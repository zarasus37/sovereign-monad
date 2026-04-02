import { AdapterRegistry } from './adapters';
import { ExecutionPlan } from './models/events';
import {
  ARBITRUM_USDC,
  ARBITRUM_WETH,
  BASE_USDC,
  BASE_WETH,
} from './adapters/common';
import { PreparedSwapLeg, PreparedSwapTransaction } from './adapters/types';

export interface PlanValidationResult {
  valid: boolean;
  reason?: string;
}

export interface InventoryRequirement {
  chain: 'base' | 'arbitrum';
  asset: 'WETH' | 'USDC';
  amount: number;
}

export interface AdapterLegBuildResult {
  ok: boolean;
  legs: PreparedSwapLeg[];
  reason?: string;
}

export interface AdapterTransactionBuildResult {
  ok: boolean;
  transactions: PreparedSwapTransaction[];
  reason?: string;
}

export function buildExecutionPath(
  plan: ExecutionPlan,
  chainAName: string,
  chainBName: string
): string {
  return plan.mode === 'bridge_based'
    ? `${chainAName}->${chainBName}:bridge`
    : `${chainAName}<->${chainBName}:inventory`;
}

export function validateExecutionPlan(
  plan: ExecutionPlan,
  nowMs: number,
  maxPlanAgeMs: number
): PlanValidationResult {
  if (!plan.approved) {
    return { valid: false, reason: 'plan_not_approved' };
  }

  if (!Number.isFinite(parseFloat(plan.size)) || parseFloat(plan.size) <= 0) {
    return { valid: false, reason: 'invalid_size' };
  }

  if (!Number.isFinite(plan.expectedEv)) {
    return { valid: false, reason: 'invalid_expected_ev' };
  }

  if (!Number.isFinite(plan.entryPrice) || plan.entryPrice <= 0) {
    return { valid: false, reason: 'invalid_entry_price' };
  }

  if (!Number.isFinite(plan.exitPrice) || plan.exitPrice <= 0) {
    return { valid: false, reason: 'invalid_exit_price' };
  }

  if (!plan.entryVenue || !plan.exitVenue) {
    return { valid: false, reason: 'missing_venue' };
  }

  if (nowMs - plan.timestampMs > maxPlanAgeMs) {
    return { valid: false, reason: 'plan_stale' };
  }

  if (nowMs > plan.executionDeadlineMs) {
    return { valid: false, reason: 'execution_deadline_expired' };
  }

  return { valid: true };
}

export function supportsLiveExecution(plan: ExecutionPlan): PlanValidationResult {
  if (plan.mode !== 'inventory_based') {
    return { valid: false, reason: 'bridge_mode_requires_bridge_executor' };
  }

  if (plan.asset !== 'ETH') {
    return { valid: false, reason: `unsupported_asset:${plan.asset}` };
  }

  const supportedVenues = new Set(['aerodrome:ETH/USDC:spot', 'camelot:ETH/USDC:spot']);
  if (!supportedVenues.has(plan.entryVenue) || !supportedVenues.has(plan.exitVenue)) {
    return { valid: false, reason: 'unsupported_venue_pair' };
  }

  if (plan.entryVenue === plan.exitVenue) {
    return { valid: false, reason: 'entry_exit_venue_match' };
  }

  return { valid: true };
}

export function buildAdapterSwapLegs(
  plan: ExecutionPlan,
  registry: AdapterRegistry,
  maxSlippageBps: number
): AdapterLegBuildResult {
  const entryVenue = registry.parseVenue(plan.entryVenue);
  const exitVenue = registry.parseVenue(plan.exitVenue);

  if (!entryVenue || !exitVenue) {
    return { ok: false, legs: [], reason: 'unparseable_venue' };
  }

  const entryAdapter = registry.resolve(plan.entryVenue, 'base');
  const exitAdapter = registry.resolve(plan.exitVenue, 'arbitrum');
  if (!entryAdapter || !exitAdapter) {
    return { ok: false, legs: [], reason: 'missing_venue_adapter' };
  }

  const sizeUsd = parseFloat(plan.size);
  const assetAmount = sizeUsd / plan.entryPrice;
  const entrySide = plan.direction === 'buy_M_sell_E' ? 'buy' : 'sell';
  const exitSide = plan.direction === 'buy_M_sell_E' ? 'sell' : 'buy';

  const entryLeg = entryAdapter.prepareSwap({
    venue: entryVenue,
    chain: 'base',
    side: entrySide,
    notionalUsd: sizeUsd,
    assetAmount,
    referencePrice: plan.entryPrice,
    slippageBps: maxSlippageBps,
  });

  const exitLeg = exitAdapter.prepareSwap({
    venue: exitVenue,
    chain: 'arbitrum',
    side: exitSide,
    notionalUsd: sizeUsd,
    assetAmount,
    referencePrice: plan.exitPrice,
    slippageBps: maxSlippageBps,
  });

  const legs = [entryLeg, exitLeg];
  const blockedLeg = legs.find((leg) => !leg.executable);
  if (blockedLeg) {
    return { ok: false, legs, reason: blockedLeg.reason || 'adapter_leg_not_executable' };
  }

  return { ok: true, legs };
}

export function buildAdapterSwapTransactions(
  legs: PreparedSwapLeg[],
  registry: AdapterRegistry,
  recipient: string,
  deadlineMs: number
): AdapterTransactionBuildResult {
  const deadline = Math.floor(deadlineMs / 1000);
  const transactions: PreparedSwapTransaction[] = [];

  for (const leg of legs) {
    const adapter = registry.resolve(leg.venue, leg.chain);
    if (!adapter) {
      return { ok: false, transactions: [], reason: 'missing_venue_adapter' };
    }

    try {
      transactions.push(
        adapter.buildSwapTransaction({
          leg,
          recipient,
          deadline,
        })
      );
    } catch (error) {
      return {
        ok: false,
        transactions,
        reason: error instanceof Error ? error.message : 'swap_transaction_build_failed',
      };
    }
  }

  return { ok: true, transactions };
}

export function getRequiredInventory(plan: ExecutionPlan): InventoryRequirement[] {
  const sizeUsd = parseFloat(plan.size);
  const assetAmount = sizeUsd / plan.entryPrice;

  if (plan.direction === 'buy_M_sell_E') {
    return [
      { chain: 'base', asset: 'USDC', amount: sizeUsd },
      { chain: 'arbitrum', asset: 'WETH', amount: assetAmount },
    ];
  }

  return [
    { chain: 'arbitrum', asset: 'USDC', amount: sizeUsd },
    { chain: 'base', asset: 'WETH', amount: assetAmount },
  ];
}

export {
  BASE_USDC,
  BASE_WETH,
  ARBITRUM_USDC,
  ARBITRUM_WETH,
};

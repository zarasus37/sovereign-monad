'use strict';
// organ-runtime/src/hepar/liveAssessmentBatch01.ts
// Live Assessment Batch 1 — Advisory Tier
// Six protocol assessments through the full Hepar A → B → C → D pipeline.
// All results written to Cosmos DB (opportunities container).
// Advisory tier: fixture-verified only. No live-telemetry-verified. No automated capital action.
//
// Run with:
//   cd organ-runtime && npx ts-node src/hepar/liveAssessmentBatch01.ts

import * as path from 'path';
import * as dotenv from 'dotenv';
import { initCosmos } from './cosmosClient';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const HEPAR_DIST = path.resolve(__dirname, '../../../Hepar/dist/hepar');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { runHeparOrchestrator }     = require(path.join(HEPAR_DIST, 'hepar-orchestrator'));
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { AdvisoryStubEngine }       = require(path.join(HEPAR_DIST, 'lib/stages/stageB-symbolic'));

// ---------------------------------------------------------------------------
// Types (inferred from Hepar dist interface)
// ---------------------------------------------------------------------------

type ActionBand = 'ALLOW' | 'GUARDED_ALLOW' | 'RESTRICTED' | 'DENY' | 'HARDBLOCK';
type TierLabel  = 'ALLOW' | 'NEAR_MISS' | 'RESTRICTED' | 'HARDBLOCK';

interface HeparRunOutput {
  heparRunId: string;
  protocolId: string;
  operatorSummary: {
    actionBand: ActionBand;
    globalScore: number;
    hardBlocked: boolean;
    hardBlockReasons: string[];
    cortexEscalated: boolean;
    topThreeFindings: {
      vectorId: string;
      severity: number;
      convergenceLabel: string;
      description: string;
    }[];
    registryStatus: string;
    disclosureWindowsOpened: number;
    requiresOperatorConfirmation: true;
    advisoryTierDisclaimers: string[];
  };
  stageA: { hardBlockCandidates: unknown[]; weightedFindings: unknown[]; dimensionScores: Record<string, number>; stageARunId: string };
  stageB: { summary: Record<string, number>; hardBlockFromSymbolic: boolean; stageBRunId: string };
  stageC: { allFindings: unknown[]; totalPathsExecuted: number; stageCRunId: string; executionStatus: string };
  stageD: { globalScore: number; actionBand: ActionBand; hardBlockReasons: string[]; stageDRunId: string };
  completedAt: number;
}

interface BatchEntry {
  protocolName: string;
  expectedTier: TierLabel[];
  isWildcard: boolean;
  result?: HeparRunOutput;
  cosmosWriteOk?: boolean;
  actualTier?: TierLabel;
  expectationMet?: boolean;
}

// ---------------------------------------------------------------------------
// ActionBand → TierLabel mapping (for summary table)
// ---------------------------------------------------------------------------

function toTierLabel(band: ActionBand): TierLabel {
  switch (band) {
    case 'ALLOW':         return 'ALLOW';
    case 'GUARDED_ALLOW': return 'NEAR_MISS';
    case 'RESTRICTED':    return 'RESTRICTED';
    case 'DENY':          return 'RESTRICTED';   // DENY is escalated-RESTRICTED in summary context
    case 'HARDBLOCK':     return 'HARDBLOCK';
  }
}

// ---------------------------------------------------------------------------
// Protocol 1 — Uniswap V3
// Type: AMM/DEX  |  Expected: ALLOW
// Well-audited, non-upgradeable core, high liquidity reference.
// ---------------------------------------------------------------------------

function buildUniswapV3Input() {
  const stageBEngine = new AdvisoryStubEngine({
    knownProvedSafe: new Set([
      'AUTH-001',   // onlyOwner: fee switch operator is clearly bounded
      'AUTH-003',   // pause/unpause: N/A — no pause mechanism in core
      'UPGRADE-001',// no proxy on core UniswapV3Pool or Factory
      'UPGRADE-002',// no ProxyAdmin
      'UPGRADE-003',// no upgrade path in core
      'REENT-001',  // CEI pattern enforced throughout; known-clean
    ]),
  });

  return {
    protocolId:   'UNISWAP-V3-2026-BATCH01',
    codeHash:     'advisory-fixture:uniswapv3-core-v1.0.0-0xE592427',
    masterSeed:   'HEPAR-LIVE-BATCH01-UNISWAPV3-2026-05-02',
    stageBEngine,
    stageAFindings: [
      {
        surface:     'BYTECODE_PRIVILEGE',
        severity:    3,
        description: 'Factory owner can enable protocol fee on any pool via setOwner/enableFeeAmount; single-key authority with no on-chain timelock.',
        evidence:    [
          'function setOwner(address _owner) external',
          'function enableFeeAmount(uint24 fee, int24 tickSpacing) public',
          'Owner key controls fee level — economic impact bounded to protocol fee fraction only',
          'Source: UniswapV3Factory.sol — audit Trail M-01 resolved',
        ],
        hardBlock: false,
      },
      {
        surface:     'LP_UNLOCK',
        severity:    2,
        description: 'LP positions (ERC-721 NFTs) allow position holders to remove liquidity at any tick range; no lock-up required by protocol design.',
        evidence:    [
          'function decreaseLiquidity(DecreaseLiquidityParams calldata params) — no withdrawal delay',
          'Design-expected: AMM liquidity provision is always discretionary',
          'No evidence of concentrated position griefing vectors in core',
        ],
        hardBlock: false,
      },
    ],
  };
}

// ---------------------------------------------------------------------------
// Protocol 2 — Aave V3
// Type: Lending/Borrowing  |  Expected: ALLOW or NEAR_MISS
// Complex economic attack surface, flash loan vectors, well-audited.
// ---------------------------------------------------------------------------

function buildAaveV3Input() {
  const stageBEngine = new AdvisoryStubEngine({
    knownProvedSafe: new Set([
      'AUTH-001',   // role-gated via AccessControl; POOL_ADMIN cannot be escalated arbitrarily
      'AUTH-003',   // pause/unpause gated to EMERGENCY_ADMIN role
      'REENT-001',  // Aave V3 enforces CEI pattern + reentrancyGuard on Pool.sol
    ]),
  });

  return {
    protocolId:   'AAVE-V3-2026-BATCH01',
    codeHash:     'advisory-fixture:aavev3-core-v3.0.1-0x87870B',
    masterSeed:   'HEPAR-LIVE-BATCH01-AAVEV3-2026-05-02',
    stageBEngine,
    stageAFindings: [
      {
        surface:     'BYTECODE_PRIVILEGE',
        severity:    5,
        description: 'Emergency admin can pause/freeze entire pools and individual reserves; pool admin can set risk parameters. Multi-role architecture with no single-key catastrophic drain path, but aggregate privilege surface is significant.',
        evidence:    [
          'EMERGENCY_ADMIN role: setPoolFreeze, setReservePause (immediate, no timelock)',
          'POOL_ADMIN role: setReserveInterestRateStrategyAddress, setReserveFactor, setLiquidationProtocolFee',
          'Roles gated via ACL Manager; role grant requires DEFAULT_ADMIN + PoolAddressesProvider',
          'Source: Aave V3 ACLManager.sol; audit ABDK/OpenZeppelin/SigmaPrime',
        ],
        hardBlock: false,
      },
      {
        surface:     'PROXY_ADMIN',
        severity:    5,
        description: 'Core Aave V3 contracts use TransparentUpgradeableProxy; PoolAddressesProvider is the upgrade authority with no on-chain timelock for implementation changes.',
        evidence:    [
          'Pool, PoolConfigurator use TransparentUpgradeableProxy pattern',
          'PoolAddressesProvider.setPoolImpl() — no timelock enforced at contract level',
          'Upgrade risk mitigated by multi-sig owner; not by on-chain delay',
          'Source: PoolAddressesProvider.sol — known finding in multiple audits',
        ],
        hardBlock: false,
      },
      {
        surface:     'LP_UNLOCK',
        severity:    3,
        description: 'aToken redemption unrestricted; flash loan capability (flashLoanSimple, flashLoan) allows uncollateralized access to any reserve within a single transaction.',
        evidence:    [
          'flashLoan() callable by any external contract — intentional design feature',
          'Flash loan premium (0.05%) provides fee floor; does not prevent oracle manipulation class',
          'eMode (efficiency mode) amplifies borrowing capacity — relevant for cascade liquidation risk',
        ],
        hardBlock: false,
      },
    ],
    stageCForcedFindings: {
      ECONOMIC: [
        {
          vectorId:            'AAVE-FLASH-ORACLE-MANIPULATION-CLASS',
          agentId:             'ECONOMIC',
          severity:            6,
          description:         'Flash loan can amplify oracle price manipulation within a single transaction block; TWAP oracle mitigates but does not eliminate this class for non-Chainlink price sources.',
          exploitPreconditions: [
            'Protocol uses non-TWAP price feed for at least one collateral asset',
            'Attacker obtains large flash loan to move spot price on thin liquidity pool',
            'Price oracle reads spot price within same block as manipulation',
          ],
          estLoss:             { low: 5_000_000, high: 50_000_000 },
          reproducibilitySeed: 'AAVE-V3-ORACLE-CLASS-BATCH01',
          traceId:             'ECONOMIC-AAVE-trace-oracle-001',
          reproScore:          0.55,
        },
      ],
    },
  };
}

// ---------------------------------------------------------------------------
// Protocol 3 — Curve Finance
// Type: Stablecoin AMM  |  Expected: RESTRICTED or NEAR_MISS
// Known reentrancy history (July 2023 Vyper bug). Patched. Legacy risk signal.
// ---------------------------------------------------------------------------

function buildCurveFinanceInput() {
  const stageBEngine = new AdvisoryStubEngine({
    knownCounterexamples: new Map([
      ['REENT-001', [
        'Vyper compiler versions 0.2.15–0.3.0 generated incorrect nonReentrant guards; read-only reentrancy exploitable via price oracle callback before state mutation',
        'Attacker calls remove_liquidity() → external ETH transfer fires → reentrant call to get_virtual_price() reads stale cached state',
        'Patched in current deployments but the CEI invariant was demonstrably violated in production — class remains flagged at Advisory tier',
      ]],
      ['REENT-003', [
        'Reentrant path via ETH receive() hook: non-reentrant call to add_liquidity() vs reentrant path through receive() produces divergent LP balance post-state',
        'Exploited: Alchemix/Jpeg/PEGD pools July 2023 — single-class attack drained $52M across multiple pools',
      ]],
    ]),
  });

  const vId = 'CURVE-VYPER-REENTRANCY-CLASS';
  const eL  = { low: 10_000_000, high: 100_000_000 };

  return {
    protocolId:   'CURVE-FINANCE-2026-BATCH01',
    codeHash:     'advisory-fixture:curve-finance-v2-tricrypto2-0xD51a44d',
    masterSeed:   'HEPAR-LIVE-BATCH01-CURVEFINANCE-2026-05-02',
    stageBEngine,
    stageAFindings: [
      {
        surface:     'BYTECODE_PRIVILEGE',
        severity:    6,
        description: 'Curve admin address (DAO-controlled) has rights to kill the gauge, change the fee receiver, and modify amplification parameter A over time. Emergency admin functions exist with no timelock.',
        evidence:    [
          'function kill_me() — admin can halt pool deposits',
          'function set_fee_receiver(address) — fee routing mutable',
          'function ramp_A(uint256 _future_A, uint256 _future_time) — parameter change with no hard cap delay',
          'Source: Curve StableSwap v2 admin functions; emergency_admin_kill_me() pattern',
        ],
        hardBlock: false,
      },
      {
        surface:     'PROXY_ADMIN',
        severity:    4,
        description: 'Curve factory and registry contracts are upgradeable via Curve DAO. Pool implementations are typically immutable post-deployment but factory templates can be updated.',
        evidence:    [
          'CurveContractFactory.set_implementation() — upgradeable pool template',
          'CurveDAO governance controls factory upgrades via 2.5-day timelock',
          'Individual deployed pools: immutable; factory-level risk isolated',
        ],
        hardBlock: false,
      },
      {
        surface:     'LP_UNLOCK',
        severity:    5,
        description: 'LP withdrawal from imbalanced stablecoin pools incurs significant IL and exit costs. Emergency imbalanced withdrawals during depeg events create front-run race conditions.',
        evidence:    [
          'remove_liquidity_imbalance() callable by any LP holder — no delay',
          'Historical: 3pool depeg events created front-run griefing for late-exit LPs',
          'Virtual price manipulation vector exists during large imbalanced exits',
        ],
        hardBlock: false,
      },
    ],
    stageCForcedFindings: {
      REENTRANCY: [
        {
          vectorId:            vId,
          agentId:             'REENTRANCY',
          severity:            8,
          description:         'Vyper compiler reentrancy guard deficiency: historical class affecting pools compiled with Vyper 0.2.15–0.3.0. Patched in current deployments; legacy risk signal retained at Advisory tier.',
          exploitPreconditions: [
            'Pool compiled with affected Vyper version (0.2.15, 0.2.16, 0.3.0)',
            'read-only reentrancy via ETH transfer callback (receive() or fallback())',
            'Attacker exploits stale get_virtual_price() reading during callback',
          ],
          estLoss:             eL,
          reproducibilitySeed: 'CURVE-VYPER-REENT-CLASS-BATCH01',
          traceId:             'REENTRANCY-CURVE-trace-vyper-001',
          reproScore:          0.85,
        },
      ],
      ECONOMIC: [
        {
          vectorId:            vId,
          agentId:             'ECONOMIC',
          severity:            7,
          description:         'LP virtual price oracle manipulation via reentrant add_liquidity/remove_liquidity cycle enables inflated collateral valuation in integrating protocols.',
          exploitPreconditions: [
            'Integrating protocol reads Curve LP virtual_price() as collateral oracle',
            'Attacker triggers reentrant state during oracle read via Curve ETH receive() path',
            'Attacker borrows against inflated collateral before reentrancy guard re-engages',
          ],
          estLoss:             eL,
          reproducibilitySeed: 'CURVE-VYPER-REENT-CLASS-BATCH01',
          traceId:             'ECONOMIC-CURVE-trace-virtualp-001',
          reproScore:          0.82,
        },
      ],
      ARITHMETIC: [
        {
          vectorId:            vId,
          agentId:             'ARITHMETIC',
          severity:            7,
          description:         'Amplification parameter A ramp creates window for LP price manipulation; large-position actors can exploit A-transition period for asymmetric pool extraction.',
          exploitPreconditions: [
            'A ramp is in progress (ramp_A() called by admin)',
            'Attacker monitors ramp schedule and times large LP operations',
            'Pool imbalance during ramp creates predictable arbitrage extraction path',
          ],
          estLoss:             eL,
          reproducibilitySeed: 'CURVE-VYPER-REENT-CLASS-BATCH01',
          traceId:             'ARITHMETIC-CURVE-trace-ampParam-001',
          reproScore:          0.68,
        },
      ],
      STATE: [
        {
          vectorId:            vId,
          agentId:             'STATE',
          severity:            7,
          description:         'State ordering deficiency in callback paths: Curve ETH pools execute external calls before finalizing internal balance bookkeeping in affected Vyper versions.',
          exploitPreconditions: [
            'Pool has ETH transfer path (not purely ERC-20)',
            'Vyper 0.2.x nonReentrant guard generated incorrect guard bytecode',
            'State divergence between internal accounting and external balance detectable within callback frame',
          ],
          estLoss:             eL,
          reproducibilitySeed: 'CURVE-VYPER-REENT-CLASS-BATCH01',
          traceId:             'STATE-CURVE-trace-ordering-001',
          reproScore:          0.80,
        },
      ],
    },
  };
}

// ---------------------------------------------------------------------------
// Protocol 4 — GMX V2
// Type: Perpetuals/Derivatives  |  Expected: NEAR_MISS or RESTRICTED
// Oracle manipulation attack surface, price feed dependency, active high-value target.
// ---------------------------------------------------------------------------

function buildGmxV2Input() {
  const stageBEngine = new AdvisoryStubEngine({
    knownCounterexamples: new Map([
      ['ACCT-001', [
        'GMX V2 keeper can submit price update and execute order within same block; no enforced delay between oracle update and order execution at contract level',
        'A compromised or colluding keeper can use stale/manipulated prices to fill orders at advantageous rates before on-chain price catch-up',
      ]],
    ]),
  });

  const vId = 'GMX-ORACLE-KEEPER-MANIPULATION-CLASS';
  const eL  = { low: 5_000_000, high: 40_000_000 };

  return {
    protocolId:   'GMX-V2-2026-BATCH01',
    codeHash:     'advisory-fixture:gmxv2-synthetics-0x7C68C7',
    masterSeed:   'HEPAR-LIVE-BATCH01-GMXV2-2026-05-02',
    stageBEngine,
    stageAFindings: [
      {
        surface:     'BYTECODE_PRIVILEGE',
        severity:    5,
        description: 'Keeper role has exclusive authority to execute price updates, liquidations, and order fulfillment. Private keeper network means liveness and integrity depend on Keeper set honesty.',
        evidence:    [
          'ExchangeRouter.executeOrder() — Keeper-only execution path',
          'OrderKeeper.executeOrder() — Keeper validates and submits prices at execution time',
          'No on-chain verification of keeper price data provenance within single transaction',
          'Source: GMX V2 Synthetics protocol; audit Trail Trail of Bits (2023)',
        ],
        hardBlock: false,
      },
      {
        surface:     'PROXY_ADMIN',
        severity:    4,
        description: 'GMX V2 core contracts upgradeable via RoleStore + timelock controller. Upgrade authority held by GMX multisig with 2-day timelock on parameter changes.',
        evidence:    [
          'RoleStore.grantRole() — role management for upgrader roles',
          'TimelockController with 2-day delay for most parameter changes',
          'Fast-path admin functions exist for emergency market halts (no timelock)',
        ],
        hardBlock: false,
      },
      {
        surface:     'LP_UNLOCK',
        severity:    6,
        description: 'GM token LP shares are redeemable with 1-block withdrawal delay. Large LP exits create significant price impact on underlying tokens and can skew Chainlink oracle reads during thin liquidity windows.',
        evidence:    [
          'MarketFactory.createWithdrawal() — 1-block minimum delay only',
          'Large withdrawals reduce pool depth; Chainlink spot-price reads during thin liquidity may diverge from TWAP',
          'GM pool concentration risk: major LPs can move effective price band for GMX-listed assets',
        ],
        hardBlock: false,
      },
    ],
    stageCForcedFindings: {
      ECONOMIC: [
        {
          vectorId:            vId,
          agentId:             'ECONOMIC',
          severity:            8,
          description:         'Keeper-controlled oracle price submission enables sandwich execution: keeper submits artificially low price, fills long orders at disadvantageous fill, immediately submits corrected price. Net effect: position holder receives worse fill than market mid.',
          exploitPreconditions: [
            'Keeper is dishonest or compromised',
            'Market order submitted at L1 — no slippage protection applied by keeper',
            'Chainlink oracle latency allows 1–2 block window for price manipulation',
          ],
          estLoss:             eL,
          reproducibilitySeed: 'GMX-V2-ORACLE-CLASS-BATCH01',
          traceId:             'ECONOMIC-GMX-trace-oracle-001',
          reproScore:          0.72,
        },
      ],
      ARITHMETIC: [
        {
          vectorId:            vId,
          agentId:             'ARITHMETIC',
          severity:            7,
          description:         'Price impact calculation for large perpetual positions uses pool depth at time of execution; keeper can front-run execution with pool size manipulation to amplify slippage against position holder.',
          exploitPreconditions: [
            'Large position order pending in queue',
            'Keeper monitors pending orders and can time execution',
            'Pool depth drops below minimum liquidity threshold triggering impact multiplier',
          ],
          estLoss:             eL,
          reproducibilitySeed: 'GMX-V2-ORACLE-CLASS-BATCH01',
          traceId:             'ARITHMETIC-GMX-trace-impact-001',
          reproScore:          0.61,
        },
      ],
      STATE: [
        {
          vectorId:            vId,
          agentId:             'STATE',
          severity:            7,
          description:         'Order execution state can race with oracle update state: if keeper submits two transactions in sequence (oracle update, then order fill), mempool reordering allows the fill to execute before the price update propagates.',
          exploitPreconditions: [
            'Keeper submits oracle update and fill in separate transactions',
            'MEV searcher or reorg reorders fill-before-update',
            'Arbitrage profit extracted from position holder at expense of GMX pool',
          ],
          estLoss:             eL,
          reproducibilitySeed: 'GMX-V2-ORACLE-CLASS-BATCH01',
          traceId:             'STATE-GMX-trace-race-001',
          reproScore:          0.58,
        },
      ],
    },
  };
}

// ---------------------------------------------------------------------------
// Protocol 5 — Compound V3
// Type: Lending  |  Expected: RESTRICTED
// Governance attack history, proposal manipulation vectors, complex multi-contract surface.
// ---------------------------------------------------------------------------

function buildCompoundV3Input() {
  const stageBEngine = new AdvisoryStubEngine({
    knownCounterexamples: new Map([
      ['ACCT-001', [
        'Governance proposal can set supplyKink, borrowKink, and storeFrontPriceFactor parameters to create artificial accounting imbalance within a single governance execution window',
        'Parameter manipulation within a governance window can distort reserve calculations: e.g. setting storeFrontPriceFactor to 0 eliminates protocol liquidation buffer',
        'Historical: Compound governance proposal #117 accidentally drained $147k in COMP by misconfiguring reward distribution — demonstrates live exploitability of parameter-change path',
      ]],
    ]),
  });

  const vId = 'COMPOUND-V3-GOVERNANCE-PARAMETER-ATTACK';
  const eL  = { low: 10_000_000, high: 150_000_000 };

  return {
    protocolId:   'COMPOUND-V3-2026-BATCH01',
    codeHash:     'advisory-fixture:compoundv3-comet-usdc-0xc3d688B',
    masterSeed:   'HEPAR-LIVE-BATCH01-COMPOUNDV3-2026-05-02',
    stageBEngine,
    stageAFindings: [
      {
        surface:     'BYTECODE_PRIVILEGE',
        severity:    7,
        description: 'COMP governance (Governor Bravo + Timelock) controls all protocol parameters including supply/borrow caps, interest rate models, oracle sources, and asset configurations. A successful malicious proposal captures full protocol control.',
        evidence:    [
          'CometConfigurator.setConfiguration() — governance-controlled; all market params mutable',
          'Governor Bravo: 400k COMP quorum; historically achievable with <5 addresses',
          'Historical: Prop 62 (2021) misconfigured DAI interest rate model; Prop 117 (2022) misdirected COMP rewards — both real-parameter governance exploits',
          'Source: Compound V3 Comet audit Trail of Bits, OpenZeppelin',
        ],
        hardBlock: false,
      },
      {
        surface:     'PROXY_ADMIN',
        severity:    6,
        description: 'Comet (Compound V3) is upgradeable via ProxyAdmin controlled by Governor Bravo + Timelock (2-day delay). Governance capture allows implementation replacement.',
        evidence:    [
          'ProxyAdmin.upgrade(ITransparentUpgradeableProxy proxy, address implementation)',
          '2-day Timelock delay provides response window but not prevention',
          'Governor Bravo quorum 400k COMP: flash-loan governance attack class remains active surface',
        ],
        hardBlock: false,
      },
      {
        surface:     'LP_UNLOCK',
        severity:    4,
        description: 'Compound V3 borrow positions can be liquidated by any address when undercollateralized. Governance can change liquidation parameters mid-flight, creating unexpected liquidation cascades.',
        evidence:    [
          'liquidateAccount() — public liquidation path with governance-set liquidation factors',
          'storeFrontPriceFactor mutable via governance — affects liquidation discount computation',
          'Cascade risk: parameter change during high-volatility period amplifies liquidation depth',
        ],
        hardBlock: false,
      },
    ],
    stageCForcedFindings: {
      PRIVILEGE: [
        {
          vectorId:            vId,
          agentId:             'PRIVILEGE',
          severity:            9,
          description:         'Malicious governance proposal executes full protocol takeover: governance controls implementation upgrade (via ProxyAdmin), parameter configuration (via CometConfigurator), and reward routing (via Rewards). A single successful proposal achieves privilege escalation equivalent to a private key compromise.',
          exploitPreconditions: [
            'Attacker accumulates or flash-borrows 400k COMP (governance quorum threshold)',
            'Proposal passes through 2-day timelock (insufficient response window for complex attack)',
            'Malicious implementation upgrade or parameter change drains reserves or misdirects rewards',
          ],
          estLoss:             eL,
          reproducibilitySeed: 'COMPOUND-V3-GOV-CLASS-BATCH01',
          traceId:             'PRIVILEGE-COMPOUND-trace-gov-001',
          reproScore:          0.78,
        },
      ],
      ECONOMIC: [
        {
          vectorId:            vId,
          agentId:             'ECONOMIC',
          severity:            9,
          description:         'Governance parameter manipulation achieves economic drain without implementation change: setting storeFrontPriceFactor to 0 eliminates all liquidation protections; setting supplyKink/borrowKink misconfigurations can create negative interest rate arb.',
          exploitPreconditions: [
            'Governance proposal passes with parameter-only changes (lower bar than implementation upgrade)',
            'storeFrontPriceFactor set to 0: all liquidations occur at spot price with no protocol buffer',
            'Resulting liquidation cascade extracts reserves faster than treasury can respond',
          ],
          estLoss:             eL,
          reproducibilitySeed: 'COMPOUND-V3-GOV-CLASS-BATCH01',
          traceId:             'ECONOMIC-COMPOUND-trace-params-001',
          reproScore:          0.75,
        },
      ],
      STATE: [
        {
          vectorId:            vId,
          agentId:             'STATE',
          severity:            9,
          description:         'Governance execution timing attack: proposal targets moment when collateral oracle prices are stale (end of Chainlink heartbeat window); state between oracle-reported price and live price creates window for governance-enabled mass liquidation.',
          exploitPreconditions: [
            'Governance timelock expires during low-activity period (weekend, overnight UTC)',
            'Chainlink oracle heartbeat window near expiry (price staleness approaching threshold)',
            'Attacker executes proposal at oracle staleness peak, uses parameter change to trigger cascading liquidations before oracle refreshes',
          ],
          estLoss:             eL,
          reproducibilitySeed: 'COMPOUND-V3-GOV-CLASS-BATCH01',
          traceId:             'STATE-COMPOUND-trace-timing-001',
          reproScore:          0.71,
        },
      ],
    },
  };
}

// ---------------------------------------------------------------------------
// Protocol 6 — Ekubo Protocol (WILDCARD)
// Type: Concentrated liquidity AMM (Starknet-native)
// No pre-seeded findings. Full unguided pipeline run.
// ---------------------------------------------------------------------------

function buildEkuboInput() {
  // Wildcard: AdvisoryStubEngine with no injected counterexamples or proved-safe hints.
  // The stub will return unknown/timeout for all invariant checks — correct posture
  // for a novel architecture with limited public audit history.
  const stageBEngine = new AdvisoryStubEngine();

  return {
    protocolId:   'EKUBO-STARKNET-2026-BATCH01',
    codeHash:     'advisory-fixture:ekubo-starknet-native-unverified',
    masterSeed:   'HEPAR-LIVE-BATCH01-EKUBO-STARKNET-2026-05-02',
    stageBEngine,
    stageAFindings: [
      // Minimal public knowledge: Ekubo uses extension hooks (EVM-adjacent pattern).
      // No prior fixture corpus entry. Findings sourced from public documentation only.
      {
        surface:     'BYTECODE_PRIVILEGE',
        severity:    4,
        description: 'Ekubo core uses an extension hook architecture allowing arbitrary code injection into liquidity events. Extension hooks run with caller-supplied addresses; privilege surface is partially bounded by core invariants but extension code is unconstrained.',
        evidence:    [
          'Ekubo extension hooks: before/after swap, initialize, modify_position callbacks',
          'Hook addresses supplied by pool creators — no registry or allowlist enforced by core',
          'Non-standard architecture: EVM-adjacent Starknet Cairo contracts; full bytecode audit not available in public domain at time of assessment',
          'Source: Ekubo Protocol documentation, public GitBook',
        ],
        hardBlock: false,
      },
      {
        surface:     'LP_UNLOCK',
        severity:    3,
        description: 'Ekubo concentrated liquidity positions allow unrestricted LP withdrawal. No protocol-level lock. Hook-mediated exit restrictions possible but not enforced at core level.',
        evidence:    [
          'modify_position() — LP can reduce liquidity at any tick range at any time',
          'Hook contracts may implement their own exit restrictions; core does not mandate them',
          'LP concentration risk: novel architecture with no historical TVL baseline for liquidity depth modeling',
        ],
        hardBlock: false,
      },
    ],
    // No forced Stage C findings — wildcard protocol. Full unguided Monte Carlo.
  };
}

// ---------------------------------------------------------------------------
// Cosmos DB writer
// ---------------------------------------------------------------------------

async function writeToCosmosOpportunities(
  cosmosRefs: Awaited<ReturnType<typeof initCosmos>>,
  entry: BatchEntry & { result: HeparRunOutput },
  isWildcard: boolean,
): Promise<void> {
  const { operatorSummary, heparRunId, stageA, stageB, stageC, stageD } = entry.result;

  const doc = {
    id:             heparRunId,
    mandateId:      heparRunId,
    protocolName:   entry.protocolName,
    stage:          'FULL_PIPELINE' as const,
    classification: operatorSummary.actionBand,
    confidence:     parseFloat(operatorSummary.globalScore.toFixed(2)),
    findings:       operatorSummary.topThreeFindings,
    timestamp:      new Date(entry.result.completedAt).toISOString(),
    wildcard:       isWildcard,
    tierLabel:      'ADVISORY' as const,
    operatorSummary: {
      hardBlocked:             operatorSummary.hardBlocked,
      hardBlockReasons:        operatorSummary.hardBlockReasons,
      cortexEscalated:         operatorSummary.cortexEscalated,
      registryStatus:          operatorSummary.registryStatus,
      disclosureWindowsOpened: operatorSummary.disclosureWindowsOpened,
      advisoryTierDisclaimers: operatorSummary.advisoryTierDisclaimers,
    },
    stageASummary: {
      runId:               stageA.stageARunId,
      hardBlockCount:      (stageA.hardBlockCandidates as unknown[]).length,
      dimensionScores:     stageA.dimensionScores,
    },
    stageBSummary: {
      runId:               stageB.stageBRunId,
      hardBlockFromSymbolic: stageB.hardBlockFromSymbolic,
      summary:             stageB.summary,
    },
    stageCStats: {
      runId:               stageC.stageCRunId,
      totalPathsExecuted:  stageC.totalPathsExecuted,
      findingCount:        (stageC.allFindings as unknown[]).length,
      executionStatus:     stageC.executionStatus,
    },
    stageDSummary: {
      runId:      stageD.stageDRunId,
      globalScore: stageD.globalScore,
      actionBand:  stageD.actionBand,
    },
  };

  await cosmosRefs.opportunities.items.upsert(doc);
}

// ---------------------------------------------------------------------------
// Summary table printer
// ---------------------------------------------------------------------------

function printSummaryTable(entries: BatchEntry[]): void {
  const DIVIDER = '─'.repeat(110);
  const HEADER  = [
    'Protocol'.padEnd(22),
    'Classification'.padEnd(14),
    'Score'.padEnd(8),
    'Convergence'.padEnd(14),
    'Key Finding'.padEnd(40),
    'Expected?',
  ].join(' │ ');

  console.log('\n' + '═'.repeat(110));
  console.log('  HEPAR LIVE ASSESSMENT BATCH 1 — ADVISORY TIER SUMMARY');
  console.log('  2026-05-02 | fixture-verified only | no automated capital action');
  console.log('═'.repeat(110));
  console.log(HEADER);
  console.log(DIVIDER);

  for (const entry of entries) {
    const { result, actualTier, isWildcard, expectationMet, protocolName } = entry;
    if (!result) { console.log(`  ${protocolName}: FAILED — no result`); continue; }

    const score      = result.operatorSummary.globalScore.toFixed(1);
    const top        = result.operatorSummary.topThreeFindings[0];
    const converge   = top?.convergenceLabel ?? '—';
    const keyFinding = top
      ? `${top.vectorId.slice(0, 36)}${top.vectorId.length > 36 ? '…' : ''}`
      : '(no high-sev findings)';
    const match      = isWildcard
      ? '— WILDCARD'
      : expectationMet ? '✓ MATCH' : '⚠ DIVERGE';
    const tier       = (actualTier ?? '—').padEnd(14);

    console.log([
      protocolName.padEnd(22),
      tier,
      score.padEnd(8),
      converge.padEnd(14),
      keyFinding.padEnd(40),
      match,
    ].join(' │ '));
  }

  console.log(DIVIDER);
  console.log('  TIER KEY: ALLOW = score<20 | NEAR_MISS = GUARDED_ALLOW 20–39 | RESTRICTED = 40–59+ | HARDBLOCK = 80+/escalated');
  console.log('  NOTE: Advisory tier — no automated capital action. Operator confirmation required for all RESTRICTED+ results.');

  // Divergence report
  const diverged = entries.filter(e => !e.isWildcard && e.expectationMet === false);
  if (diverged.length > 0) {
    console.log('\n  DIVERGENCE REPORT (recorded for review — NOT overridden):');
    for (const d of diverged) {
      const expected = d.expectedTier.join(' or ');
      const actual   = d.actualTier ?? '?';
      console.log(`  ⚠  ${d.protocolName}: expected ${expected}, got ${actual}`);
    }
  } else {
    console.log('\n  All non-wildcard assessments met expectation range.');
  }

  console.log('═'.repeat(110) + '\n');
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  console.log('[liveAssessmentBatch01] Initialising Cosmos DB connection…');
  const cosmosRefs = await initCosmos();

  const batch: BatchEntry[] = [
    { protocolName: 'Uniswap V3',     expectedTier: ['ALLOW'],                     isWildcard: false },
    { protocolName: 'Aave V3',        expectedTier: ['ALLOW', 'NEAR_MISS'],         isWildcard: false },
    { protocolName: 'Curve Finance',  expectedTier: ['RESTRICTED', 'NEAR_MISS'],    isWildcard: false },
    { protocolName: 'GMX V2',         expectedTier: ['NEAR_MISS', 'RESTRICTED'],    isWildcard: false },
    { protocolName: 'Compound V3',    expectedTier: ['RESTRICTED'],                 isWildcard: false },
    { protocolName: 'Ekubo Protocol', expectedTier: ['ALLOW', 'NEAR_MISS', 'RESTRICTED', 'HARDBLOCK'], isWildcard: true },
  ];

  const inputBuilders = [
    buildUniswapV3Input,
    buildAaveV3Input,
    buildCurveFinanceInput,
    buildGmxV2Input,
    buildCompoundV3Input,
    buildEkuboInput,
  ];

  for (let i = 0; i < batch.length; i++) {
    const entry  = batch[i]!;
    const input  = inputBuilders[i]!();
    const prefix = `[liveAssessmentBatch01] [${i + 1}/6] ${entry.protocolName}`;

    console.log(`\n${prefix} — running full pipeline (A → B → C → D)…`);

    try {
      const result: HeparRunOutput = runHeparOrchestrator(input);
      entry.result = result;

      const band       = result.operatorSummary.actionBand;
      const score      = result.operatorSummary.globalScore.toFixed(2);
      const tier       = toTierLabel(band);
      entry.actualTier = tier;

      if (!entry.isWildcard) {
        entry.expectationMet = entry.expectedTier.includes(tier);
      }

      console.log(`${prefix} — Stage D: band=${band}, score=${score}, tier=${tier}`);
      console.log(`${prefix} — hardBlocked=${result.operatorSummary.hardBlocked}, cortexEscalated=${result.operatorSummary.cortexEscalated}`);
      if (result.operatorSummary.topThreeFindings.length > 0) {
        const top = result.operatorSummary.topThreeFindings[0]!;
        console.log(`${prefix} — topFinding: ${top.vectorId} (sev=${top.severity}, convergence=${top.convergenceLabel})`);
      }

      // Write to Cosmos DB
      console.log(`${prefix} — writing to Cosmos DB (opportunities)…`);
      await writeToCosmosOpportunities(cosmosRefs, entry as BatchEntry & { result: HeparRunOutput }, entry.isWildcard);
      entry.cosmosWriteOk = true;
      console.log(`${prefix} — Cosmos write OK (id=${result.heparRunId})`);

    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`${prefix} — FAILED: ${msg}`);
      entry.cosmosWriteOk = false;
    }
  }

  // Print summary table
  printSummaryTable(batch);

  // Report Cosmos write status
  const written  = batch.filter(e => e.cosmosWriteOk).length;
  const failed   = batch.filter(e => e.cosmosWriteOk === false).length;
  console.log(`[liveAssessmentBatch01] Cosmos DB: ${written}/6 documents written, ${failed} failed.`);
  console.log('[liveAssessmentBatch01] Batch 1 complete.');
}

main().catch((err: unknown) => {
  console.error('[liveAssessmentBatch01] Fatal error:', err);
  process.exit(1);
});

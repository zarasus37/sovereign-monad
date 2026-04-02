import { Interface } from 'ethers';
import { applySlippage, amountToUnits, tokenAddress } from './common';
import {
  PreparedSwapLeg,
  PreparedSwapTransaction,
  SwapTransactionBuildInput,
  SwapPreparationInput,
  VenueSwapAdapter,
} from './types';

const AERODROME_ROUTER_INTERFACE = new Interface([
  'function swapExactTokensForTokens(uint256 amountIn,uint256 amountOutMin,(address from,address to,bool stable,address factory)[] routes,address to,uint256 deadline) external returns (uint256[] memory amounts)',
]);

export class AerodromeAdapter implements VenueSwapAdapter {
  readonly protocol = 'aerodrome' as const;

  constructor(
    private readonly routerAddress: string | null,
    private readonly factoryAddress: string | null
  ) {}

  supports(venue: SwapPreparationInput['venue'], chain: SwapPreparationInput['chain']): boolean {
    return venue.protocol === this.protocol && chain === 'base';
  }

  prepareSwap(input: SwapPreparationInput): PreparedSwapLeg {
    const tokenInAsset = input.side === 'buy' ? 'USDC' : 'ETH';
    const tokenOutAsset = input.side === 'buy' ? 'ETH' : 'USDC';
    const expectedOut = input.side === 'buy'
      ? input.assetAmount
      : input.assetAmount * input.referencePrice;

    return {
      chain: input.chain,
      protocol: this.protocol,
      venue: input.venue.raw,
      side: input.side,
      tokenIn: tokenAddress(input.chain, tokenInAsset),
      tokenOut: tokenAddress(input.chain, tokenOutAsset),
      amountIn: amountToUnits(
        tokenInAsset,
        input.side === 'buy' ? input.notionalUsd : input.assetAmount
      ),
      minAmountOut: amountToUnits(
        tokenOutAsset,
        applySlippage(expectedOut, input.slippageBps)
      ),
      referencePrice: input.referencePrice,
      routerAddress: this.routerAddress,
      routerConfigured: Boolean(this.routerAddress && this.factoryAddress),
      executable: Boolean(this.routerAddress && this.factoryAddress),
      reason: !this.routerAddress
        ? 'missing_aerodrome_router_address'
        : !this.factoryAddress
          ? 'missing_aerodrome_factory_address'
          : undefined,
    };
  }

  buildSwapTransaction(input: SwapTransactionBuildInput): PreparedSwapTransaction {
    if (!this.routerAddress) {
      throw new Error('missing_aerodrome_router_address');
    }
    if (!this.factoryAddress) {
      throw new Error('missing_aerodrome_factory_address');
    }

    const data = AERODROME_ROUTER_INTERFACE.encodeFunctionData(
      'swapExactTokensForTokens',
      [
        input.leg.amountIn,
        input.leg.minAmountOut,
        [
          {
            from: input.leg.tokenIn,
            to: input.leg.tokenOut,
            stable: false,
            factory: this.factoryAddress,
          },
        ],
        input.recipient,
        input.deadline,
      ]
    );

    return {
      chain: input.leg.chain,
      protocol: this.protocol,
      venue: input.leg.venue,
      method: 'swapExactTokensForTokens',
      routerAddress: this.routerAddress,
      spender: this.routerAddress,
      tokenIn: input.leg.tokenIn,
      amountIn: input.leg.amountIn,
      value: '0',
      data,
    };
  }
}

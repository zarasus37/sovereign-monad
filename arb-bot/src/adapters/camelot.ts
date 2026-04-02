import { Interface, ZeroAddress } from 'ethers';
import { applySlippage, amountToUnits, tokenAddress } from './common';
import {
  PreparedSwapLeg,
  PreparedSwapTransaction,
  SwapTransactionBuildInput,
  SwapPreparationInput,
  VenueSwapAdapter,
} from './types';

const CAMELOT_ROUTER_INTERFACE = new Interface([
  'function swapExactTokensForTokensSupportingFeeOnTransferTokens(uint256 amountIn,uint256 amountOutMin,address[] path,address to,address referrer,uint256 deadline) external',
]);

export class CamelotAdapter implements VenueSwapAdapter {
  readonly protocol = 'camelot' as const;

  constructor(
    private readonly routerAddress: string | null,
    private readonly referrerAddress: string | null
  ) {}

  supports(venue: SwapPreparationInput['venue'], chain: SwapPreparationInput['chain']): boolean {
    return venue.protocol === this.protocol && chain === 'arbitrum';
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
      routerConfigured: Boolean(this.routerAddress),
      executable: Boolean(this.routerAddress),
      reason: this.routerAddress ? undefined : 'missing_camelot_router_address',
    };
  }

  buildSwapTransaction(input: SwapTransactionBuildInput): PreparedSwapTransaction {
    if (!this.routerAddress) {
      throw new Error('missing_camelot_router_address');
    }

    const data = CAMELOT_ROUTER_INTERFACE.encodeFunctionData(
      'swapExactTokensForTokensSupportingFeeOnTransferTokens',
      [
        input.leg.amountIn,
        input.leg.minAmountOut,
        [input.leg.tokenIn, input.leg.tokenOut],
        input.recipient,
        this.referrerAddress || ZeroAddress,
        input.deadline,
      ]
    );

    return {
      chain: input.leg.chain,
      protocol: this.protocol,
      venue: input.leg.venue,
      method: 'swapExactTokensForTokensSupportingFeeOnTransferTokens',
      routerAddress: this.routerAddress,
      spender: this.routerAddress,
      tokenIn: input.leg.tokenIn,
      amountIn: input.leg.amountIn,
      value: '0',
      data,
    };
  }
}

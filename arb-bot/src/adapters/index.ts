import { AerodromeAdapter } from './aerodrome';
import { CamelotAdapter } from './camelot';
import { parseVenue } from './common';
import { ParsedVenue, SupportedChain, VenueSwapAdapter } from './types';

export interface AdapterRegistryConfig {
  aerodromeRouterAddress: string | null;
  aerodromeFactoryAddress: string | null;
  camelotRouterAddress: string | null;
  camelotReferrerAddress: string | null;
}

export class AdapterRegistry {
  private readonly adapters: VenueSwapAdapter[];

  constructor(config: AdapterRegistryConfig) {
    this.adapters = [
      new AerodromeAdapter(
        config.aerodromeRouterAddress,
        config.aerodromeFactoryAddress
      ),
      new CamelotAdapter(
        config.camelotRouterAddress,
        config.camelotReferrerAddress
      ),
    ];
  }

  parseVenue(raw: string): ParsedVenue | null {
    return parseVenue(raw);
  }

  resolve(rawVenue: string, chain: SupportedChain): VenueSwapAdapter | null {
    const parsed = parseVenue(rawVenue);
    if (!parsed) {
      return null;
    }

    return this.adapters.find((adapter) => adapter.supports(parsed, chain)) ?? null;
  }
}

import { createHash } from 'node:crypto';
import { Contract, JsonRpcProvider, Wallet, getBytes, keccak256, toUtf8Bytes } from 'ethers';
import { createEmergenceClaim } from './claim';
import type { EmergenceClaim } from './types';

export type AgentDomain = 'TRADING' | 'GAMING' | 'RESEARCH' | 'GOVERNANCE' | 'DOCTRINE';

export type TradingAction = 'BUY' | 'HOLD' | 'SELL';

export type AgentAction =
  | TradingAction
  | 'PROPOSE_GAME_LOOP'
  | 'RECORD_BEHAVIORAL_SIGNAL'
  | 'FLAG_GOVERNANCE_SIGNAL'
  | 'FLAG_DOCTRINE_SIGNAL';

export interface BigFiveProfile {
  openness: number;
  conscientiousness: number;
  extraversion: number;
  agreeableness: number;
  neuroticism: number;
}

export interface BigFiveFacetScores {
  extraversion: {
    friendliness: number;
    gregariousness: number;
    assertiveness: number;
    activityLevel: number;
    excitementSeeking: number;
    cheerfulness: number;
  };
  agreeableness: {
    trust: number;
    morality: number;
    altruism: number;
    cooperation: number;
    modesty: number;
    sympathy: number;
  };
  conscientiousness: {
    selfEfficacy: number;
    orderliness: number;
    dutifulness: number;
    achievementStriving: number;
    selfDiscipline: number;
    cautiousness: number;
  };
  neuroticism: {
    anxiety: number;
    anger: number;
    depression: number;
    selfConsciousness: number;
    immoderation: number;
    vulnerability: number;
  };
  openness: {
    imagination: number;
    artisticInterests: number;
    emotionality: number;
    adventurousness: number;
    intellect: number;
    liberalism: number;
  };
}

export interface DarkTriadScore {
  raw: number;
  osspPercentile: number;
  usAdultsPercentile: number;
}

export interface DarkTriadProfile {
  machiavellianism: DarkTriadScore;
  narcissism: DarkTriadScore;
  psychopathy: DarkTriadScore;
}

export interface InstrumentVersions {
  bigFive: string;
  darkTriad: string;
  bigFiveReferencePopulation: string;
  darkTriadReferencePopulation: string;
}

export interface DoveMonitoringFlags {
  elevatedMachiavellianism: boolean;
  elevatedNarcissism: boolean;
  elevatedPsychopathy: boolean;
  lowMorality: boolean;
  lowAnxiety: boolean;
  lowVulnerability: boolean;
  elevatedDarkTriadComposite: boolean;
  anyDoveFlag: boolean;
}

export interface RoutingResult {
  primaryDomain: AgentDomain;
  secondaryDomain: AgentDomain;
  tertiaryDomain: AgentDomain;
  routedToGaming: boolean;
  reasons: string[];
}

export interface CompletePsychometricProfile {
  domains: BigFiveProfile;
  facets: BigFiveFacetScores;
  darkTriad: DarkTriadProfile;
  routingResult?: RoutingResult;
  doveMonitoringFlags?: DoveMonitoringFlags;
  createdAtMs: number;
  instruments: InstrumentVersions;
}

export interface AgentProfileEnvelope {
  agentName: string;
  handle?: string;
  aliases?: string[];
  agentIdSeed?: string;
  profileVersion: 'big-five-v1';
  profile: BigFiveProfile;
  completeProfile?: CompletePsychometricProfile;
}

export interface RoutedAgentProfile extends AgentProfileEnvelope {
  agentId: string;
  profileHash: string;
  domain: AgentDomain;
  primaryDomain: AgentDomain;
  secondaryDomain: AgentDomain;
  tertiaryDomain: AgentDomain;
  routedToGaming: boolean;
  doveMonitoringFlags: DoveMonitoringFlags;
  routeReason: string;
  routeReasons: string[];
}

export interface ChainDecisionContext {
  chainId: number;
  blockNumber: number;
  blockTimestamp: number;
  gasPriceWei: string | null;
  revenueRouter: string;
  revenueRouterCodeHash: string | null;
  market?: {
    marketId: string;
    address: string;
    bestBid: number | null;
    bestAsk: number | null;
    midPrice: number | null;
    spreadBps: number | null;
    queryStatus: 'live' | 'unavailable' | 'not_configured';
    queryError?: string;
  };
}

export interface AgentDecision {
  agentId: string;
  agentName: string;
  profileHash: string;
  domain: AgentDomain;
  action: AgentAction;
  reasoning: string;
  decisionHash: string;
  decisionPayload: Record<string, unknown>;
  createdAtMs: number;
  context: ChainDecisionContext;
  localEmergenceClaim: EmergenceClaim;
}

export interface OnchainRecordProof {
  recorderAddress: string;
  revenueRouter: string;
  txHash: string;
  blockNumber: number;
  claimId: string | null;
  explorerUrl: string;
}

export interface OnchainAgentRegistrationProof {
  recorderAddress: string;
  revenueRouter: string;
  txHash: string;
  blockNumber: number;
  agentId: string;
  explorerUrl: string;
}

export interface LiveAgentProof {
  routedProfile: RoutedAgentProfile;
  decision: AgentDecision;
  onchain: OnchainRecordProof;
}

export interface RunLiveAgentConfig {
  rpcUrl: string;
  privateKey: string;
  emergenceRecorderAddress: string;
  revenueRouterAddress?: string;
  marketAddress?: string;
  marketId?: string;
}

const HIGH = 70;
const TRADING_OPENNESS_MIN = 70;
const TRADING_CONSCIENTIOUSNESS_MIN = 50;
const TRADING_SELF_EFFICACY_MIN = 75;
const TRADING_ACHIEVEMENT_MIN = 75;
const TRADING_NEUROTICISM_MAX = 35;
const LOW_CONSCIENTIOUSNESS = 45;
const LOW_EXCITEMENT_SEEKING_FOR_GAMING = 35;
const LOW_ACHIEVEMENT_FOR_GAMING = 40;
const GOVERNANCE_AGREEABLENESS = 70;
const GOVERNANCE_CONSCIENTIOUSNESS = 60;
const GOVERNANCE_NEUROTICISM_MAX = 60;
const GOVERNANCE_ARCHITECT_INTELLECT = 80;
const GOVERNANCE_ARCHITECT_SELF_EFFICACY = 75;
const GOVERNANCE_ARCHITECT_ACHIEVEMENT = 75;
const RESEARCH_OPENNESS = 65;
const RESEARCH_NEUROTICISM = 65;
const DOVE_DARK_TRIAD_US_PERCENTILE = 90;
const DOVE_LOW_FACET_PERCENTILE = 15;

export const MONAD_MAINNET_CHAIN_ID = 143;
export const LIVE_REVENUE_ROUTER_ADDRESS = '0x39158bC2cfCa2cCF70121EF72ed9a5fF1e084982';
export const DEFAULT_MONAD_MARKET_ID = 'kuru:MON/USDC:spot';

export const AGENT_0_GENESIS_AGENT_ID_SEED = 'xkryptic-agent-0-genesis';

export const AGENT_0_GENESIS_PROFILE: AgentProfileEnvelope = {
  agentName: 'Cristobal Colon',
  handle: 'Agent 0 — Genesis Entry',
  aliases: ['xkryptic', 'LittleGnostic'],
  agentIdSeed: AGENT_0_GENESIS_AGENT_ID_SEED,
  profileVersion: 'big-five-v1',
  profile: {
    openness: 74,
    conscientiousness: 55,
    extraversion: 43,
    agreeableness: 19,
    neuroticism: 12,
  },
  completeProfile: {
    createdAtMs: Date.UTC(2026, 3, 21, 0, 0, 0),
    instruments: {
      bigFive: 'IPIP-NEO-300',
      darkTriad: 'SD3 Short Dark Triad 27-item',
      bigFiveReferencePopulation: 'IPIP reference population, 720,288 persons',
      darkTriadReferencePopulation: 'US Adults estimated norms',
    },
    domains: {
      openness: 74,
      conscientiousness: 55,
      extraversion: 43,
      agreeableness: 19,
      neuroticism: 12,
    },
    facets: {
      extraversion: {
        friendliness: 44,
        gregariousness: 14,
        assertiveness: 47,
        activityLevel: 48,
        excitementSeeking: 83,
        cheerfulness: 42,
      },
      agreeableness: {
        trust: 31,
        morality: 1,
        altruism: 35,
        cooperation: 47,
        modesty: 42,
        sympathy: 48,
      },
      conscientiousness: {
        selfEfficacy: 81,
        orderliness: 51,
        dutifulness: 11,
        achievementStriving: 81,
        selfDiscipline: 62,
        cautiousness: 36,
      },
      neuroticism: {
        anxiety: 1,
        anger: 16,
        depression: 34,
        selfConsciousness: 23,
        immoderation: 45,
        vulnerability: 9,
      },
      openness: {
        imagination: 64,
        artisticInterests: 40,
        emotionality: 59,
        adventurousness: 56,
        intellect: 84,
        liberalism: 80,
      },
    },
    darkTriad: {
      machiavellianism: {
        raw: 4.1,
        osspPercentile: 62,
        usAdultsPercentile: 95,
      },
      narcissism: {
        raw: 3.8,
        osspPercentile: 87,
        usAdultsPercentile: 91,
      },
      psychopathy: {
        raw: 3.0,
        osspPercentile: 63,
        usAdultsPercentile: 92,
      },
    },
  },
};

export const FIRST_ECOSYSTEM_AGENT_PROFILE = AGENT_0_GENESIS_PROFILE;

export const EMERGENCE_RECORDER_ABI = [
  'function registerAgent(bytes32 agentId,string primaryDomain,string secondaryDomain,string tertiaryDomain,uint8[8] scores,bool doveFlag)',
  'function recordClaim(bytes32 agentId,string domain,string decisionHash,uint256 timestamp) returns (bytes32)',
  'function profiles(bytes32 agentId) view returns (bytes32 agentId,string primaryDomain,string secondaryDomain,string tertiaryDomain,uint8 openness,uint8 conscientiousness,uint8 extraversion,uint8 agreeableness,uint8 neuroticism,uint8 machiavellianism,uint8 narcissism,uint8 psychopathy,bool doveFlag,uint256 timestamp)',
  'function agentIndex(uint256 index) view returns (bytes32)',
  'function agentCount() view returns (uint256)',
  'function claimCount() view returns (uint256)',
  'function getClaim(uint256 index) view returns (bytes32 claimId, bytes32 agentId, string domain, string decisionHash, uint256 timestamp, address recorder, uint256 blockNumber)',
  'function getClaimById(bytes32 claimId) view returns (bytes32 claimId, bytes32 agentId, string domain, string decisionHash, uint256 timestamp, address recorder, uint256 blockNumber)',
  'event EmergenceClaimRecorded(bytes32 indexed claimId, bytes32 indexed agentId, string domain, string decisionHash, uint256 timestamp, address indexed recorder)',
] as const;

const KURU_ORDERBOOK_ABI = [
  'function bestBidAsk() view returns (uint256, uint256)',
] as const;

function assertTrait(name: keyof BigFiveProfile, value: number): void {
  if (!Number.isFinite(value) || value < 0 || value > 100) {
    throw new Error(`${name} must be a finite score from 0 to 100.`);
  }
}

function assertPercentile(name: string, value: number): void {
  if (!Number.isFinite(value) || value < 0 || value > 100) {
    throw new Error(`${name} must be a finite percentile from 0 to 100.`);
  }
}

function assertRawDarkTriad(name: string, value: number): void {
  if (!Number.isFinite(value) || value < 1 || value > 5) {
    throw new Error(`${name} raw score must be a finite score from 1 to 5.`);
  }
}

export function assertValidBigFiveProfile(profile: BigFiveProfile): void {
  assertTrait('openness', profile.openness);
  assertTrait('conscientiousness', profile.conscientiousness);
  assertTrait('extraversion', profile.extraversion);
  assertTrait('agreeableness', profile.agreeableness);
  assertTrait('neuroticism', profile.neuroticism);
}

export function assertValidCompletePsychometricProfile(profile: CompletePsychometricProfile): void {
  assertValidBigFiveProfile(profile.domains);

  for (const [domain, facets] of Object.entries(profile.facets)) {
    for (const [facet, value] of Object.entries(facets)) {
      assertPercentile(`${domain}.${facet}`, value as number);
    }
  }

  for (const [trait, score] of Object.entries(profile.darkTriad)) {
    assertRawDarkTriad(`${trait}.raw`, score.raw);
    assertPercentile(`${trait}.osspPercentile`, score.osspPercentile);
    assertPercentile(`${trait}.usAdultsPercentile`, score.usAdultsPercentile);
  }

  if (!Number.isFinite(profile.createdAtMs) || profile.createdAtMs <= 0) {
    throw new Error('createdAtMs must be a positive millisecond timestamp.');
  }
}

export function stableStringify(value: unknown): string {
  if (value === null || typeof value !== 'object') {
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    return `[${value.map((entry) => stableStringify(entry)).join(',')}]`;
  }

  const entries = Object.entries(value as Record<string, unknown>)
    .filter(([, entry]) => entry !== undefined)
    .sort(([left], [right]) => left.localeCompare(right));

  return `{${entries
    .map(([key, entry]) => `${JSON.stringify(key)}:${stableStringify(entry)}`)
    .join(',')}}`;
}

export function hashJson(value: unknown): string {
  return `0x${createHash('sha256').update(stableStringify(value)).digest('hex')}`;
}

export function profileHash(envelope: AgentProfileEnvelope): string {
  assertValidBigFiveProfile(envelope.profile);
  if (envelope.completeProfile) {
    assertValidCompletePsychometricProfile(envelope.completeProfile);
  }
  return hashJson({
    agentName: envelope.agentName,
    aliases: envelope.aliases || [],
    handle: envelope.handle || null,
    profileVersion: envelope.profileVersion,
    profile: envelope.profile,
    completeProfile: envelope.completeProfile || null,
  });
}

export function agentIdForProfile(envelope: AgentProfileEnvelope): string {
  if (envelope.agentIdSeed) {
    return keccak256(toUtf8Bytes(envelope.agentIdSeed));
  }

  const source = `${envelope.agentName}:${profileHash(envelope)}`;
  return keccak256(toUtf8Bytes(source));
}

export function scaleDarkTriadRawToUint8(raw: number): number {
  assertRawDarkTriad('darkTriad.raw', raw);
  const tenths = Math.round(raw * 10);
  return Math.round(((tenths - 10) / 40) * 100);
}

export function computeDoveMonitoringFlags(profile: CompletePsychometricProfile): DoveMonitoringFlags {
  assertValidCompletePsychometricProfile(profile);

  const elevatedMachiavellianism =
    profile.darkTriad.machiavellianism.usAdultsPercentile >= DOVE_DARK_TRIAD_US_PERCENTILE;
  const elevatedNarcissism =
    profile.darkTriad.narcissism.usAdultsPercentile >= DOVE_DARK_TRIAD_US_PERCENTILE;
  const elevatedPsychopathy =
    profile.darkTriad.psychopathy.usAdultsPercentile >= DOVE_DARK_TRIAD_US_PERCENTILE;
  const lowMorality = profile.facets.agreeableness.morality <= DOVE_LOW_FACET_PERCENTILE;
  const lowAnxiety = profile.facets.neuroticism.anxiety <= DOVE_LOW_FACET_PERCENTILE;
  const lowVulnerability = profile.facets.neuroticism.vulnerability <= DOVE_LOW_FACET_PERCENTILE;
  const elevatedDarkTriadComposite =
    [elevatedMachiavellianism, elevatedNarcissism, elevatedPsychopathy]
      .filter(Boolean).length >= 2;

  return {
    elevatedMachiavellianism,
    elevatedNarcissism,
    elevatedPsychopathy,
    lowMorality,
    lowAnxiety,
    lowVulnerability,
    elevatedDarkTriadComposite,
    anyDoveFlag: elevatedMachiavellianism
      || elevatedNarcissism
      || elevatedPsychopathy
      || lowMorality
      || lowAnxiety
      || lowVulnerability
      || elevatedDarkTriadComposite,
  };
}

function getCompleteProfile(envelope: AgentProfileEnvelope): CompletePsychometricProfile {
  if (envelope.completeProfile) {
    assertValidCompletePsychometricProfile(envelope.completeProfile);
    return envelope.completeProfile;
  }

  const base: CompletePsychometricProfile = {
    domains: envelope.profile,
    facets: {
      extraversion: {
        friendliness: envelope.profile.extraversion,
        gregariousness: envelope.profile.extraversion,
        assertiveness: envelope.profile.extraversion,
        activityLevel: envelope.profile.extraversion,
        excitementSeeking: envelope.profile.extraversion,
        cheerfulness: envelope.profile.extraversion,
      },
      agreeableness: {
        trust: envelope.profile.agreeableness,
        morality: envelope.profile.agreeableness,
        altruism: envelope.profile.agreeableness,
        cooperation: envelope.profile.agreeableness,
        modesty: envelope.profile.agreeableness,
        sympathy: envelope.profile.agreeableness,
      },
      conscientiousness: {
        selfEfficacy: envelope.profile.conscientiousness,
        orderliness: envelope.profile.conscientiousness,
        dutifulness: envelope.profile.conscientiousness,
        achievementStriving: envelope.profile.conscientiousness,
        selfDiscipline: envelope.profile.conscientiousness,
        cautiousness: envelope.profile.conscientiousness,
      },
      neuroticism: {
        anxiety: envelope.profile.neuroticism,
        anger: envelope.profile.neuroticism,
        depression: envelope.profile.neuroticism,
        selfConsciousness: envelope.profile.neuroticism,
        immoderation: envelope.profile.neuroticism,
        vulnerability: envelope.profile.neuroticism,
      },
      openness: {
        imagination: envelope.profile.openness,
        artisticInterests: envelope.profile.openness,
        emotionality: envelope.profile.openness,
        adventurousness: envelope.profile.openness,
        intellect: envelope.profile.openness,
        liberalism: envelope.profile.openness,
      },
    },
    darkTriad: {
      machiavellianism: { raw: 1, osspPercentile: 0, usAdultsPercentile: 0 },
      narcissism: { raw: 1, osspPercentile: 0, usAdultsPercentile: 0 },
      psychopathy: { raw: 1, osspPercentile: 0, usAdultsPercentile: 0 },
    },
    createdAtMs: Date.UTC(2026, 3, 21, 0, 0, 0),
    instruments: {
      bigFive: 'domain-only-v1',
      darkTriad: 'not-provided',
      bigFiveReferencePopulation: 'not-provided',
      darkTriadReferencePopulation: 'not-provided',
    },
  };

  return base;
}

export function routeBigFiveProfile(profile: BigFiveProfile): { domain: AgentDomain; reason: string } {
  assertValidBigFiveProfile(profile);

  if (profile.openness >= HIGH && profile.conscientiousness >= HIGH) {
    return {
      domain: 'TRADING',
      reason: 'high openness plus high conscientiousness routes to trading: exploratory enough to find edge, disciplined enough to respect risk bounds',
    };
  }

  if (profile.conscientiousness <= LOW_CONSCIENTIOUSNESS && profile.extraversion >= HIGH) {
    return {
      domain: 'GAMING',
      reason: 'low conscientiousness plus high extraversion routes away from capital execution and toward high-interaction game environments',
    };
  }

  if (
    profile.agreeableness >= GOVERNANCE_AGREEABLENESS
    && profile.conscientiousness >= GOVERNANCE_CONSCIENTIOUSNESS
    && profile.neuroticism <= GOVERNANCE_NEUROTICISM_MAX
  ) {
    return {
      domain: 'GOVERNANCE',
      reason: 'high agreeableness, sufficient conscientiousness, and bounded neuroticism route to governance signal work',
    };
  }

  if (profile.openness >= RESEARCH_OPENNESS || profile.neuroticism >= RESEARCH_NEUROTICISM) {
    return {
      domain: 'RESEARCH',
      reason: 'research route selected for high novelty tolerance or high stress-signal sensitivity',
    };
  }

  return {
    domain: 'RESEARCH',
    reason: 'default route preserves capital safety when no specialized threshold is met',
  };
}

export function encodeAgentProfile(envelope: AgentProfileEnvelope): RoutedAgentProfile {
  const completeProfile = getCompleteProfile(envelope);
  const route = routeCompletePsychometricProfile(completeProfile);
  const doveMonitoringFlags = computeDoveMonitoringFlags(completeProfile);

  return {
    ...envelope,
    completeProfile: {
      ...completeProfile,
      routingResult: route,
      doveMonitoringFlags,
    },
    agentId: agentIdForProfile(envelope),
    profileHash: profileHash(envelope),
    domain: route.primaryDomain,
    primaryDomain: route.primaryDomain,
    secondaryDomain: route.secondaryDomain,
    tertiaryDomain: route.tertiaryDomain,
    routedToGaming: route.routedToGaming,
    doveMonitoringFlags,
    routeReason: route.reasons.join(' | '),
    routeReasons: route.reasons,
  };
}

export function routeCompletePsychometricProfile(profile: CompletePsychometricProfile): RoutingResult {
  assertValidCompletePsychometricProfile(profile);

  const reasons: string[] = [];
  const domains = profile.domains;
  const facets = profile.facets;
  const dark = profile.darkTriad;

  const routesToGaming =
    facets.extraversion.excitementSeeking <= LOW_EXCITEMENT_SEEKING_FOR_GAMING
    && facets.conscientiousness.achievementStriving <= LOW_ACHIEVEMENT_FOR_GAMING
    && domains.conscientiousness <= LOW_CONSCIENTIOUSNESS;

  if (routesToGaming) {
    reasons.push(
      'gaming primary selected because low Excitement-Seeking, low Achievement-Striving, and low Conscientiousness make active trading a poor fit',
    );
    return {
      primaryDomain: 'GAMING',
      secondaryDomain: domains.openness >= RESEARCH_OPENNESS ? 'RESEARCH' : 'GOVERNANCE',
      tertiaryDomain: 'RESEARCH',
      routedToGaming: true,
      reasons,
    };
  }

  const tradingFit =
    domains.openness >= TRADING_OPENNESS_MIN
    && domains.conscientiousness >= TRADING_CONSCIENTIOUSNESS_MIN
    && facets.conscientiousness.selfEfficacy >= TRADING_SELF_EFFICACY_MIN
    && facets.conscientiousness.achievementStriving >= TRADING_ACHIEVEMENT_MIN
    && domains.neuroticism <= TRADING_NEUROTICISM_MAX;

  const governanceFit =
    (
      domains.agreeableness >= GOVERNANCE_AGREEABLENESS
      && domains.conscientiousness >= GOVERNANCE_CONSCIENTIOUSNESS
      && domains.neuroticism <= GOVERNANCE_NEUROTICISM_MAX
    )
    || (
      facets.openness.intellect >= GOVERNANCE_ARCHITECT_INTELLECT
      && facets.conscientiousness.selfEfficacy >= GOVERNANCE_ARCHITECT_SELF_EFFICACY
      && facets.conscientiousness.achievementStriving >= GOVERNANCE_ARCHITECT_ACHIEVEMENT
      && domains.neuroticism <= TRADING_NEUROTICISM_MAX
    );

  const doctrineFit =
    facets.openness.liberalism >= 75
    && (
      facets.openness.intellect >= 80
      || dark.machiavellianism.usAdultsPercentile >= DOVE_DARK_TRIAD_US_PERCENTILE
    );

  if (tradingFit) {
    reasons.push(
      'trading primary selected from high Openness, adequate Conscientiousness, high Self-Efficacy, high Achievement-Striving, and low Neuroticism',
    );
  }

  if (governanceFit) {
    reasons.push(
      'governance secondary selected from founder-architect signal: high Intellect, high Self-Efficacy, high Achievement-Striving, and emotional stability under pressure',
    );
  }

  if (doctrineFit) {
    reasons.push(
      'doctrine tertiary selected from high Liberalism plus high strategic restructuring pressure, indicating framework-building and convention-challenging behavior',
    );
  }

  if (tradingFit) {
    return {
      primaryDomain: 'TRADING',
      secondaryDomain: governanceFit ? 'GOVERNANCE' : 'RESEARCH',
      tertiaryDomain: doctrineFit ? 'DOCTRINE' : 'RESEARCH',
      routedToGaming: false,
      reasons,
    };
  }

  if (governanceFit) {
    return {
      primaryDomain: 'GOVERNANCE',
      secondaryDomain: doctrineFit ? 'DOCTRINE' : 'RESEARCH',
      tertiaryDomain: 'RESEARCH',
      routedToGaming: false,
      reasons,
    };
  }

  if (domains.openness >= RESEARCH_OPENNESS || domains.neuroticism >= RESEARCH_NEUROTICISM) {
    reasons.push('research primary selected for high novelty tolerance or stress-signal sensitivity');
    return {
      primaryDomain: 'RESEARCH',
      secondaryDomain: doctrineFit ? 'DOCTRINE' : 'GOVERNANCE',
      tertiaryDomain: 'GOVERNANCE',
      routedToGaming: false,
      reasons,
    };
  }

  reasons.push('research primary selected as conservative default when no specialized threshold is met');
  return {
    primaryDomain: 'RESEARCH',
    secondaryDomain: 'GOVERNANCE',
    tertiaryDomain: 'DOCTRINE',
    routedToGaming: false,
    reasons,
  };
}

function extractRecorderClaimId(receiptLogs: readonly unknown[], recorder: Contract): string | null {
  for (const log of receiptLogs) {
    try {
      const parsed = recorder.interface.parseLog(log as never);
      if (parsed?.name === 'EmergenceClaimRecorded') {
        return parsed.args.claimId as string;
      }
    } catch {
      continue;
    }
  }

  return null;
}

function numberFromFixed18(value: bigint): number | null {
  if (value === 0n || value === ((1n << 256n) - 1n)) {
    return null;
  }

  return Number(value) / 1e18;
}

async function queryKuruMarket(
  provider: JsonRpcProvider,
  marketAddress: string | undefined,
  marketId: string,
): Promise<ChainDecisionContext['market']> {
  if (!marketAddress) {
    return {
      marketId,
      address: '',
      bestBid: null,
      bestAsk: null,
      midPrice: null,
      spreadBps: null,
      queryStatus: 'not_configured',
    };
  }

  try {
    const code = await provider.getCode(marketAddress);
    if (!code || code === '0x') {
      return {
        marketId,
        address: marketAddress,
        bestBid: null,
        bestAsk: null,
        midPrice: null,
        spreadBps: null,
        queryStatus: 'unavailable',
        queryError: 'market address has no bytecode on the connected chain',
      };
    }

    const market = new Contract(marketAddress, KURU_ORDERBOOK_ABI, provider);
    const [bidRaw, askRaw] = await market.bestBidAsk() as [bigint, bigint];
    const bestBid = numberFromFixed18(bidRaw);
    const bestAsk = numberFromFixed18(askRaw);

    if (bestBid === null || bestAsk === null) {
      return {
        marketId,
        address: marketAddress,
        bestBid,
        bestAsk,
        midPrice: null,
        spreadBps: null,
        queryStatus: 'unavailable',
        queryError: 'best bid/ask was empty or sentinel-valued',
      };
    }

    const midPrice = (bestBid + bestAsk) / 2;
    const spreadBps = midPrice > 0 ? ((bestAsk - bestBid) / midPrice) * 10_000 : null;

    return {
      marketId,
      address: marketAddress,
      bestBid,
      bestAsk,
      midPrice,
      spreadBps,
      queryStatus: 'live',
    };
  } catch (error) {
    return {
      marketId,
      address: marketAddress,
      bestBid: null,
      bestAsk: null,
      midPrice: null,
      spreadBps: null,
      queryStatus: 'unavailable',
      queryError: error instanceof Error ? error.message : String(error),
    };
  }
}

export async function readMonadDecisionContext(
  provider: JsonRpcProvider,
  config: {
    revenueRouterAddress?: string;
    marketAddress?: string;
    marketId?: string;
  } = {},
): Promise<ChainDecisionContext> {
  const revenueRouter = config.revenueRouterAddress || LIVE_REVENUE_ROUTER_ADDRESS;
  const [network, block, feeData, routerCode, market] = await Promise.all([
    provider.getNetwork(),
    provider.getBlock('latest'),
    provider.getFeeData(),
    provider.getCode(revenueRouter),
    queryKuruMarket(provider, config.marketAddress, config.marketId || DEFAULT_MONAD_MARKET_ID),
  ]);

  if (!block) {
    throw new Error('Could not read latest Monad block.');
  }

  return {
    chainId: Number(network.chainId),
    blockNumber: block.number,
    blockTimestamp: block.timestamp,
    gasPriceWei: feeData.gasPrice?.toString() || null,
    revenueRouter,
    revenueRouterCodeHash: routerCode && routerCode !== '0x' ? keccak256(getBytes(routerCode)) : null,
    market,
  };
}

function selectTradingAction(context: ChainDecisionContext): { action: TradingAction; reasoning: string } {
  if (context.chainId !== MONAD_MAINNET_CHAIN_ID) {
    return {
      action: 'HOLD',
      reasoning: `hold selected because connected chain ${context.chainId} is not Monad mainnet ${MONAD_MAINNET_CHAIN_ID}`,
    };
  }

  if (!context.revenueRouterCodeHash) {
    return {
      action: 'HOLD',
      reasoning: 'hold selected because the live RevenueRouter code hash could not be verified',
    };
  }

  if (!context.market || context.market.queryStatus !== 'live' || context.market.spreadBps === null) {
    return {
      action: 'HOLD',
      reasoning: 'hold selected because no reliable live market spread was available; record-only proof mode forbids capital movement',
    };
  }

  if (context.market.spreadBps <= 12) {
    return {
      action: 'BUY',
      reasoning: `buy signal recorded because ${context.market.marketId} spread ${context.market.spreadBps.toFixed(2)} bps is tight; no funds moved in proof mode`,
    };
  }

  if (context.market.spreadBps >= 80) {
    return {
      action: 'SELL',
      reasoning: `sell/risk-off signal recorded because ${context.market.marketId} spread ${context.market.spreadBps.toFixed(2)} bps is too wide; no funds moved in proof mode`,
    };
  }

  return {
    action: 'HOLD',
    reasoning: `hold selected because ${context.market.marketId} spread ${context.market.spreadBps.toFixed(2)} bps is observable but not actionable in proof mode`,
  };
}

function selectDomainAction(routed: RoutedAgentProfile, context: ChainDecisionContext): { action: AgentAction; reasoning: string } {
  if (routed.domain === 'TRADING') {
    return selectTradingAction(context);
  }

  if (routed.domain === 'GAMING') {
    return {
      action: 'PROPOSE_GAME_LOOP',
      reasoning: 'gaming route produced a proposal for an onchain crafting/trading loop instead of capital execution',
    };
  }

  if (routed.domain === 'GOVERNANCE') {
    return {
      action: 'FLAG_GOVERNANCE_SIGNAL',
      reasoning: 'governance route produced a stability signal for later proposal review',
    };
  }

  if (routed.domain === 'DOCTRINE') {
    return {
      action: 'FLAG_DOCTRINE_SIGNAL',
      reasoning: 'doctrine route produced a framework-pressure signal for later alignment review',
    };
  }

  return {
    action: 'RECORD_BEHAVIORAL_SIGNAL',
    reasoning: 'research route produced an observation-oriented behavioral signal rather than an execution instruction',
  };
}

export function createLocalBehavioralClaim(
  routed: RoutedAgentProfile,
  decisionPayload: Record<string, unknown>,
  decisionHash: string,
  createdAtMs: number,
): EmergenceClaim {
  return createEmergenceClaim({
    claimId: `live-agent-${decisionHash.slice(2, 18)}`,
    tier: 'causal_set',
    eventWindow: {
      label: 'live-agent-behavioral-loop-v1',
      startTimestampMs: createdAtMs,
      endTimestampMs: createdAtMs,
    },
    candidateEventSummary: `${routed.agentName} produced one routed ${routed.domain} behavioral decision for onchain recording.`,
    nonDecomposabilityBasis:
      'The evidence point requires both the psychometric profile route and the live decision context; neither stream alone explains the recorded behavior.',
    metricEvidence: [
      {
        evidenceId: 'live-agent-decision-hash',
        surface: 'live_agent_behavioral_loop',
        ref: decisionHash,
        summary: 'cryptographic hash of the deterministic decision payload',
      },
    ],
    comprehensionalExplanation:
      'This is a bounded behavioral data point, not an emergence declaration: a profile was routed, a decision was made, and the hash can be permanently recorded.',
    falsifiablePrediction: {
      predictionStatement:
        'The same profile will route to the same domain under the deterministic Big Five router.',
      predictionScope: 'agent_behavioral',
      evaluationWindow: {
        label: 'next-live-agent-routing-check',
        startTimestampMs: createdAtMs,
        endTimestampMs: createdAtMs + 86_400_000,
      },
      falsificationCondition: 'The same profile routes to a different domain without an explicit router-version change.',
      confirmationCondition: 'The same profile routes to the same domain under the same router version.',
    },
    observerPackageVersion: 'live-agent-loop-v1',
    substrateSummaryRefs: [
      {
        evidenceId: 'revenue-router-mainnet',
        surface: 'phase1a_revenue_router',
        ref: LIVE_REVENUE_ROUTER_ADDRESS,
        summary: 'live Phase 1a RevenueRouter connected to the behavioral loop context',
      },
    ],
    streamsSampled: [
      {
        streamId: 'psychometric_profile',
        snapshotRef: routed.profileHash,
        summary: 'Big Five profile hash',
      },
      {
        streamId: 'domain_router',
        snapshotRef: routed.domain,
        summary: routed.routeReason,
      },
      {
        streamId: 'live_decision',
        snapshotRef: decisionHash,
        summary: stableStringify(decisionPayload),
      },
    ],
    causalStreamSet: [
      {
        streamId: 'psychometric_profile',
        snapshotRef: routed.profileHash,
        summary: 'Big Five profile hash',
      },
      {
        streamId: 'live_decision',
        snapshotRef: decisionHash,
        summary: 'decision hash',
      },
    ],
    metricSourceId: 'live-agent-loop',
    narrativeSourceId: 'emergence-claim-core',
    metricGenerationPath: 'Big Five profile -> deterministic router -> live Monad context -> decision hash',
    narrativeGenerationPath: 'emergence-claim-core -> bounded behavioral evidence artifact',
    causalNecessityArguments: [
      {
        streamId: 'psychometric_profile',
        snapshotRef: routed.profileHash,
        necessityArgument: 'without the profile, there is no psychometric route explaining why this domain was chosen',
      },
      {
        streamId: 'live_decision',
        snapshotRef: decisionHash,
        necessityArgument: 'without the decision, there is no behavioral data point to record',
      },
    ],
    createdAtMs,
    createdBy: 'live-agent-loop',
    statusNotes: [
      'local-analysis-only claim artifact',
      'onchain recorder stores the behavioral data point but does not ratify emergence',
    ],
  });
}

export function buildAgentDecision(
  routed: RoutedAgentProfile,
  context: ChainDecisionContext,
  createdAtMs = Date.now(),
): AgentDecision {
  const selected = selectDomainAction(routed, context);
  const decisionPayload = {
    agentId: routed.agentId,
    agentName: routed.agentName,
    profileHash: routed.profileHash,
    profileVersion: routed.profileVersion,
    profile: routed.profile,
    domain: routed.primaryDomain,
    secondaryDomain: routed.secondaryDomain,
    tertiaryDomain: routed.tertiaryDomain,
    routedToGaming: routed.routedToGaming,
    doveMonitoringFlags: routed.doveMonitoringFlags,
    routeReason: routed.routeReason,
    routeReasons: routed.routeReasons,
    action: selected.action,
    reasoning: selected.reasoning,
    context,
    createdAtMs,
    proofMode: 'record-only-no-funds-moved',
  };
  const decisionHash = hashJson(decisionPayload);

  return {
    agentId: routed.agentId,
    agentName: routed.agentName,
    profileHash: routed.profileHash,
    domain: routed.domain,
    action: selected.action,
    reasoning: selected.reasoning,
    decisionHash,
    decisionPayload,
    createdAtMs,
    context,
    localEmergenceClaim: createLocalBehavioralClaim(routed, decisionPayload, decisionHash, createdAtMs),
  };
}

export async function executeAgentDecision(
  envelope: AgentProfileEnvelope,
  provider: JsonRpcProvider,
  config: {
    revenueRouterAddress?: string;
    marketAddress?: string;
    marketId?: string;
  } = {},
): Promise<{ routed: RoutedAgentProfile; decision: AgentDecision }> {
  const routed = encodeAgentProfile(envelope);
  const context = await readMonadDecisionContext(provider, config);
  return {
    routed,
    decision: buildAgentDecision(routed, context),
  };
}

export async function recordDecisionOnchain(
  decision: AgentDecision,
  config: RunLiveAgentConfig,
): Promise<OnchainRecordProof> {
  const provider = new JsonRpcProvider(config.rpcUrl);
  const wallet = new Wallet(config.privateKey, provider);
  const recorder = new Contract(config.emergenceRecorderAddress, EMERGENCE_RECORDER_ABI, wallet);
  const timestamp = Math.floor(decision.createdAtMs / 1000);
  const tx = await recorder.recordClaim(decision.agentId, decision.domain, decision.decisionHash, timestamp);
  const receipt = await tx.wait();

  if (!receipt || receipt.status !== 1) {
    throw new Error(`recordClaim transaction failed: ${tx.hash}`);
  }

  return {
    recorderAddress: config.emergenceRecorderAddress,
    revenueRouter: config.revenueRouterAddress || LIVE_REVENUE_ROUTER_ADDRESS,
    txHash: tx.hash,
    blockNumber: receipt.blockNumber,
    claimId: extractRecorderClaimId(receipt.logs, recorder),
    explorerUrl: `https://monadscan.com/tx/${tx.hash}`,
  };
}

export function getOnchainAgentScores(envelope: AgentProfileEnvelope): [number, number, number, number, number, number, number, number] {
  const complete = getCompleteProfile(envelope);
  return [
    complete.domains.openness,
    complete.domains.conscientiousness,
    complete.domains.extraversion,
    complete.domains.agreeableness,
    complete.domains.neuroticism,
    scaleDarkTriadRawToUint8(complete.darkTriad.machiavellianism.raw),
    scaleDarkTriadRawToUint8(complete.darkTriad.narcissism.raw),
    scaleDarkTriadRawToUint8(complete.darkTriad.psychopathy.raw),
  ];
}

export async function registerAgentProfileOnchain(
  routed: RoutedAgentProfile,
  config: RunLiveAgentConfig,
): Promise<OnchainAgentRegistrationProof> {
  const provider = new JsonRpcProvider(config.rpcUrl);
  const wallet = new Wallet(config.privateKey, provider);
  const recorder = new Contract(config.emergenceRecorderAddress, EMERGENCE_RECORDER_ABI, wallet);
  const scores = getOnchainAgentScores(routed);
  const tx = await recorder.registerAgent(
    routed.agentId,
    routed.primaryDomain,
    routed.secondaryDomain,
    routed.tertiaryDomain,
    scores,
    routed.doveMonitoringFlags.anyDoveFlag,
  );
  const receipt = await tx.wait();

  if (!receipt || receipt.status !== 1) {
    throw new Error(`registerAgent transaction failed: ${tx.hash}`);
  }

  return {
    recorderAddress: config.emergenceRecorderAddress,
    revenueRouter: config.revenueRouterAddress || LIVE_REVENUE_ROUTER_ADDRESS,
    txHash: tx.hash,
    blockNumber: receipt.blockNumber,
    agentId: routed.agentId,
    explorerUrl: `https://monadscan.com/tx/${tx.hash}`,
  };
}

export async function runLiveAgentProof(config: RunLiveAgentConfig): Promise<LiveAgentProof> {
  const provider = new JsonRpcProvider(config.rpcUrl);
  const { routed, decision } = await executeAgentDecision(
    FIRST_ECOSYSTEM_AGENT_PROFILE,
    provider,
    {
      revenueRouterAddress: config.revenueRouterAddress,
      marketAddress: config.marketAddress,
      marketId: config.marketId,
    },
  );
  const onchain = await recordDecisionOnchain(decision, config);

  return {
    routedProfile: routed,
    decision,
    onchain,
  };
}

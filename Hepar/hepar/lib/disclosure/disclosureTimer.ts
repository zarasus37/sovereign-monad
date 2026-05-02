// disclosureTimer.ts
// Responsible Disclosure Window Management
// Advisory Tier: fixture-verified only. No live telemetry.

export type DisclosureSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export type DisclosureStatus =
  | 'OPEN'
  | 'ACKNOWLEDGED'
  | 'FIX_DEPLOYED'
  | 'PUBLISHED'
  | 'DISPUTED'
  | 'EXTENDED'
  | 'IGNORED'
  | 'CLOSED';

export type DisclosureOutcome =
  | 'PROTOCOL_FIXED'
  | 'PROTOCOL_IGNORED'
  | 'PROTOCOL_DISPUTED'
  | 'EXTENSION_GRANTED';

export interface DisclosureWindow {
  windowId: string;
  heparRunId: string;
  protocolId: string;
  vectorId: string;
  severity: DisclosureSeverity;
  openedAt: number;
  deadlineAt: number;
  extendedDeadlineAt?: number;
  extensionGranted: boolean;
  extensionDays?: number;
  extensionGrantedAt?: number;
  status: DisclosureStatus;
  lastUpdatedAt: number;
  outcome?: DisclosureOutcome;
}

// Window days per severity — binding constants
const WINDOW_DAYS: Record<DisclosureSeverity, number> = {
  CRITICAL: 90,
  HIGH: 60,
  MEDIUM: 30,
  LOW: 14,
};

const MS_PER_DAY = 86_400_000;

export function severityToWindowDays(severity: DisclosureSeverity): number {
  return WINDOW_DAYS[severity];
}

export function openDisclosureWindow(
  heparRunId: string,
  protocolId: string,
  vectorId: string,
  severity: DisclosureSeverity,
  openedAt: number = Date.now()
): DisclosureWindow {
  const windowDays = severityToWindowDays(severity);
  const deadlineAt = openedAt + windowDays * MS_PER_DAY;
  const windowId = `DW-${protocolId}-${vectorId}-${openedAt}`;

  return {
    windowId,
    heparRunId,
    protocolId,
    vectorId,
    severity,
    openedAt,
    deadlineAt,
    extensionGranted: false,
    status: 'OPEN',
    lastUpdatedAt: openedAt,
  };
}

export function updateDisclosureStatus(
  window: DisclosureWindow,
  newStatus: DisclosureStatus,
  timestamp: number = Date.now()
): DisclosureWindow {
  return {
    ...window,
    status: newStatus,
    lastUpdatedAt: timestamp,
  };
}

// Max extension days by severity
const MAX_EXTENSION_DAYS: Record<DisclosureSeverity, number> = {
  CRITICAL: 30,
  HIGH: 30,
  MEDIUM: 14,
  LOW: 14,
};

export function grantExtension(
  window: DisclosureWindow,
  extensionDays: number,
  grantedAt: number = Date.now()
): DisclosureWindow {
  if (window.extensionGranted) {
    throw new Error(
      `Extension already granted for window ${window.windowId}. Only one extension permitted per disclosure window.`
    );
  }

  const maxDays = MAX_EXTENSION_DAYS[window.severity];
  if (extensionDays > maxDays) {
    throw new Error(
      `Extension of ${extensionDays} days exceeds maximum of ${maxDays} days for severity ${window.severity}.`
    );
  }

  const baseDeadline = window.deadlineAt;
  const extendedDeadlineAt = baseDeadline + extensionDays * MS_PER_DAY;

  return {
    ...window,
    extensionGranted: true,
    extensionDays,
    extensionGrantedAt: grantedAt,
    extendedDeadlineAt,
    status: 'EXTENDED',
    lastUpdatedAt: grantedAt,
  };
}

export function isOverdue(window: DisclosureWindow, now: number = Date.now()): boolean {
  // Terminal/resolved statuses are never overdue
  if (
    window.status === 'FIX_DEPLOYED' ||
    window.status === 'PUBLISHED' ||
    window.status === 'DISPUTED' ||
    window.status === 'CLOSED'
  ) {
    return false;
  }

  // Already marked ignored — overdue was already applied
  if (window.status === 'IGNORED') {
    return true;
  }

  // Use extended deadline if extension was granted
  const effectiveDeadline = window.extendedDeadlineAt ?? window.deadlineAt;
  return now > effectiveDeadline;
}

export function daysRemaining(window: DisclosureWindow, now: number = Date.now()): number {
  const effectiveDeadline = window.extendedDeadlineAt ?? window.deadlineAt;
  return Math.ceil((effectiveDeadline - now) / MS_PER_DAY);
}

export function checkAndEscalate(
  window: DisclosureWindow,
  now: number = Date.now()
): DisclosureWindow {
  if (window.status !== 'OPEN' && window.status !== 'ACKNOWLEDGED' && window.status !== 'EXTENDED') {
    return window;
  }

  if (isOverdue(window, now)) {
    return {
      ...window,
      status: 'IGNORED',
      outcome: 'PROTOCOL_IGNORED',
      lastUpdatedAt: now,
    };
  }

  return window;
}

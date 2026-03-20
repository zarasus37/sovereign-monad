import { v4 as uuidv4 } from 'uuid';

// Database interface for trade logging
// Uses simple JSON file storage for Docker compatibility
// Can be swapped for SQLite with better-sqlite3

interface TradeRecord {
  id: string;
  timestamp: string;
  chain: string;
  pair: string;
  side: string;
  size_usd: number;
  price: number;
  pnl: number;
  status: string;
  planId: string;
  executedAt: string;
}

interface OpportunityRecord {
  id: string;
  timestamp: string;
  chain_a: string;
  chain_b: string;
  spread_bps: number;
  size_usd: number;
  executed: boolean;
  planId?: string;
}

interface BalanceSnapshot {
  id: string;
  timestamp: string;
  chain: string;
  token: string;
  balance: number;
  usd_value: number;
}

const DB_PATH = process.env.DB_PATH || '/app/data/trades.json';

class TradeDatabase {
  private trades: TradeRecord[] = [];
  private opportunities: OpportunityRecord[] = [];
  private balances: BalanceSnapshot[] = [];
  private initialized = false;

  async init(): Promise<void> {
    if (this.initialized) return;
    
    try {
      const fs = await import('fs');
      if (fs.existsSync(DB_PATH)) {
        const data = JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
        this.trades = data.trades || [];
        this.opportunities = data.opportunities || [];
        this.balances = data.balances || [];
      }
    } catch (error) {
      console.error('Failed to load database:', error);
    }
    
    this.initialized = true;
  }

  private save(): void {
    try {
      const fs = require('fs');
      const dir = require('path').dirname(DB_PATH);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(DB_PATH, JSON.stringify({
        trades: this.trades,
        opportunities: this.opportunities,
        balances: this.balances,
      }, null, 2));
    } catch (error) {
      console.error('Failed to save database:', error);
    }
  }

  logTrade(record: Omit<TradeRecord, 'id' | 'timestamp' | 'executedAt'>): string {
    const id = uuidv4();
    const timestamp = new Date().toISOString();
    
    this.trades.push({
      ...record,
      id,
      timestamp,
      executedAt: timestamp,
    });
    
    this.save();
    return id;
  }

  logOpportunity(record: Omit<OpportunityRecord, 'id' | 'timestamp'>): string {
    const id = uuidv4();
    const timestamp = new Date().toISOString();
    
    this.opportunities.push({
      ...record,
      id,
      timestamp,
    });
    
    this.save();
    return id;
  }

  markOpportunityExecuted(opportunityId: string, planId: string): void {
    const opp = this.opportunities.find(o => o.id === opportunityId);
    if (opp) {
      opp.executed = true;
      opp.planId = planId;
      this.save();
    }
  }

  logBalance(record: Omit<BalanceSnapshot, 'id' | 'timestamp'>): string {
    const id = uuidv4();
    const timestamp = new Date().toISOString();
    
    this.balances.push({
      ...record,
      id,
      timestamp,
    });
    
    this.save();
    return id;
  }

  getRecentTrades(limit = 10): TradeRecord[] {
    return this.trades.slice(-limit);
  }

  getOpenOpportunities(limit = 10): OpportunityRecord[] {
    return this.opportunities.filter(o => !o.executed).slice(-limit);
  }

  getRecentBalances(limit = 10): BalanceSnapshot[] {
    return this.balances.slice(-limit);
  }

  getTotalPnl(): number {
    return this.trades.reduce((sum, t) => sum + (t.pnl || 0), 0);
  }

  getTradeCount(): number {
    return this.trades.length;
  }
}

export const tradeDb = new TradeDatabase();

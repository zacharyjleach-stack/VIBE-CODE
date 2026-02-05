/**
 * UsageManager.ts
 * Subscription-based billing & feature access system
 * Prevents API key abuse by enforcing tier-based feature limits
 */

export type TierName = 'FREE' | 'STARTER' | 'PRO' | 'ULTRA';

export interface Tier {
  name: TierName;
  price: number; // in GBP
  requestsPerDay: number; // Daily request limit (0 = unlimited)
  maxAgents: number; // Max concurrent agents
  features: string[];
  integrations: string[]; // Allowed integration names
  aiModels: string[]; // Allowed AI models
}

export const TIERS: Record<TierName, Tier> = {
  FREE: {
    name: 'FREE',
    price: 0,
    requestsPerDay: 10,
    maxAgents: 1,
    features: [
      '10 requests/day',
      'Basic AI chat',
      '1 concurrent agent',
      'Community support'
    ],
    integrations: [],
    aiModels: ['claude-haiku']
  },
  STARTER: {
    name: 'STARTER',
    price: 18,
    requestsPerDay: 100,
    maxAgents: 4,
    features: [
      '100 requests/day',
      'Advanced AI chat',
      '4 concurrent agents',
      'Priority support',
      'GitHub integration'
    ],
    integrations: ['github', 'vscode'],
    aiModels: ['claude-haiku', 'claude-sonnet']
  },
  PRO: {
    name: 'PRO',
    price: 80,
    requestsPerDay: 1000,
    maxAgents: 16,
    features: [
      '1,000 requests/day',
      'All AI models',
      '16 concurrent agents',
      '24/7 support',
      'All integrations',
      'Custom deployments'
    ],
    integrations: ['github', 'vscode', 'vercel', 'docker', 'redis', 'supabase'],
    aiModels: ['claude-haiku', 'claude-sonnet', 'claude-opus', 'gpt-4']
  },
  ULTRA: {
    name: 'ULTRA',
    price: 170,
    requestsPerDay: 0, // Unlimited
    maxAgents: 0, // Unlimited
    features: [
      'Unlimited requests',
      'Unlimited AI models',
      'Unlimited agents',
      'Dedicated support',
      'White-label option',
      'API access',
      'Custom training'
    ],
    integrations: ['github', 'vscode', 'vercel', 'docker', 'redis', 'supabase', 'custom'],
    aiModels: ['all']
  }
};

export interface User {
  id: string;
  tier: TierName;
  requestsToday: number;
  lastResetDate: Date;
  subscriptionStart: Date;
  subscriptionEnd: Date;
}

// Mock user state (replace with database in production)
let currentUser: User = {
  id: 'mock-user-1',
  tier: 'FREE',
  requestsToday: 0,
  lastResetDate: new Date(),
  subscriptionStart: new Date(),
  subscriptionEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
};

export class UsageManager {
  /**
   * Check if daily limit needs reset
   */
  private static checkDailyReset(): void {
    const now = new Date();
    const lastReset = currentUser.lastResetDate;

    // Reset if it's a new day
    if (now.getDate() !== lastReset.getDate() ||
        now.getMonth() !== lastReset.getMonth() ||
        now.getFullYear() !== lastReset.getFullYear()) {
      currentUser.requestsToday = 0;
      currentUser.lastResetDate = now;
      console.log('[UsageManager] Daily usage reset');
    }
  }

  /**
   * Check if user can make a request
   * @returns true if allowed, false if limit exceeded
   */
  static canMakeRequest(): boolean {
    this.checkDailyReset();

    const tier = TIERS[currentUser.tier];

    // Unlimited for ULTRA tier (requestsPerDay = 0)
    if (tier.requestsPerDay === 0) {
      currentUser.requestsToday++;
      return true;
    }

    if (currentUser.requestsToday >= tier.requestsPerDay) {
      console.warn(`[UsageManager] Daily limit exceeded: ${currentUser.requestsToday}/${tier.requestsPerDay}`);
      return false;
    }

    // Increment request count
    currentUser.requestsToday++;
    console.log(`[UsageManager] Request counted (${currentUser.requestsToday}/${tier.requestsPerDay})`);
    return true;
  }

  /**
   * Check if user can use a specific number of agents
   * @param agentCount - Number of agents to use
   * @returns true if allowed, false if exceeds tier limit
   */
  static canUseAgents(agentCount: number): boolean {
    const tier = TIERS[currentUser.tier];

    // Unlimited for ULTRA tier
    if (tier.maxAgents === 0) {
      return true;
    }

    return agentCount <= tier.maxAgents;
  }

  /**
   * Check if user has access to a specific integration
   * @param integrationName - Name of the integration
   * @returns true if allowed
   */
  static hasIntegration(integrationName: string): boolean {
    const tier = TIERS[currentUser.tier];
    return tier.integrations.includes(integrationName.toLowerCase());
  }

  /**
   * Check if user has access to a specific AI model
   * @param modelName - Name of the AI model
   * @returns true if allowed
   */
  static hasAIModel(modelName: string): boolean {
    const tier = TIERS[currentUser.tier];

    // ULTRA tier has access to all models
    if (tier.aiModels.includes('all')) {
      return true;
    }

    return tier.aiModels.includes(modelName.toLowerCase());
  }

  /**
   * Upgrade user to a new tier
   * @param tierName - Target tier
   */
  static upgradeTier(tierName: TierName): void {
    const oldTier = currentUser.tier;
    currentUser.tier = tierName;
    currentUser.subscriptionStart = new Date();
    currentUser.subscriptionEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    console.log(`[UsageManager] Upgraded from ${oldTier} to ${tierName}`);
  }

  /**
   * Get current user state
   */
  static getUser(): User {
    this.checkDailyReset();
    return { ...currentUser };
  }

  /**
   * Get usage percentage for the day
   */
  static getUsagePercentage(): number {
    this.checkDailyReset();
    const tier = TIERS[currentUser.tier];

    // Unlimited tier shows 0%
    if (tier.requestsPerDay === 0) {
      return 0;
    }

    return (currentUser.requestsToday / tier.requestsPerDay) * 100;
  }

  /**
   * Get remaining requests for today
   */
  static getRemainingRequests(): number {
    this.checkDailyReset();
    const tier = TIERS[currentUser.tier];

    // Unlimited
    if (tier.requestsPerDay === 0) {
      return Infinity;
    }

    return Math.max(0, tier.requestsPerDay - currentUser.requestsToday);
  }

  /**
   * Reset daily usage (automatic at midnight, or manual for testing)
   */
  static resetDailyUsage(): void {
    currentUser.requestsToday = 0;
    currentUser.lastResetDate = new Date();
    console.log('[UsageManager] Daily usage reset');
  }

  /**
   * Simulate request consumption (for testing)
   */
  static simulateRequests(count: number): void {
    currentUser.requestsToday += count;
    console.log(`[UsageManager] Simulated ${count} requests (${currentUser.requestsToday}/${TIERS[currentUser.tier].requestsPerDay})`);
  }

  /**
   * Get all features for current tier
   */
  static getCurrentFeatures(): {
    requestsPerDay: number | string;
    maxAgents: number | string;
    integrations: string[];
    aiModels: string[];
  } {
    const tier = TIERS[currentUser.tier];

    return {
      requestsPerDay: tier.requestsPerDay === 0 ? 'Unlimited' : tier.requestsPerDay,
      maxAgents: tier.maxAgents === 0 ? 'Unlimited' : tier.maxAgents,
      integrations: tier.integrations,
      aiModels: tier.aiModels
    };
  }
}

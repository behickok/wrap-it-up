-- Migration: 0011_pricing_and_transactions
-- Description: Add pricing, transactions, and manual revenue tracking tables
-- Date: 2025-11-13
-- Note: Built for manual transaction tracking before Stripe integration

-- ============================================================================
-- JOURNEY PRICING CONFIGURATION
-- ============================================================================

-- Creator sets prices for each journey/tier combination
CREATE TABLE IF NOT EXISTS journey_pricing (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    journey_id INTEGER NOT NULL,
    tier_id INTEGER NOT NULL,
    base_price_monthly REAL NOT NULL,
    base_price_annual REAL NOT NULL,
    platform_fee_percentage REAL DEFAULT 15.0,
    -- Calculated fields (85% of base price goes to creator)
    creator_revenue_monthly REAL GENERATED ALWAYS AS (
        base_price_monthly * (100 - platform_fee_percentage) / 100
    ) STORED,
    creator_revenue_annual REAL GENERATED ALWAYS AS (
        base_price_annual * (100 - platform_fee_percentage) / 100
    ) STORED,
    platform_fee_monthly REAL GENERATED ALWAYS AS (
        base_price_monthly * platform_fee_percentage / 100
    ) STORED,
    platform_fee_annual REAL GENERATED ALWAYS AS (
        base_price_annual * platform_fee_percentage / 100
    ) STORED,
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (journey_id) REFERENCES journeys(id) ON DELETE CASCADE,
    FOREIGN KEY (tier_id) REFERENCES service_tiers(id) ON DELETE CASCADE,
    UNIQUE(journey_id, tier_id)
);

-- ============================================================================
-- MENTOR & CONCIERGE RATES
-- ============================================================================

-- Mentor review rates per journey
CREATE TABLE IF NOT EXISTS mentor_rates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    mentor_id INTEGER NOT NULL,
    journey_id INTEGER NOT NULL,
    review_rate REAL NOT NULL, -- per review
    currency TEXT DEFAULT 'USD',
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (mentor_id) REFERENCES mentors(id) ON DELETE CASCADE,
    FOREIGN KEY (journey_id) REFERENCES journeys(id) ON DELETE CASCADE,
    UNIQUE(mentor_id, journey_id)
);

-- Concierge session rates per journey
CREATE TABLE IF NOT EXISTS concierge_rates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    coach_id INTEGER NOT NULL,
    journey_id INTEGER NOT NULL,
    hourly_rate REAL NOT NULL,
    session_rate REAL NOT NULL, -- per session (if different from hourly)
    currency TEXT DEFAULT 'USD',
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (coach_id) REFERENCES coaches(id) ON DELETE CASCADE,
    FOREIGN KEY (journey_id) REFERENCES journeys(id) ON DELETE CASCADE,
    UNIQUE(coach_id, journey_id)
);

-- ============================================================================
-- SUBSCRIPTION TRACKING (Manual, no Stripe yet)
-- ============================================================================

-- Track user subscriptions (manually managed initially)
CREATE TABLE IF NOT EXISTS user_subscriptions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_journey_id INTEGER NOT NULL,
    tier_id INTEGER NOT NULL,
    status TEXT DEFAULT 'active' CHECK(status IN ('active', 'cancelled', 'paused', 'expired')),
    billing_cycle TEXT DEFAULT 'monthly' CHECK(billing_cycle IN ('monthly', 'annual')),

    -- Pricing at time of subscription
    price_amount REAL NOT NULL,
    platform_fee REAL NOT NULL,
    creator_amount REAL NOT NULL,

    -- Subscription dates
    started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    current_period_start DATETIME DEFAULT CURRENT_TIMESTAMP,
    current_period_end DATETIME NOT NULL,
    cancelled_at DATETIME,

    -- Payment tracking (manual for now)
    payment_method TEXT DEFAULT 'manual', -- 'manual', 'stripe', etc.
    stripe_subscription_id TEXT, -- for future Stripe integration

    -- Notes for manual tracking
    notes TEXT,

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_journey_id) REFERENCES user_journeys(id) ON DELETE CASCADE,
    FOREIGN KEY (tier_id) REFERENCES service_tiers(id) ON DELETE CASCADE
);

-- ============================================================================
-- TRANSACTION TRACKING
-- ============================================================================

-- Record all financial transactions (manual tracking initially)
CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    -- Transaction basics
    transaction_type TEXT NOT NULL CHECK(transaction_type IN (
        'subscription',      -- Monthly/annual subscription payment
        'review',           -- Mentor review payment
        'session',          -- Concierge session payment
        'affiliate',        -- Affiliate commission
        'refund',           -- Refund to customer
        'adjustment'        -- Manual adjustment
    )),

    -- Related records
    user_id INTEGER NOT NULL, -- Who paid (for subscriptions) or who gets paid (for reviews/sessions)
    user_journey_id INTEGER,
    journey_id INTEGER NOT NULL,
    mentor_id INTEGER, -- if transaction_type = 'review'
    coach_id INTEGER, -- if transaction_type = 'session'
    subscription_id INTEGER, -- if transaction_type = 'subscription'

    -- Financial breakdown
    amount REAL NOT NULL, -- Total amount
    platform_fee REAL NOT NULL, -- 15% platform fee
    creator_amount REAL NOT NULL, -- Amount for journey creator
    mentor_amount REAL DEFAULT 0, -- Amount for mentor (if review)
    concierge_amount REAL DEFAULT 0, -- Amount for concierge (if session)
    affiliate_amount REAL DEFAULT 0, -- Affiliate commission (if applicable)

    -- Payment tracking
    status TEXT DEFAULT 'pending' CHECK(status IN (
        'pending',      -- Transaction recorded, payment not yet received
        'completed',    -- Payment received
        'failed',       -- Payment failed
        'refunded',     -- Refunded to customer
        'cancelled'     -- Transaction cancelled
    )),

    -- Payment method (manual for now)
    payment_method TEXT DEFAULT 'manual',
    stripe_payment_id TEXT, -- for future Stripe integration

    -- Metadata
    description TEXT,
    notes TEXT, -- Internal notes for manual tracking
    metadata TEXT, -- JSON for additional data

    -- Dates
    transaction_date DATE DEFAULT CURRENT_DATE,
    completed_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (user_journey_id) REFERENCES user_journeys(id) ON DELETE CASCADE,
    FOREIGN KEY (journey_id) REFERENCES journeys(id) ON DELETE CASCADE,
    FOREIGN KEY (mentor_id) REFERENCES mentors(id) ON DELETE SET NULL,
    FOREIGN KEY (coach_id) REFERENCES coaches(id) ON DELETE SET NULL,
    FOREIGN KEY (subscription_id) REFERENCES user_subscriptions(id) ON DELETE SET NULL
);

-- ============================================================================
-- PAYOUT TRACKING
-- ============================================================================

-- Track payouts to creators, mentors, and concierges
CREATE TABLE IF NOT EXISTS payouts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    -- Who gets paid
    user_id INTEGER NOT NULL,
    payout_type TEXT NOT NULL CHECK(payout_type IN (
        'creator',      -- Journey creator payout
        'mentor',       -- Mentor review payout
        'concierge',    -- Concierge session payout
        'affiliate'     -- Affiliate commission payout
    )),

    -- Payout details
    amount REAL NOT NULL,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,

    -- Status
    status TEXT DEFAULT 'pending' CHECK(status IN (
        'pending',      -- Awaiting minimum threshold
        'processing',   -- Being processed
        'completed',    -- Paid out
        'failed',       -- Payout failed
        'cancelled'     -- Payout cancelled
    )),

    -- Payment method
    payment_method TEXT DEFAULT 'manual', -- 'manual', 'stripe', 'bank_transfer', etc.
    stripe_payout_id TEXT, -- for future Stripe integration

    -- Metadata
    transaction_count INTEGER DEFAULT 0, -- Number of transactions in this payout
    notes TEXT, -- Internal notes

    -- Dates
    scheduled_date DATE,
    completed_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Link transactions to payouts (many-to-one)
CREATE TABLE IF NOT EXISTS payout_transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    payout_id INTEGER NOT NULL,
    transaction_id INTEGER NOT NULL,
    amount REAL NOT NULL, -- Amount from this transaction included in payout
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (payout_id) REFERENCES payouts(id) ON DELETE CASCADE,
    FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE CASCADE,
    UNIQUE(payout_id, transaction_id)
);

-- ============================================================================
-- AFFILIATE SYSTEM
-- ============================================================================

-- Affiliate links for mentors and concierges
CREATE TABLE IF NOT EXISTS affiliate_links (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL, -- mentor or concierge
    journey_id INTEGER NOT NULL,
    affiliate_code TEXT UNIQUE NOT NULL, -- unique code (e.g., 'MENTOR-JANE-WEDDING')
    commission_percentage REAL NOT NULL, -- set by creator

    -- Tracking
    click_count INTEGER DEFAULT 0,
    signup_count INTEGER DEFAULT 0,
    total_revenue REAL DEFAULT 0, -- total affiliate commissions earned

    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (journey_id) REFERENCES journeys(id) ON DELETE CASCADE,
    UNIQUE(user_id, journey_id)
);

-- Track affiliate link clicks
CREATE TABLE IF NOT EXISTS affiliate_clicks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    affiliate_link_id INTEGER NOT NULL,
    ip_address TEXT,
    user_agent TEXT,
    referrer TEXT,
    clicked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (affiliate_link_id) REFERENCES affiliate_links(id) ON DELETE CASCADE
);

-- Track affiliate conversions (signups)
CREATE TABLE IF NOT EXISTS affiliate_conversions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    affiliate_link_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL, -- user who signed up
    user_journey_id INTEGER NOT NULL,
    commission_amount REAL NOT NULL,
    transaction_id INTEGER, -- link to transaction
    converted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (affiliate_link_id) REFERENCES affiliate_links(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (user_journey_id) REFERENCES user_journeys(id) ON DELETE CASCADE,
    FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE SET NULL
);

-- ============================================================================
-- REVENUE SETTINGS
-- ============================================================================

-- Platform-wide revenue settings (configurable by super admin)
CREATE TABLE IF NOT EXISTS revenue_settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    setting_key TEXT UNIQUE NOT NULL,
    setting_value TEXT NOT NULL,
    description TEXT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Seed default settings
INSERT INTO revenue_settings (setting_key, setting_value, description) VALUES
('platform_fee_percentage', '15.0', 'Platform fee percentage (default 15%)'),
('minimum_payout_amount', '100.00', 'Minimum payout amount in USD'),
('refund_window_days', '30', 'Refund window in days'),
('affiliate_enabled', 'true', 'Enable affiliate system'),
('manual_payment_enabled', 'true', 'Allow manual payment tracking');

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_journey_pricing_journey ON journey_pricing(journey_id);
CREATE INDEX IF NOT EXISTS idx_journey_pricing_tier ON journey_pricing(tier_id);
CREATE INDEX IF NOT EXISTS idx_journey_pricing_active ON journey_pricing(is_active);

CREATE INDEX IF NOT EXISTS idx_mentor_rates_mentor ON mentor_rates(mentor_id);
CREATE INDEX IF NOT EXISTS idx_mentor_rates_journey ON mentor_rates(journey_id);

CREATE INDEX IF NOT EXISTS idx_concierge_rates_coach ON concierge_rates(coach_id);
CREATE INDEX IF NOT EXISTS idx_concierge_rates_journey ON concierge_rates(journey_id);

CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_journey ON user_subscriptions(user_journey_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status ON user_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_tier ON user_subscriptions(tier_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_period_end ON user_subscriptions(current_period_end);

CREATE INDEX IF NOT EXISTS idx_transactions_user ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_journey ON transactions(journey_id);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(transaction_date);
CREATE INDEX IF NOT EXISTS idx_transactions_created ON transactions(created_at);

CREATE INDEX IF NOT EXISTS idx_payouts_user ON payouts(user_id);
CREATE INDEX IF NOT EXISTS idx_payouts_type ON payouts(payout_type);
CREATE INDEX IF NOT EXISTS idx_payouts_status ON payouts(status);
CREATE INDEX IF NOT EXISTS idx_payouts_period ON payouts(period_start, period_end);

CREATE INDEX IF NOT EXISTS idx_payout_transactions_payout ON payout_transactions(payout_id);
CREATE INDEX IF NOT EXISTS idx_payout_transactions_transaction ON payout_transactions(transaction_id);

CREATE INDEX IF NOT EXISTS idx_affiliate_links_user ON affiliate_links(user_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_links_journey ON affiliate_links(journey_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_links_code ON affiliate_links(affiliate_code);
CREATE INDEX IF NOT EXISTS idx_affiliate_links_active ON affiliate_links(is_active);

CREATE INDEX IF NOT EXISTS idx_affiliate_clicks_link ON affiliate_clicks(affiliate_link_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_clicks_date ON affiliate_clicks(clicked_at);

CREATE INDEX IF NOT EXISTS idx_affiliate_conversions_link ON affiliate_conversions(affiliate_link_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_conversions_user ON affiliate_conversions(user_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_conversions_transaction ON affiliate_conversions(transaction_id);

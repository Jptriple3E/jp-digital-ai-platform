-- JP Digital AI Platform
-- Cloudflare D1 Database Schema

PRAGMA foreign_keys = ON;


-- =========================================
-- USERS
-- =========================================

CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE,
    name TEXT,
    country TEXT,
    currency TEXT DEFAULT 'USD',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);


-- =========================================
-- WEBSITE PROJECTS
-- =========================================

CREATE TABLE IF NOT EXISTS website_projects (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    business_name TEXT NOT NULL,
    business_description TEXT,
    business_type TEXT,
    generated_content TEXT,
    generated_html TEXT,
    public_slug TEXT UNIQUE,
    payment_status TEXT DEFAULT 'unpaid',
    unlocked INTEGER DEFAULT 0,
    published INTEGER DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE SET NULL
);


-- =========================================
-- RECEPTIONIST TRIALS
-- =========================================

CREATE TABLE IF NOT EXISTS receptionist_trials (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    business_name TEXT,
    business_description TEXT,
    trial_started_at TEXT,
    trial_ends_at TEXT,
    payment_status TEXT DEFAULT 'trial',
    activated INTEGER DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE SET NULL
);


-- =========================================
-- PAYMENTS
-- =========================================

CREATE TABLE IF NOT EXISTS payments (
    id TEXT PRIMARY KEY,

    user_id TEXT,

    product_type TEXT NOT NULL,

    product_id TEXT,

    amount_usd REAL NOT NULL,

    amount_local REAL,

    currency TEXT NOT NULL,

    exchange_rate REAL,

    paystack_reference TEXT UNIQUE,

    paystack_status TEXT,

    payment_status TEXT DEFAULT 'pending',

    paid_at TEXT,

    created_at TEXT DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE SET NULL
);


-- =========================================
-- GENERATED WEBSITES
-- =========================================

CREATE TABLE IF NOT EXISTS generated_websites (
    id TEXT PRIMARY KEY,

    project_id TEXT NOT NULL,

    slug TEXT UNIQUE NOT NULL,

    html TEXT,

    css TEXT,

    javascript TEXT,

    seo_title TEXT,

    seo_description TEXT,

    published INTEGER DEFAULT 0,

    created_at TEXT DEFAULT CURRENT_TIMESTAMP,

    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (project_id)
        REFERENCES website_projects(id)
        ON DELETE CASCADE
);


-- =========================================
-- SCANNER HISTORY
-- =========================================

CREATE TABLE IF NOT EXISTS scanner_results (
    id TEXT PRIMARY KEY,

    url TEXT NOT NULL,

    score INTEGER,

    seo_score INTEGER,

    performance_score INTEGER,

    conversion_score INTEGER,

    trust_score INTEGER,

    authority_score INTEGER,

    crawlability_score INTEGER,

    ai_visibility_score INTEGER,

    results_json TEXT,

    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);


-- =========================================
-- DIGITAL PRODUCTS
-- =========================================

CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY,

    name TEXT NOT NULL,

    slug TEXT UNIQUE NOT NULL,

    description TEXT,

    category TEXT,

    price_usd REAL NOT NULL,

    product_url TEXT,

    active INTEGER DEFAULT 1,

    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);


-- =========================================
-- INDEXES
-- =========================================

CREATE INDEX IF NOT EXISTS idx_projects_user
ON website_projects(user_id);

CREATE INDEX IF NOT EXISTS idx_projects_slug
ON website_projects(public_slug);

CREATE INDEX IF NOT EXISTS idx_payments_user
ON payments(user_id);

CREATE INDEX IF NOT EXISTS idx_payments_reference
ON payments(paystack_reference);

CREATE INDEX IF NOT EXISTS idx_trials_user
ON receptionist_trials(user_id);

CREATE INDEX IF NOT EXISTS idx_scanner_url
ON scanner_results(url);

CREATE INDEX IF NOT EXISTS idx_products_slug
ON products(slug);

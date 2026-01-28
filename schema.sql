
-- 1. Database Creation (Manual step: Run 'CREATE DATABASE "SpeditionDB";' first if not exists)

-- 2. Users Table: For Authentication
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL, -- Hashed password
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Contacts Table: Customers and Vendors
CREATE TABLE IF NOT EXISTS contacts (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    type VARCHAR(50) NOT NULL CHECK (type IN ('Customer', 'Vendor')),
    address TEXT,
    tax_id VARCHAR(100),
    balance DECIMAL(15, 2) DEFAULT 0.00,
    initials VARCHAR(5),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Documents Table: Invoices, Bills, Estimates
CREATE TABLE IF NOT EXISTS documents (
    id SERIAL PRIMARY KEY,
    reference VARCHAR(100) NOT NULL UNIQUE,
    type VARCHAR(50) NOT NULL, -- Invoice, Bill, Estimate
    contact VARCHAR(255) NOT NULL,
    contact_initials VARCHAR(5),
    amount DECIMAL(15, 2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'USD',
    status VARCHAR(50) NOT NULL, -- Paid, Open, Overdue, Pending, Canceled
    date DATE NOT NULL,
    due_date DATE,
    source VARCHAR(100) DEFAULT 'Manual',
    uploaded_by VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

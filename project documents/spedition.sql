-- 1. پہلے ڈیٹا بیس بنائیں (اگر پہلے سے نہیں بنا ہوا)
-- CREATE DATABASE "SpeditionDB";

-- 2. Users Table: لاگ ان اور رجسٹریشن کے لیے
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL, -- یہ ہیشڈ پاس ورڈ (Hashed) اسٹور کرے گا
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Contacts Table: کسٹمرز اور وینڈرز کے لیے (جس کا ڈیزائن ابھی بنایا ہے)
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

-- 4. Documents Table: انوائسز اور بلز کے لیے
CREATE TABLE IF NOT EXISTS documents (
    id SERIAL PRIMARY KEY,
    reference VARCHAR(100) NOT NULL UNIQUE,
    type VARCHAR(50) NOT NULL, -- 'Invoice' یا 'Bill'
    contact VARCHAR(255) NOT NULL,
    contact_initials VARCHAR(5),
    amount DECIMAL(15, 2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'USD',
    status VARCHAR(50) NOT NULL, -- 'Paid', 'Open', 'Overdue', 'Pending', 'Canceled'
    date DATE NOT NULL,
    due_date DATE,
    source VARCHAR(100) DEFAULT 'Manual',
    uploaded_by VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. نمونے کے طور پر کچھ ڈیٹا ڈالنے کے لیے (Optional)
INSERT INTO contacts (name, email, type, address, tax_id, balance, initials) 
VALUES 
('Acme Corp', 'billing@acmecorp.com', 'Customer', '123 Business Rd, NY', 'US-123456', 1200.00, 'AC'),
('Global Supplies Inc.', 'support@globalsupplies.com', 'Vendor', '456 Logistics Ave, CA', 'US-987654', 0.00, 'GS');
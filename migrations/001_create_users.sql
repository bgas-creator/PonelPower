CREATE TABLE users (
    id UUID PRIMARY KEY,
    fullname VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    password_hash TEXT NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'buyer',
    country VARCHAR(100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT users_role_valid CHECK (role IN ('buyer', 'seller', 'admin'))
);

CREATE UNIQUE INDEX users_email_unique ON users (LOWER(email));

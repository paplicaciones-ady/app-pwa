CREATE TABLE IF NOT EXISTS "users" (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    "passwordHash" VARCHAR(255) NOT NULL,
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "passkey_credentials" (
    id SERIAL PRIMARY KEY,
    "userId" INTEGER NOT NULL REFERENCES "users"(id) ON DELETE CASCADE,
    "credentialId" VARCHAR(255) NOT NULL,
    "publicKey" TEXT NOT NULL,
    counter INTEGER NOT NULL DEFAULT 0,
    "backedUp" BOOLEAN NOT NULL DEFAULT FALSE,
    "deviceName" VARCHAR(255),
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    transports JSON
);

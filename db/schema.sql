-- The tables of the optional cloud copy (D1 database "fin-accounts", binding DB), used by _acct.js.
-- Kept here so the database can be rebuilt and tested locally. This folder is not served (see .assetsignore).
-- Every value stored is either a one-way fingerprint or a package locked on the person's phone.
CREATE TABLE IF NOT EXISTS acct (
  id TEXT PRIMARY KEY,            -- 13.91+: fingerprint of (name fingerprint + password fingerprint); older rows: the name fingerprint
  auth TEXT NOT NULL,             -- SHA-256 of the password fingerprint (the fingerprint itself is PBKDF2 on the phone)
  asalt TEXT NOT NULL,
  esalt TEXT NOT NULL,
  blob TEXT,                      -- the locked account package
  ver INTEGER NOT NULL DEFAULT 0,
  plan TEXT NOT NULL DEFAULT 'free',
  created INTEGER NOT NULL,
  at INTEGER NOT NULL,
  size INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS docmeta (
  id TEXT PRIMARY KEY,
  owner TEXT NOT NULL,            -- acct.id
  name TEXT NOT NULL,             -- locked on the phone
  size INTEGER NOT NULL,          -- 13.91+: the size really stored (sum of the parts)
  parts INTEGER NOT NULL,
  at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS docpart (
  id TEXT NOT NULL,
  n INTEGER NOT NULL,
  data TEXT NOT NULL,             -- locked on the phone
  PRIMARY KEY (id, n)
);
CREATE INDEX IF NOT EXISTS docmeta_owner ON docmeta (owner);
-- 13.92: suspicious activity (_sx.js). The code also creates these on first use (CREATE TABLE IF NOT EXISTS), so nothing has to be
-- applied by hand. No IP address, name or fingerprint: only a 10-minute slot, the kind, a route from a fixed list, a count and
-- at most a two-letter country code. Slots older than 30 days are removed by the half-hourly cron.
CREATE TABLE IF NOT EXISTS secev (
  b INTEGER NOT NULL,             -- the 10-minute slot (milliseconds / 600000)
  kind TEXT NOT NULL,             -- login | lock | rate | xsite | big | path
  route TEXT NOT NULL,            -- e.g. /api/acct, /admin/login (never the address the request typed)
  n INTEGER NOT NULL DEFAULT 0,   -- how many in the slot
  hint TEXT NOT NULL DEFAULT '',  -- a country code when the platform gives one, else empty
  PRIMARY KEY (b, kind, route)
);
CREATE TABLE IF NOT EXISTS secalert (
  kind TEXT PRIMARY KEY,          -- the last alert sent to the owner's inbox for this kind (at most one an hour)
  at INTEGER NOT NULL
);

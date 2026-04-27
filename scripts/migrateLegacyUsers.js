/* eslint-disable no-console */
const fs = require('fs');
const path = require('path');
const admin = require('firebase-admin');

const UID_REGEX = /^[A-Za-z0-9]{28}$/;

function parseArgs(argv) {
  const args = new Set(argv.slice(2));
  return {
    dryRun: args.has('--dry-run'),
    deleteLegacy: args.has('--delete-legacy'),
  };
}

function requiredEnv(name) {
  const value = process.env[name];
  if (!value || !value.trim()) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value.trim();
}

function readServiceAccount() {
  const explicitPath = process.env.SERVICE_ACCOUNT_PATH;
  if (!explicitPath) return null;

  const absolutePath = path.resolve(explicitPath);
  if (!fs.existsSync(absolutePath)) {
    throw new Error(`SERVICE_ACCOUNT_PATH file not found: ${absolutePath}`);
  }

  return JSON.parse(fs.readFileSync(absolutePath, 'utf8'));
}

function isLegacyUsernameKey(key) {
  return !UID_REGEX.test(key);
}

function sanitizeLegacyProfile(username, profile) {
  const clean = { ...(profile || {}) };
  delete clean.password;
  return {
    ...clean,
    username: clean.username || username,
    migratedFromUsername: username,
    migratedAt: new Date().toISOString(),
  };
}

async function getOrCreateAuthUser(email, password) {
  try {
    const existing = await admin.auth().getUserByEmail(email);
    return { uid: existing.uid, created: false };
  } catch (error) {
    if (error.code !== 'auth/user-not-found') {
      throw error;
    }
  }

  const created = await admin.auth().createUser({
    email,
    password,
    emailVerified: false,
  });
  return { uid: created.uid, created: true };
}

async function migrate() {
  const { dryRun, deleteLegacy } = parseArgs(process.argv);
  const databaseURL = requiredEnv('FIREBASE_DATABASE_URL');
  const serviceAccount = readServiceAccount();

  if (!admin.apps.length) {
    if (serviceAccount) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL,
      });
    } else {
      admin.initializeApp({ databaseURL });
    }
  }

  const db = admin.database();
  const usersRef = db.ref('users');
  const snapshot = await usersRef.get();
  const users = snapshot.val() || {};

  const legacyEntries = Object.entries(users).filter(([key]) => isLegacyUsernameKey(key));
  if (legacyEntries.length === 0) {
    console.log('No legacy username-keyed users found. Nothing to migrate.');
    return;
  }

  const result = {
    totalLegacy: legacyEntries.length,
    migrated: 0,
    skipped: 0,
    failed: 0,
  };

  for (const [username, profile] of legacyEntries) {
    try {
      const email = profile?.email ? String(profile.email).trim() : '';
      const password = profile?.password ? String(profile.password) : '';

      if (!email || !password) {
        result.skipped += 1;
        console.log(`SKIP ${username}: missing email/password in legacy profile`);
        continue;
      }

      const { uid, created } = await getOrCreateAuthUser(email, password);
      const sanitizedProfile = sanitizeLegacyProfile(username, profile);

      if (!dryRun) {
        await db.ref(`users/${uid}`).set(sanitizedProfile);
        if (deleteLegacy) {
          await db.ref(`users/${username}`).remove();
        }
      }

      result.migrated += 1;
      console.log(
        `OK ${username} -> ${uid} (${created ? 'created auth user' : 'existing auth user'})${dryRun ? ' [dry-run]' : ''}`
      );
    } catch (error) {
      result.failed += 1;
      console.error(`FAIL ${username}: ${error.message}`);
    }
  }

  console.log('\nMigration summary');
  console.log(`Legacy users found: ${result.totalLegacy}`);
  console.log(`Migrated: ${result.migrated}`);
  console.log(`Skipped: ${result.skipped}`);
  console.log(`Failed: ${result.failed}`);
  console.log(`Mode: ${dryRun ? 'dry-run (no writes)' : 'write mode'}`);
  console.log(`Delete legacy keys: ${deleteLegacy ? 'yes' : 'no'}`);
}

migrate().catch((error) => {
  console.error(`Migration crashed: ${error.message}`);
  process.exit(1);
});

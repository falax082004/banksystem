/* eslint-disable no-console */
const fs = require('fs');
const path = require('path');
const admin = require('firebase-admin');

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

function parseArgs(argv) {
  const args = argv.slice(2);
  const options = {};
  for (const token of args) {
    if (!token.startsWith('--')) continue;
    const [key, ...rest] = token.slice(2).split('=');
    options[key] = rest.length ? rest.join('=') : true;
  }
  return options;
}

async function getOrCreateAuthAdmin(email, password) {
  try {
    const existing = await admin.auth().getUserByEmail(email);
    return { uid: existing.uid, created: false };
  } catch (error) {
    if (error.code !== 'auth/user-not-found') throw error;
  }

  const created = await admin.auth().createUser({
    email,
    password,
    emailVerified: true,
  });
  return { uid: created.uid, created: true };
}

async function seedAdmin() {
  const args = parseArgs(process.argv);
  const databaseURL = requiredEnv('FIREBASE_DATABASE_URL');
  const email = String(args.email || process.env.ADMIN_EMAIL || 'admin@pasabuy.app').trim();
  const password = String(args.password || process.env.ADMIN_PASSWORD || '').trim();
  const username = String(args.username || process.env.ADMIN_USERNAME || 'admin').trim();
  const name = String(args.name || process.env.ADMIN_NAME || 'System Administrator').trim();

  if (!password) {
    throw new Error('Missing admin password. Provide --password=... or set ADMIN_PASSWORD.');
  }

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
  const { uid, created } = await getOrCreateAuthAdmin(email, password);

  // Keep profile + username index in sync with current app auth model.
  await db.ref().update({
    [`users/${uid}`]: {
      name,
      email,
      username,
      usernameKey: username.toLowerCase(),
      accountUsername: username,
      role: 'admin',
      approvalStatus: 'approved',
      pasabuyerEnabled: false,
      createdAt: new Date().toISOString(),
      notifications: {},
    },
    [`usernames/${username.toLowerCase()}`]: uid,
  });

  console.log(`Admin ${created ? 'created' : 'updated'} successfully.`);
  console.log(`uid: ${uid}`);
  console.log(`email: ${email}`);
  console.log(`username: ${username}`);
}

seedAdmin().catch((error) => {
  console.error(`Admin seed failed: ${error.message}`);
  process.exit(1);
});

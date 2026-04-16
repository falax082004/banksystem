import { db, ref, get, update } from '../firebaseConfig';

const PAYMENT_CHANNELS = ['GCash', 'Maya', 'PayPal', 'Card', 'Other e-wallet'];
const DEFAULT_WALLET = {
  pasapayBalance: 0,
  pasapayTransactions: [],
  lastCashInAt: null,
  lastWithdrawalAt: null,
};

const normalizeAmount = (amount) => {
  const value = Number(amount);
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error('Please enter a valid amount.');
  }
  return Math.round(value * 100) / 100;
};

const appendTransaction = (transactions = [], entry) => {
  const next = [entry, ...transactions];
  return next.slice(0, 50);
};

export const pasapayService = {
  paymentChannels: PAYMENT_CHANNELS,

  getWithdrawalFee(amount) {
    const value = normalizeAmount(amount);
    return Math.max(10, Math.round(value * 0.02));
  },

  getRequiredCashReserve(amount) {
    const value = normalizeAmount(amount);
    // Required Balance = Order Amount × 1.2
    const rawRequired = value * 1.2;
    // Round up to nearest 10 pesos (e.g. 406 -> 410)
    return Math.ceil(rawRequired / 10) * 10;
  },

  getCashPlatformFeeFromEarning(earningAmount) {
    normalizeAmount(earningAmount);
    // Fixed platform fee for cash orders (example: ₱50 gross -> -₱10 fee -> ₱40 net)
    return 10;
  },

  async getWallet(userId) {
    if (!userId) {
      throw new Error('User not found.');
    }

    const userRef = ref(db, `users/${userId}`);
    const snapshot = await get(userRef);
    const userData = snapshot.exists() ? snapshot.val() : {};

    return {
      ...DEFAULT_WALLET,
      pasapayBalance: Number(userData.pasapayBalance || 0),
      pasapayTransactions: Array.isArray(userData.pasapayTransactions) ? userData.pasapayTransactions : [],
      lastCashInAt: userData.lastCashInAt || null,
      lastWithdrawalAt: userData.lastWithdrawalAt || null,
    };
  },

  async ensureWallet(userId) {
    const wallet = await this.getWallet(userId);
    const userRef = ref(db, `users/${userId}`);
    await update(userRef, wallet);
    return wallet;
  },

  async cashIn(userId, amount, channel) {
    if (!PAYMENT_CHANNELS.includes(channel)) {
      throw new Error('Choose a supported cash-in method.');
    }

    const value = normalizeAmount(amount);
    const wallet = await this.getWallet(userId);
    const now = new Date().toISOString();
    const nextBalance = Number((wallet.pasapayBalance + value).toFixed(2));
    const transaction = {
      id: `cashin-${Date.now()}`,
      type: 'cash_in',
      amount: value,
      fee: 0,
      netAmount: value,
      channel,
      createdAt: now,
      summary: `Cash in via ${channel}`,
    };

    await update(ref(db, `users/${userId}`), {
      pasapayBalance: nextBalance,
      pasapayTransactions: appendTransaction(wallet.pasapayTransactions, transaction),
      lastCashInAt: now,
    });

    return { balance: nextBalance, transaction };
  },

  async withdraw(userId, amount, channel) {
    if (!PAYMENT_CHANNELS.includes(channel)) {
      throw new Error('Choose a supported withdrawal method.');
    }

    const value = normalizeAmount(amount);
    const fee = this.getWithdrawalFee(value);
    const wallet = await this.getWallet(userId);
    const totalDeduction = Number((value + fee).toFixed(2));

    if (wallet.pasapayBalance < totalDeduction) {
      throw new Error('Insufficient Pasapay balance for this withdrawal and fee.');
    }

    const now = new Date().toISOString();
    const nextBalance = Number((wallet.pasapayBalance - totalDeduction).toFixed(2));
    const transaction = {
      id: `withdraw-${Date.now()}`,
      type: 'withdrawal',
      amount: value,
      fee,
      netAmount: Number((value - fee).toFixed(2)),
      channel,
      createdAt: now,
      summary: `Withdraw via ${channel}`,
    };

    await update(ref(db, `users/${userId}`), {
      pasapayBalance: nextBalance,
      pasapayTransactions: appendTransaction(wallet.pasapayTransactions, transaction),
      lastWithdrawalAt: now,
    });

    return { balance: nextBalance, fee, transaction };
  },

  async spend(userId, amount, summary, meta = {}) {
    const value = normalizeAmount(amount);
    const wallet = await this.getWallet(userId);

    if (wallet.pasapayBalance < value) {
      throw new Error('Insufficient Pasapay balance.');
    }

    const nextBalance = Number((wallet.pasapayBalance - value).toFixed(2));
    const transaction = {
      id: `spend-${Date.now()}`,
      type: 'payment',
      amount: value,
      fee: 0,
      netAmount: value,
      channel: 'Pasapay',
      createdAt: new Date().toISOString(),
      summary,
      ...meta,
    };

    await update(ref(db, `users/${userId}`), {
      pasapayBalance: nextBalance,
      pasapayTransactions: appendTransaction(wallet.pasapayTransactions, transaction),
    });

    return { balance: nextBalance, transaction };
  },

  async credit(userId, amount, summary, meta = {}) {
    const value = normalizeAmount(amount);
    const wallet = await this.getWallet(userId);
    const nextBalance = Number((wallet.pasapayBalance + value).toFixed(2));
    const transaction = {
      id: `credit-${Date.now()}`,
      type: 'credit',
      amount: value,
      fee: 0,
      netAmount: value,
      channel: 'Earnings',
      createdAt: new Date().toISOString(),
      summary,
      ...meta,
    };

    await update(ref(db, `users/${userId}`), {
      pasapayBalance: nextBalance,
      pasapayTransactions: appendTransaction(wallet.pasapayTransactions, transaction),
    });

    return { balance: nextBalance, transaction };
  },
};

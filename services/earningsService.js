import { db, ref, push, set, serverTimestamp, get } from '../firebaseConfig';

// Simple earning calculation: base + per km, fallback to percent of order total
const BASE_FEE_PHP = 20; // base delivery fee
const FEE_PER_KM_PHP = 10; // fee per kilometer
const FALLBACK_PERCENT = 0.1; // 10% of order total if distance missing

export const earningsService = {
  calculateEarningForOrder: (order) => {
    const distanceKm = typeof order?.distanceKm === 'number' ? order.distanceKm : null;
    const totalAmount = typeof order?.totalAmount === 'number' ? order.totalAmount : 0;
    let amount = 0;
    let method = 'distance_based';
    if (distanceKm !== null && !Number.isNaN(distanceKm)) {
      amount = BASE_FEE_PHP + FEE_PER_KM_PHP * Math.max(0, distanceKm);
    } else {
      method = 'percent_total';
      amount = Math.max(0, totalAmount * FALLBACK_PERCENT);
    }
    // Round to 2 decimals
    amount = Math.round(amount * 100) / 100;
    return { amount, distanceKm: distanceKm ?? null, method };
  },

  recordDeliveryEarning: async (riderId, order) => {
    if (!riderId || !order?.id) return;
    const { amount, distanceKm, method } = earningsService.calculateEarningForOrder(order);
    const earningsRef = ref(db, `earnings/riders/${riderId}`);
    const newRef = push(earningsRef);
    const payload = {
      id: newRef.key,
      riderId,
      orderId: order.id,
      orderNumber: order.orderNumber || null,
      type: 'delivery',
      amount,
      distanceKm,
      method,
      totalAmount: order.totalAmount ?? null,
      createdAt: new Date().toISOString(),
      createdAtServer: serverTimestamp(),
    };
    await set(newRef, payload);
    return payload;
  },

  fetchEarningsOnce: async (riderId) => {
    const r = ref(db, `earnings/riders/${riderId}`);
    const snap = await get(r);
    if (!snap.exists()) return [];
    const data = snap.val();
    return Object.keys(data).map((k) => data[k]);
  },
};





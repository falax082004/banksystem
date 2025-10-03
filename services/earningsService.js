import { db, ref, push, set, serverTimestamp, get } from '../firebaseConfig';

// Enhanced earning calculation similar to common delivery platforms
// Configurable tiers and multipliers
const VEHICLE_MULTIPLIER = {
  bike: 0.8,
  motorcycle: 1.0,
  car: 1.6,
  van: 2.5,
};

const DISTANCE_TIERS = [
  { maxKm: 3, base: 50, perKm: 0 },
  { maxKm: 5, base: 60, perKm: 8 },
  { maxKm: 8, base: 75, perKm: 10 },
  { maxKm: 12, base: 90, perKm: 12 },
  { maxKm: Infinity, base: 100, perKm: 14 },
];

const WEIGHT_TIERS = [
  { maxKg: 3, add: 0 },
  { maxKg: 5, add: 10 },
  { maxKg: 10, add: 25 },
  { maxKg: Infinity, add: 50 },
];

const STOP_FEE_RANGE = { min: 20, max: 50 }; // per additional stop (beyond first)
const FALLBACK_PERCENT = 0.1; // fallback if distance missing

export const earningsService = {
  calculateEarningForOrder: (order) => {
    const distanceKm = typeof order?.distanceKm === 'number' ? order.distanceKm : null;
    const totalAmount = typeof order?.totalAmount === 'number' ? order.totalAmount : 0;
    const vehicle = (order?.vehicleType || 'motorcycle').toLowerCase();
    const vehicleMultiplier = VEHICLE_MULTIPLIER[vehicle] ?? 1.0;
    const estWeightKg = typeof order?.estimatedWeightKg === 'number' ? order.estimatedWeightKg : null;
    const stops = Array.isArray(order?.stores) ? Math.max(1, order.stores.length) : 1;

    let method = 'distance_vehicle_weight_stops';
    let base = 0;
    if (distanceKm !== null && !Number.isNaN(distanceKm)) {
      // pick tier and compute
      const tier = DISTANCE_TIERS.find(t => distanceKm <= t.maxKm) || DISTANCE_TIERS[DISTANCE_TIERS.length - 1];
      const extraKm = Math.max(0, distanceKm - (tier.maxKm === Infinity ? 12 : (tier.maxKm - (tier.perKm > 0 ? 1 : 0))));
      base = tier.base + (tier.perKm > 0 ? (Math.max(0, distanceKm - Math.min(distanceKm, (tier.maxKm === Infinity ? 12 : (tier.maxKm - 1)))) * tier.perKm) : 0);
    } else {
      method = 'fallback_percent_total';
      base = Math.max(0, totalAmount * FALLBACK_PERCENT);
    }

    // weight add-on
    let weightAdd = 0;
    if (estWeightKg !== null && !Number.isNaN(estWeightKg)) {
      const wt = WEIGHT_TIERS.find(w => estWeightKg <= w.maxKg) || WEIGHT_TIERS[WEIGHT_TIERS.length - 1];
      weightAdd = wt.add;
    }

    // stops add-on (beyond first)
    const additionalStops = Math.max(0, stops - 1);
    // distribute per stop within range relative to distance (simple heuristic)
    const perStop = Math.round((STOP_FEE_RANGE.min + Math.min(1, (distanceKm ?? 5) / 10) * (STOP_FEE_RANGE.max - STOP_FEE_RANGE.min)));
    const stopsAdd = additionalStops * perStop;

    let amount = (base + weightAdd + stopsAdd) * vehicleMultiplier;
    amount = Math.round(amount * 100) / 100;
    return { amount, distanceKm: distanceKm ?? null, method, vehicleType: vehicle, weightAdd, stopsAdd, perStop, vehicleMultiplier };
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








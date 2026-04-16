import { db, ref, push, set, serverTimestamp, get } from '../firebaseConfig';
import { pasapayService } from './pasapayService';

const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
const lerp = (a, b, t) => a + (b - a) * t;

// Batangas provincial delivery pricing (gross earning shown in Earnings)
// Near (1–2 km) → ₱30 – ₱50
// Medium (3–5 km) → ₱50 – ₱80
// Far (6–10 km) → ₱80 – ₱120
const calculateProvincialDeliveryFee = (distanceKm) => {
  const d = typeof distanceKm === 'number' && Number.isFinite(distanceKm) ? distanceKm : null;
  if (d === null) return 50;

  if (d <= 1) return 30;
  if (d <= 2) return Math.round(lerp(30, 50, clamp((d - 1) / 1, 0, 1)));
  if (d < 3) return 50;
  if (d <= 5) return Math.round(lerp(50, 80, clamp((d - 3) / 2, 0, 1)));
  if (d < 6) return 80;
  if (d <= 10) return Math.round(lerp(80, 120, clamp((d - 6) / 4, 0, 1)));
  return Math.round(120 + (d - 10) * 10);
};

export const earningsService = {
  calculateEarningForOrder: (order) => {
    const distanceKm = typeof order?.distanceKm === 'number' ? order.distanceKm : null;
    const amount = calculateProvincialDeliveryFee(distanceKm);
    return { amount, distanceKm: distanceKm ?? null, method: 'batangas_provincial_pricing' };
  },

  recordDeliveryEarning: async (riderId, order, isPasabuyer = false) => {
    if (!riderId || !order?.id) return;
    const { amount, distanceKm, method } = earningsService.calculateEarningForOrder(order);
    // IMPORTANT: earnings are based on DELIVERY FEE only, never on item/order total.
    const deliveryFee = Number(amount || 0);
    const platformFee = order?.paymentMethod === 'cash' ? pasapayService.getCashPlatformFeeFromEarning(deliveryFee) : 0;
    const netAmount = Math.max(0, Number((deliveryFee - platformFee).toFixed(2)));
    // Riders: earnings/riders/{riderId}
    // Pasabuyers: earnings/pasabuyers/{riderId}
    const path = isPasabuyer ? `earnings/pasabuyers/${riderId}` : `earnings/riders/${riderId}`;
    const earningsRef = ref(db, path);
    const newRef = push(earningsRef);
    const payload = {
      id: newRef.key,
      riderId,
      orderId: order.id,
      orderNumber: order.orderNumber || null,
      type: isPasabuyer ? 'pasabuy' : 'delivery',
      amount: netAmount,
      deliveryFee,
      grossAmount: deliveryFee,
      platformFee,
      netAmount,
      distanceKm,
      method,
      paymentMethod: order?.paymentMethod || 'cash',
      totalAmount: order.totalAmount ?? null,
      createdAt: new Date().toISOString(),
      createdAtServer: serverTimestamp(),
      creditedToPasapay: order?.paymentMethod === 'cash' ? false : true,
    };
    await set(newRef, payload);

    // Pasapay connection:
    // - ONLINE/PASAPAY: credit NET earning (after fixed -₱10 platform fee)
    // - CASH: do NOT credit earning into Pasapay; only deduct the fixed platform fee (-₱10)
    if (order?.paymentMethod !== 'cash') {
      await pasapayService.credit(riderId, netAmount, `Earnings from ${isPasabuyer ? 'pasabuy' : 'delivery'} ${order.orderNumber || order.id}`, {
        orderId: order.id,
        orderNumber: order.orderNumber || null,
        earningId: payload.id,
        deliveryFee,
        grossAmount: deliveryFee,
        platformFee,
        netAmount,
      });
    }
    if (order?.paymentMethod === 'cash' && platformFee > 0) {
      await pasapayService.spend(
        riderId,
        platformFee,
        `Platform fee for cash order ${order.orderNumber || order.id}`,
        { orderId: order.id, orderNumber: order.orderNumber || null, earningId: payload.id, feeType: 'platform_fee_cash' }
      );
    }
    return payload;
  },

  fetchEarningsOnce: async (riderId) => {
    const r = ref(db, `earnings/riders/${riderId}`);
    const snap = await get(r);
    if (!snap.exists()) return [];
    const data = snap.val();
    return Object.keys(data).map((k) => data[k]);
  },
  
  recordCancellationComp: async (riderId, order) => {
    if (!riderId || !order?.id) return;
    const fee = Number(order.cancellationFee || 0);
    if (fee <= 0) return;
    const earningsRef = ref(db, `earnings/riders/${riderId}`);
    const newRef = push(earningsRef);
    const payload = {
      id: newRef.key,
      riderId,
      orderId: order.id,
      orderNumber: order.orderNumber || null,
      type: 'cancellation_compensation',
      amount: fee,
      createdAt: new Date().toISOString(),
      createdAtServer: serverTimestamp(),
      creditedToPasapay: true,
    };
    await set(newRef, payload);

    await pasapayService.credit(
      riderId,
      fee,
      `Cancellation compensation ${order.orderNumber || order.id}`,
      { orderId: order.id, orderNumber: order.orderNumber || null, earningId: payload.id }
    );
    return payload;
  },
};








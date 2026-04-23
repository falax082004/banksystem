import { db, ref, push, set, serverTimestamp, get } from '../firebaseConfig';
import { pasapayService } from './pasapayService';

// Stable prototype delivery pricing:
// Use a flat gross delivery fee so Earnings and Pasapay stay consistent.
const FLAT_DELIVERY_FEE = 50;
const RIDER_PLATFORM_FEE = 10;
const PASABUYER_PLATFORM_FEE = 12;
const calculateProvincialDeliveryFee = (distanceKm) => {
  return FLAT_DELIVERY_FEE;
};

export const earningsService = {
  calculateEarningForOrder: (order) => {
    if (order?.requestType === 'custom_pasabuy') {
      return { amount: 50, distanceKm: null, method: 'custom_pasabuy_fixed_fee' };
    }
    const distanceKm = typeof order?.distanceKm === 'number' ? order.distanceKm : null;
    const amount = calculateProvincialDeliveryFee(distanceKm);
    return { amount, distanceKm: distanceKm ?? null, method: 'batangas_provincial_pricing' };
  },

  recordDeliveryEarning: async (riderId, order, isPasabuyer = false) => {
    if (!riderId || !order?.id) return;
    const { amount, distanceKm, method } = earningsService.calculateEarningForOrder(order);
    // IMPORTANT: earnings are based on DELIVERY FEE only, never on item/order total.
    const deliveryFee = Number(amount || 0);
    // Apply role-based platform fee to every completed delivery earning.
    // Riders: -10, Pasabuyers: -12.
    const platformFee = isPasabuyer ? PASABUYER_PLATFORM_FEE : RIDER_PLATFORM_FEE;
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
    // - ONLINE/PASAPAY: credit NET earning (already after fixed -₱10 platform fee)
    // - CASH: do NOT credit earning into Pasapay; deduct fixed platform fee (-₱10) from Pasapay
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








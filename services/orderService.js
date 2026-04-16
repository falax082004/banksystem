// Order service to create and persist orders from the cart
import { db, ref, push, set, get } from '../firebaseConfig';
import { cartService } from './cartService';
import { pasapayService } from './pasapayService';

const toRad = (deg) => (deg * Math.PI) / 180;
const haversineKm = (a, b) => {
  if (!a || !b) return null;
  const lat1 = a.latitude ?? a.lat;
  const lon1 = a.longitude ?? a.lng;
  const lat2 = b.latitude ?? b.lat;
  const lon2 = b.longitude ?? b.lng;
  if (![lat1, lon1, lat2, lon2].every((v) => typeof v === 'number' && Number.isFinite(v))) return null;

  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const x =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
  return R * c;
};

export const orderService = {
  createOrderFromCart: async (userId, checkout = {}) => {
    const cart = cartService.getCart();
    if (!userId) {
      throw new Error('User ID is required to place an order');
    }
    if (!cart || cart.length === 0) {
      throw new Error('Cart is empty');
    }

    const generateOrderNumber = () => {
      const d = new Date();
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const rand = Math.random().toString(36).toUpperCase().replace(/[^A-Z0-9]/g, '').slice(2, 6);
      return `ORD-${y}${m}${day}-${rand}`;
    };

    const userSnapshot = await get(ref(db, `users/${userId}`));
    if (!userSnapshot.exists()) {
      throw new Error('User account not found.');
    }

    const userData = userSnapshot.val();
    const paymentMethod = checkout.paymentMethod || 'cash';
    const paymentChannel = checkout.paymentChannel || null;
    const totalAmount = cartService.getTotalAmount();
    const deliveryAddress =
      checkout.deliveryAddress ||
      userData.address ||
      (userData.barangay && userData.area ? `${userData.barangay}, ${userData.area}, Batangas` : '');

    if (!deliveryAddress || !userData.area || !userData.barangay) {
      throw new Error('Please complete your Batangas area and barangay before checkout.');
    }

    if (paymentMethod === 'online' && !paymentChannel) {
      throw new Error('Please choose an online payment channel.');
    }

    let paymentStatus = 'unpaid';
    const cashReserveRequired = paymentMethod === 'cash' ? pasapayService.getRequiredCashReserve(totalAmount) : 0;

    if (paymentMethod === 'pasapay') {
      await pasapayService.spend(userId, totalAmount, 'Store order paid via Pasapay', {
        paymentChannel: 'Pasapay',
      });
      paymentStatus = 'paid';
    } else if (paymentMethod === 'online') {
      paymentStatus = 'paid';
    }

    // Compute distance from shopper homeLocation to store coordinates (max distance across stores)
    const deliveryCoordinates = userData.homeLocation || null;
    const storeDistances = cart
      .map((s) => haversineKm(deliveryCoordinates, s.coordinates || null))
      .filter((d) => typeof d === 'number' && Number.isFinite(d));
    const distanceKm = storeDistances.length ? Math.round(Math.max(...storeDistances) * 10) / 10 : null;

    const order = {
      userId: userId,
      stores: cart.map(s => ({
        storeId: s.storeId,
        storeName: s.storeName,
        storeAddress: s.storeAddress,
        storeCategory: s.storeCategory,
        storeCoordinates: s.coordinates || null,
        serviceQuantity: s.serviceQuantity || 1,
        items: (s.items || []).map(i => ({
          itemId: i.itemId,
          itemName: i.itemName,
          itemPrice: i.itemPrice,
          quantity: i.quantity,
        })),
      })),
      totalAmount,
      status: 'pending',
      createdAt: new Date().toISOString(),
      estimatedDelivery: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
      orderNumber: generateOrderNumber(),
      paymentMethod,
      paymentChannel: paymentMethod === 'cash' ? 'Cash on Delivery' : paymentMethod === 'pasapay' ? 'Pasapay' : paymentChannel,
      paymentStatus,
      deliveryAddress,
      deliveryArea: userData.area,
      deliveryBarangay: userData.barangay,
      deliveryCoordinates,
      shopperName: userData.name || userId,
      cashReserveRequired,
      distanceKm,
    };

    const ordersRef = ref(db, `orders/${userId}`);
    const newOrderRef = push(ordersRef);
    await set(newOrderRef, {
      ...order,
      id: newOrderRef.key,
    });

    // Also index this order in a public pool for riders/pasabuyers to discover
    const publicOrder = {
      id: newOrderRef.key,
      ownerId: userId,
      status: order.status,
      orderNumber: order.orderNumber,
      totalAmount: order.totalAmount,
      createdAt: order.createdAt,
      estimatedDelivery: order.estimatedDelivery,
      distanceKm: distanceKm ?? Math.round((1 + Math.random() * 2) * 10) / 10, // fallback if coords missing
      paymentMethod: order.paymentMethod,
      paymentChannel: order.paymentChannel,
      paymentStatus: order.paymentStatus,
      deliveryAddress: order.deliveryAddress,
      deliveryArea: order.deliveryArea,
      deliveryBarangay: order.deliveryBarangay,
      cashReserveRequired: order.cashReserveRequired,
      stores: order.stores.map(s => ({
        storeName: s.storeName,
        storeAddress: s.storeAddress,
        storeCategory: s.storeCategory,
        serviceQuantity: s.serviceQuantity,
        items: (s.items || []).map(i => ({ itemName: i.itemName, quantity: i.quantity })),
      })),
      original: {
        ...order,
        id: newOrderRef.key,
      },
    };
    const publicRef = ref(db, `availableOrders/${newOrderRef.key}`);
    await set(publicRef, publicOrder);

    // Initialize chat participants for this order (shopper only at creation)
    const chatMetaRef = ref(db, `chats/${newOrderRef.key}/participants`);
    await set(chatMetaRef, { [userId]: true });

    // Clear cart after successful save
    cartService.clearCart();

    return { id: newOrderRef.key, ...order };
  },
};



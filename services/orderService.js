// Order service to create and persist orders from the cart
import { db, ref, push, set } from '../firebaseConfig';
import { cartService } from './cartService';

export const orderService = {
  createOrderFromCart: async (userId) => {
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

    const order = {
      userId: userId,
      stores: cart.map(s => ({
        storeId: s.storeId,
        storeName: s.storeName,
        storeAddress: s.storeAddress,
        storeCategory: s.storeCategory,
        serviceQuantity: s.serviceQuantity || 1,
        items: (s.items || []).map(i => ({
          itemId: i.itemId,
          itemName: i.itemName,
          itemPrice: i.itemPrice,
          quantity: i.quantity,
        })),
      })),
      totalAmount: cartService.getTotalAmount(),
      status: 'pending',
      createdAt: new Date().toISOString(),
      estimatedDelivery: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
      orderNumber: generateOrderNumber(),
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
      distanceKm: Math.round((1 + Math.random() * 2) * 10) / 10, // prototype random 1.0-3.0 km
      stores: order.stores.map(s => ({
        storeName: s.storeName,
        storeAddress: s.storeAddress,
        storeCategory: s.storeCategory,
        serviceQuantity: s.serviceQuantity,
        items: (s.items || []).map(i => ({ itemName: i.itemName, quantity: i.quantity })),
      })),
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



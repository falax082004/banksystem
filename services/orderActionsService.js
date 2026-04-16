import { db, ref, get, set, push } from '../firebaseConfig';
import { pasapayService } from './pasapayService';
import { earningsService } from './earningsService';

const normalizeOrder = (order) => ({
  ...(order.original || order),
  ...order,
});

const createNotification = async (targetUserId, payload) => {
  if (!targetUserId) return;
  const notifRef = push(ref(db, `users/${targetUserId}/notifications`));
  await set(notifRef, {
    id: notifRef.key,
    createdAt: new Date().toISOString(),
    read: false,
    ...payload,
  });
};

export const orderActionsService = {
  async createPasabuyRequest({
    userId,
    itemName,
    notes,
    budget,
    paymentMethod,
    paymentChannel,
    deliveryAddress,
  }) {
    if (!userId) {
      throw new Error('User not found.');
    }
    if (!itemName?.trim()) {
      throw new Error('Please enter the item you want to request.');
    }
    if (!deliveryAddress?.trim()) {
      throw new Error('Please complete your delivery address first.');
    }

    const userSnapshot = await get(ref(db, `users/${userId}`));
    if (!userSnapshot.exists()) {
      throw new Error('User account not found.');
    }

    const userData = userSnapshot.val();
    const totalAmount = Number(budget);
    if (!Number.isFinite(totalAmount) || totalAmount <= 0) {
      throw new Error('Please enter a valid budget amount.');
    }

    if (paymentMethod === 'online' && !paymentChannel) {
      throw new Error('Please choose an online payment channel.');
    }

    let paymentStatus = 'unpaid';
    if (paymentMethod === 'pasapay') {
      await pasapayService.spend(userId, totalAmount, 'Custom pasabuy request paid via Pasapay');
      paymentStatus = 'paid';
    } else if (paymentMethod === 'online') {
      paymentStatus = 'paid';
    }

    const createdAt = new Date().toISOString();
    const ordersRef = ref(db, `orders/${userId}`);
    const newOrderRef = push(ordersRef);
    const orderNumber = `REQ-${Date.now().toString().slice(-8)}`;
    const cashReserveRequired = paymentMethod === 'cash' ? pasapayService.getRequiredCashReserve(totalAmount) : 0;

    const baseOrder = {
      id: newOrderRef.key,
      userId,
      ownerId: userId,
      status: 'pending',
      createdAt,
      estimatedDelivery: new Date(Date.now() + 45 * 60 * 1000).toISOString(),
      orderNumber,
      totalAmount,
      paymentMethod,
      paymentChannel: paymentMethod === 'cash' ? 'Cash on Delivery' : paymentMethod === 'pasapay' ? 'Pasapay' : paymentChannel,
      paymentStatus,
      deliveryAddress,
      deliveryArea: userData.area,
      deliveryBarangay: userData.barangay,
      deliveryCoordinates: userData.homeLocation || null,
      shopperName: userData.name || userId,
      cashReserveRequired,
      requestType: 'custom_pasabuy',
      requestedItem: itemName.trim(),
      requestNotes: notes?.trim() || '',
      stores: [
        {
          storeId: 'custom-request',
          storeName: 'Custom Pasabuy Request',
          storeAddress: deliveryAddress,
          storeCategory: 'Requested Item',
          serviceQuantity: 1,
          items: [
            {
              itemId: 'custom-item',
              itemName: itemName.trim(),
              itemPrice: totalAmount,
              quantity: 1,
            },
          ],
        },
      ],
    };

    await set(newOrderRef, baseOrder);
    await set(ref(db, `availableOrders/${newOrderRef.key}`), {
      id: newOrderRef.key,
      ownerId: userId,
      status: baseOrder.status,
      orderNumber: baseOrder.orderNumber,
      totalAmount: baseOrder.totalAmount,
      createdAt: baseOrder.createdAt,
      estimatedDelivery: baseOrder.estimatedDelivery,
      paymentMethod: baseOrder.paymentMethod,
      paymentChannel: baseOrder.paymentChannel,
      paymentStatus: baseOrder.paymentStatus,
      deliveryAddress: baseOrder.deliveryAddress,
      deliveryArea: baseOrder.deliveryArea,
      deliveryBarangay: baseOrder.deliveryBarangay,
      cashReserveRequired: baseOrder.cashReserveRequired,
      requestType: baseOrder.requestType,
      requestedItem: baseOrder.requestedItem,
      requestNotes: baseOrder.requestNotes,
      distanceKm: Math.round((1 + Math.random() * 2) * 10) / 10,
      stores: baseOrder.stores.map((store) => ({
        storeName: store.storeName,
        storeAddress: store.storeAddress,
        storeCategory: store.storeCategory,
        serviceQuantity: store.serviceQuantity,
        items: store.items.map((item) => ({ itemName: item.itemName, quantity: item.quantity })),
      })),
      original: baseOrder,
    });

    await set(ref(db, `chats/${newOrderRef.key}/participants`), { [userId]: true });
    return baseOrder;
  },

  async acceptAvailableOrder({ order, userId, viewerRole }) {
    const normalized = normalizeOrder(order);
    if (!userId) {
      throw new Error('User not found.');
    }
    if (normalized.ownerId === userId) {
      throw new Error('You cannot accept your own order.');
    }

    const userSnapshot = await get(ref(db, `users/${userId}`));
    if (!userSnapshot.exists()) {
      throw new Error('Assignee account not found.');
    }

    const userData = userSnapshot.val();
    if (viewerRole === 'pasabuyer' && normalized.deliveryBarangay && userData.barangay !== normalized.deliveryBarangay) {
      throw new Error('Pasabuyers can only accept requests within their barangay.');
    }

    if (normalized.paymentMethod === 'cash') {
      const wallet = await pasapayService.getWallet(userId);
      const reserveNeeded = Number(normalized.cashReserveRequired || pasapayService.getRequiredCashReserve(normalized.totalAmount || 0));
      if (wallet.pasapayBalance < reserveNeeded) {
        throw new Error(`This cash order needs at least ₱${reserveNeeded} Pasapay balance before you can accept it.`);
      }
    }

    const updated = {
      ...normalized,
      id: order.id || normalized.id,
      assignedTo: userId,
      assignedRole: viewerRole,
      status: 'rider_assigned',
    };

    await set(ref(db, `riderDeliveries/${userId}/${updated.id}`), updated);
    if (updated.ownerId) {
      await set(ref(db, `orders/${updated.ownerId}/${updated.id}`), {
        ...updated,
        userId: updated.ownerId,
      });
    }
    await set(ref(db, `chats/${updated.id}/participants/${userId}`), true);
    if (updated.ownerId) {
      await set(ref(db, `chats/${updated.id}/participants/${updated.ownerId}`), true);
    }
    await set(ref(db, `availableOrders/${updated.id}`), null);
    await createNotification(updated.ownerId, {
      type: 'order_accepted',
      orderId: updated.id,
      orderNumber: updated.orderNumber || null,
      title: 'Order accepted',
      message: `Your order ${updated.orderNumber || updated.id} was accepted by a ${viewerRole}.`,
    });
    return updated;
  },

  async updateOrderStatus({ order, userId, status }) {
    const normalized = normalizeOrder(order);
    const shopperId = normalized.ownerId || normalized.userId;
    let updated = {
      ...normalized,
      id: normalized.id,
      assignedTo: normalized.assignedTo || userId,
      status,
    };

    if (shopperId) {
      await set(ref(db, `orders/${shopperId}/${updated.id}`), {
        ...updated,
        userId: shopperId,
      });
    }
    if (userId) {
      await set(ref(db, `riderDeliveries/${userId}/${updated.id}`), {
        ...updated,
        assignedTo: userId,
      });
    }
    if (status === 'delivered') {
      await set(ref(db, `availableOrders/${updated.id}`), null);
      if (userId) {
        await earningsService.recordDeliveryEarning(userId, updated, updated.assignedRole === 'pasabuyer');
      }
      await createNotification(shopperId, {
        type: 'order_delivered',
        orderId: updated.id,
        orderNumber: updated.orderNumber || null,
        title: 'Order delivered',
        message: `Your order ${updated.orderNumber || updated.id} has been delivered.`,
      });
      if (updated.assignedTo) {
        await createNotification(updated.assignedTo, {
          type: 'delivery_completed',
          orderId: updated.id,
          orderNumber: updated.orderNumber || null,
          title: 'Delivery completed',
          message: `You marked order ${updated.orderNumber || updated.id} as delivered.`,
        });
      }
    }
    return updated;
  },

  async cancelOrder({ order }) {
    const normalized = normalizeOrder(order);
    const shopperId = normalized.ownerId || normalized.userId;
    const status = normalized.status || 'pending';
    let fee = 0;
    if (status === 'rider_assigned' || status === 'shopping') {
      fee = Math.round((normalized.totalAmount || 50) * 0.2);
    } else if (status === 'on_way') {
      fee = Math.round((normalized.totalAmount || 50) * 0.5);
    } else if (status === 'delivered') {
      throw new Error('Delivered orders can no longer be cancelled.');
    }

    const cancelled = { ...normalized, status: 'cancelled', cancellationFee: fee };
    if (shopperId) {
      await set(ref(db, `orders/${shopperId}/${cancelled.id}`), cancelled);
    }
    if (cancelled.assignedTo) {
      await set(ref(db, `riderDeliveries/${cancelled.assignedTo}/${cancelled.id}`), null);
    }
    await set(ref(db, `availableOrders/${cancelled.id}`), null);
    if (cancelled.assignedTo && fee > 0) {
      await earningsService.recordCancellationComp(cancelled.assignedTo, cancelled);
    }
    return cancelled;
  },
};

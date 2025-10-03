import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TextInput, ScrollView, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome5';
import { db, ref, get, set, onValue, off } from '../firebaseConfig';

// Prototype-only mock nearby orders
const MOCK_ORDERS = [
  {
    id: 'MOCK-1',
    orderNumber: 'ORD-1001',
    status: 'pending',
    totalAmount: 150,
    distanceKm: 0.6,
    createdAt: new Date().toISOString(),
    stores: [
      { storeName: '7-Eleven', storeAddress: 'EDSA, QC', storeCategory: 'Convenience', quantity: 1 },
    ],
  },
  {
    id: 'MOCK-2',
    orderNumber: 'ORD-1002',
    status: 'shopping',
    totalAmount: 250,
    distanceKm: 1.2,
    createdAt: new Date().toISOString(),
    stores: [
      { storeName: 'Puregold', storeAddress: 'Ortigas, Pasig', storeCategory: 'Supermarket', quantity: 2 },
    ],
  },
  {
    id: 'MOCK-3',
    orderNumber: 'ORD-1003',
    status: 'on_way',
    totalAmount: 90,
    distanceKm: 2.8,
    createdAt: new Date().toISOString(),
    stores: [
      { storeName: 'McDonald\'s', storeAddress: 'Ayala, Makati', storeCategory: 'Fast Food', quantity: 1 },
    ],
  },
];

const NearbyOrdersScreen = ({ navigation, route }) => {
  const { userId } = route.params || {};
  const [query, setQuery] = useState('');
  const [maxDistance, setMaxDistance] = useState('3'); // km
  const [remoteOrders, setRemoteOrders] = useState(null);

  useEffect(() => {
    const poolRef = ref(db, 'availableOrders');
    const unsub = onValue(poolRef, (snapshot) => {
      if (snapshot.exists()) {
        const val = snapshot.val();
        const list = Object.keys(val).map(k => ({ id: k, ...val[k] }));
        setRemoteOrders(list);
      } else {
        setRemoteOrders([]);
      }
    });
    return () => off(poolRef, 'value', unsub);
  }, []);

  const source = remoteOrders && remoteOrders.length >= 0 ? remoteOrders : MOCK_ORDERS;
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const max = parseFloat(maxDistance) || 999;
    return source.filter(o =>
      // Hide orders already assigned
      !o.assignedTo &&
      // Do not show user's own orders to themselves
      (o.ownerId ? o.ownerId !== userId : true) &&
      o.distanceKm <= max && (
        q.length === 0 ||
        o.orderNumber.toLowerCase().includes(q) ||
        o.stores.some(s =>
          s.storeName.toLowerCase().includes(q) ||
          s.storeCategory.toLowerCase().includes(q) ||
          s.storeAddress.toLowerCase().includes(q)
        )
      )
    ).sort((a,b) => a.distanceKm - b.distanceKm);
  }, [query, maxDistance, source]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return '#FFA500';
      case 'shopping': return '#FF9800';
      case 'on_way': return '#007AFF';
      default: return '#666';
    }
  };

  const OrderRow = ({ order }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.orderNumber}>#{order.orderNumber}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) }]}>
          <Text style={styles.statusText}>{order.status.replace('_',' ').toUpperCase()}</Text>
        </View>
      </View>
      <Text style={styles.meta}>Distance: {order.distanceKm} km</Text>
      <Text style={styles.meta}>Total: ₱{order.totalAmount}</Text>
      <View style={styles.storeRow}>
        <Icon name="store" size={12} color="#666" />
        <Text style={styles.storeText}>{order.stores[0].storeName} • {order.stores[0].storeCategory}</Text>
      </View>
      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={() => navigation.navigate('TrackOrder', { order, userId, viewerRole: 'pasabuyer' })}
        >
          <Icon name="map-marker-alt" size={14} color="#fff" />
          <Text style={styles.primaryBtnText}>Track</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.secondaryBtn}
          onPress={async () => {
            // Accept order: move to rider's deliveries and remove from available pool
            try {
              if (order.ownerId && order.ownerId === userId) {
                return; // Prevent accepting own order
              }
              const updated = { ...order, assignedTo: userId, status: 'rider_assigned' };
              // Write to rider's deliveries
              const riderRef = ref(db, `riderDeliveries/${userId}/${order.id}`);
              await set(riderRef, updated);
              // Reflect in shopper's order
              if (order.ownerId) {
                const shopperOrderRef = ref(db, `orders/${order.ownerId}/${order.id}`);
                await set(shopperOrderRef, { ...(order.original || order), status: 'rider_assigned', assignedTo: userId, id: order.id, userId: order.ownerId });
              }
              // Add rider to chat participants
              const chatMetaRef = ref(db, `chats/${order.id}/participants/${userId}`);
              await set(chatMetaRef, true);
              // Add shopper as participant too
              if (order.ownerId) {
                const shopperChatRef = ref(db, `chats/${order.id}/participants/${order.ownerId}`);
                await set(shopperChatRef, true);
              }
              // Remove from available so others cannot see
              const assignmentRef = ref(db, `availableOrders/${order.id}`);
              await set(assignmentRef, null);
              navigation.navigate('TrackOrder', { order: updated, userId, viewerRole: 'rider' });
            } catch (e) {
              // no-op
            }
          }}
        >
          <Icon name="hand-paper" size={14} color="#333" />
          <Text style={styles.secondaryBtnText}>Accept</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Nearby Orders (Prototype)</Text>
        <Text style={styles.subtitle}>Search and track orders near you</Text>
      </View>

      <View style={styles.filters}>
        <View style={styles.inputWrap}>
          <Icon name="search" size={14} color="#666" />
          <TextInput
            style={styles.input}
            placeholder="Search store, category, or order #"
            value={query}
            onChangeText={setQuery}
            placeholderTextColor="#888"
          />
        </View>
        <View style={styles.inputWrap}>
          <Icon name="ruler" size={14} color="#666" />
          <TextInput
            style={styles.input}
            placeholder="Max distance (km)"
            keyboardType="numeric"
            value={maxDistance}
            onChangeText={setMaxDistance}
            placeholderTextColor="#888"
          />
        </View>
      </View>

      <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
        {filtered.map(o => (
          <OrderRow key={o.id} order={o} />
        ))}
        {filtered.length === 0 && (
          <View style={styles.emptyBox}>
            <Icon name="map" size={24} color="#bbb" />
            <Text style={styles.emptyText}>No nearby orders match your filters</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { padding: 20, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
  title: { fontSize: 20, fontWeight: 'bold', color: '#333' },
  subtitle: { fontSize: 14, color: '#666', marginTop: 4 },
  filters: { paddingHorizontal: 20, paddingTop: 12 },
  inputWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderWidth: 1, borderColor: '#ddd', borderRadius: 8, paddingHorizontal: 12, marginBottom: 10 },
  input: { flex: 1, height: 42, marginLeft: 8, color: '#333' },
  list: { paddingHorizontal: 20, paddingTop: 10 },
  card: { backgroundColor: '#fff', borderRadius: 8, borderWidth: 1, borderColor: '#ddd', padding: 14, marginBottom: 10 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  orderNumber: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4 },
  statusText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
  meta: { fontSize: 12, color: '#666' },
  storeRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  storeText: { marginLeft: 6, color: '#666', fontSize: 12 },
  actions: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  primaryBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#333', paddingVertical: 10, paddingHorizontal: 12, borderRadius: 6 },
  primaryBtnText: { color: '#fff', fontWeight: '600', marginLeft: 6 },
  secondaryBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f0f0f0', paddingVertical: 10, paddingHorizontal: 12, borderRadius: 6, borderWidth: 1, borderColor: '#ddd' },
  secondaryBtnText: { color: '#333', fontWeight: '600', marginLeft: 6 },
  emptyBox: { alignItems: 'center', padding: 30 },
  emptyText: { color: '#888', marginTop: 8 },
});

export default NearbyOrdersScreen;



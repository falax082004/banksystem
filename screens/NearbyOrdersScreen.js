import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TextInput, ScrollView, TouchableOpacity, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome5';
import { FONT } from '../styles/typography';
import { db, ref, get, onValue, off, set } from '../firebaseConfig';
import { orderActionsService } from '../services/orderActionsService';
import { pasapayService } from '../services/pasapayService';
import { useThemeMode } from '../theme/ThemeContext';

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
  const { colors, isDark } = useThemeMode();
  const { userId } = route.params || {};
  const [query, setQuery] = useState('');
  const [maxDistance, setMaxDistance] = useState(''); // blank means no max filter
  const [remoteOrders, setRemoteOrders] = useState(null);
  const [viewerRole, setViewerRole] = useState('rider');
  const [userBarangay, setUserBarangay] = useState(null);
  const [pasapayBalance, setPasapayBalance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    const loadUser = async () => {
      if (!userId) return;
      const snapshot = await get(ref(db, `users/${userId}`));
      if (snapshot.exists()) {
        const data = snapshot.val();
        const nextRole = data.role === 'rider' ? 'rider' : data.pasabuyerEnabled ? 'pasabuyer' : 'rider';
        setViewerRole(nextRole);
        setMaxDistance(nextRole === 'rider' ? '' : '3');
        setUserBarangay(data.barangay || null);
        setPasapayBalance(Number(data.pasapayBalance || 0));
      }
    };
    loadUser();
  }, [userId]);

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

  const handleRefresh = async () => {
    if (!userId) return;
    setIsRefreshing(true);
    try {
      const userSnap = await get(ref(db, `users/${userId}`));
      if (userSnap.exists()) {
        const data = userSnap.val();
        const nextRole = data.role === 'rider' ? 'rider' : data.pasabuyerEnabled ? 'pasabuyer' : 'rider';
        setViewerRole(nextRole);
        setMaxDistance(nextRole === 'rider' ? '' : '3');
        setUserBarangay(data.barangay || null);
        setPasapayBalance(Number(data.pasapayBalance || 0));
      }
      const poolSnap = await get(ref(db, 'availableOrders'));
      if (poolSnap.exists()) {
        const val = poolSnap.val();
        const list = Object.keys(val).map((k) => ({ id: k, ...val[k] }));
        setRemoteOrders(list);
      } else {
        setRemoteOrders([]);
      }
    } catch (e) {
      // no-op; realtime subscription will still update
    } finally {
      setIsRefreshing(false);
    }
  };

  const source = remoteOrders && remoteOrders.length >= 0 ? remoteOrders : MOCK_ORDERS;
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const parsed = parseFloat(maxDistance);
    const max = Number.isFinite(parsed) && parsed > 0 ? parsed : Number.POSITIVE_INFINITY;
    return source.filter(o =>
      // Hide orders already assigned
      !o.assignedTo &&
      // Do not show user's own orders to themselves
      (o.ownerId ? o.ownerId !== userId : true) &&
      (viewerRole === 'rider' ? true : !o.deliveryBarangay || o.deliveryBarangay === userBarangay) &&
      // Cash orders should not even display if assignee has insufficient Pasapay reserve
      (o.paymentMethod !== 'cash'
        ? true
        : pasapayBalance >= Number(o.cashReserveRequired || pasapayService.getRequiredCashReserve(o.totalAmount || 0))) &&
      o.distanceKm <= max && (
        q.length === 0 ||
        o.orderNumber.toLowerCase().includes(q) ||
        (o.requestedItem || '').toLowerCase().includes(q) ||
        o.stores.some(s =>
          s.storeName.toLowerCase().includes(q) ||
          s.storeCategory.toLowerCase().includes(q) ||
          s.storeAddress.toLowerCase().includes(q)
        )
      )
    ).sort((a,b) => a.distanceKm - b.distanceKm);
  }, [query, maxDistance, source, userId, viewerRole, userBarangay, pasapayBalance]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return '#FFA500';
      case 'shopping': return '#FF9800';
      case 'on_way': return '#007AFF';
      default: return '#666';
    }
  };

  const OrderRow = ({ order }) => (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.cardHeader}>
        <Text style={[styles.orderNumber, { color: colors.text }]}>#{order.orderNumber}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) }]}>
          <Text style={styles.statusText}>{order.status.replace('_',' ').toUpperCase()}</Text>
        </View>
      </View>
      <Text style={[styles.meta, { color: colors.mutedText }]}>Distance: {order.distanceKm} km</Text>
      <Text style={[styles.meta, { color: colors.mutedText }]}>Total: ₱{order.totalAmount}</Text>
      <Text style={[styles.meta, { color: colors.mutedText }]}>Payment: {(order.paymentChannel || order.paymentMethod || 'cash').toString()}</Text>
      <Text style={[styles.meta, { color: colors.mutedText }]}>Address: {order.deliveryAddress || 'No delivery address'}</Text>
      {order.requestType === 'custom_pasabuy' && order.requestedItem ? (
        <Text style={[styles.meta, { color: colors.mutedText }]}>Requested item: {order.requestedItem}</Text>
      ) : null}
      <View style={styles.storeRow}>
        <Icon name="store" size={12} color={colors.mutedText} />
        <Text style={[styles.storeText, { color: colors.mutedText }]}>{order.stores[0].storeName} • {order.stores[0].storeCategory}</Text>
      </View>
      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.primaryBtn, { backgroundColor: isDark ? '#2F2F35' : '#333' }]}
          onPress={() => navigation.navigate('TrackOrder', { order, userId, viewerRole })}
        >
          <Icon name="map-marker-alt" size={14} color="#fff" />
          <Text style={styles.primaryBtnText}>Track</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.secondaryBtn, { backgroundColor: isDark ? '#2A2A2D' : '#f0f0f0', borderColor: colors.border }]}
          onPress={async () => {
            try {
              if (!order?.id || !userId) return;
              // Allow pre-accept communication: enroll as chat participant without accepting the order.
              await set(ref(db, `chats/${order.id}/participants/${userId}`), true);
              if (order.ownerId) {
                await set(ref(db, `chats/${order.id}/participants/${order.ownerId}`), true);
              }
              navigation.navigate('Chat', {
                orderId: order.id,
                userId,
                viewerRole,
                order,
                shopperId: order.ownerId,
              });
            } catch (e) {
              Alert.alert('Chat Unavailable', e.message || 'Unable to open chat.');
            }
          }}
        >
          <Icon name="comments" size={14} color={colors.text} />
          <Text style={[styles.secondaryBtnText, { color: colors.text }]}>Chat Customer</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.secondaryBtn, { backgroundColor: isDark ? '#2A2A2D' : '#f0f0f0', borderColor: colors.border }]}
          onPress={() => {
            Alert.alert(
              'Confirm Order',
              `Accept this ${viewerRole === 'rider' ? 'delivery' : 'pasabuy'} request for ${order.deliveryAddress || 'the shopper address'}?`,
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Accept',
                  onPress: async () => {
                    try {
                      const updated = await orderActionsService.acceptAvailableOrder({ order, userId, viewerRole });
                      navigation.navigate('TrackOrder', { order: updated, userId, viewerRole });
                    } catch (e) {
                      Alert.alert('Unable to Accept', e.message || 'Failed to accept this order.');
                    }
                  },
                },
              ]
            );
          }}
        >
          <Icon name="hand-paper" size={14} color={colors.text} />
          <Text style={[styles.secondaryBtnText, { color: colors.text }]}>Accept Order</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.title, { color: colors.text }]}>{viewerRole === 'rider' ? 'Available Orders' : 'Orders In My Barangay'}</Text>
            <Text style={[styles.subtitle, { color: colors.mutedText }]}>
              {viewerRole === 'rider'
                ? 'Riders can accept orders across Batangas.'
                : `Pasabuyers only see requests in ${userBarangay || 'their barangay'}.`}
            </Text>
          </View>
          <TouchableOpacity style={[styles.refreshBtn, { backgroundColor: isDark ? '#2A2A2D' : '#f0f0f0', borderColor: colors.border }]} onPress={handleRefresh} disabled={isRefreshing}>
            <Icon name="sync" size={16} color={colors.text} />
            <Text style={[styles.refreshText, { color: colors.text }]}>{isRefreshing ? 'Refreshing' : 'Refresh'}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.filters}>
        <View style={[styles.inputWrap, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Icon name="search" size={14} color={colors.mutedText} />
          <TextInput
            style={[styles.input, { color: colors.text }]}
            placeholder="Search store, category, or order #"
            value={query}
            onChangeText={setQuery}
            placeholderTextColor={colors.mutedText}
          />
        </View>
        {viewerRole !== 'rider' ? (
          <View style={[styles.inputWrap, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Icon name="ruler" size={14} color={colors.mutedText} />
            <TextInput
              style={[styles.input, { color: colors.text }]}
              placeholder="Max distance (km)"
              keyboardType="numeric"
              value={maxDistance}
              onChangeText={setMaxDistance}
              placeholderTextColor={colors.mutedText}
            />
          </View>
        ) : (
          <View style={[styles.inputWrap, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Icon name="globe-asia" size={14} color={colors.mutedText} />
            <Text style={[styles.input, { color: colors.text }]}>Coverage: Entire Batangas</Text>
          </View>
        )}
      </View>

      <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
        {filtered.map(o => (
          <OrderRow key={o.id} order={o} />
        ))}
        {filtered.length === 0 && (
          <View style={styles.emptyBox}>
            <Icon name="map" size={24} color={colors.mutedText} />
            <Text style={[styles.emptyText, { color: colors.mutedText }]}>No nearby orders match your filters</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { padding: 20, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
  headerRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  title: { fontSize: FONT.titleSize, fontWeight: FONT.weightBold, color: FONT.headerColor },
  subtitle: { fontSize: FONT.subtitleSize, color: FONT.mutedColor, marginTop: 4 },
  refreshBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f0f0f0', borderWidth: 1, borderColor: '#ddd', paddingHorizontal: 10, paddingVertical: 8, borderRadius: 8 },
  refreshText: { marginLeft: 6, color: '#333', fontWeight: '600', fontSize: 13 },
  filters: { paddingHorizontal: 20, paddingTop: 12 },
  inputWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderWidth: 1, borderColor: '#ddd', borderRadius: 8, paddingHorizontal: 12, marginBottom: 10 },
  input: { flex: 1, height: 42, marginLeft: 8, color: '#333' },
  list: { paddingHorizontal: 20, paddingTop: 10 },
  card: { backgroundColor: '#fff', borderRadius: 8, borderWidth: 1, borderColor: '#ddd', padding: 14, marginBottom: 10 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  orderNumber: { fontSize: FONT.bodySize, fontWeight: FONT.weightBold, color: FONT.headerColor },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4 },
  statusText: { color: '#fff', fontSize: FONT.smallSize, fontWeight: 'bold' },
  meta: { fontSize: FONT.smallSize, color: FONT.mutedColor },
  storeRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  storeText: { marginLeft: 6, color: FONT.mutedColor, fontSize: FONT.smallSize },
  actions: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10, gap: 8 },
  primaryBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#333', paddingVertical: 10, paddingHorizontal: 12, borderRadius: 6, flex: 1, justifyContent: 'center' },
  primaryBtnText: { color: '#fff', fontWeight: '600', marginLeft: 6, fontSize: FONT.bodySize },
  secondaryBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f0f0f0', paddingVertical: 10, paddingHorizontal: 12, borderRadius: 6, borderWidth: 1, borderColor: '#ddd', flex: 1, justifyContent: 'center' },
  secondaryBtnText: { color: '#333', fontWeight: '600', marginLeft: 6, fontSize: FONT.bodySize },
  emptyBox: { alignItems: 'center', padding: 30 },
  emptyText: { color: FONT.secondaryMuted, marginTop: 8 },
});

export default NearbyOrdersScreen;



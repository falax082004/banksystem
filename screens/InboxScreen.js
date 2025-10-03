import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, FlatList } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome5';
import { db, ref, onValue, off } from '../firebaseConfig';

const InboxScreen = ({ navigation, route }) => {
  const { userId, viewerRole } = route.params || {};
  const [threads, setThreads] = useState([]);

  useEffect(() => {
    if (!userId) return;
    // Collect chat threads from orders for this user/rider
    // Shopper: orders/{userId}
    // Rider: riderDeliveries/{userId}
    const path = (viewerRole === 'rider' || viewerRole === 'pasabuyer') ? `riderDeliveries/${userId}` : `orders/${userId}`;
    const r = ref(db, path);
    const unsub = onValue(r, (snap) => {
      if (!snap.exists()) { setThreads([]); return; }
      const data = snap.val();
      const list = Object.keys(data).map((k) => {
        const o = { id: k, ...data[k] };
        return {
          id: o.id,
          orderNumber: o.orderNumber || o.id,
          counterpart: (viewerRole === 'rider' || viewerRole === 'pasabuyer') ? (o.userId || o.ownerId || 'Shopper') : (o.assignedTo ? 'Rider' : 'Unassigned'),
          status: o.status || 'pending',
          totalAmount: o.totalAmount || 0,
          distanceKm: o.distanceKm || null,
          createdAt: o.createdAt,
        };
      }).sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));
      setThreads(list);
    });
    return () => off(r, 'value', unsub);
  }, [userId, viewerRole]);

  const openChat = (thread) => {
    navigation.navigate('Chat', { orderId: thread.id, userId, viewerRole: viewerRole || 'shopper' });
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity style={styles.thread} onPress={() => openChat(item)}>
      <View style={styles.threadLeft}>
        <View style={styles.avatar}><Icon name="comments" size={14} color="#fff" /></View>
      </View>
      <View style={styles.threadCenter}>
        <Text style={styles.orderNumber}>Order #{item.orderNumber}</Text>
        <Text style={styles.counterpart}>Chat with {item.counterpart}</Text>
        <Text style={styles.meta}>₱{item.totalAmount} • {item.status.replace('_',' ')}</Text>
      </View>
      <View style={styles.threadRight}>
        <Icon name="chevron-right" size={14} color="#999" />
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Inbox</Text>
        <Text style={styles.subtitle}>Messages with your { (viewerRole === 'rider' || viewerRole === 'pasabuyer') ? 'shoppers' : 'riders' }</Text>
      </View>
      {threads.length === 0 ? (
        <View style={styles.empty}>
          <Icon name="inbox" size={40} color="#bbb" />
          <Text style={styles.emptyText}>No conversations yet</Text>
        </View>
      ) : (
        <FlatList
          data={threads}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { padding: 20, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#333' },
  subtitle: { fontSize: 14, color: '#666', marginTop: 4 },
  list: { paddingHorizontal: 12, paddingTop: 8 },
  thread: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 8, borderWidth: 1, borderColor: '#ddd', padding: 12, marginVertical: 6 },
  threadLeft: { width: 40, alignItems: 'center' },
  avatar: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#333', alignItems: 'center', justifyContent: 'center' },
  threadCenter: { flex: 1, paddingHorizontal: 8 },
  orderNumber: { fontWeight: '600', color: '#333' },
  counterpart: { color: '#666', fontSize: 12 },
  meta: { color: '#999', fontSize: 12, marginTop: 2 },
  threadRight: { width: 24, alignItems: 'flex-end' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyText: { color: '#999', marginTop: 8 },
});

export default InboxScreen;




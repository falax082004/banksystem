import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList } from 'react-native';
import { onValue, off, ref, db } from '../firebaseConfig';

const EarningsScreen = ({ route }) => {
  const { userId, userType } = route?.params || {};
  const isPasabuyer = userType === 'pasabuyer';
  const [earnings, setEarnings] = useState([]);
  const [totalThisWeek, setTotalThisWeek] = useState(0);

  useEffect(() => {
    if (!userId) return;
    // Riders: earnings/riders/{userId}
    // Pasabuyers: earnings/pasabuyers/{userId}
    const path = isPasabuyer ? `earnings/pasabuyers/${userId}` : `earnings/riders/${userId}`;
    const r = ref(db, path);
    const unsubscribe = onValue(r, (snap) => {
      if (!snap.exists()) {
        setEarnings([]);
        setTotalThisWeek(0);
        return;
      }
      const data = snap.val();
      const list = Object.keys(data).map((k) => data[k]).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setEarnings(list);
      const now = new Date();
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - now.getDay()); // Sunday start
      const weekTotal = list
        .filter((e) => e.createdAt && new Date(e.createdAt) >= weekStart)
        .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
      setTotalThisWeek(Math.round(weekTotal * 100) / 100);
    });
    return () => off(r, 'value', unsubscribe);
  }, [userId, isPasabuyer]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Earnings</Text>
        <Text style={styles.subtitle}>
          Your {isPasabuyer ? 'pasabuy' : 'delivery'} earnings summary
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>This week</Text>
        <Text style={styles.value}>₱{totalThisWeek.toFixed(2)}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Total {isPasabuyer ? 'requests' : 'deliveries'}</Text>
        <Text style={styles.value}>{earnings.length}</Text>
      </View>

      <View style={[styles.card, { padding: 0 }] }>
        <View style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: '#eee' }}>
          <Text style={styles.label}>Recent earnings</Text>
        </View>
        {earnings.length === 0 ? (
          <View style={{ padding: 16 }}>
            <Text style={{ color: '#666' }}>No earnings yet</Text>
          </View>
        ) : (
          <FlatList
            data={earnings}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={{ paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f3f3f3' }}>
                <Text style={{ fontWeight: '600', color: '#333' }}>₱{Number(item.amount || 0).toFixed(2)}</Text>
                <Text style={{ color: '#666', fontSize: 12 }}>{item.type || 'delivery'} • {item.orderNumber || item.orderId}</Text>
                <Text style={{ color: '#999', fontSize: 12 }}>{new Date(item.createdAt).toLocaleString()}</Text>
              </View>
            )}
          />
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  card: {
    backgroundColor: '#fff',
    margin: 20,
    marginTop: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 16,
  },
  label: {
    fontSize: 12,
    color: '#888',
    marginBottom: 6,
  },
  value: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
});

export default EarningsScreen;




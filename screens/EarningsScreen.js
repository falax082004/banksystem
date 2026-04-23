import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome5';
import { onValue, off, ref, db } from '../firebaseConfig';
import { useThemeMode } from '../theme/ThemeContext';
import { pasapayService } from '../services/pasapayService';

const formatPeso = (value) => `₱${Math.round(Number(value || 0))}`;
const toNumber = (value, fallback = 0) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

const normalizeEarning = (item = {}) => {
  const paymentMethod = (item.paymentMethod || 'cash').toString().toLowerCase();
  const hasDeliveryFee = item.deliveryFee != null || item.grossAmount != null;
  let baseDeliveryFee = toNumber(item.deliveryFee ?? item.grossAmount ?? item.amount, 0);
  // Keep legacy records aligned with current fixed-fee policy.
  if ((item.type === 'delivery' || item.type === 'pasabuy') && baseDeliveryFee > 0 && baseDeliveryFee < 50) {
    baseDeliveryFee = 50;
  }
  const inferredPlatformFee = item.type === 'pasabuy' ? 12 : 10;
  const basePlatformFee =
    item.platformFee != null
      ? toNumber(item.platformFee, 0)
      : hasDeliveryFee
        ? inferredPlatformFee
        : 0;
  const computedNet = Math.max(0, Number((baseDeliveryFee - basePlatformFee).toFixed(2)));
  const netAmount =
    item.netAmount != null
      ? toNumber(item.netAmount, computedNet)
      : hasDeliveryFee
        ? computedNet
        : toNumber(item.amount, 0);

  return {
    ...item,
    paymentMethod,
    deliveryFee: baseDeliveryFee,
    platformFee: basePlatformFee,
    netAmount,
    amount: netAmount,
  };
};

const EarningsScreen = ({ route, navigation }) => {
  const { colors } = useThemeMode();
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
      const list = Object.keys(data)
        .map((k) => normalizeEarning(data[k]))
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setEarnings(list);
      const now = new Date();
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - now.getDay()); // Sunday start
      const weekTotal = list
        .filter((e) => e.createdAt && new Date(e.createdAt) >= weekStart)
        .reduce((sum, e) => sum + (Number(e.netAmount ?? e.amount) || 0), 0);
      setTotalThisWeek(Math.round(weekTotal));
    });
    return () => off(r, 'value', unsubscribe);
  }, [userId, isPasabuyer]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <View style={styles.headerRow}>
          <TouchableOpacity style={[styles.backButton, { borderColor: colors.border, backgroundColor: colors.surface }]} onPress={() => navigation.goBack()}>
            <Icon name="arrow-left" size={14} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text }]}>Earnings</Text>
        </View>
        <Text style={[styles.subtitle, { color: colors.mutedText }]}>
          Your {isPasabuyer ? 'pasabuy' : 'delivery'} earnings summary
        </Text>
      </View>

      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.label, { color: colors.mutedText }]}>This week</Text>
        <Text style={[styles.value, { color: colors.text }]}>{formatPeso(totalThisWeek)}</Text>
      </View>

      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.label, { color: colors.mutedText }]}>Total {isPasabuyer ? 'requests' : 'deliveries'}</Text>
        <Text style={[styles.value, { color: colors.text }]}>{earnings.length}</Text>
      </View>

      <View style={[styles.card, { padding: 0, backgroundColor: colors.surface, borderColor: colors.border }] }>
        <View style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: colors.border }}>
          <Text style={[styles.label, { color: colors.mutedText }]}>Recent earnings</Text>
        </View>
        {earnings.length === 0 ? (
          <View style={{ padding: 16 }}>
            <Text style={{ color: colors.mutedText }}>No earnings yet</Text>
          </View>
        ) : (
          <FlatList
            data={earnings}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={{ paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border }}>
                <Text style={{ fontWeight: '600', color: colors.text }}>{formatPeso(item.netAmount ?? item.amount)}</Text>
                <Text style={{ color: colors.mutedText, fontSize: 12 }}>{item.type || 'delivery'} • {item.orderNumber || item.orderId}</Text>
                {item.platformFee > 0 && (
                  <Text style={{ color: colors.mutedText, fontSize: 12 }}>
                    Delivery fee: {formatPeso(item.deliveryFee || item.grossAmount || item.amount)} • Platform fee: -{formatPeso(item.platformFee || 0)}
                  </Text>
                )}
                <Text style={{ color: colors.mutedText, fontSize: 12 }}>{new Date(item.createdAt).toLocaleString()}</Text>
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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  backButton: {
    width: 34,
    height: 34,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    marginRight: 10,
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




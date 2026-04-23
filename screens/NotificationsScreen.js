import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome5';
import { db, ref, onValue, off } from '../firebaseConfig';
import { FONT } from '../styles/typography';
import { useThemeMode } from '../theme/ThemeContext';

const NotificationsScreen = ({ navigation, route }) => {
  const { colors, isDark } = useThemeMode();
  const { userId } = route.params || {};
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    if (!userId) return;
    const notifRef = ref(db, `users/${userId}/notifications`);
    const unsub = onValue(notifRef, (snapshot) => {
      if (!snapshot.exists()) {
        setNotifications([]);
        return;
      }
      const rows = Object.keys(snapshot.val())
        .map((id) => ({ id, ...snapshot.val()[id] }))
        .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
      setNotifications(rows);
    });
    return () => off(notifRef, 'value', unsub);
  }, [userId]);

  const openNotification = (item) => {
    if (item?.supportTicketId) {
      navigation.navigate('SupportTicket', { ticketId: item.supportTicketId, userId, isAdmin: false });
      return;
    }
    navigation.goBack();
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity style={[styles.backButton, { backgroundColor: colors.surface, borderColor: colors.border }]} onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={14} color="#333" />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Notifications</Text>
      </View>

      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Icon name="bell" size={26} color="#bbb" />
            <Text style={styles.emptyText}>No notifications yet.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity style={[styles.row, { backgroundColor: colors.surface, borderColor: colors.border }]} onPress={() => openNotification(item)}>
            <Icon
              name={item.type === 'order_delivered' ? 'check-circle' : 'bell'}
              size={14}
              color={item.type === 'order_delivered' ? '#00C853' : '#007AFF'}
            />
            <View style={styles.rowBody}>
              <Text style={[styles.message, { color: colors.text }]}>{item.message || item.title || 'Order update'}</Text>
              <Text style={[styles.date, { color: colors.mutedText }]}>{new Date(item.createdAt || Date.now()).toLocaleString()}</Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
  backButton: { width: 32, height: 32, borderRadius: 8, borderWidth: 1, borderColor: '#ddd', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff', marginRight: 10 },
  title: { fontSize: FONT.titleSize, fontWeight: FONT.weightBold, color: FONT.headerColor },
  list: { padding: 16 },
  row: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: '#fff', borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, marginBottom: 8 },
  rowBody: { flex: 1, marginLeft: 10 },
  message: { fontSize: FONT.bodySize, color: FONT.headerColor, fontWeight: '500' },
  date: { fontSize: FONT.smallSize, color: FONT.mutedColor, marginTop: 4 },
  emptyWrap: { alignItems: 'center', marginTop: 40 },
  emptyText: { marginTop: 8, color: FONT.mutedColor, fontSize: FONT.bodySize },
});

export default NotificationsScreen;

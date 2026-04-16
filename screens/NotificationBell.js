import React, { useEffect, useMemo, useState } from 'react';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome5';
import { db, ref, onValue, off, update } from '../firebaseConfig';

const NotificationBell = ({ userId, navigation, style }) => {
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

  const unreadCount = useMemo(
    () => notifications.filter((x) => x.read !== true).length,
    [notifications]
  );

  const openNotificationList = () => {
    if (!userId) return;
    const unread = notifications.filter((n) => n.read !== true);
    if (unread.length > 0) {
      const patch = {};
      unread.forEach((n) => {
        patch[`users/${userId}/notifications/${n.id}/read`] = true;
      });
      update(ref(db), patch);
    }
    if (navigation?.navigate) {
      navigation.navigate('Notifications', { userId });
    }
  };

  return (
    <TouchableOpacity style={[styles.bellButton, style]} onPress={openNotificationList}>
      <Icon name="bell" size={18} color="#333" />
      {unreadCount > 0 && <View style={styles.redDot}><Text style={styles.dotText}>{unreadCount > 9 ? '9+' : unreadCount}</Text></View>}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  bellButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  redDot: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#ff3b30',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  dotText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: 'bold',
  },
});

export default NotificationBell;

import React, { useMemo, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome5';
import { db, ref, onValue, off, update, push, set, get } from '../firebaseConfig';
import { FONT } from '../styles/typography';
import { useThemeMode } from '../theme/ThemeContext';

const AdminDashboardScreen = ({ navigation }) => {
  const { colors, isDark } = useThemeMode();
  const [activeTab, setActiveTab] = useState('applications');
  const [pendingApplications, setPendingApplications] = useState([]);
  const [users, setUsers] = useState([]);
  const [supportTickets, setSupportTickets] = useState([]);
  const [monitoring, setMonitoring] = useState({
    orders: 0,
    deliveries: 0,
    pasapayTransactions: 0,
  });

  useEffect(() => {
    const usersRef = ref(db, 'users');
    const supportRef = ref(db, 'supportTickets');

    const unsubUsers = onValue(usersRef, (snapshot) => {
      if (!snapshot.exists()) {
        setUsers([]);
        setPendingApplications([]);
        return;
      }

      const list = Object.keys(snapshot.val()).map((id) => ({ id, ...snapshot.val()[id] }));
      setUsers(list.filter((u) => u.id !== 'admin'));

      const pending = list
        .filter((u) => u.id !== 'admin' && u.approvalStatus === 'pending' && !!u.requestedRole)
        .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
      setPendingApplications(pending);
    });

    const unsubSupport = onValue(supportRef, (snapshot) => {
      if (!snapshot.exists()) {
        setSupportTickets([]);
        return;
      }
      const list = Object.keys(snapshot.val())
        .map((id) => ({ id, ...snapshot.val()[id] }))
        .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
      setSupportTickets(list);
    });

    return () => {
      off(usersRef, 'value', unsubUsers);
      off(supportRef, 'value', unsubSupport);
    };
  }, []);

  useEffect(() => {
    const loadMonitoring = async () => {
      try {
        const [ordersSnap, deliveriesSnap, usersSnap] = await Promise.all([
          get(ref(db, 'orders')),
          get(ref(db, 'riderDeliveries')),
          get(ref(db, 'users')),
        ]);

        let ordersCount = 0;
        if (ordersSnap.exists()) {
          const ordersByUser = ordersSnap.val();
          Object.keys(ordersByUser).forEach((uid) => {
            ordersCount += Object.keys(ordersByUser[uid] || {}).length;
          });
        }

        let deliveriesCount = 0;
        if (deliveriesSnap.exists()) {
          const deliveriesByUser = deliveriesSnap.val();
          Object.keys(deliveriesByUser).forEach((uid) => {
            deliveriesCount += Object.keys(deliveriesByUser[uid] || {}).length;
          });
        }

        let pasapayTxCount = 0;
        if (usersSnap.exists()) {
          const usersMap = usersSnap.val();
          Object.keys(usersMap).forEach((uid) => {
            const tx = usersMap[uid]?.pasapayTransactions;
            if (Array.isArray(tx)) {
              pasapayTxCount += tx.length;
            } else if (tx && typeof tx === 'object') {
              pasapayTxCount += Object.keys(tx).length;
            }
          });
        }

        setMonitoring({
          orders: ordersCount,
          deliveries: deliveriesCount,
          pasapayTransactions: pasapayTxCount,
        });
      } catch {
        // Ignore monitor snapshot failures.
      }
    };
    loadMonitoring();
  }, [users.length, supportTickets.length]);

  const notifyUser = async (userId, payload) => {
    if (!userId) return;
    const notifRef = push(ref(db, `users/${userId}/notifications`));
    await set(notifRef, {
      ...payload,
      read: false,
      createdAt: new Date().toISOString(),
    });
  };

  const handleApprove = async (applicant) => {
    try {
      const patch = {
        approvalStatus: 'approved',
        approvedAt: new Date().toISOString(),
      };

      if (applicant.requestedRole === 'rider') {
        patch.role = 'rider';
        patch.pasabuyerEnabled = false;
      } else {
        patch.role = 'shopper';
        patch.pasabuyerEnabled = true;
      }

      await update(ref(db, `users/${applicant.id}`), patch);
      await notifyUser(applicant.id, {
        type: 'application_approved',
        title: 'Application Approved',
        message: `Congratulations! Your application has been approved. You can now access your ${applicant.requestedRole} account.`,
      });
      Alert.alert('Approved', `${applicant.name || applicant.username || applicant.id} has been approved.`);
    } catch (error) {
      Alert.alert('Approval Failed', error.message || 'Unable to approve this application.');
    }
  };

  const handleReject = async (applicant) => {
    try {
      await update(ref(db, `users/${applicant.id}`), {
        approvalStatus: 'rejected',
        rejectedAt: new Date().toISOString(),
        pasabuyerEnabled: false,
      });
      await notifyUser(applicant.id, {
        type: 'application_rejected',
        title: 'Application Rejected',
        message: 'Your role application was rejected. You can apply again anytime from your Profile tab.',
      });
      Alert.alert('Rejected', `${applicant.name || applicant.username || applicant.id} has been rejected.`);
    } catch (error) {
      Alert.alert('Rejection Failed', error.message || 'Unable to reject this application.');
    }
  };

  const stats = useMemo(() => ({
    pending: pendingApplications.length,
    supportOpen: supportTickets.filter((x) => x.status !== 'closed').length,
    users: users.length,
  }), [pendingApplications.length, supportTickets, users.length]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.text }]}>Admin Dashboard</Text>
        <TouchableOpacity style={[styles.logoutBtn, { borderColor: colors.border, backgroundColor: colors.surface }]} onPress={() => navigation.replace('Login')}>
          <Icon name="sign-out-alt" size={13} color="#333" />
          <Text style={[styles.logoutText, { color: colors.text }]}>Logout</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.statsRow}>
        <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.statValue, { color: colors.text }]}>{stats.pending}</Text>
          <Text style={[styles.statLabel, { color: colors.mutedText }]}>Pending Apps</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.statValue, { color: colors.text }]}>{stats.supportOpen}</Text>
          <Text style={[styles.statLabel, { color: colors.mutedText }]}>Open Support</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.statValue, { color: colors.text }]}>{stats.users}</Text>
          <Text style={[styles.statLabel, { color: colors.mutedText }]}>Users</Text>
        </View>
      </View>

      <View style={styles.tabRow}>
        <TouchableOpacity style={[styles.tabBtn, { borderColor: colors.border, backgroundColor: colors.surface }, activeTab === 'applications' && styles.tabBtnActive]} onPress={() => setActiveTab('applications')}>
          <Text style={[styles.tabText, { color: colors.text }, activeTab === 'applications' && styles.tabTextActive]}>Application Requests</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tabBtn, { borderColor: colors.border, backgroundColor: colors.surface }, activeTab === 'support' && styles.tabBtnActive]} onPress={() => setActiveTab('support')}>
          <Text style={[styles.tabText, { color: colors.text }, activeTab === 'support' && styles.tabTextActive]}>Support Messages</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tabBtn, { borderColor: colors.border, backgroundColor: colors.surface }, activeTab === 'users' && styles.tabBtnActive]} onPress={() => setActiveTab('users')}>
          <Text style={[styles.tabText, { color: colors.text }, activeTab === 'users' && styles.tabTextActive]}>User Accounts</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {activeTab === 'applications' && (
          <>
            {pendingApplications.length === 0 ? (
              <Text style={[styles.emptyText, { color: colors.mutedText }]}>No pending Rider/Pasabuyer applications.</Text>
            ) : pendingApplications.map((item) => (
              <View key={item.id} style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Text style={[styles.cardTitle, { color: colors.text }]}>{item.name || item.username || item.id}</Text>
                <Text style={[styles.cardMeta, { color: colors.mutedText }]}>Username: {item.id}</Text>
                <Text style={[styles.cardMeta, { color: colors.mutedText }]}>Requested role: {item.requestedRole}</Text>
                <Text style={[styles.cardMeta, { color: colors.mutedText }]}>Email: {item.email || 'N/A'}</Text>
                <View style={styles.actionRow}>
                  <TouchableOpacity style={styles.approveBtn} onPress={() => handleApprove(item)}>
                    <Text style={styles.approveText}>Approve</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.rejectBtn} onPress={() => handleReject(item)}>
                    <Text style={styles.rejectText}>Reject</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </>
        )}

        {activeTab === 'support' && (
          <>
            <TouchableOpacity
              style={[styles.approveBtn, { marginBottom: 10 }]}
              onPress={() => navigation.navigate('SupportInbox', { isAdmin: true, userId: 'admin' })}
            >
              <Text style={styles.approveText}>Open Support Ticket Inbox</Text>
            </TouchableOpacity>
            {supportTickets.length === 0 ? (
              <Text style={[styles.emptyText, { color: colors.mutedText }]}>No support tickets yet.</Text>
            ) : supportTickets.map((item) => (
              <View key={item.id} style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Text style={[styles.cardTitle, { color: colors.text }]}>{item.email}</Text>
                <Text style={[styles.cardMeta, { color: colors.mutedText }]}>{new Date(item.createdAt || Date.now()).toLocaleString()}</Text>
                <Text style={[styles.messageText, { color: colors.text }]}>Status: {item.status || 'open'}</Text>
                <TouchableOpacity
                  style={styles.rejectBtn}
                  onPress={() => navigation.navigate('SupportTicket', { ticketId: item.id, isAdmin: true, userId: 'admin' })}
                >
                  <Text style={styles.rejectText}>Open Ticket</Text>
                </TouchableOpacity>
              </View>
            ))}
          </>
        )}

        {activeTab === 'users' && (
          <>
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.cardTitle, { color: colors.text }]}>System Monitoring</Text>
              <Text style={[styles.cardMeta, { color: colors.mutedText }]}>Orders tracked: {monitoring.orders}</Text>
              <Text style={[styles.cardMeta, { color: colors.mutedText }]}>Deliveries tracked: {monitoring.deliveries}</Text>
              <Text style={[styles.cardMeta, { color: colors.mutedText }]}>Pasapay transactions: {monitoring.pasapayTransactions}</Text>
            </View>
            {users.map((item) => (
              <View key={item.id} style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Text style={[styles.cardTitle, { color: colors.text }]}>{item.name || item.username || item.id}</Text>
                <Text style={[styles.cardMeta, { color: colors.mutedText }]}>Username: {item.id}</Text>
                <Text style={[styles.cardMeta, { color: colors.mutedText }]}>Role: {item.role || 'none'}</Text>
                <Text style={[styles.cardMeta, { color: colors.mutedText }]}>Approval: {item.approvalStatus || 'approved'}</Text>
              </View>
            ))}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { padding: 20, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: FONT.titleSize, fontWeight: FONT.weightBold, color: FONT.headerColor },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#ddd', paddingHorizontal: 10, paddingVertical: 7, borderRadius: 8, backgroundColor: '#fff' },
  logoutText: { marginLeft: 6, color: '#333', fontWeight: '600' },
  statsRow: { flexDirection: 'row', paddingHorizontal: 20, paddingTop: 12, gap: 8 },
  statCard: { flex: 1, backgroundColor: '#fff', borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, alignItems: 'center' },
  statValue: { fontSize: 20, fontWeight: 'bold', color: '#333' },
  statLabel: { fontSize: 12, color: '#666' },
  tabRow: { flexDirection: 'row', paddingHorizontal: 20, paddingTop: 12, gap: 8 },
  tabBtn: { flex: 1, borderWidth: 1, borderColor: '#ddd', borderRadius: 8, paddingVertical: 10, alignItems: 'center', backgroundColor: '#fff' },
  tabBtnActive: { backgroundColor: '#333', borderColor: '#333' },
  tabText: { fontSize: 12, fontWeight: '600', color: '#333' },
  tabTextActive: { color: '#fff' },
  content: { flex: 1, paddingHorizontal: 20, paddingTop: 12 },
  card: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 14, marginBottom: 10 },
  cardTitle: { fontSize: FONT.bodySize, fontWeight: '700', color: '#333', marginBottom: 4 },
  cardMeta: { color: '#666', fontSize: 12, marginBottom: 2 },
  actionRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
  approveBtn: { backgroundColor: '#333', paddingHorizontal: 12, paddingVertical: 10, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  approveText: { color: '#fff', fontWeight: '600' },
  rejectBtn: { backgroundColor: '#f0f0f0', borderWidth: 1, borderColor: '#ddd', paddingHorizontal: 12, paddingVertical: 10, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  rejectText: { color: '#333', fontWeight: '600' },
  emptyText: { color: '#777', textAlign: 'center', marginTop: 28 },
  messageText: { color: '#333', marginTop: 8, lineHeight: 20 },
});

export default AdminDashboardScreen;

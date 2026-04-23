import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome5';
import { db, ref, onValue, off } from '../firebaseConfig';
import { FONT } from '../styles/typography';
import { useThemeMode } from '../theme/ThemeContext';

const SupportInboxScreen = ({ navigation, route }) => {
  const { colors } = useThemeMode();
  const { userId, isAdmin } = route.params || {};
  const [tickets, setTickets] = useState([]);

  useEffect(() => {
    const ticketsRef = ref(db, 'supportTickets');
    const unsub = onValue(ticketsRef, (snapshot) => {
      if (!snapshot.exists()) {
        setTickets([]);
        return;
      }
      const list = Object.keys(snapshot.val())
        .map((id) => ({ id, ...snapshot.val()[id] }))
        .filter((t) => (isAdmin ? true : t.userId === userId))
        .sort((a, b) => new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0));
      setTickets(list);
    });
    return () => off(ticketsRef, 'value', unsub);
  }, [isAdmin, userId]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity style={[styles.backBtn, { borderColor: colors.border, backgroundColor: colors.surface }]} onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={14} color="#333" />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>{isAdmin ? 'Support Inbox' : 'My Support Tickets'}</Text>
      </View>
      <FlatList
        data={tickets}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={[styles.empty, { color: colors.mutedText }]}>No tickets yet.</Text>}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.ticketRow, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => navigation.navigate('SupportTicket', { ticketId: item.id, userId, isAdmin })}
          >
            <View style={styles.ticketBody}>
              <Text style={[styles.ticketTitle, { color: colors.text }]}>{item.subject || 'Support Ticket'}</Text>
              <Text style={[styles.ticketMeta, { color: colors.mutedText }]}>{item.email || 'No email'} • {item.status || 'open'}</Text>
            </View>
            <Icon name="chevron-right" size={12} color="#999" />
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { padding: 20, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee', flexDirection: 'row', alignItems: 'center' },
  backBtn: { width: 32, height: 32, borderRadius: 8, borderWidth: 1, borderColor: '#ddd', alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  title: { fontSize: FONT.titleSize, fontWeight: FONT.weightBold, color: FONT.headerColor },
  list: { padding: 16 },
  ticketRow: { backgroundColor: '#fff', borderRadius: 8, borderWidth: 1, borderColor: '#ddd', marginBottom: 8, padding: 12, flexDirection: 'row', alignItems: 'center' },
  ticketBody: { flex: 1 },
  ticketTitle: { color: '#333', fontWeight: '600' },
  ticketMeta: { color: '#666', fontSize: 12, marginTop: 4 },
  empty: { textAlign: 'center', color: '#777', marginTop: 30 },
});

export default SupportInboxScreen;

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, FlatList, TextInput } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome5';
import { db, ref, onValue, off, push, set, update } from '../firebaseConfig';
import { FONT } from '../styles/typography';
import { useThemeMode } from '../theme/ThemeContext';

const SupportTicketScreen = ({ navigation, route }) => {
  const { colors, isDark } = useThemeMode();
  const { ticketId, userId, isAdmin } = route.params || {};
  const [ticket, setTicket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');

  useEffect(() => {
    if (!ticketId) return;
    const ticketRef = ref(db, `supportTickets/${ticketId}`);
    const msgRef = ref(db, `supportTickets/${ticketId}/messages`);
    const unsubTicket = onValue(ticketRef, (snapshot) => setTicket(snapshot.exists() ? snapshot.val() : null));
    const unsubMsg = onValue(msgRef, (snapshot) => {
      if (!snapshot.exists()) {
        setMessages([]);
        return;
      }
      const list = Object.keys(snapshot.val())
        .map((id) => ({ id, ...snapshot.val()[id] }))
        .sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0));
      setMessages(list);
    });
    return () => {
      off(ticketRef, 'value', unsubTicket);
      off(msgRef, 'value', unsubMsg);
    };
  }, [ticketId]);

  const sendMessage = async () => {
    const trimmed = text.trim();
    if (!trimmed || !ticketId || !ticket) return;
    const msgRef = push(ref(db, `supportTickets/${ticketId}/messages`));
    await set(msgRef, {
      senderId: userId || (isAdmin ? 'admin' : null),
      senderRole: isAdmin ? 'admin' : 'user',
      text: trimmed,
      createdAt: new Date().toISOString(),
    });
    await update(ref(db, `supportTickets/${ticketId}`), {
      status: 'open',
      updatedAt: new Date().toISOString(),
      lastMessage: trimmed,
      lastMessageAt: new Date().toISOString(),
    });

    if (isAdmin && ticket.userId) {
      const notifRef = push(ref(db, `users/${ticket.userId}/notifications`));
      await set(notifRef, {
        type: 'support_reply',
        title: 'Support Reply',
        message: 'You have received a reply from Support.',
        supportTicketId: ticketId,
        read: false,
        createdAt: new Date().toISOString(),
      });
      const emailRef = push(ref(db, 'emailQueue'));
      await set(emailRef, {
        to: ticket.email,
        subject: 'Pasabuy Support Reply',
        body: trimmed,
        supportTicketId: ticketId,
        status: 'queued',
        createdAt: new Date().toISOString(),
      });
    }
    setText('');
  };

  const closeTicket = async () => {
    if (!ticketId) return;
    await update(ref(db, `supportTickets/${ticketId}`), {
      status: 'closed',
      closedBy: isAdmin ? 'admin' : userId,
      closedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  };

  if (!ticket) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.empty, { color: colors.mutedText }]}>Ticket not found.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity style={[styles.backBtn, { borderColor: colors.border }]} onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={14} color="#333" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: colors.text }]}>Support Ticket</Text>
          <Text style={[styles.meta, { color: colors.mutedText }]}>{ticket.email} • {ticket.status}</Text>
        </View>
        {ticket.status !== 'closed' && (
          <TouchableOpacity style={styles.closeBtn} onPress={closeTicket}>
            <Icon name="times-circle" size={13} color="#fff" />
            <Text style={styles.closeBtnText}>Close Ticket</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={messages}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => {
          const mine = (isAdmin && item.senderRole === 'admin') || (!isAdmin && item.senderRole !== 'admin');
          return (
            <View style={[styles.row, mine ? styles.rowRight : styles.rowLeft]}>
              <View style={[styles.bubble, mine ? styles.mine : styles.theirs]}>
                <Text style={[styles.msgText, mine ? { color: '#fff' } : { color: '#222' }]}>{item.text}</Text>
              </View>
            </View>
          );
        }}
      />

      {ticket.status !== 'closed' && (
        <View style={[styles.inputBar, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
          <TextInput
            style={[styles.input, { borderColor: colors.border, backgroundColor: colors.surface, color: colors.text }]}
            placeholder="Write a reply..."
            placeholderTextColor={colors.mutedText}
            value={text}
            onChangeText={setText}
          />
          <TouchableOpacity style={styles.sendBtn} onPress={sendMessage}>
            <Icon name="paper-plane" size={14} color="#fff" />
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee', flexDirection: 'row', alignItems: 'center' },
  backBtn: { width: 32, height: 32, borderRadius: 8, borderWidth: 1, borderColor: '#ddd', alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  title: { fontSize: FONT.bodySize, fontWeight: '700', color: '#333' },
  meta: { fontSize: 12, color: '#666', marginTop: 2 },
  closeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#C62828',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#B71C1C',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
    elevation: 2,
  },
  closeBtnText: { color: '#fff', fontWeight: '700', fontSize: 12, marginLeft: 6 },
  list: { padding: 12 },
  row: { flexDirection: 'row', marginVertical: 4 },
  rowLeft: { justifyContent: 'flex-start' },
  rowRight: { justifyContent: 'flex-end' },
  bubble: { maxWidth: '80%', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8 },
  mine: { backgroundColor: '#333' },
  theirs: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#ddd' },
  msgText: { fontSize: 14 },
  inputBar: { flexDirection: 'row', padding: 12, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#eee' },
  input: { flex: 1, borderWidth: 1, borderColor: '#ddd', borderRadius: 8, paddingHorizontal: 10, marginRight: 8, backgroundColor: '#fff' },
  sendBtn: { width: 42, height: 42, borderRadius: 8, backgroundColor: '#333', alignItems: 'center', justifyContent: 'center' },
  empty: { textAlign: 'center', color: '#777', marginTop: 30 },
});

export default SupportTicketScreen;

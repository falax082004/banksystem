import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TextInput, TouchableOpacity, FlatList, KeyboardAvoidingView, Platform } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome5';
import { db, ref, push, onValue, off, get, set } from '../firebaseConfig';
import { useThemeMode } from '../theme/ThemeContext';

const ChatScreen = ({ navigation, route }) => {
  const { isDark, colors } = useThemeMode();
  const { orderId, userId, viewerRole, order, shopperId: propShopperId, riderId: propRiderId } = route.params || {};
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const listRef = useRef(null);
  const shopperId = propShopperId || order?.ownerId || order?.userId || null;
  const riderId = propRiderId || order?.assignedTo || null;

  useEffect(() => {
    if (!orderId) return;
    let cleanup;
    const init = async () => {
      const pRef = ref(db, `chats/${orderId}/participants`);
      const pSnap = await get(pRef);
      const pVal = pSnap.exists() ? (pSnap.val() || {}) : {};
      let canRead = !!pVal[userId];
      // auto-enroll if current user is the shopper or assigned rider for this order
      if (!canRead && (userId && (userId === shopperId || (riderId && userId === riderId)))) {
        try {
          const selfRef = ref(db, `chats/${orderId}/participants/${userId}`);
          await set(selfRef, true);
          canRead = true;
        } catch {}
      }
      if (!canRead) {
        setMessages([]);
        return;
      }
      const msgRef = ref(db, `chats/${orderId}/messages`);
      const unsub = onValue(msgRef, (snapshot) => {
        if (snapshot.exists()) {
          const val = snapshot.val();
          const list = Object.keys(val)
            .map(k => ({ id: k, ...val[k] }))
            .sort((a,b) => new Date(a.createdAt) - new Date(b.createdAt));
          setMessages(list);
          setTimeout(() => listRef.current?.scrollToEnd?.({ animated: true }), 100);
        } else {
          setMessages([]);
        }
      });
      cleanup = () => off(msgRef, 'value', unsub);
    };
    init();
    return () => {
      if (cleanup) cleanup();
    };
  }, [orderId, userId]);

  const send = async () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    try {
      // Verify participant before sending
      const pRef = ref(db, `chats/${orderId}/participants`);
      const pSnap = await get(pRef);
      const canSend = pSnap.exists() && !!(pSnap.val() || {})[userId];
      if (!canSend) return;
      const msgRef = ref(db, `chats/${orderId}/messages`);
      await push(msgRef, {
        text: trimmed,
        senderId: userId,
        senderRole: viewerRole || 'user',
        createdAt: new Date().toISOString(),
      });
      setText('');
    } catch (e) {
      // ignore prototype errors
    }
  };

  const renderItem = ({ item }) => {
    const mine = item.senderId === userId;
    return (
      <View style={[styles.bubbleRow, mine ? { justifyContent: 'flex-end' } : { justifyContent: 'flex-start' }]}>
        <View
          style={[
            styles.bubble,
            mine
              ? [styles.bubbleMine, { backgroundColor: isDark ? '#2F2F35' : '#333' }]
              : [styles.bubbleTheirs, { backgroundColor: isDark ? '#2A2A2D' : '#f0f0f0' }],
          ]}
        >
          <Text style={[styles.msgText, mine ? { color: '#fff' } : { color: colors.text }]}>{item.text}</Text>
          <Text style={[styles.meta, mine ? { color: '#E5E7EB' } : { color: colors.mutedText }]}>
            {item.senderRole === 'pasabuyer' || item.senderRole === 'rider' ? 'Rider' : item.senderRole === 'shopper' ? 'Shopper' : 'User'}
          </Text>
        </View>
      </View>
    );
  };

  const [notAllowed, setNotAllowed] = useState(false);
  useEffect(() => {
    const check = async () => {
      if (!orderId) return;
      const pRef = ref(db, `chats/${orderId}/participants`);
      const pSnap = await get(pRef);
      const ok = pSnap.exists() && !!(pSnap.val() || {})[userId];
      setNotAllowed(!ok);
    };
    check();
  }, [orderId, userId]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="arrow-left" size={18} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Chat</Text>
        <View style={{ width: 32 }} />
      </View>

      {notAllowed ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="lock" size={36} color="#bbb" />
          <Text style={{ marginTop: 8, color: colors.mutedText }}>You are not a participant of this chat.</Text>
        </View>
      ) : (
      <KeyboardAvoidingWidget>
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
        />
        <View style={[styles.inputBar, { borderTopColor: colors.border, backgroundColor: colors.surface }]}>
          <TextInput
            style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.surface }]}
            placeholder="Type a message..."
            placeholderTextColor={colors.mutedText}
            value={text}
            onChangeText={setText}
          />
          <TouchableOpacity style={[styles.sendBtn, { backgroundColor: isDark ? '#2F2F35' : '#333' }]} onPress={send}>
            <Icon name="paper-plane" size={16} color="#fff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingWidget>
      )}
    </SafeAreaView>
  );
};

const KeyboardAvoidingWidget = ({ children }) => (
  <KeyboardAvoidingView
    style={{ flex: 1 }}
    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
  >
    {children}
  </KeyboardAvoidingView>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#eee' },
  backBtn: { padding: 6, marginRight: 10 },
  title: { fontSize: 18, fontWeight: 'bold', color: '#333', flex: 1 },
  listContent: { padding: 12, paddingBottom: 120 },
  bubbleRow: { flexDirection: 'row', marginVertical: 4 },
  bubble: { maxWidth: '80%', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8 },
  bubbleMine: { backgroundColor: '#333' },
  bubbleTheirs: { backgroundColor: '#f0f0f0' },
  msgText: { fontSize: 14 },
  meta: { fontSize: 10, marginTop: 4 },
  inputBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingTop: 12, paddingBottom: 20, borderTopWidth: 1, borderTopColor: '#eee', backgroundColor: '#fff' },
  input: { flex: 1, height: 48, borderWidth: 1, borderColor: '#ddd', borderRadius: 10, paddingHorizontal: 12, marginRight: 10, color: '#333', backgroundColor: '#fff' },
  sendBtn: { backgroundColor: '#333', paddingVertical: 12, paddingHorizontal: 14, borderRadius: 10 },
});

export default ChatScreen;



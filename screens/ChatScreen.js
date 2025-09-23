import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TextInput, TouchableOpacity, FlatList, KeyboardAvoidingView, Platform } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome5';
import { db, ref, push, onValue, off } from '../firebaseConfig';

const ChatScreen = ({ navigation, route }) => {
  const { orderId, userId, viewerRole } = route.params || {};
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const listRef = useRef(null);

  useEffect(() => {
    if (!orderId) return;
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
    return () => off(msgRef, 'value', unsub);
  }, [orderId]);

  const send = async () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    try {
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
        <View style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleTheirs]}>
          <Text style={[styles.msgText, mine ? { color: '#fff' } : { color: '#222' }]}>{item.text}</Text>
          <Text style={[styles.meta, mine ? { color: '#f0f0f0' } : { color: '#888' }]}>
            {item.senderRole === 'pasabuyer' ? 'Rider' : item.senderRole === 'shopper' ? 'Shopper' : 'User'}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="arrow-left" size={18} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>Chat</Text>
        <View style={{ width: 32 }} />
      </View>

      <KeyboardAvoidingWidget>
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
        />
        <View style={styles.inputBar}>
          <TextInput
            style={styles.input}
            placeholder="Type a message..."
            placeholderTextColor="#888"
            value={text}
            onChangeText={setText}
          />
          <TouchableOpacity style={styles.sendBtn} onPress={send}>
            <Icon name="paper-plane" size={16} color="#fff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingWidget>
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



// screens/HelpCenterScreen.js
import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Modal, TextInput, ScrollView, Alert } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import FONT from '../styles/typography';
import { db, ref, push, set, get } from '../firebaseConfig';
import { useThemeMode } from '../theme/ThemeContext';

const FAQS = [
  {
    question: 'How do I place an order?',
    answer: 'Browse stores, add to cart, then proceed to checkout from the Cart tab.'
  },
  {
    question: 'How do I track my order?',
    answer: 'Open Orders and tap Track on your order to view progress.'
  },
  {
    question: 'How do fees work?',
    answer: 'A service fee per store is shown at checkout. Some fees may be non‑refundable.'
  },
  {
    question: 'How do I change my role?',
    answer: 'Go to Profile > Change Role to switch between Shopper/Pasabuyer and Rider.'
  },
  {
    question: 'How do I contact support?',
    answer: 'Use Contact Support below to send us a message.'
  },
];

const HelpCenterScreen = ({ navigation, route }) => {
  const { isDark, colors } = useThemeMode();
  const { userId } = route?.params || {};
  const [faqVisible, setFaqVisible] = useState(false);
  const [contactVisible, setContactVisible] = useState(false);
  const [contactEmail, setContactEmail] = useState('');
  const [message, setMessage] = useState('');

  const resolveEmail = async () => {
    if (contactEmail.trim()) return contactEmail.trim();
    if (!userId) return '';
    try {
      const userSnap = await get(ref(db, `users/${userId}`));
      if (userSnap.exists()) return (userSnap.val()?.email || '').trim();
    } catch {}
    return '';
  };

  const handleSend = async () => {
    if (!message.trim()) {
      Alert.alert('Please enter a message.');
      return;
    }
    const email = await resolveEmail();
    if (!email) {
      Alert.alert('Email Required', 'Please enter your email so admin can reply.');
      return;
    }

    try {
      const ticketRef = push(ref(db, 'supportTickets'));
      const ticketId = ticketRef.key;
      await set(ticketRef, {
        id: ticketId,
        userId: userId || null,
        email,
        subject: 'Help Center Inquiry',
        status: 'open',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        source: 'help_center',
      });
      const msgRef = push(ref(db, `supportTickets/${ticketId}/messages`));
      await set(msgRef, {
        senderId: userId || null,
        senderRole: 'user',
        text: message.trim(),
        createdAt: new Date().toISOString(),
      });

      if (userId) {
        const notifRef = push(ref(db, `users/${userId}/notifications`));
        await set(notifRef, {
          type: 'support_ticket_created',
          title: 'Support Ticket Created',
          message: 'Your support ticket has been created.',
          supportTicketId: ticketId,
          read: false,
          createdAt: new Date().toISOString(),
        });
      }
      Alert.alert('Message Sent', 'Your support request was sent to admin.');
      setMessage('');
      setContactEmail('');
      setContactVisible(false);
    } catch (error) {
      Alert.alert('Send Failed', error.message || 'Unable to send support request.');
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.headerWrap}>
        <View style={styles.headerRow}>
          <TouchableOpacity style={[styles.backButton, { borderColor: colors.border, backgroundColor: colors.surface }]} onPress={() => navigation.goBack()}>
            <Ionicons name="close" size={18} color={colors.text} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={[styles.header, { color: colors.text }]}>Help Center</Text>
            <Text style={[styles.subheader, { color: colors.mutedText }]}>Find answers and contact Pasabuy Support</Text>
          </View>
        </View>
      </View>

      <View style={styles.cardsWrap}>
        <TouchableOpacity style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]} onPress={() => setFaqVisible(true)}>
          <Ionicons name="help-circle-outline" size={28} color={colors.text} style={styles.cardIcon} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>FAQs</Text>
            <Text style={[styles.cardDesc, { color: colors.mutedText }]}>Common questions about Pasabuy</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]} onPress={() => setContactVisible(true)}>
          <Ionicons name="call-outline" size={28} color={colors.text} style={styles.cardIcon} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>Contact Support</Text>
            <Text style={[styles.cardDesc, { color: colors.mutedText }]}>Send us a message</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]} onPress={() => navigation.navigate('SupportInbox', { userId, isAdmin: false })}>
          <Ionicons name="mail-open-outline" size={28} color={colors.text} style={styles.cardIcon} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>My Tickets</Text>
            <Text style={[styles.cardDesc, { color: colors.mutedText }]}>View and continue your support chats</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* FAQ Modal */}
      <Modal visible={faqVisible} animationType="slide" transparent onRequestClose={() => setFaqVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.surface }]}>
            <Text style={[styles.modalHeader, { color: colors.text }]}>Frequently Asked Questions</Text>
            <ScrollView style={{ maxHeight: 360 }}>
              {FAQS.map((faq, idx) => (
                <View key={idx} style={styles.faqItem}>
                  <Text style={[styles.faqQ, { color: colors.text }]}>{faq.question}</Text>
                  <Text style={[styles.faqA, { color: colors.mutedText }]}>{faq.answer}</Text>
                </View>
              ))}
            </ScrollView>
            <TouchableOpacity style={[styles.closeBtn, { backgroundColor: isDark ? '#2F2F35' : '#222' }]} onPress={() => setFaqVisible(false)}>
              <Text style={styles.closeBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Contact Support Modal */}
      <Modal visible={contactVisible} animationType="slide" transparent onRequestClose={() => setContactVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.surface }]}>
            <Text style={[styles.modalHeader, { color: colors.text }]}>Contact Support</Text>
            <Text style={[styles.contactInfo, { color: colors.text }]}><Ionicons name="mail" size={16} color={colors.text} /> support@pasabuy.app</Text>
            <Text style={[styles.contactInfo, { color: colors.text }]}><Ionicons name="call" size={16} color={colors.text} /> +63 2 1234 5678</Text>
            <Text style={[styles.contactLabel, { color: colors.text }]}>Send us a message:</Text>
            <TextInput
              style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.background }]}
              placeholder="Your email"
              placeholderTextColor={colors.mutedText}
              value={contactEmail}
              onChangeText={setContactEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <TextInput
              style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.background }]}
              placeholder="Type your message..."
              placeholderTextColor={colors.mutedText}
              value={message}
              onChangeText={setMessage}
              multiline
              numberOfLines={3}
            />
            <TouchableOpacity style={[styles.sendBtn, { backgroundColor: isDark ? '#2F2F35' : '#222' }]} onPress={handleSend}>
              <Text style={styles.sendBtnText}>Send</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.closeBtn, { backgroundColor: isDark ? '#2F2F35' : '#222' }]} onPress={() => setContactVisible(false)}>
              <Text style={styles.closeBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default HelpCenterScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  headerWrap: {
    paddingTop: 24,
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  backButton: {
    width: 34,
    height: 34,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e5e5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    backgroundColor: '#fff',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  header: {
    fontSize: FONT.titleSize,
    fontWeight: FONT.weightBold,
    color: FONT.headerColor,
  },
  subheader: {
    fontSize: FONT.smallSize,
    color: FONT.mutedColor,
    marginTop: 4,
  },
  cardsWrap: {
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#eee',
  },
  cardIcon: {
    marginRight: 12,
  },
  cardTitle: {
    fontSize: FONT.subtitleSize,
    fontWeight: FONT.weightBold,
    color: FONT.headerColor,
    marginBottom: 2,
  },
  cardDesc: {
    fontSize: FONT.smallSize,
    color: FONT.mutedColor,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 18,
    width: '100%',
    maxWidth: 460,
  },
  modalHeader: {
    fontSize: FONT.subtitleSize,
    fontWeight: FONT.weightBold,
    color: FONT.headerColor,
    marginBottom: 12,
  },
  faqItem: {
    marginBottom: 14,
  },
  faqQ: {
    fontWeight: FONT.weightBold,
    color: FONT.headerColor,
    fontSize: FONT.subtitleSize,
    marginBottom: 2,
  },
  faqA: {
    color: FONT.mutedColor,
    fontSize: FONT.smallSize,
    marginLeft: 4,
  },
  closeBtn: {
    marginTop: 14,
    backgroundColor: '#222',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  closeBtnText: {
    color: '#fff',
    fontWeight: FONT.weightBold,
    fontSize: FONT.subtitleSize,
  },
  contactInfo: {
    color: FONT.headerColor,
    fontSize: FONT.bodySize,
    marginBottom: 6,
  },
  contactLabel: {
    color: FONT.headerColor,
    fontWeight: FONT.weightBold,
    fontSize: FONT.bodySize,
    marginTop: 10,
    marginBottom: 6,
  },
  input: {
    width: '100%',
    minHeight: 60,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 10,
    fontSize: FONT.bodySize,
    color: FONT.headerColor,
    backgroundColor: '#f7f7f7',
    marginBottom: 10,
  },
  sendBtn: {
    backgroundColor: '#222',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: 4,
  },
  sendBtnText: {
    color: '#fff',
    fontWeight: FONT.weightBold,
    fontSize: FONT.subtitleSize,
  },
});

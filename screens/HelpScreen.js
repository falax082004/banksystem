// screens/HelpCenterScreen.js
import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Modal, TextInput, ScrollView, Alert } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

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

const HelpCenterScreen = () => {
  const [faqVisible, setFaqVisible] = useState(false);
  const [contactVisible, setContactVisible] = useState(false);
  const [message, setMessage] = useState('');

  const handleSend = () => {
    if (!message.trim()) {
      Alert.alert('Please enter a message.');
      return;
    }
    Alert.alert('Message Sent', 'Thanks for reaching out. We will get back to you soon.');
    setMessage('');
    setContactVisible(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerWrap}>
        <Text style={styles.header}>Help Center</Text>
        <Text style={styles.subheader}>Find answers and contact Pasabuy Support</Text>
      </View>

      <View style={styles.cardsWrap}>
        <TouchableOpacity style={styles.card} onPress={() => setFaqVisible(true)}>
          <Ionicons name="help-circle-outline" size={28} color="#222" style={styles.cardIcon} />
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle}>FAQs</Text>
            <Text style={styles.cardDesc}>Common questions about Pasabuy</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity style={styles.card} onPress={() => setContactVisible(true)}>
          <Ionicons name="call-outline" size={28} color="#222" style={styles.cardIcon} />
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle}>Contact Support</Text>
            <Text style={styles.cardDesc}>Send us a message</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* FAQ Modal */}
      <Modal visible={faqVisible} animationType="slide" transparent onRequestClose={() => setFaqVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalHeader}>Frequently Asked Questions</Text>
            <ScrollView style={{ maxHeight: 360 }}>
              {FAQS.map((faq, idx) => (
                <View key={idx} style={styles.faqItem}>
                  <Text style={styles.faqQ}>{faq.question}</Text>
                  <Text style={styles.faqA}>{faq.answer}</Text>
                </View>
              ))}
            </ScrollView>
            <TouchableOpacity style={styles.closeBtn} onPress={() => setFaqVisible(false)}>
              <Text style={styles.closeBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Contact Support Modal */}
      <Modal visible={contactVisible} animationType="slide" transparent onRequestClose={() => setContactVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalHeader}>Contact Support</Text>
            <Text style={styles.contactInfo}><Ionicons name="mail" size={16} /> support@pasabuy.app</Text>
            <Text style={styles.contactInfo}><Ionicons name="call" size={16} /> +63 2 1234 5678</Text>
            <Text style={styles.contactLabel}>Send us a message:</Text>
            <TextInput
              style={styles.input}
              placeholder="Type your message..."
              placeholderTextColor="#888"
              value={message}
              onChangeText={setMessage}
              multiline
              numberOfLines={3}
            />
            <TouchableOpacity style={styles.sendBtn} onPress={handleSend}>
              <Text style={styles.sendBtnText}>Send</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.closeBtn} onPress={() => setContactVisible(false)}>
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
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#222',
  },
  subheader: {
    fontSize: 14,
    color: '#666',
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
    fontSize: 16,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 2,
  },
  cardDesc: {
    fontSize: 13,
    color: '#666',
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
    fontSize: 18,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 12,
  },
  faqItem: {
    marginBottom: 14,
  },
  faqQ: {
    fontWeight: 'bold',
    color: '#222',
    fontSize: 14,
    marginBottom: 2,
  },
  faqA: {
    color: '#555',
    fontSize: 13,
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
    fontWeight: 'bold',
    fontSize: 16,
  },
  contactInfo: {
    color: '#222',
    fontSize: 14,
    marginBottom: 6,
  },
  contactLabel: {
    color: '#222',
    fontWeight: 'bold',
    fontSize: 14,
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
    fontSize: 14,
    color: '#222',
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
    fontWeight: 'bold',
    fontSize: 16,
  },
});

// screens/HelpCenterScreen.js
import React, { useState } from 'react';
import { View, Text, StyleSheet, ImageBackground, SafeAreaView, TouchableOpacity, Modal, TextInput, ScrollView, Alert } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

const FAQS = [
  {
    question: 'How do I reset my password?',
    answer: 'Go to Settings > Change Password. Enter your current password and your new password.'
  },
  {
    question: 'How do I contact support?',
    answer: 'You can contact us via the Contact Support section in this Help Center.'
  },
  {
    question: 'How do I deposit money?',
    answer: 'Go to Home > Deposit and follow the instructions to add funds to your account.'
  },
  {
    question: 'How do I view my transaction history?',
    answer: 'Go to Inbox to see all your recent transactions and notifications.'
  },
  {
    question: 'How do I link another bank account?',
    answer: 'Go to My Linked Accounts and select the bank you want to link.'
  },
  {
    question: 'How do I check my balance?',
    answer: 'Your balance is displayed on the Home screen in the card at the top. Tap the eye icon to show or hide your balance.'
  },
  {
    question: 'How do I transfer money?',
    answer: 'On the Home screen, tap the Transfer button, then follow the prompts to send money to another account.'
  },
  {
    question: 'How do I pay bills?',
    answer: 'On the Home screen, tap the Pay Bills button and select the biller you want to pay.'
  },
  {
    question: 'How do I invest?',
    answer: 'Go to Investment Hub from the menu, select an investment option, and follow the instructions to invest.'
  },
  {
    question: 'How do I donate to charity?',
    answer: 'Go to Charity and Donations from the menu, choose a cause, and tap Donate to make a contribution.'
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
    Alert.alert('Message Sent', 'Your message has been sent to support. We will get back to you soon.');
    setMessage('');
    setContactVisible(false);
  };

  return (
    <ImageBackground source={require('../assets/bgapp3.jpg')} style={styles.background}>
      <View style={styles.overlay} />
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.headerWrap}>
          <Text style={styles.header}>Help Center</Text>
        </View>
        <View style={styles.cardsWrap}>
          <TouchableOpacity style={styles.card} onPress={() => setFaqVisible(true)}>
            <Ionicons name="help-circle-outline" size={36} color="#222" style={styles.cardIcon} />
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>FAQs</Text>
              <Text style={styles.cardDesc}>Find answers to common questions about Pantheon Bank.</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity style={styles.card} onPress={() => setContactVisible(true)}>
            <Ionicons name="call-outline" size={36} color="#222" style={styles.cardIcon} />
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>Contact Support</Text>
              <Text style={styles.cardDesc}>Reach out to our support team via email or phone for assistance.</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* FAQ Modal */}
        <Modal visible={faqVisible} animationType="slide" transparent onRequestClose={() => setFaqVisible(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <Text style={styles.modalHeader}>Frequently Asked Questions</Text>
              <ScrollView style={{ maxHeight: 350 }}>
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
              <Text style={styles.contactInfo}><Ionicons name="mail" size={16} /> support@pantheonbank.com</Text>
              <Text style={styles.contactInfo}><Ionicons name="call" size={16} /> (02) 8-5612-8999</Text>
              <Text style={styles.contactInfo}><Ionicons name="location" size={16} /> Pantheon Bank HQ, Manila</Text>
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
    </ImageBackground>
  );
};

export default HelpCenterScreen;

const styles = StyleSheet.create({
  background: {
    flex: 1,
    resizeMode: 'cover',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  headerWrap: {
    paddingTop: 40,
    paddingBottom: 16,
    alignItems: 'center',
  },
  header: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    letterSpacing: 1,
  },
  cardsWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    width: '100%',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  cardIcon: {
    marginRight: 18,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 4,
  },
  cardDesc: {
    fontSize: 14,
    color: '#555',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 24,
    width: '90%',
    maxWidth: 400,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
    elevation: 10,
  },
  modalHeader: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 16,
    textAlign: 'center',
  },
  faqItem: {
    marginBottom: 18,
  },
  faqQ: {
    fontWeight: 'bold',
    color: '#222',
    fontSize: 15,
    marginBottom: 2,
  },
  faqA: {
    color: '#555',
    fontSize: 14,
    marginLeft: 6,
  },
  closeBtn: {
    marginTop: 18,
    backgroundColor: '#222',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 40,
  },
  closeBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    letterSpacing: 1,
  },
  contactInfo: {
    color: '#222',
    fontSize: 15,
    marginBottom: 6,
    textAlign: 'left',
    width: '100%',
  },
  contactLabel: {
    color: '#222',
    fontWeight: 'bold',
    fontSize: 15,
    marginTop: 12,
    marginBottom: 4,
    alignSelf: 'flex-start',
  },
  input: {
    width: '100%',
    minHeight: 60,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 10,
    fontSize: 15,
    color: '#222',
    backgroundColor: '#f7f7f7',
    marginBottom: 10,
  },
  sendBtn: {
    backgroundColor: '#222',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 40,
    marginTop: 4,
  },
  sendBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    letterSpacing: 1,
  },
});

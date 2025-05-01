import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ImageBackground, Modal, Pressable
} from 'react-native';
import { db, ref, get, update } from '../firebaseConfig';

const TransferScreen = ({ navigation, route }) => {
  const [recipientUsername, setRecipientUsername] = useState('');
  const [amount, setAmount] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const { userId } = route.params;

  const handleTransfer = async () => {
    const transferAmount = parseFloat(amount);
    if (!recipientUsername.trim() || isNaN(transferAmount) || transferAmount <= 0) {
      setModalMessage('Please enter a valid recipient username and amount');
      setModalVisible(true);
      return;
    }

    if (recipientUsername === userId) {
      setModalMessage('You cannot transfer money to your own account');
      setModalVisible(true);
      return;
    }

    const senderRef = ref(db, 'users/' + userId);
    const recipientRef = ref(db, 'users/' + recipientUsername);

    try {
      const senderSnapshot = await get(senderRef);
      const recipientSnapshot = await get(recipientRef);

      if (!senderSnapshot.exists()) {
        setModalMessage('Sender not found');
        setModalVisible(true);
        return;
      }

      if (!recipientSnapshot.exists()) {
        setModalMessage('Recipient not found');
        setModalVisible(true);
        return;
      }

      const senderData = senderSnapshot.val();
      const recipientData = recipientSnapshot.val();

      const senderBalance = senderData.balance || 0;
      if (transferAmount > senderBalance) {
        setModalMessage('Insufficient funds');
        setModalVisible(true);
        return;
      }

      const newSenderBalance = senderBalance - transferAmount;
      const newRecipientBalance = (recipientData.balance || 0) + transferAmount;

      await update(senderRef, {
        balance: newSenderBalance,
        transactions: [...(senderData.transactions || []), {
          type: 'transfer',
          to: recipientUsername,
          amount: transferAmount,
          timestamp: new Date().toISOString(),
        }],
      });

      await update(recipientRef, {
        balance: newRecipientBalance,
        transactions: [...(recipientData.transactions || []), {
          type: 'received',
          from: userId,
          amount: transferAmount,
          timestamp: new Date().toISOString(),
        }],
      });

      setModalMessage(`Transferred ₱${transferAmount} to ${recipientUsername}`);
      setModalVisible(true);

    } catch (error) {
      console.error("Error during transfer:", error);
      setModalMessage('Something went wrong. Please try again.');
      setModalVisible(true);
    }
  };

  const closeModal = () => {
    setModalVisible(false);
    if (modalMessage.includes('Transferred')) {
      navigation.navigate('Home', { userId });
    }
  };

  return (
    <ImageBackground source={require('../assets/bgapp3.jpg')} style={styles.background}>
      <View style={styles.container}>
        <TouchableOpacity 
          style={styles.closeButton} 
          onPress={() => navigation.navigate('Home', { userId })}
        >
          <Text style={styles.closeButtonText}>X</Text>
        </TouchableOpacity>

        <View style={styles.card}>
          <Text style={styles.title}>Transfer Funds</Text>

          <Text style={styles.label}>Recipient Username:</Text>
          <TextInput
            style={styles.input}
            value={recipientUsername}
            onChangeText={setRecipientUsername}
            autoCapitalize="none"
            autoCorrect={false}
            placeholder="Username"
            placeholderTextColor="#888"
          />

          <Text style={styles.label}>Amount:</Text>
          <TextInput
            style={styles.input}
            value={amount}
            onChangeText={setAmount}
            keyboardType="numeric"
            placeholder="₱0.00"
            placeholderTextColor="#888"
          />

          <TouchableOpacity style={styles.button} onPress={handleTransfer}>
            <Text style={styles.buttonText}>Send Transfer</Text>
          </TouchableOpacity>
        </View>

        <Modal
          transparent={true}
          visible={modalVisible}
          animationType="fade"
          onRequestClose={closeModal}
        >
          <View style={styles.modalBackground}>
            <View style={styles.modalCard}>
              <Text style={styles.modalText}>{modalMessage}</Text>
              <Pressable style={styles.modalButton} onPress={closeModal}>
                <Text style={styles.modalButtonText}>OK</Text>
              </Pressable>
            </View>
          </View>
        </Modal>
      </View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  background: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  closeButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
    padding: 10,
    zIndex: 1,
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  card: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 16,
    padding: 30,
    width: '90%',
    maxWidth: 400,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    color: '#fff',
    marginBottom: 10,
    alignSelf: 'flex-start',
  },
  input: {
    height: 50,
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingLeft: 15,
    fontSize: 18,
    marginBottom: 20,
    color: '#333',
  },
  button: {
    backgroundColor: '#D8D8D8',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 30,
    marginTop: 10,
    alignItems: 'center',
    width: '100%',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },
  buttonText: {
    color: '#333',
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalBackground: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCard: {
    backgroundColor: '#f4f4f4',
    padding: 30,
    borderRadius: 20,
    alignItems: 'center',
    width: '80%',
  },
  modalText: {
    fontSize: 18,
    marginBottom: 20,
    color: '#111',
    textAlign: 'center',
  },
  modalButton: {
    backgroundColor: '#333',
    paddingVertical: 10,
    paddingHorizontal: 25,
    borderRadius: 10,
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
  },
});

export default TransferScreen;

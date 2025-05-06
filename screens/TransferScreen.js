import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Modal, Pressable, ImageBackground } from 'react-native';
import { db, ref, get, update, serverTimestamp } from '../firebaseConfig';

const TransferScreen = ({ navigation, route }) => {
  const [recipientUsername, setRecipientUsername] = useState('');
  const [amount, setAmount] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [confirmationModalVisible, setConfirmationModalVisible] = useState(false);
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
      const senderBalance = senderData.balance || 0;
      const dailyOutgoing = senderData.dailyOutgoing || 0;

      // Check if the transfer exceeds the daily limit
      if (dailyOutgoing + transferAmount > 100000) {
        setModalMessage('Transfer exceeds daily outgoing limit of ₱100,000');
        setModalVisible(true);
        return;
      }

      if (transferAmount > senderBalance) {
        setModalMessage('Insufficient funds');
        setModalVisible(true);
        return;
      }

      setConfirmationModalVisible(true);
    } catch (error) {
      console.error("Error during transfer:", error);
      setModalMessage('Something went wrong. Please try again.');
      setModalVisible(true);
    }
  };

  const confirmTransfer = async () => {
    const transferAmount = parseFloat(amount);
    const senderRef = ref(db, 'users/' + userId);
    const recipientRef = ref(db, 'users/' + recipientUsername);

    try {
      const senderSnapshot = await get(senderRef);
      const recipientSnapshot = await get(recipientRef);

      const senderData = senderSnapshot.val();
      const recipientData = recipientSnapshot.val();

      const senderBalance = senderData.balance || 0;
      const newSenderBalance = senderBalance - transferAmount;
      const newRecipientBalance = (recipientData.balance || 0) + transferAmount;

      const senderTransactions = senderData.transactions || [];
      const recipientTransactions = recipientData.transactions || [];

      const timestamp = serverTimestamp();  // Use Firebase's server timestamp for accuracy

      // Prepare transaction data
      const senderTransaction = {
        type: 'transfer',
        to: recipientUsername,
        amount: transferAmount,
        timestamp,
      };

      const recipientTransaction = {
        type: 'received',
        from: userId,
        amount: transferAmount,
        timestamp,
      };

      // Update dailyOutgoing and monthlyIncoming for both sender and recipient
      const today = new Date().toISOString().split('T')[0]; // 'yyyy-mm-dd' format
      const currentMonth = new Date().toISOString().split('T')[0].slice(0, 7); // 'yyyy-mm' format

      // Update sender dailyOutgoing
      let dailyOutgoing = senderData.dailyOutgoing || 0;
      dailyOutgoing += transferAmount;

      // Update recipient monthlyIncoming
      let monthlyIncoming = recipientData.monthlyIncoming || 0;
      monthlyIncoming += transferAmount;

      await update(senderRef, {
        balance: newSenderBalance,
        transactions: [...senderTransactions, senderTransaction],
        dailyOutgoing,
      });

      await update(recipientRef, {
        balance: newRecipientBalance,
        transactions: [...recipientTransactions, recipientTransaction],
        monthlyIncoming,
      });

      setModalMessage(`Transferred ₱${transferAmount} to ${recipientUsername}`);
      setModalVisible(true);
      setConfirmationModalVisible(false);
    } catch (error) {
      console.error("Error confirming transfer:", error);
      setModalMessage('Transfer failed. Please try again.');
      setModalVisible(true);
      setConfirmationModalVisible(false);
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
        {/* Close button */}
        <TouchableOpacity style={styles.closeButton} onPress={() => navigation.navigate('Home', { userId })}>
          <Text style={styles.closeButtonText}>X</Text>
        </TouchableOpacity>

        <View style={styles.card}>
          <Text style={styles.title}>Transfer Funds</Text>

          <Text style={styles.label}>Recipient Username:</Text>
          <TextInput
            style={styles.input}
            value={recipientUsername}
            onChangeText={setRecipientUsername}
            placeholder="Enter recipient username"
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
            <Text style={styles.buttonText}>Transfer</Text>
          </TouchableOpacity>
        </View>

        {/* Modal for messages */}
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

        {/* Confirmation Modal */}
        <Modal
          transparent={true}
          visible={confirmationModalVisible}
          animationType="fade"
          onRequestClose={() => setConfirmationModalVisible(false)}
        >
          <View style={styles.modalBackground}>
            <View style={[styles.modalCard, { backgroundColor: '#222' }]}>
              <Text style={[styles.modalText, { color: '#fff', marginBottom: 30 }]}>
                Confirm transfer of ₱{amount} to @{recipientUsername}?
              </Text>
              <View style={styles.modalButtonContainer}>
                <Pressable style={[styles.modalButton, styles.confirmButton]} onPress={confirmTransfer}>
                  <Text style={styles.modalButtonText}>Confirm</Text>
                </Pressable>
                <Pressable style={[styles.modalButton, styles.cancelButton]} onPress={() => setConfirmationModalVisible(false)}>
                  <Text style={styles.modalButtonText}>Cancel</Text>
                </Pressable>
              </View>
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
    top: 40,
    right: 20,
    backgroundColor: '#fff',
    borderRadius: 50,
    padding: 10,
    zIndex: 1,
  },
  closeButtonText: {
    fontSize: 24,
    color: '#333',
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
  },
  buttonText: {
    color: '#333',
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalBackground: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 30,
    alignItems: 'center',
    width: '80%',
    maxWidth: 400,
  },
  modalText: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 20,
  },
  modalButton: {
    backgroundColor: '#007BFF',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 40,
    marginTop: 10,
    alignItems: 'center',
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  modalButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  confirmButton: {
    backgroundColor: '#4CAF50',
  },
  cancelButton: {
    backgroundColor: '#F44336',
  },
});

export default TransferScreen;

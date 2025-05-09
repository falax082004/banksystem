import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ImageBackground, Modal, Pressable
} from 'react-native';
import { db, ref, get, update, serverTimestamp } from '../firebaseConfig';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const TransferScreen = ({ navigation, route }) => {
  const { userId } = route.params;
  const [amount, setAmount] = useState('');
  const [recipient, setRecipient] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [lockStatus, setLockStatus] = useState(false);  // Lock status
  const [showConfirmation, setShowConfirmation] = useState(false);  // Confirmation modal status
  const [showReceipt, setShowReceipt] = useState(false);
  const [receiptData, setReceiptData] = useState(null);

  useEffect(() => {
    fetchLockStatus();
  }, []);

  const fetchLockStatus = async () => {
    try {
      const lockRef = ref(db, `users/${userId}/lock/status`);
      const snapshot = await get(lockRef);
      if (snapshot.exists()) {
        setLockStatus(snapshot.val());
      }
    } catch (error) {
      console.error('Error fetching lock status:', error);
    }
  };

  const handleTransfer = async () => {
    const transferAmount = parseFloat(amount);

    if (isNaN(transferAmount) || transferAmount <= 0) {
      setModalMessage('Please enter a valid transfer amount');
      setModalVisible(true);
      return;
    }

    if (lockStatus) {
      setModalMessage('Your account is locked. Transfers are not allowed.');
      setModalVisible(true);
      return;
    }

    const userRef = ref(db, 'users/' + userId);

    try {
      const snapshot = await get(userRef);
      if (!snapshot.exists()) {
        setModalMessage('User not found');
        setModalVisible(true);
        return;
      }

      const userData = snapshot.val();
      const currentBalance = userData.balance || 0;

      if (transferAmount > currentBalance) {
        setModalMessage('Insufficient funds');
        setModalVisible(true);
        return;
      }

      setShowConfirmation(true);  // Show confirmation modal

    } catch (error) {
      console.error("Error during transfer:", error);
      setModalMessage('Something went wrong. Please try again.');
      setModalVisible(true);
    }
  };

  const generateRefNo = () => {
    return (
      Math.floor(1000 + Math.random() * 9000) + ' ' +
      Math.floor(1000 + Math.random() * 9000) + ' ' +
      Math.floor(1000 + Math.random() * 9000)
    );
  };

  const confirmTransfer = async () => {
    const transferAmount = parseFloat(amount);
    const recipientId = recipient;
    const refNo = generateRefNo();
    const paidAt = new Date();
    const fee = 5.00; // mock fee

    const userRef = ref(db, 'users/' + userId);
    const recipientRef = ref(db, 'users/' + recipientId);

    try {
      const userSnapshot = await get(userRef);
      const recipientSnapshot = await get(recipientRef);

      if (!userSnapshot.exists() || !recipientSnapshot.exists()) {
        setModalMessage('User or recipient not found');
        setModalVisible(true);
        setShowConfirmation(false);
        return;
      }

      const userData = userSnapshot.val();
      const recipientData = recipientSnapshot.val();

      const currentBalance = userData.balance || 0;
      const recipientBalance = recipientData.balance || 0;

      const newBalance = currentBalance - parseFloat(amount);
      const newRecipientBalance = recipientBalance + parseFloat(amount);

      // Update balances for both users
      await update(userRef, {
        balance: newBalance,
        transactions: [...(userData.transactions || []), {
          type: 'transfer',
          amount: -parseFloat(amount),
          recipient: recipientId,
          timestamp: serverTimestamp(),
        }],
      });

      await update(recipientRef, {
        balance: newRecipientBalance,
        transactions: [...(recipientData.transactions || []), {
          type: 'transfer',
          amount: parseFloat(amount),
          sender: userId,
          timestamp: serverTimestamp(),
        }],
      });

      setReceiptData({
        sender: userId,
        recipient: recipientId,
        amount: parseFloat(amount),
        fee,
        refNo,
        paidAt,
      });
      setShowReceipt(true);
      setShowConfirmation(false);  // Close confirmation modal
    } catch (error) {
      console.error("Error during transfer:", error);
      setModalMessage('Something went wrong. Please try again.');
      setModalVisible(true);
      setShowConfirmation(false);
    }
  };

  const closeModal = () => {
    setModalVisible(false);
    if (modalMessage.includes('Successfully')) {
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

          <Text style={styles.label}>Amount:</Text>
          <TextInput
            style={styles.input}
            value={amount}
            onChangeText={setAmount}
            keyboardType="numeric"
            placeholder="₱0.00"
            placeholderTextColor="#888"
          />

          <Text style={styles.label}>Recipient ID:</Text>
          <TextInput
            style={styles.input}
            value={recipient}
            onChangeText={setRecipient}
            placeholder="Recipient User ID"
            placeholderTextColor="#888"
          />

          <TouchableOpacity style={styles.button} onPress={handleTransfer}>
            <Text style={styles.buttonText}>Initiate Transfer</Text>
          </TouchableOpacity>
        </View>

        {/* Confirmation Modal */}
        <Modal
          transparent={true}
          visible={showConfirmation}
          animationType="fade"
          onRequestClose={() => setShowConfirmation(false)}
        >
          <View style={styles.modalBackground}>
            <View style={styles.modalCard}>
              <Text style={styles.modalText}>
                Are you sure you want to transfer ₱{amount} to user {recipient}?
              </Text>
              <Pressable style={styles.modalButton} onPress={confirmTransfer}>
                <Text style={styles.modalButtonText}>Confirm</Text>
              </Pressable>
              <Pressable style={styles.modalButton} onPress={() => setShowConfirmation(false)}>
                <Text style={styles.modalButtonText}>Cancel</Text>
              </Pressable>
            </View>
          </View>
        </Modal>

        {/* Pantheon Receipt Modal (copied from BillScreen) */}
        <Modal
          transparent={true}
          visible={showReceipt}
          animationType="fade"
          onRequestClose={() => setShowReceipt(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.receiptCardBW}>
              {/* Top circle with sender initial */}
              <View style={styles.receiptCircleBW}>
                <Text style={styles.receiptCircleTextBW}>
                  {receiptData ? (receiptData.sender[0] || '?').toUpperCase() : '?'}
                </Text>
              </View>
              <Text style={styles.receiptBillerBW}>Transfer to {receiptData ? receiptData.recipient : ''}</Text>
              <Text style={styles.receiptReceivedBW}>Transfer Successful</Text>
              <Text style={styles.receiptAmountLabelBW}>the amount of</Text>
              <Text style={styles.receiptAmountBW}>₱{receiptData ? Math.abs(receiptData.amount) : ''}</Text>
              <Text style={styles.receiptViaBW}>Pantheon Bank</Text>
              <View style={styles.receiptDividerBW} />
              <Text style={styles.receiptRefBW}>Ref. No. {receiptData ? receiptData.refNo : ''}</Text>
              <Text style={styles.receiptDateBW}>{receiptData ? receiptData.paidAt.toLocaleString() : ''}</Text>
              <View style={styles.receiptDividerBW} />
              <Text style={styles.receiptDetailsTitleBW}>Details</Text>
              <View style={styles.receiptDetailsRowBW}><Text style={styles.receiptDetailsLabelBW}>Amount</Text><Text style={styles.receiptDetailsValueBW}>₱{receiptData ? Math.abs(receiptData.amount - receiptData.fee).toFixed(2) : ''}</Text></View>
              <View style={styles.receiptDetailsRowBW}><Text style={styles.receiptDetailsLabelBW}>Fee</Text><Text style={styles.receiptDetailsValueBW}>₱{receiptData ? receiptData.fee.toFixed(2) : ''}</Text></View>
              <View style={styles.receiptDetailsRowBW}><Text style={styles.receiptDetailsLabelBW}>Sender</Text><Text style={styles.receiptDetailsValueBW}>{receiptData ? receiptData.sender : ''}</Text></View>
              <View style={styles.receiptDetailsRowBW}><Text style={styles.receiptDetailsLabelBW}>Recipient</Text><Text style={styles.receiptDetailsValueBW}>{receiptData ? receiptData.recipient : ''}</Text></View>
              <Text style={styles.receiptProcessedBW}>This transfer has been processed and will reflect shortly.</Text>
              <TouchableOpacity style={styles.receiptDoneBtnBW} onPress={() => { setShowReceipt(false); navigation.navigate('Home', { userId }); }}>
                <Text style={styles.receiptDoneTextBW}>DONE</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Error/Success Modal */}
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
    right: 20,
    top: 20,
    zIndex: 1,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 24,
    color: '#fff',
    fontWeight: 'bold',
  },
  card: {
    backgroundColor: '#111',
    borderRadius: 16,
    padding: 30,
    width: '90%',
    maxWidth: 400,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 25,
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
    backgroundColor: '#f4f4f4',
    borderRadius: 10,
    paddingLeft: 15,
    fontSize: 18,
    marginBottom: 20,
    color: '#222',
  },
  button: {
    backgroundColor: '#222',
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
    color: '#fff',
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
    backgroundColor: '#fff',
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
    backgroundColor: '#111',
    paddingVertical: 10,
    paddingHorizontal: 25,
    borderRadius: 10,
    marginBottom: 10,
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  receiptCardBW: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 24,
    width: '90%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
    elevation: 10,
  },
  receiptCircleBW: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#111',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  receiptCircleTextBW: {
    color: '#111',
    fontSize: 28,
    fontWeight: 'bold',
  },
  receiptBillerBW: {
    color: '#111',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  receiptReceivedBW: {
    color: '#111',
    fontSize: 14,
    marginBottom: 2,
  },
  receiptAmountLabelBW: {
    color: '#111',
    fontSize: 14,
    marginTop: 8,
  },
  receiptAmountBW: {
    color: '#111',
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  receiptViaBW: {
    color: '#111',
    fontSize: 14,
    marginBottom: 10,
  },
  receiptDividerBW: {
    width: '100%',
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 10,
  },
  receiptRefBW: {
    color: '#111',
    fontSize: 13,
    marginBottom: 2,
  },
  receiptDateBW: {
    color: '#555',
    fontSize: 13,
    marginBottom: 2,
  },
  receiptDetailsTitleBW: {
    color: '#111',
    fontWeight: 'bold',
    fontSize: 15,
    marginBottom: 6,
    alignSelf: 'flex-start',
  },
  receiptDetailsRowBW: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 2,
  },
  receiptDetailsLabelBW: {
    color: '#555',
    fontSize: 13,
  },
  receiptDetailsValueBW: {
    color: '#111',
    fontSize: 13,
    fontWeight: 'bold',
  },
  receiptProcessedBW: {
    color: '#555',
    fontSize: 12,
    marginTop: 10,
    marginBottom: 10,
    textAlign: 'center',
  },
  receiptDoneBtnBW: {
    backgroundColor: '#111',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 40,
    marginTop: 10,
  },
  receiptDoneTextBW: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    letterSpacing: 1,
  },
});

export default TransferScreen;

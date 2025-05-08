import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ImageBackground, Modal, Pressable
} from 'react-native';
import { db, ref, get, update, serverTimestamp } from '../firebaseConfig';

const DepositScreen = ({ navigation, route }) => {
  const { userId } = route.params;
  const [amount, setAmount] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [lockStatus, setLockStatus] = useState(false);  // Lock status

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

  const handleDeposit = async () => {
    const depositAmount = parseFloat(amount);

    if (isNaN(depositAmount) || depositAmount <= 0) {
      setModalMessage('Please enter a valid deposit amount');
      setModalVisible(true);
      return;
    }

    if (lockStatus) {
      setModalMessage('Your account is locked. Deposits are not allowed.');
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
      const newBalance = currentBalance + depositAmount;

      await update(userRef, {
        balance: newBalance,
        transactions: [...(userData.transactions || []), {
          type: 'deposit',
          amount: depositAmount,
          timestamp: serverTimestamp(),
        }],
      });

      setModalMessage(`Successfully deposited ₱${depositAmount}`);
      setModalVisible(true);

    } catch (error) {
      console.error("Error during deposit:", error);
      setModalMessage('Something went wrong. Please try again.');
      setModalVisible(true);
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
          <Text style={styles.title}>Deposit Funds</Text>

          <Text style={styles.label}>Amount:</Text>
          <TextInput
            style={styles.input}
            value={amount}
            onChangeText={setAmount}
            keyboardType="numeric"
            placeholder="₱0.00"
            placeholderTextColor="#888"
          />

          <TouchableOpacity style={styles.button} onPress={handleDeposit}>
            <Text style={styles.buttonText}>Make Deposit</Text>
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

export default DepositScreen;

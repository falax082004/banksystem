import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, ScrollView, ImageBackground, Modal, Button } from 'react-native';
import { db, ref, get, push, set } from '../firebaseConfig';

const HomeScreen = ({ navigation, route }) => {
  const { userId } = route.params;
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);  // For controlling modal visibility
  const [selectedTransaction, setSelectedTransaction] = useState(null);  // For storing the selected transaction

  useEffect(() => {
    const fetchUserData = async () => {
      const userRef = ref(db, 'users/' + userId);
      const snapshot = await get(userRef);
      if (snapshot.exists()) {
        const userData = snapshot.val();
        setBalance(userData.balance || 0);
        const txn = userData.transactions ? Object.values(userData.transactions).reverse() : [];
        setTransactions(txn);
      } else {
        setBalance(0);
        setTransactions([]);
      }
    };
    fetchUserData();
  }, [userId]);

  const handleTransaction = async (type, amount, to = null, from = null) => {
    const timestamp = new Date().toISOString();
    const transactionData = {
      type,
      amount,
      to,
      from,
      timestamp,
    };

    const userRef = ref(db, 'users/' + userId + '/transactions');
    await push(userRef, transactionData);

    const userRefBalance = ref(db, 'users/' + userId);
    const snapshot = await get(userRefBalance);
    if (snapshot.exists()) {
      const userData = snapshot.val();
      const newBalance = type === 'deposit' ? userData.balance + amount : userData.balance - amount;
      await set(userRefBalance, {
        ...userData,
        balance: newBalance,
      });
      setBalance(newBalance);
    }

    setTransactions(prevTransactions => [transactionData, ...prevTransactions]);
  };

  // Function to open the modal and show transaction details
  const openTransactionModal = (txn) => {
    setSelectedTransaction(txn);
    setModalVisible(true);
  };

  // Function to close the modal
  const closeModal = () => {
    setModalVisible(false);
    setSelectedTransaction(null);  // Clear selected transaction when closing
  };

  return (
    <ImageBackground
      source={require('../assets/bgapp3.jpg')}
      style={styles.container}
      resizeMode="cover"
    >
      <View style={styles.contentWrapper}>
        <View style={styles.headerRow}>
          <Text style={styles.helloText}>
            Hello, <Text style={styles.bold}>{userId}</Text> 👋
          </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Profile', { userId })}>
            <Image
              source={require('../assets/profile.png')}
              style={styles.profileImage}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <Text style={styles.balanceLabel}>Available balance</Text>
          <Text style={styles.balanceValue}>₱{parseFloat(balance).toFixed(2)}</Text>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.button}
              onPress={() => navigation.navigate('Deposit', { userId })}
            >
              <Text style={styles.buttonText}>Deposit</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.button}
              onPress={() => navigation.navigate('Transfer', { userId })}
            >
              <Text style={styles.buttonText}>Transfer</Text>
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.historyTitle}>Recent Transactions</Text>
        <ScrollView style={styles.historyScroll} contentContainerStyle={{ paddingBottom: 40 }}>
          {transactions.length === 0 ? (
            <Text style={styles.noTxnText}>No transactions yet</Text>
          ) : (
            transactions.map((txn, index) => (
              <TouchableOpacity
                key={index}
                style={styles.transactionItem}
                onPress={() => openTransactionModal(txn)}  // Open modal on transaction click
              >
                <Text style={styles.txnText}>
                  {txn.type === 'deposit' && (
                    <>
                      <Text style={styles.labelText}>Deposited </Text>
                      <Text style={styles.greenValue}>₱{txn.amount}</Text>
                    </>
                  )}
                  {txn.type === 'received' && (
                    <>
                      <Text style={styles.labelText}>Received </Text>
                      <Text style={styles.greenValue}>₱{txn.amount}</Text>
                      <Text style={styles.labelText}> from </Text>
                      <Text style={styles.userText}>{txn.from}</Text>
                    </>
                  )}
                  {txn.type === 'transfer' && (
                    <>
                      <Text style={styles.labelText}>Transferred </Text>
                      <Text style={styles.redValue}>₱{txn.amount}</Text>
                      <Text style={styles.labelText}> to </Text>
                      <Text style={styles.userText}>{txn.to}</Text>
                    </>
                  )}
                </Text>
                <Text style={styles.txnTime}>
                  {new Date(txn.timestamp).toLocaleDateString(undefined, {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </Text>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      </View>

      {/* Modal to show transaction details */}
      {selectedTransaction && (
        <Modal
          transparent={true}
          animationType="slide"
          visible={modalVisible}
          onRequestClose={closeModal}  // Close the modal
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <Text style={styles.modalTitle}>Transaction Details</Text>

              {/* Align content neatly within the modal */}
              <View style={styles.modalContent}>
                <Text style={styles.modalText}>Type: <Text style={styles.modalValue}>{selectedTransaction.type}</Text></Text>
                <Text style={styles.modalText}>Amount: <Text style={styles.modalValue}>₱{selectedTransaction.amount}</Text></Text>
                {selectedTransaction.to && (
                  <Text style={styles.modalText}>To: <Text style={styles.modalValue}>{selectedTransaction.to}</Text></Text>
                )}
                {selectedTransaction.from && (
                  <Text style={styles.modalText}>From: <Text style={styles.modalValue}>{selectedTransaction.from}</Text></Text>
                )}
                <Text style={styles.modalText}>
                  Date: <Text style={styles.modalValue}>
                    {new Date(selectedTransaction.timestamp).toLocaleDateString()}
                  </Text>
                </Text>
              </View>

              {/* Custom close button with white text and black background */}
              <TouchableOpacity style={styles.modalButton} onPress={closeModal}>
                <Text style={styles.modalButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  contentWrapper: { marginTop: 60 },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  helloText: { fontSize: 24, fontWeight: '400' },
  bold: { fontWeight: 'bold' },
  profileImage: { width: 42, height: 42, resizeMode: 'contain' },
  card: {
    backgroundColor: '#1c1c1c',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  },
  balanceLabel: { color: '#fff', marginTop: 20, fontSize: 14 },
  balanceValue: {
    color: '#fff',
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    width: '100%',
    marginTop: 20,
  },
  button: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    paddingVertical: 15,
    paddingHorizontal: 30,
  },
  buttonText: { fontSize: 16, fontWeight: '600', color: '#000000' },
  historyTitle: { marginTop: 30, fontSize: 20, fontWeight: 'bold' },
  historyScroll: { marginTop: 10, maxHeight: 300 },
  noTxnText: { textAlign: 'center', color: '#888', marginTop: 20 },
  transactionItem: {
    backgroundColor: '#fff',
    padding: 15,
    marginBottom: 10,
    borderRadius: 10,
  },
  txnText: { fontSize: 14 },
  txnTime: { fontSize: 12, color: '#aaa', marginTop: 5 },
  labelText: { color: '#000', fontWeight: '600' },
  greenValue: { color: 'green' },
  redValue: { color: 'red' },
  userText: { fontWeight: '600' },

  // Modal styles
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',  // Center the modal in the middle of the screen
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    width: 300,
    alignItems: 'center',  // Content centered within the modal
  },
  modalTitle: { fontSize: 18, fontWeight: 'bold' },
  modalContent: { marginTop: 15, alignItems: 'flex-start' },  // Align content to the left
  modalText: { fontSize: 16, marginTop: 10 },
  modalValue: { fontWeight: 'bold', color: '#333' },  // Style for values like amount, to, from, and date

  // Modal button styles
  modalButton: {
    backgroundColor: 'black',   // Black background
    paddingVertical: 10,        // Vertical padding
    paddingHorizontal: 20,      // Horizontal padding
    borderRadius: 8,            // Rounded corners
    marginTop: 20,              // Space from the content above
  },

  modalButtonText: {
    color: 'white',             // White text
    fontSize: 16,               // Text size
    fontWeight: 'bold',         // Bold text
    textAlign: 'center',       // Center the text
  },
});

export default HomeScreen;

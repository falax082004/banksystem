import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  ScrollView,
  ImageBackground,
  Modal,
} from 'react-native';
import { db, ref, get, push, set } from '../firebaseConfig';

const HomeScreen = ({ navigation, route }) => {
  const { userId } = route.params;
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);

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
    const transactionData = { type, amount, to, from, timestamp };

    const userRef = ref(db, 'users/' + userId + '/transactions');
    await push(userRef, transactionData);

    const userRefBalance = ref(db, 'users/' + userId);
    const snapshot = await get(userRefBalance);
    if (snapshot.exists()) {
      const userData = snapshot.val();
      const newBalance = type === 'deposit' ? userData.balance + amount : userData.balance - amount;
      await set(userRefBalance, { ...userData, balance: newBalance });
      setBalance(newBalance);
    }

    setTransactions(prev => [transactionData, ...prev]);
  };

  const openTransactionModal = (txn) => {
    setSelectedTransaction(txn);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setSelectedTransaction(null);
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

        {/* Balance Card */}
        <View style={styles.card}>
          <Text style={styles.balanceLabel}>Available Balance</Text>
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
                onPress={() => openTransactionModal(txn)}
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

      {selectedTransaction && (
        <Modal
          transparent={true}
          animationType="slide"
          visible={modalVisible}
          onRequestClose={closeModal}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <Text style={styles.modalTitle}>Transaction Details</Text>
              <View style={styles.modalContent}>
                <Text style={styles.modalText}>Type: <Text style={styles.modalValue}>{selectedTransaction.type}</Text></Text>
                <Text style={styles.modalText}>Amount: <Text style={styles.modalValue}>₱{selectedTransaction.amount}</Text></Text>
                {selectedTransaction.to && (
                  <Text style={styles.modalText}>To: <Text style={styles.modalValue}>{selectedTransaction.to}</Text></Text>
                )}
                {selectedTransaction.from && (
                  <Text style={styles.modalText}>From: <Text style={styles.modalValue}>{selectedTransaction.from}</Text></Text>
                )}
                <Text style={styles.modalText}>Date: <Text style={styles.modalValue}>
                  {new Date(selectedTransaction.timestamp).toLocaleDateString()}
                </Text></Text>
              </View>
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
    backgroundColor: 'rgba(28, 28, 28, 0.95)',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#C4A35A',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
    marginTop: 20,
  },
  balanceLabel: {
    color: '#C4A35A',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 5,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  balanceValue: {
    color: '#FFFFFF',
    fontSize: 36,
    fontWeight: 'bold',
    fontFamily: 'serif',
    marginBottom: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  button: {
    backgroundColor: '#C4A35A',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 28,
    marginHorizontal: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  buttonText: {
    color: '#1c1c1c',
    fontWeight: 'bold',
    fontSize: 16,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },

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

  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    width: 300,
    alignItems: 'center',
  },
  modalTitle: { fontSize: 18, fontWeight: 'bold' },
  modalContent: { marginTop: 15, alignItems: 'flex-start' },
  modalText: { fontSize: 16, marginTop: 10 },
  modalValue: { fontWeight: 'bold', color: '#333' },
  modalButton: {
    backgroundColor: 'black',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 20,
  },
  modalButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default HomeScreen;

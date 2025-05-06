import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  ImageBackground,
  Modal,
  ScrollView,
} from 'react-native';
import { db, ref, get } from '../firebaseConfig';

const HomeScreen = ({ navigation, route }) => {
  const { userId } = route.params;
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [isBalanceVisible, setIsBalanceVisible] = useState(true); // State to control balance visibility

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

  const openTransactionModal = (txn) => {
    setSelectedTransaction(txn);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setSelectedTransaction(null);
  };

  const toggleBalanceVisibility = () => {
    setIsBalanceVisible(!isBalanceVisible);
  };

  return (
    <ImageBackground
      source={require('../assets/bgapp3.jpg')}
      style={styles.container}
      resizeMode="cover"
    >
      <View style={styles.contentWrapper}>
        {/* Header */}
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.welcomeText}>Hi, welcome</Text>
            <Text style={styles.username}>{userId}</Text>
          </View>
          <TouchableOpacity onPress={() => navigation.navigate('Profile', { userId })}>
            <Image source={require('../assets/apollo.png')} style={styles.profileImage} />
          </TouchableOpacity>
        </View>

        {/* Balance Card */}
        <View style={styles.balanceCard}>
          <View style={styles.balanceWrapper}>
            <View style={styles.balanceTextWrapper}>
              <Text style={styles.balanceLabel}>My Balance</Text>
              {isBalanceVisible ? (
                <Text style={styles.balanceValue}>₱{parseFloat(balance).toFixed(2)}</Text>
              ) : (
                <Text style={styles.balanceValue}>₱••••••</Text> // Hidden balance
              )}
              <Text style={styles.currency}>PHP ⌄</Text>
            </View>

            <Image
              source={require('../assets/cardicon.png')} // Make sure to use the correct path
              style={styles.pantheonImage} // Custom style for the image
            />
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => navigation.navigate('Transfer', { userId })}
            >
              <Text style={styles.actionText}>Transfer</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => navigation.navigate('Deposit', { userId })}
            >
              <Text style={styles.actionText}>Deposit</Text>
            </TouchableOpacity>
          </View>

          {/* Balance Visibility Toggle */}
          <TouchableOpacity
            style={styles.hideBalanceButton}
            onPress={toggleBalanceVisibility}
          >
            <Text style={styles.hideBalanceText}>{isBalanceVisible ? 'Hide' : 'Show'} Balance</Text>
          </TouchableOpacity>
        </View>

        {/* Transactions */}
        <Text style={styles.historyTitle}>Transactions</Text>
        <ScrollView style={styles.historyScroll} contentContainerStyle={{ paddingBottom: 80 }}>
          {transactions.length === 0 ? (
            <Text style={styles.noTxnText}>No transactions yet</Text>
          ) : (
            transactions.map((txn, index) => {
              const amountColor =
                txn.type === 'deposit' || txn.type === 'received' ? '#00c853' : '#d50000';
              const sign = txn.type === 'deposit' || txn.type === 'received' ? '+' : '-';

              return (
                <TouchableOpacity
                  key={index}
                  style={styles.transactionItem}
                  onPress={() => openTransactionModal(txn)}
                >
                  <Text style={styles.txnLabel}>
                    {txn.type === 'deposit'
                      ? 'Deposit'
                      : txn.type === 'received'
                      ? 'Received'
                      : 'Transfer'}
                  </Text>
                  <Text style={[styles.txnAmount, { color: amountColor }]}>{sign}₱{txn.amount}</Text>
                  <Text style={styles.txnDate}>
                    {new Date(txn.timestamp).toLocaleDateString()} | Completed
                  </Text>
                </TouchableOpacity>
              );
            })
          )}
        </ScrollView>
      </View>

      {/* Modal */}
      {selectedTransaction && (
        <Modal transparent={true} animationType="slide" visible={modalVisible}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <Text style={styles.modalTitle}>Transaction Details</Text>
              <Text style={styles.modalText}>Type: {selectedTransaction.type}</Text>
              <Text style={styles.modalText}>Amount: ₱{selectedTransaction.amount}</Text>
              {selectedTransaction.to && <Text style={styles.modalText}>To: {selectedTransaction.to}</Text>}
              {selectedTransaction.from && <Text style={styles.modalText}>From: {selectedTransaction.from}</Text>}
              <Text style={styles.modalText}>
                Date: {new Date(selectedTransaction.timestamp).toLocaleDateString()}
              </Text>
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
  },
  welcomeText: { fontSize: 26, color: '#1c1c1e' },
  username: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  profileImage: { width: 52, height: 52, borderRadius: 21 },

  balanceCard: {
    backgroundColor: '#1c1c1e',
    borderRadius: 20,
    padding: 24,
    marginTop: 20,
  },
  balanceWrapper: {
    flexDirection: 'row', // Align the balance text and image horizontally
    justifyContent: 'space-between', // Spread out the items
    alignItems: 'center',
  },
  balanceTextWrapper: {
    flex: 1, // Allow the text to take up available space
  },
  pantheonImage: {
    width: 100, // Set appropriate width
    height: 100, // Set appropriate height
    marginLeft: 20, // Add space between the text and the image
  },
  balanceLabel: { color: '#aaa', fontSize: 14, marginBottom: 5 },
  balanceValue: { fontSize: 46, fontWeight: 'bold', color: '#fff' },
  currency: { color: '#bbb', marginTop: 5 },

  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#2e2e2e',
    paddingVertical: 12,
    marginHorizontal: 5,
    borderRadius: 12,
    alignItems: 'center',
  },
  actionText: { color: '#fff', fontWeight: '600' },

  historyTitle: { marginTop: 30, fontSize: 18, fontWeight: 'bold', color: '#2e2e2e' },
  historyScroll: { marginTop: 10 },
  noTxnText: { textAlign: 'center', color: '#888', marginTop: 20 },
  transactionItem: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
  },
  txnLabel: { fontSize: 14, color: '#333', fontWeight: 'bold' },
  txnAmount: { fontSize: 18, fontWeight: '600' },
  txnDate: { fontSize: 12, color: '#888', marginTop: 5 },

  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContainer: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    width: 300,
    alignItems: 'center',
  },
  modalTitle: { fontSize: 18, fontWeight: 'bold' },
  modalText: { fontSize: 16, marginTop: 10 },
  modalButton: {
    backgroundColor: 'black',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 20,
  },
  modalButtonText: { color: 'white', fontWeight: 'bold' },

  hideBalanceButton: {
    marginTop: 10,
    alignItems: 'center',
    backgroundColor: '#555',
    paddingVertical: 8,
    borderRadius: 12,
  },
  hideBalanceText: {
    color: '#fff',
    fontWeight: '600',
  },
});

export default HomeScreen;

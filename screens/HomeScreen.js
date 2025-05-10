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
  FlatList,
} from 'react-native';
import { db, ref, get } from '../firebaseConfig';
import { useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Feather';
import MaterialIcons from 'react-native-vector-icons/MaterialCommunityIcons';

const HomeScreen = ({ navigation, route }) => {
  const { userId } = route.params;
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [userName, setUserName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expirationDate, setExpirationDate] = useState('');
  const [showCard, setShowCard] = useState(false);
  const [isBalanceVisible, setIsBalanceVisible] = useState(true);

  const recentAvatars = [
    require('../assets/apollo.png'),
    require('../assets/apollo.png'),
    require('../assets/apollo.png'),
    require('../assets/apollo.png'),
    require('../assets/apollo.png'),
  ];

  // Fetch user and card data
  const fetchUserData = async () => {
    const userRef = ref(db, 'users/' + userId);
    const snapshot = await get(userRef);
    if (snapshot.exists()) {
      const userData = snapshot.val();
      setBalance(userData.balance || 0);
      setUserName(userData.name || userId);
      const txn = userData.transactions ? Object.values(userData.transactions).reverse() : [];
      setTransactions(txn);
      if (userData.card) {
        setCardNumber(userData.card.cardNumber || '');
        setExpirationDate(userData.card.expirationDate || '');
      }
    } else {
      setBalance(0);
      setTransactions([]);
      setUserName(userId);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchUserData();
    }, [userId])
  );

  const openTransactionModal = (txn) => {
    setSelectedTransaction(txn);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setSelectedTransaction(null);
  };

  // Card JSX (Pantheon card, with balance and label above balance, styled as in reference)
  const renderCard = () => (
    <View style={styles.customCard}>
      <View style={styles.cardTopRow}>
        <Image source={require('../assets/cardicon.png')} style={styles.enlargedCardIcon} />
      </View>
      <View style={styles.circleRed} />
      <View style={styles.circleOrange} />
      <View style={styles.cardBalanceLabelRow}>
        <Text style={styles.balanceLabel}>My Balance</Text>
        <TouchableOpacity onPress={() => setIsBalanceVisible(v => !v)}>
          <Icon name={isBalanceVisible ? 'eye' : 'eye-off'} size={15} color="#fff" style={{ marginLeft: 10 }} />
        </TouchableOpacity>
      </View>
      <View style={styles.cardBalanceRow}>
        <Text style={styles.cardCurrency}>₱</Text>
        <Text style={styles.cardBalance}>
          {isBalanceVisible ? parseFloat(balance).toLocaleString() : '••••••'}
        </Text>
      </View>
    </View>
  );

  return (
    <ImageBackground source={require('../assets/bgapp3.jpg')} style={styles.background}>
      <View style={styles.overlay} />
      <View style={styles.jpContainer}>
        {/* Header */}
        <View style={styles.jpHeaderRow}>
          <Text style={styles.jpDate}>{new Date().toISOString().slice(0, 10).replace(/-/g, '.')}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Icon name="bell" size={22} color="#222" style={{ marginRight: 16 }} />
            <Icon name="user" size={22} color="#222" />
          </View>
        </View>
        <Text style={styles.jpWelcome}>Hi, {userName || 'User'}!</Text>


        {/* Card */}
        <View style={{ alignItems: 'center', marginTop: 2 }}>
          {renderCard()}
        </View>

        {/* Main Actions */}
        <View style={styles.jpActionsRow}>
          <TouchableOpacity style={styles.jpActionBtn} onPress={() => navigation.navigate('Transfer', { userId })}>
            <Icon name="arrow-up" size={28} color="#FFF" />
            <Text style={styles.jpActionLabel}>Transfer</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.jpActionBtn} onPress={() => navigation.navigate('Deposit', { userId })}>
            <Icon name="arrow-down" size={28} color="#FFF" />
            <Text style={styles.jpActionLabel}>Deposit</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.jpActionBtn} onPress={() => navigation.navigate('PayBills', { userId })}>
            <MaterialIcons name="file-document-outline" size={28} color="#FFF" />
            <Text style={styles.jpActionLabel}>Pay Bills</Text>
          </TouchableOpacity>
        </View>

        {/* Transactions */}
        <Text style={styles.jpTxnTitle}>Recent Transactions</Text>
        <View style={styles.jpTxnList}>
          {transactions.length === 0 ? (
            <Text style={styles.noTxnText}>No transactions yet</Text>
          ) : (
            transactions.slice(0, 5).map((txn, index) => (
              <View key={index} style={styles.jpTxnItem}>
                <Text style={styles.jpTxnLabel}>{txn.label || txn.type || 'Transaction'}</Text>
                <Text style={[styles.jpTxnAmount, { color: txn.type === 'deposit' || txn.type === 'received' ? '#00c853' : '#d50000' }]}>₱{txn.amount}</Text>
              </View>
            ))
          )}
        </View>
        {/* Transaction Modal (unchanged) */}
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
      </View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  background: {
    flex: 1,
    resizeMode: 'cover',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.55)',
    zIndex: 1,
  },
  jpContainer: { flex: 1, padding: 20, zIndex: 2 },
  jpHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  jpDate: { fontSize: 14, color: '#fff' },
  jpWelcome: { fontSize: 26, color: '#fff', marginTop: 10 },
  jpHomeTitle: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
  jpActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  jpActionBtn: {
    flex: 1,
    backgroundColor: 'rgba(34,34,34,0.96)',
    paddingVertical: 12,
    marginHorizontal: 5,
    borderRadius: 12,
    alignItems: 'center',
  },
  jpActionLabel: { color: '#fff', fontWeight: '600' },
  jpTxnTitle: { marginTop: 30, fontSize: 18, fontWeight: 'bold', color: '#fff' },
  jpTxnList: { marginTop: 10 },
  noTxnText: { textAlign: 'center', color: '#888', marginTop: 20 },
  jpTxnItem: {
    backgroundColor: 'rgba(34,34,34,0.96)',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
  },
  jpTxnLabel: { fontSize: 14, color: '#fff', fontWeight: 'bold' },
  jpTxnAmount: { fontSize: 18, fontWeight: '600' },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  modalContainer: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    width: 300,
    alignItems: 'center',
  },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#111' },
  modalText: { fontSize: 16, marginTop: 10, color: '#111' },
  modalButton: {
    backgroundColor: '#111',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 20,
  },
  modalButtonText: { color: '#fff', fontWeight: 'bold' },
  customCard: {
    width: '100%',
    maxWidth: 360,
    height: 210,
    backgroundColor: 'rgba(17,17,17,0.96)',
    borderRadius: 16,
    padding: 20,
    overflow: 'hidden',
    justifyContent: 'space-between',
    marginTop: 10,
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 10,
    elevation: 10,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  enlargedCardIcon: {
    width: 100,
    height: 75,
    resizeMode: 'contain',
  },
  circleRed: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#222',
    position: 'absolute',
    top: -30,
    right: -30,
    opacity: 0.5,
    zIndex: -1,
  },
  circleOrange: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#333',
    position: 'absolute',
    bottom: -20,
    left: -20,
    opacity: 0.5,
    zIndex: -1,
  },
  cardBalanceLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'absolute',
    left: 12,
    bottom: 58,
    zIndex: 2,
    backgroundColor: 'rgba(17,17,17,0.95)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  balanceLabel: {
    fontSize: 12,
    color: '#fff',
    fontWeight: 'normal',
  },
  cardBalanceRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    position: 'absolute',
    left: 24,
    bottom: 24,
    zIndex: 2,
  },
  cardCurrency: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
    marginRight: 4,
  },
  cardBalance: {
    color: '#fff',
    fontSize: 32,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
});

export default HomeScreen;

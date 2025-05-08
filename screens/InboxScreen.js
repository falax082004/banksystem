import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  ImageBackground,
  Modal,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { db, ref, get } from '../firebaseConfig';
import Ionicons from 'react-native-vector-icons/Ionicons';

const InboxScreen = ({ route }) => {
  const { userId } = route.params;
  const navigation = useNavigation();
  const [transactions, setTransactions] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [activeTab, setActiveTab] = useState('All');

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const snapshot = await get(ref(db, `users/${userId}/transactions`));
        if (snapshot.exists()) {
          const transactionsData = snapshot.val();
          const recentTransactions = Object.values(transactionsData).reverse();
          setTransactions(recentTransactions);
        }
      } catch (error) {
        console.error('Failed to fetch transactions:', error);
      }
    };

    fetchTransactions();
  }, [userId]);

  const filteredTransactions = transactions.filter(transaction => {
    console.log('Transaction type:', transaction.type); // Debug log
    if (activeTab === 'All') return true;
    if (activeTab === 'Transactions') {
      return transaction.type === 'deposit' || transaction.type === 'transfer' || 
             transaction.type === 'Deposit' || transaction.type === 'Transfer';
    }
    if (activeTab === 'Others') {
      return transaction.type === 'donation' || transaction.type === 'investment' || 
             transaction.type === 'Donation' || transaction.type === 'Investment';
    }
    return false;
  });

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.item}
      onPress={() => {
        setSelectedTransaction(item);
        setModalVisible(true);
      }}
    >
      <Ionicons name="mail-outline" size={30} color="#fff" style={styles.icon} />
      <View style={styles.itemText}>
        <Text style={styles.itemTitle}>{item.type} Notification</Text>
        <Text style={styles.itemSubtitle}>
          You have {item.type === 'Received' ? 'received' : 'sent'} ₱{item.amount}
        </Text>
      </View>
      <Text style={styles.timeText}>{getRelativeTime(item.timestamp)}</Text>
    </TouchableOpacity>
  );

  const closeModal = () => setModalVisible(false);

  return (
    <ImageBackground source={require('../assets/bgapp3.jpg')} style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.header}>
        <Text style={styles.headerText}>Inbox</Text>
        <View style={styles.tabContainer}>
          <TouchableOpacity onPress={() => setActiveTab('All')}>
            <Text style={[styles.tabText, activeTab === 'All' && styles.tabActive]}>All</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setActiveTab('Transactions')}>
            <Text style={[styles.tabText, activeTab === 'Transactions' && styles.tabActive]}>Transactions</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setActiveTab('Others')}>
            <Text style={[styles.tabText, activeTab === 'Others' && styles.tabActive]}>Others</Text>
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={filteredTransactions}
        keyExtractor={(item, index) => index.toString()}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={styles.emptyText}>No recent transactions</Text>}
      />

      <Modal
        visible={modalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={closeModal}
      >
        <TouchableWithoutFeedback onPress={closeModal}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              {selectedTransaction && (
                <>
                  <Text style={styles.modalTitle}>Transaction Details</Text>
                  <Text style={styles.modalText}>Type: {selectedTransaction.type}</Text>
                  <Text style={styles.modalText}>Amount: ₱{selectedTransaction.amount}</Text>
                  {selectedTransaction.type === 'Transfer' && (
                    <Text style={styles.modalText}>To: {selectedTransaction.to}</Text>
                  )}
                  {selectedTransaction.type === 'Received' && (
                    <Text style={styles.modalText}>From: {selectedTransaction.from}</Text>
                  )}
                  <Text style={styles.modalText}>Date: {new Date(selectedTransaction.timestamp).toLocaleString()}</Text>
                  <TouchableOpacity onPress={closeModal} style={styles.closeButton}>
                    <Text style={styles.closeButtonText}>Close</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </ImageBackground>
  );
};

const getRelativeTime = (timestamp) => {
  const now = Date.now();
  const diff = now - new Date(timestamp).getTime();
  const minutes = Math.floor(diff / (1000 * 60));
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days !== 1 ? 's' : ''} ago`;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    resizeMode: 'cover',
  },
  header: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingTop: 60,
    paddingBottom: 25,
    paddingHorizontal: 20,
  },
  headerText: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  tabContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  tabText: {
    color: '#aaa',
    fontSize: 18,
  },
  tabActive: {
    color: '#fff',
    fontWeight: 'bold',
    textDecorationLine: 'underline',
  },
  list: {
    padding: 20,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111',
    padding: 20,
    borderRadius: 12,
    marginBottom: 15,
  },
  icon: {
    marginRight: 15,
  },
  itemText: {
    flex: 1,
  },
  itemTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  itemSubtitle: {
    color: '#aaa',
    fontSize: 16,
  },
  timeText: {
    color: '#aaa',
    fontSize: 14,
  },
  emptyText: {
    color: '#888',
    textAlign: 'center',
    marginTop: 50,
    fontSize: 18,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  modalContent: {
    backgroundColor: '#fff',
    padding: 30,
    borderRadius: 12,
    width: '85%',
    maxWidth: 450,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  modalText: {
    fontSize: 18,
    marginBottom: 12,
  },
  closeButton: {
    marginTop: 25,
    backgroundColor: '#1c1c1e',
    paddingVertical: 15,
    paddingHorizontal: 25,
    borderRadius: 8,
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 18,
  },
});

export default InboxScreen; 
import React, { useEffect, useState, useCallback } from 'react';
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
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { db, ref, get, update } from '../firebaseConfig';
import Ionicons from 'react-native-vector-icons/Ionicons';

const InboxScreen = ({ route }) => {
  const { userId } = route.params;
  const navigation = useNavigation();
  const [transactions, setTransactions] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [activeTab, setActiveTab] = useState('All');

  const fetchTransactions = useCallback(async () => {
    try {
      const [globalSnapshot, userSnapshot] = await Promise.all([
        get(ref(db, 'transactions')),
        get(ref(db, `users/${userId}/transactions`)),
      ]);

      let allTransactions = [];

      if (globalSnapshot.exists()) {
        const globalTransactions = Object.values(globalSnapshot.val()).filter(
          transaction => transaction.userId === userId
        );
        allTransactions = [...allTransactions, ...globalTransactions];
      }

      if (userSnapshot.exists()) {
        const userTransactions = userSnapshot.val();
        if (Array.isArray(userTransactions)) {
          allTransactions = [...allTransactions, ...userTransactions];
        }
      }

      allTransactions.sort((a, b) => {
        const timeA = new Date(a.timestamp || a.date).getTime();
        const timeB = new Date(b.timestamp || b.date).getTime();
        return timeB - timeA;
      });

      setTransactions(allTransactions);
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
    }
  }, [userId]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const filteredTransactions = transactions.filter(transaction => {
    if (activeTab === 'All') return true;
    if (activeTab === 'Transactions') {
      return ['deposit', 'transfer'].includes(transaction.type?.toLowerCase());
    }
    if (activeTab === 'Others') {
      return ['donation', 'investment'].includes(transaction.type?.toLowerCase());
    }
    return false;
  });

  const getNotificationIcon = type => {
    switch (type.toLowerCase()) {
      case 'deposit':
        return 'add-circle-outline';
      case 'transfer':
        return 'swap-horizontal-outline';
      case 'investment':
        return 'trending-up-outline';
      case 'donation':
        return 'heart-outline';
      default:
        return 'mail-outline';
    }
  };

  const getNotificationColor = type => {
    switch (type.toLowerCase()) {
      case 'deposit':
        return '#4CAF50';
      case 'transfer':
        return '#2196F3';
      case 'investment':
        return '#FF9800';
      case 'donation':
        return '#E91E63';
      default:
        return '#fff';
    }
  };

  const getNotificationMessage = item => {
    switch (item.type.toLowerCase()) {
      case 'deposit':
        return `You have deposited ₱${item.amount}`;
      case 'transfer':
        return `You have transferred ₱${item.amount} to ${item.to || 'recipient'}`;
      case 'investment':
        return `You have invested ₱${item.amount} in ${item.investmentType || 'investment'}`;
      case 'donation':
        return `You have donated ₱${item.amount}`;
      default:
        return `Transaction of ₱${item.amount}`;
    }
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.item,
        { borderLeftWidth: 4, borderLeftColor: getNotificationColor(item.type) },
      ]}
      onPress={() => {
        setSelectedTransaction(item);
        setModalVisible(true);
        if (!item.read) {
          const transactionRef = ref(db, `transactions/${item.id}`);
          update(transactionRef, { read: true });
          setTransactions(prev =>
            prev.map(t => (t.id === item.id ? { ...t, read: true } : t))
          );
        }
      }}
    >
      <View style={[styles.iconContainer, { backgroundColor: getNotificationColor(item.type) }]}>
        <Ionicons name={getNotificationIcon(item.type)} size={24} color="#fff" />
      </View>
      <View style={styles.itemText}>
        <Text style={styles.itemTitle}>{item.type} Notification</Text>
        <Text style={styles.itemSubtitle}>{getNotificationMessage(item)}</Text>
      </View>
      <View style={styles.rightContainer}>
        <Text style={styles.timeText}>{getRelativeTime(item.timestamp || item.date)}</Text>
        {!item.read && <View style={styles.unreadDot} />}
      </View>
    </TouchableOpacity>
  );

  const closeModal = () => setModalVisible(false);

  return (
    <ImageBackground source={require('../assets/bgapp3.jpg')} style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <Text style={styles.headerText}>Inbox</Text>
          <TouchableOpacity onPress={fetchTransactions}>
            <Ionicons name="refresh" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
        <View style={styles.tabContainer}>
          {['All', 'Transactions', 'Others'].map(tab => (
            <TouchableOpacity key={tab} onPress={() => setActiveTab(tab)}>
              <Text style={[styles.tabText, activeTab === tab && styles.tabActive]}>{tab}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <FlatList
        data={filteredTransactions}
        keyExtractor={(item, index) => index.toString()}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={styles.emptyText}>No recent transactions</Text>}
      />

      <Modal visible={modalVisible} animationType="fade" transparent onRequestClose={closeModal}>
        <TouchableWithoutFeedback onPress={closeModal}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              {selectedTransaction && (
                <>
                  <View
                    style={[
                      styles.modalHeader,
                      { backgroundColor: getNotificationColor(selectedTransaction.type) },
                    ]}
                  >
                    <Ionicons
                      name={getNotificationIcon(selectedTransaction.type)}
                      size={32}
                      color="#fff"
                    />
                    <Text style={styles.modalTitle}>{selectedTransaction.type} Details</Text>
                  </View>
                  <View style={styles.modalBody}>
                    <Text style={styles.modalText}>Amount: ₱{selectedTransaction.amount}</Text>
                    {selectedTransaction.type === 'Transfer' && (
                      <Text style={styles.modalText}>To: {selectedTransaction.to}</Text>
                    )}
                    {selectedTransaction.type === 'Investment' && (
                      <Text style={styles.modalText}>
                        Investment Type: {selectedTransaction.investmentType}
                      </Text>
                    )}
                    <Text style={styles.modalText}>
                      Date:{' '}
                      {new Date(
                        selectedTransaction.timestamp || selectedTransaction.date
                      ).toLocaleString()}
                    </Text>
                    <TouchableOpacity onPress={closeModal} style={styles.closeButton}>
                      <Text style={styles.closeButtonText}>Close</Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </ImageBackground>
  );
};

const getRelativeTime = timestamp => {
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
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerText: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
  },
  tabContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 10,
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
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
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
  rightContainer: {
    alignItems: 'flex-end',
  },
  timeText: {
    color: '#aaa',
    fontSize: 14,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E91E63',
    marginTop: 4,
  },
  emptyText: {
    color: '#aaa',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 50,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#222',
    width: '85%',
    borderRadius: 15,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },
  modalTitle: {
    color: '#fff',
    fontSize: 20,
    marginLeft: 15,
  },
  modalBody: {
    padding: 20,
  },
  modalText: {
    color: '#fff',
    fontSize: 16,
    marginBottom: 10,
  },
  closeButton: {
    backgroundColor: '#444',
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 20,
  },
  closeButtonText: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 16,
  },
});

export default InboxScreen;

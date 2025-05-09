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
  Image,
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
      return ['donation', 'investment', 'bill'].includes(transaction.type?.toLowerCase());
    }
    return false;
  });

  const getNotificationIcon = type => {
    switch (type.toLowerCase()) {
      case 'deposit':
        return 'add-circle';
      case 'transfer':
        return 'swap-horizontal';
      case 'investment':
        return 'trending-up';
      case 'donation':
        return 'heart';
      case 'bill':
        return 'file-tray-full';
      default:
        return 'mail';
    }
  };

  const getNotificationColor = type => '#222';

  const getNotificationMessage = item => {
    switch (item.type.toLowerCase()) {
      case 'deposit':
        return `You have deposited ₱${Math.abs(item.amount)}`;
      case 'transfer':
        return `You have transferred ₱${Math.abs(item.amount)} to ${item.to || 'recipient'}`;
      case 'investment':
        return `You have invested ₱${Math.abs(item.amount)} in ${item.investmentType || 'investment'}`;
      case 'donation':
        return `You have donated ₱${Math.abs(item.amount)}`;
      case 'bill':
        return `You have paid a bill of ₱${Math.abs(item.amount)}`;
      default:
        return `Transaction of ₱${Math.abs(item.amount)}`;
    }
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.item,
        { borderLeftWidth: 4, borderLeftColor: '#888' },
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
      <View style={[styles.iconContainer, { backgroundColor: '#f4f4f4' }]}>
        <Ionicons name={getNotificationIcon(item.type)} size={28} color="#222" />
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
      <View style={styles.overlay} />
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
            <View
              key={tab}
              style={[
                styles.tabWrap,
                activeTab === tab && styles.tabActiveWrap
              ]}
            >
              <TouchableOpacity onPress={() => setActiveTab(tab)}>
                <Text style={[styles.tabText, activeTab === tab && styles.tabActive]}>{tab}</Text>
              </TouchableOpacity>
            </View>
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
            {selectedTransaction && (
              <View style={styles.receiptCardBW}>
                {/* Top circle with initial */}
                <View style={styles.receiptCircleBW}>
                  <Text style={styles.receiptCircleTextBW}>
                    {selectedTransaction.type ? selectedTransaction.type[0].toUpperCase() : '?'}
                  </Text>
                </View>
                <Text style={styles.receiptBillerBW}>{selectedTransaction.type} Notification</Text>
                <Text style={styles.receiptReceivedBW}>Transaction Details</Text>
                <Text style={styles.receiptAmountLabelBW}>the amount of</Text>
                <Text style={styles.receiptAmountBW}>₱{Math.abs(selectedTransaction.amount)}</Text>
                <Text style={styles.receiptViaBW}>Pantheon Bank</Text>
                <View style={styles.receiptDividerBW} />
                <Text style={styles.receiptRefBW}>Date: {new Date(selectedTransaction.timestamp || selectedTransaction.date).toLocaleString()}</Text>
                <View style={styles.receiptDividerBW} />
                <Text style={styles.receiptDetailsTitleBW}>Details</Text>
                <View style={styles.receiptDetailsRowBW}><Text style={styles.receiptDetailsLabelBW}>Type</Text><Text style={styles.receiptDetailsValueBW}>{selectedTransaction.type}</Text></View>
                <View style={styles.receiptDetailsRowBW}><Text style={styles.receiptDetailsLabelBW}>Amount</Text><Text style={styles.receiptDetailsValueBW}>₱{Math.abs(selectedTransaction.amount)}</Text></View>
                {selectedTransaction.to && (
                  <View style={styles.receiptDetailsRowBW}><Text style={styles.receiptDetailsLabelBW}>To</Text><Text style={styles.receiptDetailsValueBW}>{selectedTransaction.to}</Text></View>
                )}
                {selectedTransaction.from && (
                  <View style={styles.receiptDetailsRowBW}><Text style={styles.receiptDetailsLabelBW}>From</Text><Text style={styles.receiptDetailsValueBW}>{selectedTransaction.from}</Text></View>
                )}
                {selectedTransaction.investmentType && (
                  <View style={styles.receiptDetailsRowBW}><Text style={styles.receiptDetailsLabelBW}>Investment Type</Text><Text style={styles.receiptDetailsValueBW}>{selectedTransaction.investmentType}</Text></View>
                )}
                <Text style={styles.receiptProcessedBW}>This transaction has been processed and will reflect shortly.</Text>
                <Image
                  source={require('../assets/pantheon.png')}
                  style={{ width: 90, height: 30, marginVertical: 10 }}
                  resizeMode="contain"
                />
                <TouchableOpacity style={styles.receiptDoneBtnBW} onPress={closeModal}>
                  <Text style={styles.receiptDoneTextBW}>DONE</Text>
                </TouchableOpacity>
              </View>
            )}
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
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  header: {
    backgroundColor: '#111',
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
  tabWrap: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
    marginHorizontal: 4,
  },
  tabActiveWrap: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 3,
    elevation: 2,
  },
  tabText: {
    color: '#888',
    fontSize: 18,
  },
  tabActive: {
    color: '#111',
    fontWeight: 'bold',
    textDecorationLine: 'none',
  },
  list: {
    padding: 20,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    marginBottom: 15,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 2,
  },
  itemText: {
    flex: 1,
  },
  itemTitle: {
    color: '#111',
    fontSize: 18,
    fontWeight: '600',
  },
  itemSubtitle: {
    color: '#555',
    fontSize: 16,
  },
  rightContainer: {
    alignItems: 'flex-end',
  },
  timeText: {
    color: '#888',
    fontSize: 14,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#111',
    marginTop: 4,
  },
  emptyText: {
    color: '#888',
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

export default InboxScreen;

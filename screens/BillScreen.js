import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ImageBackground,
  Modal,
  Pressable,
  ScrollView,
  Image,
  FlatList,
} from 'react-native';
import { db, ref, get, update } from '../firebaseConfig';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const BillScreen = ({ navigation, route }) => {
  const [amount, setAmount] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [selectedBiller, setSelectedBiller] = useState(null);
  const { userId } = route.params;

  const billerCategories = [
    {
      id: 'utilities',
      name: 'Utilities',
      icon: 'flash',
      billers: [
        { id: 'meralco', name: 'Meralco', icon: 'flash' },
        { id: 'maynilad', name: 'Maynilad', icon: 'water' },
        { id: 'manila_water', name: 'Manila Water', icon: 'water' },
      ],
    },
    {
      id: 'telecom',
      name: 'Telecommunications',
      icon: 'phone',
      billers: [
        { id: 'smart', name: 'Smart', icon: 'cellphone' },
        { id: 'globe', name: 'Globe', icon: 'cellphone' },
        { id: 'sun', name: 'Sun', icon: 'cellphone' },
      ],
    },
    {
      id: 'government',
      name: 'Government',
      icon: 'bank',
      billers: [
        { id: 'bir', name: 'BIR', icon: 'file-document' },
        { id: 'sss', name: 'SSS', icon: 'card-account-details' },
        { id: 'pagibig', name: 'Pag-IBIG', icon: 'home' },
      ],
    },
    {
      id: 'education',
      name: 'Education',
      icon: 'school',
      billers: [
        { id: 'deped', name: 'DepEd', icon: 'school' },
        { id: 'ched', name: 'CHED', icon: 'school' },
        { id: 'tesda', name: 'TESDA', icon: 'school' },
      ],
    },
  ];

  const handleBill = async () => {
    const billAmount = parseFloat(amount);

    if (isNaN(billAmount) || billAmount <= 0) {
      setModalMessage('Please enter a valid bill amount');
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
      const newBalance = currentBalance - billAmount;

      if (billAmount > currentBalance) {
        setModalMessage('Insufficient balance to pay bill');
        setModalVisible(true);
        return;
      }

      await update(userRef, {
        balance: newBalance,
        transactions: [...(userData.transactions || []), {
          type: 'bill',
          amount: billAmount,
          biller: selectedBiller.name,
          timestamp: new Date().toISOString(),
        }],
      });

      setModalMessage(`Successfully paid ${selectedBiller.name} bill of ₱${billAmount}`);
      setModalVisible(true);

    } catch (error) {
      console.error("Error during bill payment:", error);
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

  const renderBillerItem = ({ item }) => (
    <TouchableOpacity
      style={styles.billerItem}
      onPress={() => setSelectedBiller(item)}
    >
      <View style={styles.billerIconContainer}>
        <Icon name={item.icon} size={32} color="#222" />
      </View>
      <Text style={styles.billerName}>{item.name}</Text>
    </TouchableOpacity>
  );

  const renderCategory = ({ item }) => (
    <View style={styles.categoryContainer}>
      <View style={styles.categoryHeader}>
        <Icon name={item.icon} size={28} color="#222" />
        <Text style={styles.categoryTitle}>{item.name}</Text>
      </View>
      <View style={styles.billerGrid}>
        {item.billers.map((biller) => (
          <TouchableOpacity
            key={biller.id}
            style={styles.billerItem}
            onPress={() => setSelectedBiller(biller)}
          >
            <View style={styles.billerIconContainer}>
              <Icon name={biller.icon} size={32} color="#222" />
            </View>
            <Text style={styles.billerName}>{biller.name}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  // Helper to generate a random reference number
  const generateRefNo = () => {
    return (
      Math.floor(1000 + Math.random() * 9000) + ' ' +
      Math.floor(1000 + Math.random() * 9000) + ' ' +
      Math.floor(1000 + Math.random() * 9000)
    );
  };

  // Add these to state
  const [refNo] = useState(generateRefNo());
  const [paidAt] = useState(new Date());

  const mockDetails = {
    fee: 7.00,
    accountNumber: '••••••1234',
    email: 'user@email.com',
    phone: '+63••••••7890',
    service: selectedBiller ? selectedBiller.name + ' Service' : '',
  };

  return (
    <ImageBackground source={require('../assets/bgapp3.jpg')} style={styles.background}>
      <View style={styles.container}>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="close" size={24} color="#fff" />
        </TouchableOpacity>

        {!selectedBiller ? (
          <View style={styles.categoriesContainer}>
            <Text style={styles.title}>Pay Bills</Text>
            <FlatList
              data={billerCategories}
              renderItem={renderCategory}
              keyExtractor={(category) => category.id}
              showsVerticalScrollIndicator={false}
            />
          </View>
        ) : (
          <View style={styles.card}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => setSelectedBiller(null)}
            >
              <Icon name="arrow-left" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.title}>{selectedBiller.name}</Text>
            <Text style={styles.label}>Amount:</Text>
            <TextInput
              style={styles.input}
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric"
              placeholder="₱0.00"
              placeholderTextColor="#888"
            />
            <TouchableOpacity style={styles.button} onPress={handleBill}>
              <Text style={styles.buttonText}>Pay Bill</Text>
            </TouchableOpacity>
          </View>
        )}

        <Modal
          transparent={true}
          visible={modalVisible}
          animationType="fade"
          onRequestClose={closeModal}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.receiptCardBW}>
              {/* Top circle with initial */}
              <View style={styles.receiptCircleBW}>
                <Text style={styles.receiptCircleTextBW}>
                  {selectedBiller ? selectedBiller.name[0] : '?'}
                </Text>
              </View>
              <Text style={styles.receiptBillerBW}>{selectedBiller ? selectedBiller.name : ''}</Text>
              <Text style={styles.receiptReceivedBW}>Payment received for</Text>
              <Text style={styles.receiptAmountLabelBW}>the amount of</Text>
              <Text style={styles.receiptAmountBW}>₱{amount}</Text>
              <Text style={styles.receiptViaBW}>Pantheon Bank</Text>
              <View style={styles.receiptDividerBW} />
              <Text style={styles.receiptRefBW}>Ref. No. {refNo}</Text>
              <Text style={styles.receiptDateBW}>{paidAt.toLocaleString()}</Text>
              <View style={styles.receiptDividerBW} />
              <Text style={styles.receiptDetailsTitleBW}>Details</Text>
              <View style={styles.receiptDetailsRowBW}><Text style={styles.receiptDetailsLabelBW}>Amount Paid</Text><Text style={styles.receiptDetailsValueBW}>₱{(parseFloat(amount) - mockDetails.fee).toFixed(2)}</Text></View>
              <View style={styles.receiptDetailsRowBW}><Text style={styles.receiptDetailsLabelBW}>Fee</Text><Text style={styles.receiptDetailsValueBW}>₱{mockDetails.fee.toFixed(2)}</Text></View>
              <View style={styles.receiptDetailsRowBW}><Text style={styles.receiptDetailsLabelBW}>Account Number</Text><Text style={styles.receiptDetailsValueBW}>{mockDetails.accountNumber}</Text></View>
              <View style={styles.receiptDetailsRowBW}><Text style={styles.receiptDetailsLabelBW}>Email</Text><Text style={styles.receiptDetailsValueBW}>{mockDetails.email}</Text></View>
              <View style={styles.receiptDetailsRowBW}><Text style={styles.receiptDetailsLabelBW}>Phone Number</Text><Text style={styles.receiptDetailsValueBW}>{mockDetails.phone}</Text></View>
              <View style={styles.receiptDetailsRowBW}><Text style={styles.receiptDetailsLabelBW}>Service</Text><Text style={styles.receiptDetailsValueBW}>{mockDetails.service}</Text></View>
              <Text style={styles.receiptProcessedBW}>This has been processed and your payment will be posted within 1-2 hours.</Text>
              <TouchableOpacity style={styles.receiptDoneBtnBW} onPress={closeModal}>
                <Text style={styles.receiptDoneTextBW}>DONE</Text>
              </TouchableOpacity>
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
  },
  container: {
    flex: 1,
    padding: 20,
  },
  categoriesContainer: {
    flex: 1,
    paddingTop: 10,
  },
  card: {
    backgroundColor: '#111',
    borderRadius: 16,
    padding: 30,
    width: '100%',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 25,
    paddingHorizontal: 10,
  },
  categoryContainer: {
    marginBottom: 25,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    paddingHorizontal: 10,
  },
  categoryTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#222',
    marginLeft: 12,
  },
  billerGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 5,
  },
  billerItem: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 15,
    width: '48%',
    aspectRatio: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  billerIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#f4f4f4',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  billerName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#222',
    textAlign: 'center',
  },
  backButton: {
    position: 'absolute',
    left: 20,
    top: 20,
    zIndex: 1,
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
});

export default BillScreen; 
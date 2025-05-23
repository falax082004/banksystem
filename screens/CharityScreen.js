import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, TextInput, ScrollView, SafeAreaView, Alert, ImageBackground } from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { db, push, ref, serverTimestamp, get, update } from '../firebaseConfig';

const donationOptions = [
  {
    category: 'FOOD',
    title: 'Help disaster victims meet their food needs',
    description: 'Lake Moraine is a glacial lake in Banff National Park, 14 kilometers outside.',
    image: 'http://sdwordsandpictures.com/wp-content/uploads/2020/07/IMG_7601-1024x684.jpg',
    raised: 98000,
    target: 140000,
    donors: 1200,
    hoursLeft: 8,
  },
  {
    category: 'EDUCATION',
    title: 'Support children to get quality education',
    description: 'Help provide books and tuition for underprivileged children.',
    image: 'https://files01.pna.gov.ph/ograph/2023/07/07/tacloban---book-donation.jpg',
    raised: 45000,
    target: 100000,
    donors: 800,
    hoursLeft: 12,
  },
  {
    category: 'HUMANITY',
    title: 'Aid refugees with basic necessities',
    description: 'Your donation helps provide shelter and healthcare for refugees.',
    image: 'https://compote.slate.com/images/40e24264-228f-429c-9b0a-d321b5417bfc.jpg?crop=590%2C421%2Cx0%2Cy0&width=480',
    raised: 67000,
    target: 120000,
    donors: 950,
    hoursLeft: 20,
  },
];

const categories = ['All', 'EDUCATION', 'FOOD', 'HUMANITY'];

export default function DonationScreen({ route }) {
  const { userId } = route.params;
  const [screen, setScreen] = useState('home');
  const [amount, setAmount] = useState(100);
  const [manual, setManual] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Filter donation options based on selected category
  const filteredOptions = selectedCategory === 'All'
    ? donationOptions
    : donationOptions.filter(opt => opt.category === selectedCategory);

  // Always use a safe index
  const safeIndex = Math.min(selectedIndex, filteredOptions.length - 1);
  const donationData = filteredOptions[safeIndex] || filteredOptions[0];
  const percent = Math.round((donationData.raised / donationData.target) * 100);

  // Fix: Reset selectedIndex to 0 when category changes and ensure filteredOptions is not empty
  useEffect(() => {
    setSelectedIndex(0);
  }, [selectedCategory]);

  const handleDonate = async () => {
    if (!userId) {
      Alert.alert('Error', 'User not identified.');
      return;
    }

    try {
      const userRef = ref(db, 'users/' + userId);
      const snapshot = await get(userRef);
      
      if (!snapshot.exists()) {
        Alert.alert('Error', 'User not found.');
        return;
      }

      const userData = snapshot.val();
      const currentBalance = userData.balance || 0;

      if (amount > currentBalance) {
        Alert.alert('Error', 'Insufficient balance.');
        return;
      }

      const timestamp = new Date().toISOString();
      const donationRecord = {
        userId,
        category: donationData.category,
        title: donationData.title,
        amount: amount,
        timestamp: timestamp,
      };

      // Update user balance and transactions
      await update(userRef, {
        balance: currentBalance - amount,
        transactions: [...(userData.transactions || []), {
          type: 'donation',
          ...donationRecord
        }]
      });

      // Add donation record
      await push(ref(db, 'donations/'), donationRecord);

      Alert.alert('Salamat!', `Your donation of ₱${amount} was successful!`);
      setScreen('home');
      setAmount(100);
      setManual('');
    } catch (error) {
      Alert.alert('Error', 'Donation failed. Please try again.');
    }
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity onPress={() => {
        if (screen === 'details') {
          setScreen('home');
        } else if (screen === 'donate') {
          setScreen('details');
        }
      }}>
        <Ionicons name={screen === 'home' ? "menu" : "arrow-back"} size={28} color="#FFFFFF" />
      </TouchableOpacity>
      {screen === 'donate' && (
        <Text style={styles.headerTitle}>Donate</Text>
      )}
      <View style={{ flex: 1 }} />
      {screen === 'home' && (
        <Image
          source={{ uri: 'https://img.freepik.com/premium-vector/pantheon-logo-illustration_848918-17712.jpg' }}
          style={styles.avatar}
        />
      )}
    </View>
  );

  const renderHomeScreen = () => (
    <ScrollView style={{ flex: 1 }}>
      {renderHeader()}
      <Text style={styles.title}>Find the{"\n"}needy</Text>
      
      <View style={styles.categories}>
        {categories.map((cat) => (
          <TouchableOpacity
            key={cat}
            style={[styles.catBtn, selectedCategory === cat && styles.catBtnActive]}
            onPress={() => {
              setSelectedCategory(cat);
              setSelectedIndex(0);
            }}
          >
            <Text style={[styles.catText, selectedCategory === cat && styles.catTextActive]}>{cat}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ paddingLeft: 16 }}>
        {filteredOptions.map((option, idx) => (
          <TouchableOpacity
            key={option.category}
            style={[styles.card, { 
              width: 280, 
              marginRight: 16, 
              borderWidth: selectedIndex === idx ? 2 : 0, 
              borderColor: '#FFFFFF' 
            }]}
            onPress={() => setSelectedIndex(idx)}
            onLongPress={() => {
              setSelectedIndex(idx);
              setScreen('details');
            }}
          >
            <Image source={{ uri: option.image }} style={styles.cardImg} />
            <View style={{ padding: 12 }}>
              <Text style={styles.cardCat}>{option.category}</Text>
              <Text style={styles.cardTitle}>{option.title}</Text>
              <View style={styles.progressBarBg}>
                <View style={[styles.progressBar, { width: `${Math.round((option.raised / option.target) * 100)}%` }]} />
              </View>
              <View style={styles.cardFooter}>
                <Text style={styles.raised}>Donation raised{"\n"}<Text style={{ fontWeight: 'bold' }}>₱{option.raised.toLocaleString()}</Text></Text>
                <TouchableOpacity 
                  style={styles.donatingBtn} 
                  onPress={() => {
                    setSelectedIndex(idx);
                    setScreen('details');
                  }}
                >
                  <Text style={{ color: '#FFFFFF', fontWeight: 'bold' }}>Donate</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </ScrollView>
  );

  const renderDetailsScreen = () => (
    <ScrollView style={{ flex: 1 }}>
      {renderHeader()}
      <Image source={{ uri: donationData.image }} style={styles.detailImg} />
      <View style={{ padding: 20 }}>
        <Text style={styles.cardCat}>{donationData.category}</Text>
        <Text style={styles.cardTitle}>{donationData.title}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 8 }}>
          <Ionicons name="people" size={18} color="#FFFFFF" />
          <Text style={{ marginLeft: 6, color: '#CCCCCC' }}>{donationData.donors}+ people donating</Text>
        </View>
        <Text style={{ color: '#CCCCCC', marginBottom: 12 }}>{donationData.description}</Text>
        <View style={styles.detailRow}>
          <View>
            <Text style={styles.raised}>Donation raised</Text>
            <Text style={{ fontWeight: 'bold', fontSize: 16, color: '#FFFFFF' }}>₱{donationData.raised.toLocaleString()}</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.raised}>Target</Text>
            <Text style={{ fontWeight: 'bold', fontSize: 16, color: '#FFFFFF' }}>₱{donationData.target.toLocaleString()}</Text>
          </View>
        </View>
        <View style={styles.progressBarBg}>
          <View style={[styles.progressBar, { width: `${percent}%` }]} />
        </View>
        <Text style={{ color: '#CCCCCC', marginTop: 8 }}>{donationData.hoursLeft} Hours Left</Text>
        <TouchableOpacity style={styles.donatingBtnBig} onPress={() => setScreen('donate')}>
          <Text style={{ color: '#FFFFFF', fontWeight: 'bold', fontSize: 18 }}>Donate</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  const renderDonateScreen = () => (
    <View style={{ flex: 1, backgroundColor: '#000000' }}>
      {renderHeader()}
      <View style={{ padding: 20 }}>
        <View style={styles.donateCard}>
          <Image source={{ uri: donationData.image }} style={styles.donateImg} />
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={styles.cardCat}>{donationData.category}</Text>
            <Text style={styles.cardTitleSmall}>{donationData.title}</Text>
          </View>
        </View>
        <Text style={{ fontWeight: 'bold', fontSize: 16, marginVertical: 16, color: '#FFFFFF' }}>Select Amount</Text>
        <View style={{ flexDirection: 'row', marginBottom: 16 }}>
          {[100, 1000].map(val => (
            <TouchableOpacity
              key={val}
              style={[styles.amountBtn, amount === val && styles.amountBtnActive]}
              onPress={() => { setAmount(val); setManual(''); }}
            >
              <Text style={[styles.amountText, amount === val && styles.amountTextActive]}>₱{val.toLocaleString()}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={{ textAlign: 'center', color: '#CCCCCC', marginBottom: 8 }}>Or</Text>
        <TextInput
          placeholder="Enter Manually"
          placeholderTextColor="#666666"
          style={styles.manualInput}
          keyboardType="numeric"
          value={manual}
          onChangeText={txt => {
            setManual(txt);
            setAmount(Number(txt) || 0);
          }}
        />
        <TouchableOpacity style={styles.donatingBtnBig} onPress={handleDonate}>
          <Text style={{ color: '#FFFFFF', fontWeight: 'bold', fontSize: 18 }}>Donate ₱{amount}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <ImageBackground source={require('../assets/bgapp3.jpg')} style={{ flex: 1 }}>
      <View style={styles.overlay} />
      <SafeAreaView style={{ flex: 1, backgroundColor: 'transparent' }}>
        {screen === 'home' && renderHomeScreen()}
        {screen === 'details' && renderDetailsScreen()}
        {screen === 'donate' && renderDonateScreen()}
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingBottom: 0,
  },
  headerTitle: {
    fontWeight: 'bold',
    fontSize: 20,
    flex: 1,
    textAlign: 'center',
    color: '#FFFFFF',
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginLeft: 16,
    marginTop: 8,
    marginBottom: 16,
    color: '#FFFFFF',
  },
  categories: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 16,
  },
  catBtn: {
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#1A1A1A',
    marginRight: 10,
  },
  catBtnActive: {
    backgroundColor: '#FFFFFF',
  },
  catText: {
    color: '#CCCCCC',
    fontWeight: 'bold',
  },
  catTextActive: {
    color: '#000000',
  },
  card: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    margin: 16,
    shadowColor: '#FFFFFF',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  cardImg: {
    width: '100%',
    height: 120,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  cardCat: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 13,
    marginBottom: 4,
  },
  cardTitle: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 8,
    color: '#FFFFFF',
  },
  progressBarBg: {
    height: 8,
    backgroundColor: '#333333',
    borderRadius: 4,
    marginVertical: 8,
    width: '100%',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 4,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  raised: {
    color: '#CCCCCC',
    fontSize: 12,
  },
  donatingBtn: {
    backgroundColor: '#000000',
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 18,
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
  detailImg: {
    width: '100%',
    height: 180,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 8,
  },
  donatingBtnBig: {
    backgroundColor: '#000000',
    borderRadius: 24,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 24,
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
  donateCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 10,
  },
  donateImg: {
    width: 48,
    height: 48,
    borderRadius: 8,
  },
  cardTitleSmall: {
    fontWeight: 'bold',
    fontSize: 14,
    color: '#FFFFFF',
  },
  amountBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginRight: 10,
    alignItems: 'center',
  },
  amountBtnActive: {
    backgroundColor: '#FFFFFF',
  },
  amountText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  amountTextActive: {
    color: '#000000',
  },
  manualInput: {
    borderWidth: 1,
    borderColor: '#333333',
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    marginBottom: 24,
    textAlign: 'center',
    color: '#FFFFFF',
    backgroundColor: '#1A1A1A',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
}); 
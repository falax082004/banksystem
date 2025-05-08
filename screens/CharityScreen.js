import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, TextInput, ScrollView, SafeAreaView, Alert } from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { db, push, ref, serverTimestamp, get, update } from '../firebaseConfig';

const donationOptions = [
  {
    category: 'FOOD',
    title: 'Help disaster victims meet their food needs',
    description: 'Lake Moraine is a glacial lake in Banff National Park, 14 kilometers outside.',
    image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=400&q=80',
    raised: 98000,
    target: 140000,
    donors: 1200,
    hoursLeft: 8,
  },
  {
    category: 'EDUCATION',
    title: 'Support children to get quality education',
    description: 'Help provide books and tuition for underprivileged children.',
    image: 'https://images.unsplash.com/photo-1464983953574-0892a716854b?auto=format&fit=crop&w=400&q=80',
    raised: 45000,
    target: 100000,
    donors: 800,
    hoursLeft: 12,
  },
  {
    category: 'HUMANITY',
    title: 'Aid refugees with basic necessities',
    description: 'Your donation helps provide shelter and healthcare for refugees.',
    image: 'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=400&q=80',
    raised: 67000,
    target: 120000,
    donors: 950,
    hoursLeft: 20,
  },
];

const categories = ['All', 'Education', 'Food', 'Humanity'];

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
    : donationOptions.filter(opt => opt.category.toLowerCase() === selectedCategory.toLowerCase());
  const donationData = filteredOptions[selectedIndex] || filteredOptions[0];
  const percent = Math.round((donationData.raised / donationData.target) * 100);

  const handleDonate = async () => {
    if (!userId) {
      Alert.alert('Error', 'User not identified.');
      return;
    }
    const userRef = ref(db, 'users/' + userId);
    try {
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
      // Deduct balance
      const newBalance = currentBalance - amount;
      // Update transactions as an array
      const newTransactions = [
        ...(userData.transactions || []),
        {
          type: 'donation',
          category: donationData.category,
          title: donationData.title,
          amount: amount,
          timestamp: new Date().toISOString(),
        }
      ];
      await update(userRef, {
        balance: newBalance,
        transactions: newTransactions,
      });
      // Push donation record
      await push(ref(db, 'donations/'), {
        userId,
        category: donationData.category,
        title: donationData.title,
        amount: amount,
        timestamp: serverTimestamp(),
      });
      Alert.alert('Salamat!', `Your donation of ₱${amount} was successful!`);
      setScreen('home');
      setAmount(100);
      setManual('');
    } catch (error) {
      Alert.alert('Error', 'Donation failed. Please try again.');
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      {screen === 'home' && (
        <ScrollView style={{ flex: 1 }}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity>
              <Ionicons name="menu" size={28} color="#222" />
            </TouchableOpacity>
            <View style={{ flex: 1 }} />
            <Image
              source={{ uri: 'https://randomuser.me/api/portraits/men/32.jpg' }}
              style={styles.avatar}
            />
          </View>
          {/* Title */}
          <Text style={styles.title}>Find the{"\n"}needy</Text>
          {/* Search */}
          <View style={styles.searchRow}>
            <TextInput
              placeholder="Search.."
              style={styles.searchInput}
              placeholderTextColor="#aaa"
            />
            <TouchableOpacity style={styles.filterBtn}>
              <MaterialIcons name="tune" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
          {/* Categories */}
          <View style={styles.categories}>
            {categories.map((cat, i) => (
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
          {/* Donation Cards */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ paddingLeft: 16 }}>
            {filteredOptions.map((option, idx) => (
              <TouchableOpacity
                key={option.category}
                style={[styles.card, { width: 280, marginRight: 16, borderWidth: selectedIndex === idx ? 2 : 0, borderColor: '#1abc9c' }]}
                onPress={() => { setSelectedIndex(idx); }}
                onLongPress={() => { setSelectedIndex(idx); setScreen('details'); }}
              >
                <Image source={{ uri: option.image }} style={styles.cardImg} />
                <View style={{ padding: 12 }}>
                  <Text style={styles.cardCat}>{option.category}</Text>
                  <Text style={styles.cardTitle}>{option.title}</Text>
                  <View style={styles.progressBarBg}>
                    <View style={[styles.progressBar, { width: `${Math.round((option.raised / option.target) * 100)}%` }]} />
                  </View>
                  <View style={styles.cardFooter}>
                    <Text style={styles.raised}>Donation raised{"\n"}<Text style={{ fontWeight: 'bold' }}>${option.raised.toLocaleString()}</Text></Text>
                    <TouchableOpacity style={styles.donatingBtn} onPress={() => { setSelectedIndex(idx); setScreen('details'); }}>
                      <Text style={{ color: '#fff', fontWeight: 'bold' }}>Donate</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </ScrollView>
      )}

      {screen === 'details' && (
        <ScrollView style={{ flex: 1 }}>
          <TouchableOpacity style={{ margin: 16 }} onPress={() => setScreen('home')}>
            <Ionicons name="arrow-back" size={28} color="#222" />
          </TouchableOpacity>
          <Image source={{ uri: donationData.image }} style={styles.detailImg} />
          <View style={{ padding: 20 }}>
            <Text style={styles.cardCat}>{donationData.category}</Text>
            <Text style={styles.cardTitle}>{donationData.title}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 8 }}>
              <Ionicons name="people" size={18} color="#1abc9c" />
              <Text style={{ marginLeft: 6, color: '#555' }}>{donationData.donors}+ people donating</Text>
            </View>
            <Text style={{ color: '#888', marginBottom: 12 }}>{donationData.description}</Text>
            <View style={styles.detailRow}>
              <View>
                <Text style={styles.raised}>Donation raised</Text>
                <Text style={{ fontWeight: 'bold', fontSize: 16 }}>${donationData.raised.toLocaleString()}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.raised}>Target</Text>
                <Text style={{ fontWeight: 'bold', fontSize: 16 }}>${donationData.target.toLocaleString()}</Text>
              </View>
            </View>
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBar, { width: `${percent}%` }]} />
            </View>
            <Text style={{ color: '#888', marginTop: 8 }}>{donationData.hoursLeft} Hours Left</Text>
            <TouchableOpacity style={styles.donatingBtnBig} onPress={() => setScreen('donate')}>
              <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 18 }}>Donate</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}

      {screen === 'donate' && (
        <View style={{ flex: 1, backgroundColor: '#fff' }}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => setScreen('details')}>
              <Ionicons name="arrow-back" size={28} color="#222" />
            </TouchableOpacity>
            <Text style={{ fontWeight: 'bold', fontSize: 20, flex: 1, textAlign: 'center' }}>Donate</Text>
            <View style={{ width: 28 }} />
          </View>
          <View style={{ padding: 20 }}>
            <View style={styles.donateCard}>
              <Image source={{ uri: donationData.image }} style={styles.donateImg} />
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={styles.cardCat}>{donationData.category}</Text>
                <Text style={styles.cardTitleSmall}>{donationData.title}</Text>
              </View>
            </View>
            <Text style={{ fontWeight: 'bold', fontSize: 16, marginVertical: 16 }}>Select Amount</Text>
            <View style={{ flexDirection: 'row', marginBottom: 16 }}>
              {[100, 1000].map(val => (
                <TouchableOpacity
                  key={val}
                  style={[styles.amountBtn, amount === val && styles.amountBtnActive]}
                  onPress={() => { setAmount(val); setManual(''); }}
                >
                  <Text style={[styles.amountText, amount === val && styles.amountTextActive]}>${val.toLocaleString()}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={{ textAlign: 'center', color: '#888', marginBottom: 8 }}>Or</Text>
            <TextInput
              placeholder="Enter Manually"
              style={styles.manualInput}
              keyboardType="numeric"
              value={manual}
              onChangeText={txt => {
                setManual(txt);
                setAmount(Number(txt) || 0);
              }}
            />
            <TouchableOpacity style={styles.donatingBtnBig} onPress={handleDonate}>
              <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 18 }}>Donate ₱{amount}</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row', alignItems: 'center', padding: 16, paddingBottom: 0,
  },
  avatar: {
    width: 36, height: 36, borderRadius: 18, borderWidth: 2, borderColor: '#1abc9c',
  },
  title: {
    fontSize: 32, fontWeight: 'bold', marginLeft: 16, marginTop: 8, marginBottom: 16,
  },
  searchRow: {
    flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, marginBottom: 12,
  },
  searchInput: {
    flex: 1, backgroundColor: '#f2f2f2', borderRadius: 12, padding: 12, fontSize: 16,
  },
  filterBtn: {
    backgroundColor: '#ffa726', marginLeft: 10, borderRadius: 12, padding: 10,
  },
  categories: {
    flexDirection: 'row', marginHorizontal: 16, marginBottom: 16,
  },
  catBtn: {
    paddingVertical: 6, paddingHorizontal: 16, borderRadius: 20, backgroundColor: '#f2f2f2', marginRight: 10,
  },
  catBtnActive: {
    backgroundColor: '#222',
  },
  catText: {
    color: '#888', fontWeight: 'bold',
  },
  catTextActive: {
    color: '#fff',
  },
  card: {
    backgroundColor: '#fff', borderRadius: 16, margin: 16, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 8, elevation: 2,
  },
  cardImg: {
    width: '100%', height: 120, borderTopLeftRadius: 16, borderTopRightRadius: 16,
  },
  cardCat: {
    color: '#ffa726', fontWeight: 'bold', fontSize: 13, marginBottom: 4,
  },
  cardTitle: {
    fontWeight: 'bold', fontSize: 16, marginBottom: 8,
  },
  progressBarBg: {
    height: 8, backgroundColor: '#eee', borderRadius: 4, marginVertical: 8, width: '100%',
  },
  progressBar: {
    height: 8, backgroundColor: '#ffa726', borderRadius: 4,
  },
  cardFooter: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8,
  },
  raised: {
    color: '#888', fontSize: 12,
  },
  donatingBtn: {
    backgroundColor: '#1abc9c', borderRadius: 16, paddingVertical: 6, paddingHorizontal: 18,
  },
  detailImg: {
    width: '100%', height: 180,
  },
  detailRow: {
    flexDirection: 'row', justifyContent: 'space-between', marginVertical: 8,
  },
  donatingBtnBig: {
    backgroundColor: '#1abc9c', borderRadius: 24, paddingVertical: 14, alignItems: 'center', marginTop: 24,
  },
  donateCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#f2f2f2', borderRadius: 12, padding: 10,
  },
  donateImg: {
    width: 48, height: 48, borderRadius: 8,
  },
  cardTitleSmall: {
    fontWeight: 'bold', fontSize: 14,
  },
  amountBtn: {
    flex: 1, borderWidth: 1, borderColor: '#1abc9c', borderRadius: 16, padding: 16, marginRight: 10, alignItems: 'center',
  },
  amountBtnActive: {
    backgroundColor: '#1abc9c',
  },
  amountText: {
    color: '#1abc9c', fontWeight: 'bold', fontSize: 16,
  },
  amountTextActive: {
    color: '#fff',
  },
  manualInput: {
    borderWidth: 1, borderColor: '#eee', borderRadius: 12, padding: 12, fontSize: 16, marginBottom: 24, textAlign: 'center',
  },
}); 
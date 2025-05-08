import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, ScrollView } from 'react-native';
import { db, ref, get } from '../firebaseConfig';
import cardImage from '../assets/card.png';

const ManageCardsScreen = ({ navigation, route }) => {
  const { userId } = route.params;
  const [cardNumber, setCardNumber] = useState('');

  useEffect(() => {
    const fetchCardData = async () => {
      try {
        const userRef = ref(db, 'users/' + userId);
        const snapshot = await get(userRef);
        if (snapshot.exists()) {
          const data = snapshot.val();
          const fullNumber = data.card?.cardNumber || '';
          const last4 = fullNumber.slice(-4);
          const masked = `•••• •••• •••• ${last4}`;
          setCardNumber(masked);
        }
      } catch (error) {
        console.log('Error fetching card data:', error);
      }
    };

    fetchCardData();
  }, []);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.sectionTitle}>Debit Card</Text>

      <TouchableOpacity
        style={styles.cardContainer}
        onPress={() => navigation.navigate('LockCardScreen', { userId })}
      >
        <Image source={cardImage} style={styles.cardImage} />
        <View style={styles.cardTextContainer}>
          <Text style={styles.cardTitle}>MY SAVINGS</Text>
          <Text style={styles.cardNumber}>{cardNumber}</Text>
        </View>
      </TouchableOpacity>
    </ScrollView>
  );
};

export default ManageCardsScreen;

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#e6f0ff',
    padding: 16,
    flexGrow: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  cardContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 6,
    elevation: 5,
  },
  cardImage: {
    width: 80, // enlarged
    height: 50,
    resizeMode: 'contain',
    marginRight: 20,
  },
  cardTextContainer: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 18, // enlarged
    fontWeight: '700',
    color: '#000',
    marginBottom: 4,
  },
  cardNumber: {
    fontSize: 16, // enlarged
    color: '#555',
  },
});

import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, ScrollView, ImageBackground } from 'react-native';
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
    <ImageBackground source={require('../assets/bgapp3.jpg')} style={styles.background}>
      <View style={styles.overlay} />
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
    </ImageBackground>
  );
};

export default ManageCardsScreen;

const styles = StyleSheet.create({
  background: {
    flex: 1,
    resizeMode: 'cover',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  container: {
    backgroundColor: 'transparent',
    padding: 16,
    flexGrow: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 16,
    textAlign: 'center',
  },
  cardContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.2,
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
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  cardNumber: {
    fontSize: 16,
    color: '#CCCCCC',
  },
});

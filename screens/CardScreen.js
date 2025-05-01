import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Button,
  StyleSheet,
  Image,
  ImageBackground, // Import ImageBackground
} from 'react-native';
import {
  db,
  ref,
  set,
  get,
  serverTimestamp,
} from '../firebaseConfig'; // Adjust path if needed
import cardIcon from '../assets/cardicon.png'; // Ensure this path is correct
import bgapp3 from '../assets/bgapp3.jpg'; // Import the background image

const generateCardNumber = () => {
  let cardNumber = '';
  for (let i = 0; i < 4; i++) {
    const segment = Math.floor(Math.random() * 9000 + 1000);
    cardNumber += segment + ' ';
  }
  return cardNumber.trim();
};

// Fixed Expiration: 01/30
const generateExpirationDate = () => {
  return '01/30';
};

const CardScreen = ({ route }) => {
  const { userId } = route.params;
  const [cardNumber, setCardNumber] = useState('');
  const [expirationDate, setExpirationDate] = useState('');
  const [userName, setUserName] = useState('');
  const [loading, setLoading] = useState(true);
  const [cardGenerated, setCardGenerated] = useState(false);

  useEffect(() => {
    fetchCardData();
  }, []);

  const generateCard = async () => {
    const randomCardNumber = generateCardNumber();
    const fixedExpirationDate = generateExpirationDate();
    setCardNumber(randomCardNumber);
    setExpirationDate(fixedExpirationDate);

    await saveCardData(randomCardNumber, fixedExpirationDate);
  };

  const fetchCardData = async () => {
    try {
      const userRef = ref(db, 'users/' + userId);
      const snapshot = await get(userRef);
      if (snapshot.exists()) {
        const data = snapshot.val();
        if (data.card?.cardNumber && data.card?.expirationDate) {
          setCardNumber(data.card.cardNumber);
          setExpirationDate(data.card.expirationDate);
          setCardGenerated(true);
        }
        if (data.name) {
          setUserName(data.name);
        }
      }
      setLoading(false);
    } catch (error) {
      console.log('Error fetching card:', error);
      setLoading(false);
    }
  };

  const saveCardData = async (cardNumber, expirationDate) => {
    try {
      const cardRef = ref(db, 'users/' + userId + '/card');
      const snapshot = await get(cardRef);
      if (!snapshot.exists()) {
        await set(cardRef, {
          cardNumber,
          expirationDate,
          createdAt: serverTimestamp(),
        });
        setCardGenerated(true);
        console.log('Card saved to Firebase.');
      }
    } catch (error) {
      console.log('Error saving card:', error);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <ImageBackground source={bgapp3} style={styles.container}>
      
      {/* Custom Credit Card UI */}
      <View style={styles.customCard}>
        <View style={styles.cardTopRow}>
          {/* Enlarged card icon */}
          <Image source={cardIcon} style={styles.enlargedCardIcon} />
          <Text style={styles.cardLabel}>Virtual Credit Card</Text>
        </View>

        <View style={styles.cardNumberRow}>
          {(cardNumber || '•••• •••• •••• ••••').split(' ').map((segment, index) => (
            <Text key={index} style={styles.cardNumberSegment}>
              {segment}
            </Text>
          ))}
        </View>

        <View style={styles.cardFooter}>
          <Text style={styles.cardName}>{userName || 'Cardholder'}</Text>
          <Text style={styles.cardExpiry}>Exp: {expirationDate || 'MM/YY'}</Text>
        </View>

        <View style={styles.circleRed} />
        <View style={styles.circleOrange} />
      </View>

      {!cardGenerated ? (
        <Button title="Generate Card" onPress={generateCard} />
      ) : (
        <Text style={styles.successMessage}>Card generated and saved!</Text>
      )}
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  subTitle: {
    fontSize: 18,
    marginTop: 10,
    color: '#fff',
  },
  customCard: {
    width: '100%',
    maxWidth: 350,
    height: 200,
    backgroundColor: '#1c1c1c',
    borderRadius: 12,
    padding: 20,
    overflow: 'hidden',
    position: 'relative',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  enlargedCardIcon: {
    width: 70,  // Increase width for larger size
    height: 50, // Increase height for larger size
    resizeMode: 'contain',
    marginRight: 10,
  },
  cardLabel: {
    color: '#ccc',
    fontSize: 16,
    fontWeight: '600',
  },
  cardNumberRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 40,
  },
  cardNumberSegment: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cardName: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  cardExpiry: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  circleRed: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#c62828',
    position: 'absolute',
    top: -30,
    right: -30,
    opacity: 0.7,
    zIndex: -1, 
  },
  circleOrange: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#ff9800',
    position: 'absolute',
    bottom: -20,
    left: -20,
    opacity: 0.8,
    zIndex: -1, 
  },
  successMessage: {
    fontSize: 16,
    color: 'green',
    marginTop: 20,
  },
});

export default CardScreen;

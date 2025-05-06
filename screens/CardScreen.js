import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  ImageBackground,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import {
  db,
  ref,
  set,
  get,
  serverTimestamp,
} from '../firebaseConfig';
import cardIcon from '../assets/cardicon.png';
import bgapp3 from '../assets/bgapp3.jpg';

const generateCardNumber = () => {
  let cardNumber = '';
  for (let i = 0; i < 4; i++) {
    const segment = Math.floor(Math.random() * 9000 + 1000);
    cardNumber += segment + ' ';
  }
  return cardNumber.trim();
};

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
  const [showCard, setShowCard] = useState(false); // visibility toggle

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
        <Text style={{ color: '#fff' }}>Loading...</Text>
      </View>
    );
  }

  return (
    <ImageBackground source={bgapp3} style={styles.container} resizeMode="cover">
      <View style={styles.customCard}>
        <View style={styles.cardTopRow}>
          <Image source={cardIcon} style={styles.enlargedCardIcon} />
          <Text style={styles.cardLabel}>Digital Bank Card</Text>
        </View>

        <View style={styles.cardNumberRow}>
          <View style={styles.cardNumberGroup}>
            {(showCard ? cardNumber : '•••• •••• •••• ••••').split(' ').map((segment, index) => (
              <Text key={index} style={styles.cardNumberSegment}>
                {segment}
              </Text>
            ))}
          </View>
          <TouchableOpacity onPress={() => setShowCard(!showCard)} style={styles.eyeIcon}>
            <Icon name={showCard ? 'eye' : 'eye-off'} size={22} color="#fff" />
          </TouchableOpacity>
        </View>

        <View style={styles.cardFooter}>
          <Text style={styles.cardName}>{userName || 'Cardholder'}</Text>
          <Text style={styles.cardExpiry}>Exp: {expirationDate || 'MM/YY'}</Text>
        </View>

        <View style={styles.circleRed} />
        <View style={styles.circleOrange} />
      </View>

      {!cardGenerated ? (
        <TouchableOpacity style={styles.generateButton} onPress={generateCard}>
          <Text style={styles.generateButtonText}>Generate Card</Text>
        </TouchableOpacity>
      ) : (
        <Text style={styles.successMessage}>✔ Card generated and saved!</Text>
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
    backgroundColor: '#000',
  },
  customCard: {
    width: '100%',
    maxWidth: 360,
    height: 210,
    backgroundColor: '#1e1e1e',
    borderRadius: 16,
    padding: 20,
    overflow: 'hidden',
    justifyContent: 'space-between',
    marginTop: 40,
    shadowColor: '#C4A35A',
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 10,
    elevation: 10,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  enlargedCardIcon: {
    width: 100,
    height: 75,
    resizeMode: 'contain',
  },
  cardLabel: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  cardNumberRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  cardNumberGroup: {
    flexDirection: 'row',
    gap: 6,
  },
  cardNumberSegment: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    letterSpacing: 1,
    marginHorizontal: 2,
  },
  eyeIcon: {
    padding: 6,
    borderRadius: 20
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
    color: '#ccc',
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
    opacity: 0.5,
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
    opacity: 0.5,
    zIndex: -1,
  },
  generateButton: {
    marginTop: 30,
    backgroundColor: '#FFF',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 8,
  },
  generateButtonText: {
    color: '#1e1e1e',
    fontSize: 16,
    fontWeight: '700',
  },
  successMessage: {
    marginTop: 20,
    color: '#4CAF50',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default CardScreen;

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
      <ImageBackground source={bgapp3} style={styles.container} resizeMode="cover">
        <View style={styles.overlay} />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', width: '100%' }}>
          <Text style={{ color: '#FFFFFF' }}>Loading...</Text>
        </View>
      </ImageBackground>
    );
  }

  return (
    <ImageBackground source={bgapp3} style={styles.container} resizeMode="cover">
      <View style={styles.overlay} />
      <View style={styles.innerContainer}>
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
              <Icon name={showCard ? 'eye' : 'eye-off'} size={22} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          <View style={styles.cardFooter}>
            <Text style={styles.cardName}>{userName || 'Cardholder'}</Text>
            <Text style={styles.cardExpiry}>Exp: {expirationDate || 'MM/YY'}</Text>
          </View>

          <View style={styles.circleDark} />
          <View style={styles.circleLight} />
        </View>

        {!cardGenerated ? (
          <TouchableOpacity style={styles.generateButton} onPress={generateCard}>
            <Text style={styles.generateButtonText}>Generate Card</Text>
          </TouchableOpacity>
        ) : (
          <Text style={styles.successMessage}>✔ Card generated and saved!</Text>
        )}
      </View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    width: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.55)',
    zIndex: 0,
  },
  innerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    zIndex: 1,
  },
  customCard: {
    width: '100%',
    maxWidth: 360,
    height: 210,
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 20,
    overflow: 'hidden',
    justifyContent: 'space-between',
    marginTop: 40,
    shadowColor: '#FFFFFF',
    shadowOpacity: 0.1,
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
    color: '#FFFFFF',
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
    color: '#FFFFFF',
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
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  cardExpiry: {
    color: '#CCCCCC',
    fontSize: 14,
    fontWeight: '600',
  },
  circleDark: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#333333',
    position: 'absolute',
    top: -30,
    right: -30,
    opacity: 0.3,
    zIndex: -1,
  },
  circleLight: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#333333',
    position: 'absolute',
    bottom: -20,
    left: -20,
    opacity: 0.3,
    zIndex: -1,
  },
  generateButton: {
    marginTop: 30,
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 8,
  },
  generateButtonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '700',
  },
  successMessage: {
    marginTop: 20,
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default CardScreen;

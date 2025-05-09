import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ImageBackground,
  Switch,
} from 'react-native';
import { db, ref, set, get, serverTimestamp } from '../firebaseConfig';
import cardIcon from '../assets/cardicon.png';
import bgapp3 from '../assets/bgapp3.jpg';

const LockCardScreen = ({ route }) => {
  const { userId } = route.params;
  const [cardNumber, setCardNumber] = useState('');
  const [expirationDate, setExpirationDate] = useState('');
  const [userName, setUserName] = useState('');
  const [lockStatus, setLockStatus] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCardData();
    fetchLockData();
  }, []);

  const fetchCardData = async () => {
    try {
      const userRef = ref(db, 'users/' + userId);
      const snapshot = await get(userRef);
      if (snapshot.exists()) {
        const data = snapshot.val();
        if (data.card?.cardNumber && data.card?.expirationDate) {
          setCardNumber(data.card.cardNumber);
          setExpirationDate(data.card.expirationDate);
        }
        if (data.name) {
          setUserName(data.name);
        }
      }
    } catch (error) {
      console.log('Error fetching card:', error);
    }
  };

  const fetchLockData = async () => {
    try {
      const lockRef = ref(db, `users/${userId}/lock`);
      const snapshot = await get(lockRef);
      if (snapshot.exists()) {
        const data = snapshot.val();
        if (data.status !== undefined) {
          setLockStatus(data.status);
        }
      } else {
        await saveLockStatus(false);
      }
    } catch (error) {
      console.error('Error fetching lock status:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveLockStatus = async (status) => {
    try {
      const lockRef = ref(db, `users/${userId}/lock`);
      await set(lockRef, {
        status,
        updatedAt: serverTimestamp(),
      });
      console.log('Lock status saved to Firebase.');
    } catch (error) {
      console.error('Error saving lock status:', error);
    }
  };

  const toggleLockStatus = () => {
    const newStatus = !lockStatus;
    setLockStatus(newStatus);
    saveLockStatus(newStatus);
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
      <View style={styles.cardWrapper}>
        <View style={styles.customCard}>
          <View style={styles.cardTopRow}>
            <Image source={cardIcon} style={styles.enlargedCardIcon} />
            <Text style={styles.cardLabel}>Digital Bank Card</Text>
          </View>

          <View style={styles.cardNumberRow}>
            <View style={styles.cardNumberGroup}>
              {(cardNumber || '•••• •••• •••• ••••').split(' ').map((segment, index) => (
                <Text key={index} style={styles.cardNumberSegment}>
                  {segment}
                </Text>
              ))}
            </View>
          </View>

          <View style={styles.cardFooter}>
            <Text style={styles.cardName}>{userName || 'Cardholder'}</Text>
            <Text style={styles.cardExpiry}>Exp: {expirationDate || 'MM/YY'}</Text>
          </View>

          {/* Background circles */}
          <View style={styles.circleDark} />
          <View style={styles.circleLight} />

          {/* Locked overlay */}
          {lockStatus && (
            <View style={styles.lockOverlay}>
              <Text style={styles.lockedLabel}>🔒 LOCKED</Text>
            </View>
          )}
        </View>
      </View>

      {lockStatus && (
        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>🔐 Card Locked</Text>
          <Text style={styles.infoText}>
            Debit card transactions including ATM, in-store, and online will be declined. You can unlock your card anytime.
          </Text>
        </View>
      )}

      <View style={styles.lockPanel}>
        <View style={styles.lockTextWrapper}>
          <Text style={styles.lockTitle}>🔒 Lock Card</Text>
          <Text style={styles.lockSubtitle}>Block transactions made with this card</Text>
        </View>
        <Switch
          trackColor={{ false: '#333333', true: '#FFFFFF' }}
          thumbColor="#000000"
          ios_backgroundColor="#333333"
          onValueChange={toggleLockStatus}
          value={lockStatus}
        />
      </View>
    </ImageBackground>
  );
};

export default LockCardScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#000000',
  },
  cardWrapper: {
    width: '100%',
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 20,
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
    backgroundColor: '#000000',
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
  lockOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
  },
  lockedLabel: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    backgroundColor: '#000000',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
    fontSize: 16,
  },
  infoBox: {
    width: '100%',
    backgroundColor: '#1A1A1A',
    borderColor: '#333333',
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  infoTitle: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 6,
    color: '#FFFFFF',
  },
  infoText: {
    fontSize: 14,
    color: '#CCCCCC',
  },
  lockPanel: {
    width: '100%',
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 4,
  },
  lockTextWrapper: {
    flex: 1,
  },
  lockTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#FFFFFF',
  },
  lockSubtitle: {
    fontSize: 12,
    color: '#CCCCCC',
  },
});

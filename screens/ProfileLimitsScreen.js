import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, StatusBar, ActivityIndicator, ImageBackground } from 'react-native';
import { Ionicons } from '@expo/vector-icons'; // Make sure you have @expo/vector-icons installed
import * as Progress from 'react-native-progress';
import { db, ref, get } from '../firebaseConfig'; // adjust path if needed

const ProfileLimitsScreen = ({ route, navigation }) => {
  const { userId } = route.params; // Ensure this is passed via navigation

  const [walletBalance, setWalletBalance] = useState(0);
  const [dailyOutgoing, setDailyOutgoing] = useState(0);
  const [monthlyIncoming, setMonthlyIncoming] = useState(0);
  const [loading, setLoading] = useState(true);

  const WALLET_LIMIT = 500000;
  const DAILY_OUTGOING_LIMIT = 100000;
  const MONTHLY_INCOMING_LIMIT = 500000;

  useEffect(() => {
    // Setting the header title and the back button
    navigation.setOptions({
      headerLeft: () => (
        <Ionicons
          name="arrow-back"
          size={24}
          color="white"
          onPress={() => navigation.goBack()} // Go back when back button is pressed
          style={{ marginLeft: 10 }}
        />
      ),
      headerTitle: 'Profile Limits',
      headerStyle: {
        backgroundColor: '#000000',
      },
      headerTitleStyle: {
        color: 'white',
        fontSize: 20,
        fontWeight: 'bold',
      },
    });

    const fetchLimits = async () => {
      try {
        const userRef = ref(db, `users/${userId}`);
        const snapshot = await get(userRef);

        if (snapshot.exists()) {
          const data = snapshot.val();
          setWalletBalance(data.balance || 0);
          setDailyOutgoing(data.dailyOutgoing || 0);
          setMonthlyIncoming(data.monthlyIncoming || 0);
        }
      } catch (error) {
        console.error("Error fetching limits:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchLimits();
  }, [userId, navigation]);

  return (
    <ImageBackground source={require('../assets/bgapp3.jpg')} style={styles.background}>
      <View style={styles.overlay} />
      <View style={styles.screen}>
        <StatusBar backgroundColor="#000000" barStyle="light-content" />
        {loading ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="large" color="#FFFFFF" />
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.content}>
            <View style={styles.banner}>
              <Text style={styles.bannerText}>YOUR ACCOUNT IS FULLY VERIFIED</Text>
            </View>
            <LimitCard title="WALLET LIMIT" used={walletBalance} limit={WALLET_LIMIT} />
            <LimitCard title="DAILY OUTGOING LIMIT" used={dailyOutgoing} limit={DAILY_OUTGOING_LIMIT} />
            <LimitCard title="MONTHLY INCOMING LIMIT" used={monthlyIncoming} limit={MONTHLY_INCOMING_LIMIT} />
          </ScrollView>
        )}
      </View>
    </ImageBackground>
  );
};

const LimitCard = ({ title, used, limit }) => {
  const left = limit - used;
  const progress = Math.min(used / limit, 1);

  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{title}</Text>
      <View style={styles.row}>
        <Text style={styles.used}>PHP {used.toLocaleString(undefined, { minimumFractionDigits: 2 })} used</Text>
        <Text style={styles.limit}>PHP {limit.toLocaleString()} limit</Text>
      </View>
      <Progress.Bar
        progress={progress}
        width={null}
        color="#FFFFFF"
        unfilledColor="#333333"
        borderColor="transparent"
        height={8}
        borderRadius={6}
        style={{ marginTop: 8 }}
      />
      <Text style={styles.leftText}>PHP {left.toLocaleString(undefined, { minimumFractionDigits: 2 })} left</Text>
      {title === 'DAILY OUTGOING LIMIT' && (
        <Text style={styles.note}>No Limit for Monthly Outgoing Transactions</Text>
      )}
    </View>
  );
};

export default ProfileLimitsScreen;

const styles = StyleSheet.create({
  background: {
    flex: 1,
    resizeMode: 'cover',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  screen: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  content: {
    padding: 16,
  },
  banner: {
    backgroundColor: '#1A1A1A',
    padding: 10,
    borderRadius: 8,
    marginBottom: 16,
    alignItems: 'center',
  },
  bannerText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  card: {
    backgroundColor: '#1A1A1A',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#FFFFFF',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  used: {
    color: '#FFFFFF',
  },
  limit: {
    color: '#CCCCCC',
  },
  leftText: {
    marginTop: 6,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  note: {
    marginTop: 8,
    fontSize: 12,
    color: '#999999',
  },
});

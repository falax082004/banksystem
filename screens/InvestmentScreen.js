// screens/VoucherScreen.js
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { db, ref, get, update, push, serverTimestamp, set, remove } from '../firebaseConfig';

const InvestmentScreen = ({ route }) => {
  const { userId } = route.params;
  const [selectedOption, setSelectedOption] = useState(null);
  const [portfolioValue, setPortfolioValue] = useState(0);
  const [dailyChange, setDailyChange] = useState(0);
  const [userBalance, setUserBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [investments, setInvestments] = useState([]);

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      const userRef = ref(db, 'users/' + userId);
      const snapshot = await get(userRef);
      
      if (snapshot.exists()) {
        const userData = snapshot.val();
        setUserBalance(userData.balance || 0);
        setPortfolioValue(userData.portfolioValue || 0);
        setDailyChange(userData.dailyChange || 0);
        
        // Fetch user's investments
        const investmentsRef = ref(db, 'investments/' + userId);
        const investmentsSnapshot = await get(investmentsRef);
        if (investmentsSnapshot.exists()) {
          setInvestments(investmentsSnapshot.val().investments || []);
        }
      } else {
        // Create new user document if it doesn't exist
        const newUserData = {
          balance: 10000, // Starting balance
          portfolioValue: 0,
          dailyChange: 0,
          createdAt: new Date().toISOString()
        };
        
        await update(userRef, newUserData);
        
        // Initialize with default values
        setUserBalance(10000);
        setPortfolioValue(0);
        setDailyChange(0);
        setInvestments([]);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      Alert.alert('Error', 'Failed to load user data');
    } finally {
      setLoading(false);
    }
  };

  const saveUserProfile = async (userData) => {
    try {
      const userRef = ref(db, 'users/' + userId);
      await update(userRef, {
        ...userData,
        lastUpdated: serverTimestamp()
      });
      return true;
    } catch (error) {
      console.error('Error saving user profile:', error);
      Alert.alert('Error', 'Failed to save user profile');
      return false;
    }
  };

  const saveInvestmentHistory = async (investmentData) => {
    try {
      const historyRef = ref(db, 'investmentHistory/' + userId);
      const newHistoryRef = push(historyRef);
      await set(newHistoryRef, {
        ...investmentData,
        timestamp: serverTimestamp()
      });
      return true;
    } catch (error) {
      console.error('Error saving investment history:', error);
      Alert.alert('Error', 'Failed to save investment history');
      return false;
    }
  };

  const savePortfolioSnapshot = async () => {
    try {
      const snapshotRef = ref(db, 'portfolioSnapshots/' + userId);
      const newSnapshotRef = push(snapshotRef);
      await set(newSnapshotRef, {
        portfolioValue,
        dailyChange,
        investments,
        timestamp: serverTimestamp()
      });
      return true;
    } catch (error) {
      console.error('Error saving portfolio snapshot:', error);
      Alert.alert('Error', 'Failed to save portfolio snapshot');
      return false;
    }
  };

  const saveTransaction = async (transactionData) => {
    try {
      const transactionsRef = ref(db, 'transactions/' + userId);
      const newTransactionRef = push(transactionsRef);
      await set(newTransactionRef, {
        ...transactionData,
        timestamp: serverTimestamp()
      });
      return true;
    } catch (error) {
      console.error('Error saving transaction:', error);
      Alert.alert('Error', 'Failed to save transaction');
      return false;
    }
  };

  const saveInvestmentGoal = async (goalData) => {
    try {
      const goalsRef = ref(db, 'investmentGoals/' + userId);
      const newGoalRef = push(goalsRef);
      await set(newGoalRef, {
        ...goalData,
        createdAt: serverTimestamp(),
        status: 'active'
      });
      return true;
    } catch (error) {
      console.error('Error saving investment goal:', error);
      Alert.alert('Error', 'Failed to save investment goal');
      return false;
    }
  };

  const saveInvestmentPerformance = async (performanceData) => {
    try {
      const performanceRef = ref(db, 'investmentPerformance/' + userId);
      const newPerformanceRef = push(performanceRef);
      await set(newPerformanceRef, {
        ...performanceData,
        timestamp: serverTimestamp()
      });
      return true;
    } catch (error) {
      console.error('Error saving investment performance:', error);
      Alert.alert('Error', 'Failed to save investment performance');
      return false;
    }
  };

  const saveInvestmentPreferences = async (preferences) => {
    try {
      const preferencesRef = ref(db, 'userPreferences/' + userId);
      await update(preferencesRef, {
        ...preferences,
        lastUpdated: serverTimestamp()
      });
      return true;
    } catch (error) {
      console.error('Error saving investment preferences:', error);
      Alert.alert('Error', 'Failed to save investment preferences');
      return false;
    }
  };

  const saveInvestmentAlert = async (alertData) => {
    try {
      const alertsRef = ref(db, 'investmentAlerts/' + userId);
      const newAlertRef = push(alertsRef);
      await set(newAlertRef, {
        ...alertData,
        createdAt: serverTimestamp(),
        status: 'active'
      });
      return true;
    } catch (error) {
      console.error('Error saving investment alert:', error);
      Alert.alert('Error', 'Failed to save investment alert');
      return false;
    }
  };

  const saveInvestmentNote = async (noteData) => {
    try {
      const notesRef = ref(db, 'investmentNotes/' + userId);
      const newNoteRef = push(notesRef);
      await set(newNoteRef, {
        ...noteData,
        createdAt: serverTimestamp()
      });
      return true;
    } catch (error) {
      console.error('Error saving investment note:', error);
      Alert.alert('Error', 'Failed to save investment note');
      return false;
    }
  };

  const deleteInvestment = async (investmentId) => {
    try {
      const investmentRef = ref(db, `investments/${userId}/${investmentId}`);
      await remove(investmentRef);
      
      // Update local state
      setInvestments(prevInvestments => 
        prevInvestments.filter(inv => inv.id !== investmentId)
      );
      
      return true;
    } catch (error) {
      console.error('Error deleting investment:', error);
      Alert.alert('Error', 'Failed to delete investment');
      return false;
    }
  };

  const updateInvestmentStatus = async (investmentId, newStatus) => {
    try {
      const investmentRef = ref(db, `investments/${userId}/${investmentId}`);
      await update(investmentRef, {
        status: newStatus,
        lastUpdated: serverTimestamp()
      });
      
      // Update local state
      setInvestments(prevInvestments =>
        prevInvestments.map(inv =>
          inv.id === investmentId ? { ...inv, status: newStatus } : inv
        )
      );
      
      return true;
    } catch (error) {
      console.error('Error updating investment status:', error);
      Alert.alert('Error', 'Failed to update investment status');
      return false;
    }
  };

  const investmentOptions = [
    { 
      id: 1, 
      name: 'Stocks', 
      icon: 'trending-up', 
      color: '#4CAF50',
      description: 'Invest in company shares',
      minAmount: 5000
    },
    { 
      id: 2, 
      name: 'Bonds', 
      icon: 'shield-checkmark', 
      color: '#2196F3',
      description: 'Government and corporate bonds',
      minAmount: 10000
    },
    { 
      id: 3, 
      name: 'Mutual Funds', 
      icon: 'pie-chart', 
      color: '#FF9800',
      description: 'Diversified investment funds',
      minAmount: 5000
    },
    { 
      id: 4, 
      name: 'Crypto', 
      icon: 'logo-bitcoin', 
      color: '#9C27B0',
      description: 'Digital currency investments',
      minAmount: 1000
    },
  ];

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    try {
      const date = new Date(timestamp);
      return date.toLocaleDateString();
    } catch (error) {
      return 'N/A';
    }
  };

  const processInvestment = async (option, amount) => {
    try {
      if (!userId) {
        Alert.alert('Error', 'User not identified.');
        return;
      }

      if (amount < option.minAmount) {
        Alert.alert('Error', `Minimum investment amount is ${formatCurrency(option.minAmount)}`);
        return;
      }

      if (amount > userBalance) {
        Alert.alert('Error', 'Insufficient balance');
        return;
      }

      setLoading(true);

      const userRef = ref(db, 'users/' + userId);
      const snapshot = await get(userRef);
      if (!snapshot.exists()) {
        Alert.alert('Error', 'User not found.');
        return;
      }

      const newBalance = userBalance - amount;
      const newPortfolioValue = portfolioValue + amount;
      const currentDate = new Date().toISOString();

      // Update user balance and portfolio
      await update(userRef, {
        balance: newBalance,
        portfolioValue: newPortfolioValue,
        lastUpdated: currentDate
      });

      // Add investment record
      const investmentData = {
        type: option.name,
        amount: amount,
        date: currentDate,
        status: 'active'
      };

      // Add transaction record
      await push(ref(db, 'transactions/'), {
        userId: userId,
        type: 'Investment',
        amount: amount,
        investmentType: option.name,
        date: currentDate,
        status: 'completed'
      });

      // Update investments array
      const newInvestments = [...investments, investmentData];
      const investmentsRef = ref(db, 'investments/' + userId);
      await update(investmentsRef, {
        investments: newInvestments,
        lastUpdated: currentDate
      });

      // Update local state
      setUserBalance(newBalance);
      setPortfolioValue(newPortfolioValue);
      setInvestments(newInvestments);

      Alert.alert('Success', `Successfully invested ${formatCurrency(amount)} in ${option.name}`);
    } catch (error) {
      console.error('Error processing investment:', error);
      Alert.alert('Error', 'Failed to process investment');
    } finally {
      setLoading(false);
    }
  };

  const handleInvestmentOption = (option) => {
    setSelectedOption(option);
    
    if (Platform.OS === 'android') {
      Alert.alert(
        `${option.name} Investment`,
        `Enter investment amount (Minimum: ${formatCurrency(option.minAmount)})`,
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Invest',
            onPress: () => {
              const testAmount = option.minAmount;
              processInvestment(option, testAmount);
            }
          }
        ]
      );
    } else {
      Alert.prompt(
        `${option.name} Investment`,
        `Enter investment amount (Minimum: ${formatCurrency(option.minAmount)})`,
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Invest',
            onPress: (amount) => {
              const investmentAmount = parseFloat(amount);
              if (isNaN(investmentAmount)) {
                Alert.alert('Error', 'Please enter a valid amount');
                return;
              }
              processInvestment(option, investmentAmount);
            },
          },
        ],
        'plain-text',
        option.minAmount.toString()
      );
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Portfolio Summary Card */}
      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>Portfolio Value</Text>
        <Text style={styles.summaryAmount}>{formatCurrency(portfolioValue)}</Text>
        <View style={styles.changeContainer}>
          <Ionicons 
            name={dailyChange >= 0 ? 'arrow-up' : 'arrow-down'} 
            size={16} 
            color={dailyChange >= 0 ? '#4CAF50' : '#F44336'} 
          />
          <Text style={[
            styles.changeText, 
            { color: dailyChange >= 0 ? '#4CAF50' : '#F44336' }
          ]}>
            {dailyChange >= 0 ? '+' : ''}{dailyChange}%
          </Text>
        </View>
        <Text style={styles.balanceText}>Available Balance: {formatCurrency(userBalance)}</Text>
      </View>

      {/* Investment Options */}
      <Text style={styles.sectionTitle}>Investment Options</Text>
      <View style={styles.optionsContainer}>
        {investmentOptions.map((option) => (
          <TouchableOpacity 
            key={option.id} 
            style={[
              styles.optionCard,
              selectedOption?.id === option.id && styles.selectedOptionCard
            ]}
            onPress={() => handleInvestmentOption(option)}
          >
            <View style={[styles.iconContainer, { backgroundColor: option.color }]}>
              <Ionicons name={option.icon} size={24} color="white" />
            </View>
            <Text style={styles.optionName}>{option.name}</Text>
            <Text style={styles.optionDescription}>{option.description}</Text>
            <Text style={styles.minAmount}>Min: {formatCurrency(option.minAmount)}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Recent Transactions */}
      <Text style={styles.sectionTitle}>Recent Transactions</Text>
      <View style={styles.transactionsContainer}>
        {investments.slice(0, 5).map((investment, index) => (
          <View key={index} style={styles.transactionItem}>
            <View style={styles.transactionLeft}>
              <Text style={styles.transactionType}>Investment</Text>
              <Text style={styles.transactionAsset}>{investment.type}</Text>
            </View>
            <View style={styles.transactionRight}>
              <Text style={styles.transactionAmount}>{formatCurrency(investment.amount)}</Text>
              <Text style={styles.transactionDate}>
                {formatDate(investment.date)}
              </Text>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
};

export default InvestmentScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  summaryCard: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 20,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  summaryTitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  summaryAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  balanceText: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
  },
  changeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  changeText: {
    marginLeft: 4,
    fontSize: 14,
    fontWeight: '500',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginHorizontal: 16,
    marginTop: 24,
    marginBottom: 16,
    color: '#333',
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    justifyContent: 'space-between',
  },
  optionCard: {
    width: '48%',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  selectedOptionCard: {
    borderWidth: 2,
    borderColor: '#2196F3',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  optionName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  minAmount: {
    fontSize: 12,
    color: '#2196F3',
    fontWeight: '500',
  },
  transactionsContainer: {
    marginHorizontal: 16,
    marginBottom: 24,
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  transactionLeft: {
    flex: 1,
  },
  transactionRight: {
    alignItems: 'flex-end',
  },
  transactionType: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  transactionAsset: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  transactionDate: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
});

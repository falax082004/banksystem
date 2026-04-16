import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/FontAwesome5';
import { FONT } from '../styles/typography';
import { pasapayService } from '../services/pasapayService';

const formatPeso = (value) => `₱${Math.round(Number(value || 0))}`;

const PasapayWalletScreen = ({ route, navigation }) => {
  const { userId } = route.params || {};
  const [wallet, setWallet] = useState({
    pasapayBalance: 0,
    pasapayTransactions: [],
  });
  const [loading, setLoading] = useState(true);
  const [cashInAmount, setCashInAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [cashInChannel, setCashInChannel] = useState('GCash');
  const [withdrawChannel, setWithdrawChannel] = useState('GCash');

  const loadWallet = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const nextWallet = await pasapayService.ensureWallet(userId);
      setWallet(nextWallet);
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to load Pasapay wallet.');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useFocusEffect(
    useCallback(() => {
      loadWallet();
    }, [loadWallet])
  );

  const handleCashIn = async () => {
    try {
      await pasapayService.cashIn(userId, cashInAmount, cashInChannel);
      setCashInAmount('');
      await loadWallet();
      Alert.alert('Pasapay Updated', 'Cash in completed successfully.');
    } catch (error) {
      Alert.alert('Cash In Failed', error.message || 'Unable to complete cash in.');
    }
  };

  const handleWithdraw = async () => {
    try {
      await pasapayService.withdraw(userId, withdrawAmount, withdrawChannel);
      setWithdrawAmount('');
      await loadWallet();
      Alert.alert('Withdrawal Submitted', 'Withdrawal completed with the Pasapay fee applied.');
    } catch (error) {
      Alert.alert('Withdrawal Failed', error.message || 'Unable to complete withdrawal.');
    }
  };

  const renderChannelPicker = (selected, onSelect) => (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.channelRow}>
      {pasapayService.paymentChannels.map((channel) => {
        const active = channel === selected;
        return (
          <TouchableOpacity
            key={channel}
            style={[styles.channelChip, active && styles.channelChipActive]}
            onPress={() => onSelect(channel)}
          >
            <Text style={[styles.channelChipText, active && styles.channelChipTextActive]}>{channel}</Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );

  const withdrawalFee = withdrawAmount ? pasapayService.getWithdrawalFee(withdrawAmount || 0) : 0;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.contentContainer}>
        <View style={styles.screenHeader}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Icon name="arrow-left" size={16} color="#333" />
          </TouchableOpacity>
          <Text style={styles.screenTitle}>Pasapay</Text>
        </View>

        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Pasapay Balance</Text>
          <Text style={styles.balanceValue}>{formatPeso(wallet.pasapayBalance)}</Text>
          <Text style={styles.balanceHint}>
            Cash-on-delivery orders require enough Pasapay balance before riders or pasabuyers can take them.
          </Text>
        </View>

        <View style={styles.panel}>
          <Text style={styles.sectionTitle}>Cash In</Text>
          {renderChannelPicker(cashInChannel, setCashInChannel)}
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            placeholder="Enter amount"
            value={cashInAmount}
            onChangeText={setCashInAmount}
          />
          <TouchableOpacity style={styles.primaryButton} onPress={handleCashIn}>
            <Icon name="plus-circle" size={16} color="#fff" />
            <Text style={styles.primaryButtonText}>Deposit to Pasapay</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.panel}>
          <Text style={styles.sectionTitle}>Withdraw</Text>
          {renderChannelPicker(withdrawChannel, setWithdrawChannel)}
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            placeholder="Enter amount"
            value={withdrawAmount}
            onChangeText={setWithdrawAmount}
          />
          <Text style={styles.feeText}>Withdrawal fee: {formatPeso(withdrawalFee)}</Text>
          <TouchableOpacity style={styles.secondaryButton} onPress={handleWithdraw}>
            <Icon name="arrow-circle-up" size={16} color="#333" />
            <Text style={styles.secondaryButtonText}>Withdraw from Pasapay</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.panel}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          {loading ? (
            <Text style={styles.emptyText}>Loading wallet activity...</Text>
          ) : wallet.pasapayTransactions?.length ? (
            <ScrollView style={styles.activityList} nestedScrollEnabled showsVerticalScrollIndicator={false}>
              {wallet.pasapayTransactions.map((transaction) => {
                const isDebit = transaction.type === 'withdrawal' || transaction.type === 'payment';
                const sign = isDebit ? '-' : '+';
                const iconName =
                  transaction.type === 'withdrawal'
                    ? 'arrow-up'
                    : transaction.type === 'cash_in'
                      ? 'arrow-down'
                      : transaction.type === 'payment'
                        ? 'minus-circle'
                        : 'wallet';
                return (
                  <View key={transaction.id} style={styles.transactionRow}>
                    <View style={styles.transactionIcon}>
                      <Icon name={iconName} size={14} color="#333" />
                    </View>
                    <View style={styles.transactionBody}>
                      <Text style={styles.transactionTitle}>{transaction.summary}</Text>
                      <Text style={styles.transactionMeta}>
                        {transaction.channel} • {new Date(transaction.createdAt).toLocaleString()}
                      </Text>
                    </View>
                    <Text style={styles.transactionAmount}>
                      {sign}{formatPeso(transaction.amount)}
                    </Text>
                  </View>
                );
              })}
            </ScrollView>
          ) : (
            <Text style={styles.emptyText}>No Pasapay transactions yet.</Text>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  contentContainer: {
    flex: 1,
    padding: 20,
  },
  screenHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  backButton: {
    width: 34,
    height: 34,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  screenTitle: {
    fontSize: FONT.titleSize,
    fontWeight: FONT.weightBold,
    color: FONT.headerColor,
  },
  balanceCard: {
    backgroundColor: '#333',
    borderRadius: 10,
    padding: 20,
    marginBottom: 16,
  },
  balanceLabel: {
    color: '#ddd',
    fontSize: FONT.smallSize,
  },
  balanceValue: {
    color: '#fff',
    fontSize: 32,
    fontWeight: 'bold',
    marginTop: 8,
  },
  balanceHint: {
    color: '#ddd',
    fontSize: FONT.smallSize,
    marginTop: 12,
    lineHeight: 18,
  },
  panel: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
  },
  activityList: {
    maxHeight: 260,
  },
  sectionTitle: {
    fontSize: FONT.bodySize,
    fontWeight: FONT.weightBold,
    color: FONT.headerColor,
    marginBottom: 12,
  },
  channelRow: {
    paddingBottom: 8,
  },
  channelChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    marginRight: 8,
    backgroundColor: '#fff',
  },
  channelChipActive: {
    backgroundColor: '#333',
    borderColor: '#333',
  },
  channelChipText: {
    color: '#333',
    fontSize: 13,
    fontWeight: '600',
  },
  channelChipTextActive: {
    color: '#fff',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: FONT.bodySize,
    color: FONT.headerColor,
    marginTop: 8,
    marginBottom: 12,
    backgroundColor: '#fff',
  },
  primaryButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#333',
    borderRadius: 8,
    paddingVertical: 14,
  },
  primaryButtonText: {
    color: '#fff',
    fontWeight: '600',
    marginLeft: 8,
  },
  secondaryButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    paddingVertical: 14,
  },
  secondaryButtonText: {
    color: '#333',
    fontWeight: '600',
    marginLeft: 8,
  },
  feeText: {
    color: FONT.mutedColor,
    fontSize: FONT.smallSize,
    marginBottom: 12,
  },
  transactionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  transactionIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  transactionBody: {
    flex: 1,
  },
  transactionTitle: {
    color: FONT.headerColor,
    fontSize: FONT.bodySize,
    fontWeight: '600',
  },
  transactionMeta: {
    color: FONT.mutedColor,
    fontSize: FONT.smallSize,
    marginTop: 2,
  },
  transactionAmount: {
    color: FONT.headerColor,
    fontSize: FONT.bodySize,
    fontWeight: 'bold',
  },
  emptyText: {
    color: FONT.mutedColor,
    fontSize: FONT.bodySize,
  },
});

export default PasapayWalletScreen;

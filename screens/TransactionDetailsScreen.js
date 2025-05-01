// screens/TransactionDetailsScreen.js
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const TransactionDetailsScreen = ({ route }) => {
  const { transaction } = route.params;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Transaction Details</Text>
      <Text style={styles.label}>Type:</Text>
      <Text style={styles.value}>{transaction.type}</Text>

      <Text style={styles.label}>Amount:</Text>
      <Text style={styles.value}>₱{transaction.amount}</Text>

      {transaction.to && (
        <>
          <Text style={styles.label}>To:</Text>
          <Text style={styles.value}>{transaction.to}</Text>
        </>
      )}

      {transaction.from && (
        <>
          <Text style={styles.label}>From:</Text>
          <Text style={styles.value}>{transaction.from}</Text>
        </>
      )}

      <Text style={styles.label}>Date:</Text>
      <Text style={styles.value}>
        {new Date(transaction.timestamp).toLocaleDateString(undefined, {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#f5f5f5' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  label: { fontSize: 16, fontWeight: '600', marginTop: 10 },
  value: { fontSize: 16, color: '#333' },
});

export default TransactionDetailsScreen;

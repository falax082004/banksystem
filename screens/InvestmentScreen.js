// screens/VoucherScreen.js
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const InvestmentScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Voucher Center</Text>
      <Text style={styles.subtitle}>You have no vouchers yet.</Text>
    </View>
  );
};

export default InvestmentScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#555',
  },
});

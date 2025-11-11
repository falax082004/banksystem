import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
import { FONT } from '../styles/typography';

const VoucherScreen = ({ navigation }) => {
  React.useLayoutEffect(() => {
    navigation.setOptions({
      title: 'Vouchers',
    });
  }, [navigation]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.subtitleContainer}>
        <Text style={styles.subtitle}>Apply vouchers at checkout to save</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.card}>
          <Text style={styles.voucherCode}>PASABUY50</Text>
          <Text style={styles.voucherDesc}>₱50 off service fee • Min spend ₱200</Text>
          <TouchableOpacity style={styles.applyBtn} disabled>
            <Text style={styles.applyText}>Apply at Checkout</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <Text style={styles.voucherCode}>FIRSTORDER</Text>
          <Text style={styles.voucherDesc}>10% off first order • Max ₱100</Text>
          <TouchableOpacity style={styles.applyBtn} disabled>
            <Text style={styles.applyText}>Apply at Checkout</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  subtitleContainer: {
    padding: 20,
    paddingTop: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  subtitle: { 
    fontSize: FONT.subtitleSize, 
    color: FONT.mutedColor,
  },
  content: { padding: 20 },
  card: { backgroundColor: '#fff', borderRadius: 8, borderWidth: 1, borderColor: '#ddd', padding: 16, marginBottom: 12 },
  voucherCode: { fontSize: FONT.bodySize, fontWeight: FONT.weightBold, color: FONT.headerColor },
  voucherDesc: { fontSize: FONT.smallSize, color: FONT.mutedColor, marginTop: 6 },
  applyBtn: { marginTop: 10, alignSelf: 'flex-start', backgroundColor: '#333', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 6 },
  applyText: { color: '#fff', fontWeight: '600' },
});

export default VoucherScreen;









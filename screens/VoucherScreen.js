import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome5';
import { FONT } from '../styles/typography';
import { useThemeMode } from '../theme/ThemeContext';

const VoucherScreen = ({ navigation }) => {
  const { isDark, colors } = useThemeMode();
  React.useLayoutEffect(() => {
    navigation.setOptions({
      title: 'Vouchers',
    });
  }, [navigation]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.subtitleContainer, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <View style={styles.headerRow}>
          <TouchableOpacity style={[styles.backButton, { borderColor: colors.border, backgroundColor: colors.surface }]} onPress={() => navigation.goBack()}>
            <Icon name="arrow-left" size={14} color={colors.text} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={[styles.title, { color: colors.text }]}>Vouchers</Text>
            <Text style={[styles.subtitle, { color: colors.mutedText }]}>Apply vouchers at checkout to save</Text>
          </View>
        </View>
      </View>

      <ScrollView style={styles.content}>
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.voucherCode, { color: colors.text }]}>PASABUY50</Text>
          <Text style={[styles.voucherDesc, { color: colors.mutedText }]}>₱50 off service fee • Min spend ₱200</Text>
          <TouchableOpacity style={[styles.applyBtn, { backgroundColor: isDark ? '#2F2F35' : '#333' }]} disabled>
            <Text style={styles.applyText}>Apply at Checkout</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.voucherCode, { color: colors.text }]}>FIRSTORDER</Text>
          <Text style={[styles.voucherDesc, { color: colors.mutedText }]}>10% off first order • Max ₱100</Text>
          <TouchableOpacity style={[styles.applyBtn, { backgroundColor: isDark ? '#2F2F35' : '#333' }]} disabled>
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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: FONT.titleSize,
    fontWeight: FONT.weightBold,
    color: FONT.headerColor,
    marginBottom: 2,
  },
  backButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    marginRight: 10,
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









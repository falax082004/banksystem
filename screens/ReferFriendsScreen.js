import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import Icon from 'react-native-vector-icons/FontAwesome5';
import { FONT } from '../styles/typography';

const ReferFriendsScreen = ({ route, navigation }) => {
  const { userId, fullName } = route.params || {};
  const displayName = fullName || 'A friend';
  const referralUrl = `https://pasabuy.app/ref?userId=${encodeURIComponent(userId || 'guest')}`;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}> 
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Icon name="arrow-left" size={14} color="#333" />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Invite a friend to Pasabuy</Text>
            <Text style={styles.subtitle}>{displayName} is inviting you to join Pasabuy.</Text>
          </View>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardLabel}>Your referral QR</Text>
        <View style={styles.qrWrapper}>
          <QRCode value={referralUrl} size={200} />
        </View>
        <Text style={styles.linkText} numberOfLines={1}>
          {referralUrl}
        </Text>
      </View>

      <View style={styles.noteBox}>
        <Text style={styles.noteText}>Share this QR or link. New users can scan to get started quickly.</Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    padding: 20,
  },
  header: {
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
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
  title: {
    fontSize: FONT.titleSize,
    fontWeight: FONT.weightBold,
    color: FONT.headerColor,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: FONT.smallSize,
    color: FONT.mutedColor,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e5e5',
    padding: 20,
    alignItems: 'center',
  },
  cardLabel: {
    fontSize: FONT.smallSize,
    color: FONT.secondaryMuted,
    marginBottom: 12,
  },
  qrWrapper: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#eee',
    marginBottom: 12,
  },
  linkText: {
    fontSize: FONT.smallSize,
    color: '#007AFF',
  },
  noteBox: {
    marginTop: 16,
    backgroundColor: '#F7FAFF',
    borderWidth: 1,
    borderColor: '#E3F2FF',
    borderRadius: 10,
    padding: 12,
  },
  noteText: {
    color: '#44607A',
    fontSize: FONT.smallSize,
  },
});

export default ReferFriendsScreen;

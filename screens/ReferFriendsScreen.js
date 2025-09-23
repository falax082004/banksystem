import React from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import QRCode from 'react-native-qrcode-svg';

const ReferFriendsScreen = ({ route }) => {
  const { userId, fullName } = route.params || {};
  const displayName = fullName || 'A friend';
  const referralUrl = `https://pasabuy.app/ref?userId=${encodeURIComponent(userId || 'guest')}`;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}> 
        <Text style={styles.title}>Invite a friend to Pasabuy</Text>
        <Text style={styles.subtitle}>{displayName} is inviting you to join Pasabuy.</Text>
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
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
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
    fontSize: 12,
    color: '#888',
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
    fontSize: 12,
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
    fontSize: 12,
  },
});

export default ReferFriendsScreen;

import React from 'react';
import { View, Text, Image, StyleSheet, ImageBackground } from 'react-native';
import QRCode from 'react-native-qrcode-svg';

const ReferFriendsScreen = ({ route }) => {
  const { userId, fullName } = route.params; // Retrieve fullName from route params

  return (
    <ImageBackground source={require('../assets/bgapp3.jpg')} style={{ flex: 1 }}>
      <View style={styles.overlay} />
      <View style={styles.container}>
        <Image source={require('../assets/apollo.png')} style={styles.avatar} />

        {/* Display Full Name */}
        <Text style={styles.name}>{fullName}</Text>

        {/* Invitation Text */}
        <Text style={styles.inviteText}>is inviting you to join Pantheon Bank.</Text>

        {/* QR Code */}
        <View style={styles.qrContainer}>
          <QRCode
            value={`https://pantheonbank.app/your-referral-link?userId=${userId}`} // Replace with your own referral URL
            size={180}
          />
        </View>

        {/* Footer Text */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Scan the QR Code to get started!</Text>
        </View>
      </View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  container: {
    flex: 1,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 20,
  },
  name: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
  },
  inviteText: {
    fontSize: 16,
    color: '#fff',
    marginBottom: 30,
  },
  qrContainer: {
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 },
    marginBottom: 40,
  },
  footer: {
    marginTop: 20,
  },
  footerText: {
    fontSize: 14,
    color: '#fff',
  },
});

export default ReferFriendsScreen;

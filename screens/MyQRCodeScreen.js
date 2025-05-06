import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import QRCode from 'react-native-qrcode-svg'; // Import QRCode component
import { useNavigation } from '@react-navigation/native'; // Import for navigation

const MyQRCodeScreen = () => {
  const [showQRCode, setShowQRCode] = useState(false); // State to toggle QR code visibility
  const [qrValue, setQrValue] = useState(''); // State to store dynamic QR code value
  const navigation = useNavigation(); // Hook to navigate between screens

  const toggleQRCode = () => {
    // Generate a new QR code value with a unique identifier (timestamp)
    const newQrValue = `https://example.com/pay/${new Date().getTime()}`;
    setQrValue(newQrValue);
    setShowQRCode(!showQRCode); // Toggle the QR code visibility
  };

  return (
    <View style={styles.container}>

      <Text style={styles.text}>My Pantheon QR Code</Text>
      
      {/* Button to show/hide the QR code */}
      <TouchableOpacity style={styles.button} onPress={toggleQRCode}>
        <Text style={styles.buttonText}>Pay Using QR Code</Text>
      </TouchableOpacity>

      {/* Conditionally render the QR code when the button is pressed */}
      {showQRCode && (
        <View style={styles.qrCodeContainer}>
          <QRCode
            value={qrValue} // Dynamic value for the QR code
            size={200}
            color="#ffffff" // Gold color for the QR code
            backgroundColor="#000000" // Light marble background
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#2a2a2a', // Dark stone-like background color for Pantheon theme
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  text: {
    fontSize: 24,
    marginBottom: 20,
    color: '#f0f0f0', // Light marble text color for contrast
    fontFamily: 'Times New Roman', // Classical font style
    textAlign: 'center',
    fontWeight: 'bold',
  },
  button: {
    backgroundColor: '#a9a9a9', // Gold background for Pantheon-inspired luxury
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 25,
    marginBottom: 20,
    elevation: 5, // Shadow effect to elevate the button
  },
  buttonText: {
    color: '#2a2a2a', // Dark text for the gold button
    fontWeight: 'bold',
    fontSize: 16,
  },
  qrCodeContainer: {
    marginTop: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0', // Marble-like background for QR code area
    padding: 10,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
 
});

export default MyQRCodeScreen;

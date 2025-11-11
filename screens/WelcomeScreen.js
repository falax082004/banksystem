import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Image } from 'react-native';
import { FONT } from '../styles/typography';

const WelcomeScreen = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.container}>
      {/* Orange Main Content Area */}
      <View style={styles.orangeSection}>
        {/* Logo */}
        <Image
          source={require('../assets/Pasabuy.png')}
          style={styles.logo}
        />
        
        {/* Brand Name */}
        <Text style={styles.brandName}>PASABUY</Text>
        
        {/* Tagline */}
        <Text style={styles.tagline}>Your trusted shopping and delivery partner.</Text>
        
    
      </View>

      {/* White Bottom Section */}
      <View style={styles.whiteSection}>
        {/* Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={styles.signUpButton}
            onPress={() => navigation.navigate('Register')}
          >
            <Text style={styles.signUpButtonText}>Sign Up</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.logInButton}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.logInButtonText}>Log In</Text>
          </TouchableOpacity>
        </View>

        {/* Help Text */}
        <View style={styles.helpContainer}>
          <Text style={styles.helpText}>
            Need help?{' '}
            <Text 
              style={styles.helpLink}
              onPress={() => navigation.navigate('Help')}
            >
              Visit our Help Centre.
            </Text>
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff', // White background
  },
  orangeSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingTop: 60,
    backgroundColor: '#fff',
  },
  logo: {
    width: 180,
    height: 180,
    resizeMode: 'contain',
    marginBottom: 20,
  },
  brandName: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 16,
    letterSpacing: 2,
  },
  tagline: {
    fontSize: 18,
    color: '#333',
    textAlign: 'center',
    marginBottom: 40,
    fontWeight: '500',
  },
  nextText: {
    fontSize: 16,
    color: '#666',
    marginTop: 'auto',
    marginBottom: 20,
    fontWeight: '500',
  },
  whiteSection: {
    backgroundColor: '#000',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 30,
    paddingTop: 30,
    paddingBottom: 40,
    alignItems: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
    marginBottom: 20,
    gap: 15,
  },
  signUpButton: {
    flex: 1,
    backgroundColor: '#fff', // White
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
  },
  signUpButtonText: {
    fontSize: FONT.bodySize,
    fontWeight: '600',
    color: '#000',
  },
  logInButton: {
    flex: 1,
    backgroundColor: '#333', // Dark gray
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#555',
  },
  logInButtonText: {
    fontSize: FONT.bodySize,
    fontWeight: '600',
    color: '#fff',
  },
  helpContainer: {
    marginTop: 10,
  },
  helpText: {
    fontSize: FONT.smallSize,
    color: '#ccc',
    textAlign: 'center',
  },
  helpLink: {
    color: '#fff',
    fontWeight: '500',
    textDecorationLine: 'underline',
  },
});

export default WelcomeScreen;


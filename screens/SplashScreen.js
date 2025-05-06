import React, { useEffect } from 'react';
import { View, Image, Text, StyleSheet } from 'react-native';
import * as Animatable from 'react-native-animatable';

const SplashScreen = ({ navigation }) => {
  useEffect(() => {
    const timeout = setTimeout(() => {
      navigation.replace('Login'); // Navigate to Login after 2.5s
    }, 2500);

    return () => clearTimeout(timeout);
  }, [navigation]);

  return (
    <View style={styles.container}>
      <Animatable.Image
        animation="fadeInDown"
        duration={1500}
        source={require('../assets/pantheonnn.png')} // Replace with your actual logo
        style={styles.logo}
      />
      <Animatable.Text animation="fadeInUp" delay={1000} style={styles.tagline}>
        Securing Your Future
      </Animatable.Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f2f2f2', // Light background
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 200,
    height: 200,
    resizeMode: 'contain',
    marginBottom: 20,
  },
  tagline: {
    fontSize: 22,
    color: '#333',
    fontWeight: '500',
    fontStyle: 'italic',
  },
});

export default SplashScreen;

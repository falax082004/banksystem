// screens/PromosScreen.js
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const PromosScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Promos</Text>
      <Text style={styles.subtitle}>Check out our latest promos here!</Text>
    </View>
  );
};

export default PromosScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
});

// screens/PartnersScreen.js
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const PartnersScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Our Partners</Text>
      <Text style={styles.description}>Partner listings will be shown here.</Text>
    </View>
  );
};

export default PartnersScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    color: '#666',
  },
});

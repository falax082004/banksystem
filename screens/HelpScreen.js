// screens/HelpCenterScreen.js
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const HelpCenterScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Help Center</Text>
      <Text style={styles.description}>
        Need assistance? Here’s where you’ll find FAQs, contact info, and support resources.
      </Text>
    </View>
  );
};

export default HelpCenterScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    color: '#666',
  },
});

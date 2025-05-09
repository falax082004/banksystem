import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ImageBackground
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';

const MyLinkedAccountsScreen = ({ navigation, route }) => {
  const { userId } = route.params; // Get userId from route params

  const accounts = [
    { icon: 'credit-card', name: 'Pantheon Card', isAvailable: true },
    { icon: 'paypal', name: 'PayPal', isAvailable: false },
    { icon: 'university', name: 'BPI', isAvailable: false },
    { icon: 'bank', name: 'UnionBank', isAvailable: false },
  ];

  const handlePress = (account) => {
    if (!account.isAvailable) {
      Alert.alert('Coming Soon!', `${account.name} integration is coming soon!`);
    } else {
      if (account.name === 'Pantheon Card') {
        // Navigate to CardScreen and pass the userId
        navigation.navigate('CardScreen', { userId });
      }
    }
  };

  return (
    <ImageBackground source={require('../assets/bgapp3.jpg')} style={styles.background}>
      <View style={styles.overlay} />
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.header}>Linked Accounts</Text>
        {accounts.map((account, index) => (
          <TouchableOpacity
            key={index}
            style={styles.accountCard}
            onPress={() => handlePress(account)}
          >
            <View style={styles.cardContent}>
              <Icon name={account.icon} size={24} color="#FFFFFF" />
              <Text style={styles.accountText}>{account.name}</Text>
            </View>
            <Icon name="angle-right" size={20} color="#CCCCCC" />
          </TouchableOpacity>
        ))}
      </ScrollView>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  background: {
    flex: 1,
    resizeMode: 'cover',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  container: {
    flexGrow: 1,
    backgroundColor: 'transparent',
    padding: 20,
  },
  header: {
    fontSize: 22,
    color: '#FFFFFF',
    fontWeight: 'bold',
    marginBottom: 20,
  },
  accountCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    padding: 15,
    marginBottom: 15,
    borderRadius: 10,
    shadowColor: '#FFFFFF',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  accountText: {
    marginLeft: 15,
    fontSize: 16,
    color: '#FFFFFF',
  },
});

export default MyLinkedAccountsScreen;

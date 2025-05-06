import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert
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
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>Linked Accounts</Text>
      {accounts.map((account, index) => (
        <TouchableOpacity
          key={index}
          style={styles.accountCard}
          onPress={() => handlePress(account)}
        >
          <View style={styles.cardContent}>
            <Icon name={account.icon} size={24} color="#FFF" />
            <Text style={styles.accountText}>{account.name}</Text>
          </View>
          <Icon name="angle-right" size={20} color="#888" />
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#333',
    padding: 20,
  },
  header: {
    fontSize: 22,
    color: '#FFF',
    fontWeight: 'bold',
    marginBottom: 20,
  },
  accountCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#444',
    padding: 15,
    marginBottom: 15,
    borderRadius: 10,
    shadowColor: '#000',
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
    color: '#FFF',
  },
});

export default MyLinkedAccountsScreen;

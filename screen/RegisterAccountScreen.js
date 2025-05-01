import React, { useState } from 'react';
import { View, Text, TextInput, Button, Alert, StyleSheet } from 'react-native';
import { db } from '../firebaseConfig';
import { ref, set } from 'firebase/database';

const RegisterAccountScreen = ({ navigation }) => {
  const [id, setId] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [age, setAge] = useState('');

  const registerAccount = async () => {
    if (!id.trim() || !firstName.trim() || !lastName.trim() || !age.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    try {
      await set(ref(db, 'users/' + id), {
        id: id,
        firstName: firstName,
        lastName: lastName,
        age: parseInt(age, 10),
        createdAt: new Date().toISOString(),
      });

      Alert.alert('Success', 'Account registered successfully!');
      setId('');
      setFirstName('');
      setLastName('');
      setAge('');
      navigation.navigate('Login');
    } catch (error) {
      console.error('Error adding document: ', error);
      Alert.alert('Error', 'Failed to register account');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>ID:</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter ID"
        value={id}
        onChangeText={setId}
        keyboardType="numeric"
      />
      <Text style={styles.label}>First Name:</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter First Name"
        value={firstName}
        onChangeText={setFirstName}
      />
      <Text style={styles.label}>Last Name:</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter Last Name"
        value={lastName}
        onChangeText={setLastName}
      />
      <Text style={styles.label}>Age:</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter Age"
        value={age}
        onChangeText={setAge}
        keyboardType="numeric"
      />
      <Button title="Register Account" onPress={registerAccount} color="#6200ea" />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
  },
  label: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
    backgroundColor: '#fff',
    marginBottom: 20,
  },
});

export default RegisterAccountScreen;

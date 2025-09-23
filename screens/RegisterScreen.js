import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { db, ref, set, get } from '../firebaseConfig';

const RegisterScreen = ({ navigation }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleRegister = async () => {
    setErrorMessage('');
    setSuccessMessage('');

    if (!name.trim() || !email.trim() || !username.trim() || !password.trim() || !confirmPassword.trim()) {
      setErrorMessage('Please fill out all fields');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match');
      return;
    }

    try {
      const usersRef = ref(db, 'users/');
      const snapshot = await get(usersRef);

      let emailExists = false;
      let usernameExists = false;

      snapshot.forEach((childSnapshot) => {
        const userData = childSnapshot.val();
        if (userData.email === email) emailExists = true;
        if (childSnapshot.key === username) usernameExists = true;
      });

      if (emailExists) {
        setErrorMessage('Email already taken');
        return;
      }

      if (usernameExists) {
        setErrorMessage('Username already taken');
        return;
      }

      const newUserRef = ref(db, 'users/' + username);
      await set(newUserRef, {
        name,
        email,
        username,
        password,
      });

      setSuccessMessage('Account Created Successfully!');
      navigation.navigate('Login');
    } catch (error) {
      setErrorMessage('Registration failed. Please try again.');
    }
  };

  return (
    <View style={styles.background}>
      <View style={styles.container}>
        <View style={styles.formContainer}>
          <Text style={styles.headerText}>PASABUY</Text>
          <Text style={styles.subtitleText}>Create your account</Text>
          {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
          {successMessage ? <Text style={styles.successText}>{successMessage}</Text> : null}

          <TextInput
            style={styles.input}
            placeholder="Full Name"
            value={name}
            onChangeText={setName}
          />
          <TextInput
            style={styles.input}
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
          />
          <TextInput
            style={styles.input}
            placeholder="Username"
            value={username}
            onChangeText={setUsername}
          />
          <TextInput
            style={styles.input}
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
          <TextInput
            style={styles.input}
            placeholder="Confirm Password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
          />

          <TouchableOpacity style={styles.registerButton} onPress={handleRegister}>
            <Text style={styles.registerButtonText}>Register</Text>
          </TouchableOpacity>

          <View style={styles.loginLinkContainer}>
            <Text style={styles.loginLinkText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.loginLink}>Login</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  background: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  formContainer: {
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    width: '80%',
    borderWidth: 2,
    borderColor: '#ddd',
  },
  headerText: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
    letterSpacing: 2,
  },
  subtitleText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    height: 50,
    width: '100%',
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    paddingLeft: 15,
    marginBottom: 15,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  errorText: {
    color: 'red',
    marginBottom: 10,
  },
  successText: {
    color: 'green',
    marginBottom: 10,
  },
  registerButton: {
    backgroundColor: '#333',
    padding: 15,
    borderRadius: 8,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  registerButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  loginLinkContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  loginLinkText: {
    fontSize: 16,
    color: '#333',
  },
  loginLink: {
    fontSize: 16,
    color: '#000',
    fontWeight: 'bold',
  },
});

export default RegisterScreen;

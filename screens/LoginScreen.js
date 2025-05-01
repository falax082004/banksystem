import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, Alert, Image, Text, StyleSheet, ImageBackground } from 'react-native';
import { db, ref, get } from '../firebaseConfig';

const LoginScreen = ({ navigation }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      Alert.alert('Error', 'Please enter both username and password.');
      return;
    }

    const userRef = ref(db, 'users/' + username);
    const snapshot = await get(userRef);

    if (!snapshot.exists()) {
      Alert.alert('Error', 'Invalid username. Please try again.');
      return;
    }

    const userData = snapshot.val();
    if (userData.password !== password) {
      Alert.alert('Error', 'Incorrect password. Please check and try again.');
      return;
    }

    // Successful login, navigate to home
    navigation.navigate('Home', { userId: username });
  };

  return (
    <ImageBackground
      source={require('../assets/bgapp3.jpg')}  // Background image
      style={styles.background}
      resizeMode="cover"
    >
      {/* Adding a dark overlay for readability */}
      <View style={styles.overlay} />

      <View style={styles.container}>
        {/* Removed Avatar Image */}
        <Image source={require('../assets/pantheon.png')} style={styles.headerImage} />

        {/* Username input */}
        <TextInput
          style={styles.input}
          placeholder="Username"
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
        />

        {/* Password input */}
        <TextInput
          style={styles.input}
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry={true}
          autoCapitalize="none"
        />

        {/* Login button */}
        <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
          <Text style={styles.buttonText}>Login</Text>
        </TouchableOpacity>

        {/* Register link */}
        <View style={styles.registerContainer}>
          <Text style={styles.registerText}>Doesn't have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Register')}>
            <Text style={styles.registerLink}>Register</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // Dark overlay for better text visibility
  },
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center', // Center the content
    backgroundColor: 'rgba(255, 255, 255, 0.8)', // Slightly white translucent overlay
    borderRadius: 15,
    marginHorizontal: 20,
  },
  headerImage: {
    width: 300,
    height: 280,
    resizeMode: 'contain',
    alignSelf: 'center',
    marginBottom: 40,
    transform: [{ scale: 1.05 }],
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
  loginButton: {
    backgroundColor: '#000',
    paddingVertical: 15,
    borderRadius: 8,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    elevation: 2,
  },
  buttonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  registerText: {
    fontSize: 16,
    color: '#333',
  },
  registerLink: {
    fontSize: 16,
    color: '#000',
    fontWeight: 'bold',
  },
});

export default LoginScreen;

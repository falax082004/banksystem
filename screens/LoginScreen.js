import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, Alert, Image, Text, StyleSheet, ImageBackground, Modal, ScrollView } from 'react-native';
import { db, ref, get, update, set, serverTimestamp } from '../firebaseConfig';
import Icon from 'react-native-vector-icons/Feather';

const LoginScreen = ({ navigation }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [forgotPasswordModal, setForgotPasswordModal] = useState(false);
  const [resetStep, setResetStep] = useState(1); // 1: email, 2: questions, 3: new password
  const [email, setEmail] = useState('');
  const [answers, setAnswers] = useState(['', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [supportModal, setSupportModal] = useState(false);
  const [supportMessage, setSupportMessage] = useState('');
  const [supportEmail, setSupportEmail] = useState('');

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

  const handleForgotPassword = () => {
    setForgotPasswordModal(true);
    setResetStep(1);
    setEmail('');
    setAnswers(['', '', '']);
    setNewPassword('');
    setConfirmPassword('');
    setCurrentUser(null);
  };

  const verifyEmail = async () => {
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter your email address.');
      return;
    }

    if (!username.trim()) {
      Alert.alert('Error', 'Please enter your username first.');
      return;
    }

    const userRef = ref(db, 'users/' + username);
    const snapshot = await get(userRef);

    if (!snapshot.exists()) {
      Alert.alert('Error', 'User not found.');
      return;
    }

    const userData = snapshot.val();
    
    // Check if email exists and matches
    if (!userData.email) {
      Alert.alert('Error', 'No email found for this account. Please contact support.');
      setForgotPasswordModal(false);
      return;
    }

    if (userData.email.toLowerCase() !== email.toLowerCase()) {
      Alert.alert('Error', 'Email does not match our records.');
      return;
    }

    // Check if security questions exist
    if (!userData.securityQuestions || !Array.isArray(userData.securityQuestions) || userData.securityQuestions.length === 0) {
      Alert.alert('Error', 'No security questions found for this account. Please contact support.');
      setForgotPasswordModal(false);
      return;
    }

    console.log('Security Questions:', userData.securityQuestions); // Debug log
    setCurrentUser(userData);
    setResetStep(2);
  };

  const verifyAnswers = async () => {
    if (answers.some(answer => !answer.trim())) {
      Alert.alert('Error', 'Please answer all security questions.');
      return;
    }

    // Get the correct answers from the database
    const correctAnswers = currentUser.securityAnswers.map(answer => 
      answer.toLowerCase().trim()
    );

    // Get user's answers and normalize them
    const userAnswers = answers.map(a => a.toLowerCase().trim());

    // Debug logs
    console.log('Correct Answers:', correctAnswers);
    console.log('User Answers:', userAnswers);

    // Check if all answers match
    const allCorrect = correctAnswers.every((correct, index) => correct === userAnswers[index]);

    if (allCorrect) {
      // If all answers are correct, proceed to password reset
      setResetStep(3);
    } else {
      // If any answer is wrong, show error
      Alert.alert('Invalid Answer', 'One or more answers are incorrect. Please try again.');
    }
  };

  const resetPassword = async () => {
    if (!newPassword.trim() || !confirmPassword.trim()) {
      Alert.alert('Error', 'Please enter and confirm your new password.');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match.');
      return;
    }

    try {
      const userRef = ref(db, 'users/' + username);
      await update(userRef, {
        password: newPassword
      });

      Alert.alert('Success', 'Password has been reset successfully.', [
        {
          text: 'OK',
          onPress: () => {
            setForgotPasswordModal(false);
            // Reset all states
            setResetStep(1);
            setEmail('');
            setAnswers(['', '', '']);
            setNewPassword('');
            setConfirmPassword('');
            setCurrentUser(null);
          }
        }
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to reset password. Please try again.');
    }
  };

  const handleSupport = () => {
    setSupportModal(true);
    setSupportMessage('');
    setSupportEmail('');
  };

  const submitSupportRequest = async () => {
    if (!supportEmail.trim() || !supportMessage.trim()) {
      Alert.alert('Error', 'Please fill in all fields.');
      return;
    }

    try {
      const supportRef = ref(db, 'supportRequests');
      await set(supportRef, {
        email: supportEmail,
        message: supportMessage,
        timestamp: serverTimestamp(),
        status: 'pending'
      });

      Alert.alert('Success', 'Your support request has been submitted. We will contact you soon.');
      setSupportModal(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to submit support request. Please try again.');
    }
  };

  const renderResetStep = () => {
    switch (resetStep) {
      case 1:
        return (
          <View>
            <Text style={styles.modalTitle}>Reset Password</Text>
            <Text style={styles.modalSubtitle}>Enter your email address</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <TouchableOpacity style={styles.modalButton} onPress={verifyEmail}>
              <Text style={styles.modalButtonText}>Continue</Text>
            </TouchableOpacity>
          </View>
        );
      case 2:
        return (
          <ScrollView>
            <Text style={styles.modalTitle}>Security Questions</Text>
            <Text style={styles.modalSubtitle}>Answer your security questions</Text>
            {currentUser && currentUser.securityQuestions && currentUser.securityQuestions.map((question, index) => (
              <View key={index} style={styles.questionContainer}>
                <Text style={styles.questionText}>
                  Question {index + 1}: {question}
                </Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder={`Answer for question ${index + 1}`}
                  value={answers[index]}
                  onChangeText={(text) => {
                    const newAnswers = [...answers];
                    newAnswers[index] = text;
                    setAnswers(newAnswers);
                  }}
                  autoCapitalize="none"
                />
              </View>
            ))}
            <TouchableOpacity style={styles.modalButton} onPress={verifyAnswers}>
              <Text style={styles.modalButtonText}>Verify Answers</Text>
            </TouchableOpacity>
          </ScrollView>
        );
      case 3:
        return (
          <View>
            <Text style={styles.modalTitle}>New Password</Text>
            <Text style={styles.modalSubtitle}>Enter your new password</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="New Password"
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry
            />
            <TextInput
              style={styles.modalInput}
              placeholder="Confirm New Password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
            />
            <TouchableOpacity style={styles.modalButton} onPress={resetPassword}>
              <Text style={styles.modalButtonText}>Reset Password</Text>
            </TouchableOpacity>
          </View>
        );
    }
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

        {/* Forgot Password button */}
        <TouchableOpacity onPress={handleForgotPassword} style={styles.forgotPasswordContainer}>
          <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
        </TouchableOpacity>

        {/* Register link */}
        <View style={styles.registerContainer}>
          <Text style={styles.registerText}>Doesn't have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Register')}>
            <Text style={styles.registerLink}>Register</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.supportButton} onPress={handleSupport}>
          <Icon name="help-circle" size={24} color="#000" />
          <Text style={styles.supportButtonText}>Need Help?</Text>
        </TouchableOpacity>
      </View>

      <Modal
        visible={forgotPasswordModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setForgotPasswordModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setForgotPasswordModal(false)}
            >
              <Text style={styles.closeButtonText}>×</Text>
            </TouchableOpacity>
            {renderResetStep()}
          </View>
        </View>
      </Modal>

      <Modal
        visible={supportModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setSupportModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setSupportModal(false)}
            >
              <Text style={styles.closeButtonText}>×</Text>
            </TouchableOpacity>
            
            <View style={styles.supportHeader}>
              <Icon name="help-circle" size={40} color="#000" />
              <Text style={styles.modalTitle}>Contact Support</Text>
            </View>
            
            <Text style={styles.modalSubtitle}>We're here to help you</Text>
            
            <TextInput
              style={styles.modalInput}
              placeholder="Your Email"
              value={supportEmail}
              onChangeText={setSupportEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            
            <TextInput
              style={[styles.modalInput, styles.messageInput]}
              placeholder="How can we help you?"
              value={supportMessage}
              onChangeText={setSupportMessage}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
            
            <TouchableOpacity style={styles.modalButton} onPress={submitSupportRequest}>
              <Text style={styles.modalButtonText}>Submit Request</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
    marginTop: 1,
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
  forgotPasswordContainer: {
    marginTop: 5,
    marginBottom: 20,
  },
  forgotPasswordText: {
    color: '#000',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    width: '90%',
    maxWidth: 400,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 10,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalInput: {
    height: 50,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 15,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  modalButton: {
    backgroundColor: '#000',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  closeButton: {
    position: 'absolute',
    right: 15,
    top: 15,
    zIndex: 1,
  },
  closeButtonText: {
    fontSize: 24,
    color: '#000',
    fontWeight: 'bold',
  },
  questionContainer: {
    marginBottom: 20,
    backgroundColor: '#f5f5f5',
    padding: 15,
    borderRadius: 8,
  },
  questionText: {
    fontSize: 16,
    color: '#000',
    marginBottom: 10,
    fontWeight: '500',
  },
  supportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 85,
    padding: 10,
  },
  supportButtonText: {
    color: '#000',
    fontSize: 16,
    marginLeft: 8,
    fontWeight: '600',
  },
  supportHeader: {
    alignItems: 'center',
    marginBottom: 15,
  },
  messageInput: {
    height: 120,
    paddingTop: 15,
    textAlignVertical: 'top',
  },
});

export default LoginScreen;

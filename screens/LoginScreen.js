import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, Alert, Text, StyleSheet, Modal, Image } from 'react-native';
import { db, ref, get, update, set, push } from '../firebaseConfig';
import Icon from 'react-native-vector-icons/Feather';
import { FONT } from '../styles/typography';

const LoginScreen = ({ navigation }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [forgotPasswordModal, setForgotPasswordModal] = useState(false);
  const [resetStep, setResetStep] = useState(1); // 1: email, 2: new password
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [foundUsername, setFoundUsername] = useState(null);
  const [supportModal, setSupportModal] = useState(false);
  const [supportMessage, setSupportMessage] = useState('');
  const [supportEmail, setSupportEmail] = useState('');
  const [showPassword, setShowPassword] = useState(false);

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

    if (username === 'admin' && userData.role === 'admin') {
      navigation.navigate('AdminDashboard');
      return;
    }

    if (userData.approvalStatus === 'pending' && !userData.role) {
      Alert.alert('Pending Approval', 'Your application is pending admin approval. Please wait for confirmation.');
      return;
    }

    // Rejected applicants can still log in as shopper and apply again from Profile.

    const unreadRef = ref(db, `users/${username}/notifications`);
    const unreadSnapshot = await get(unreadRef);
    if (unreadSnapshot.exists()) {
      const unreadRows = Object.keys(unreadSnapshot.val())
        .map((id) => ({ id, ...unreadSnapshot.val()[id] }))
        .filter((x) => x.read !== true)
        .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
      if (unreadRows.length > 0) {
        Alert.alert('Notifications', unreadRows[0].message || 'You have new notifications.');
      }
    }

    navigation.navigate('Home', { userId: username });
  };

  const handleForgotPassword = () => {
    setForgotPasswordModal(true);
    setResetStep(1);
    setEmail('');
    setNewPassword('');
    setConfirmPassword('');
    setFoundUsername(null);
  };

  const verifyEmail = async () => {
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter your email address.');
      return;
    }

    try {
      // Search for user by email
      const usersRef = ref(db, 'users/');
      const snapshot = await get(usersRef);

      if (!snapshot.exists()) {
        Alert.alert('Error', 'No users found in the system.');
        return;
      }

      let userFound = false;
      let matchingUsername = null;

      snapshot.forEach((childSnapshot) => {
        const userData = childSnapshot.val();
        if (userData.email && userData.email.toLowerCase() === email.toLowerCase()) {
          userFound = true;
          matchingUsername = childSnapshot.key;
          return;
        }
      });

      if (!userFound) {
        Alert.alert('Error', 'No account found with this email address.');
        return;
      }

      // Email found, proceed to password reset
      setFoundUsername(matchingUsername);
      setResetStep(2);
    } catch (error) {
      Alert.alert('Error', 'Failed to verify email. Please try again.');
      console.error('Error verifying email:', error);
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

    if (!foundUsername) {
      Alert.alert('Error', 'User information not found. Please try again.');
      return;
    }

    try {
      const userRef = ref(db, 'users/' + foundUsername);
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
            setNewPassword('');
            setConfirmPassword('');
            setFoundUsername(null);
          }
        }
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to reset password. Please try again.');
      console.error('Error resetting password:', error);
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
      const ticketRef = push(ref(db, 'supportTickets'));
      const ticketId = ticketRef.key;
      await set(ticketRef, {
        id: ticketId,
        userId: foundUsername || null,
        email: supportEmail,
        subject: 'Login Support Inquiry',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: 'open',
        source: 'login',
      });
      const msgRef = push(ref(db, `supportTickets/${ticketId}/messages`));
      await set(msgRef, {
        senderId: foundUsername || null,
        senderRole: 'user',
        text: supportMessage,
        createdAt: new Date().toISOString(),
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
    <View style={styles.background}>
      <View style={styles.container}>
        {/* Logo */}
        <Image
          source={require('../assets/Pasabuy.png')}
          style={styles.logo}
        />
        {/* Low-fidelity header */}
        <Text style={styles.headerText}>PASABUY</Text>
        <Text style={styles.subtitleText}>Login to your account</Text>

        {/* Username input */}
        <TextInput
          style={styles.input}
          placeholder="Username"
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
        />

        {/* Password input with eye icon */}
        <View style={styles.passwordInputContainer}>
          <TextInput
            style={[styles.input, { flex: 1, marginBottom: 0 }]}
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            autoCapitalize="none"
          />
          <TouchableOpacity
            style={styles.eyeIcon}
            onPress={() => setShowPassword((prev) => !prev)}
            accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
          >
            <Icon name={showPassword ? 'eye' : 'eye-off'} size={22} color="#888" />
          </TouchableOpacity>
        </View>

        {/* Login button */}
        <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
          <Text style={styles.buttonText}>Login</Text>
        </TouchableOpacity>

        {/* Grouped bottom actions */}
        <View style={styles.bottomActionsContainer}>
          <TouchableOpacity onPress={handleForgotPassword} style={styles.forgotPasswordContainer}>
            <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
          </TouchableOpacity>

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
    </View>
  );
};

const styles = StyleSheet.create({
  background: {
    flex: 1,
    backgroundColor: '#f5f5f5', // Simple light gray background
  },
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff', // Simple white container
    marginHorizontal: 20,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#ddd',
  },
  logo: {
    width: 150,
    height: 150,
    resizeMode: 'contain',
    marginBottom: 20,
  },
  headerText: {
    fontSize: FONT.titleSize,
    fontWeight: FONT.weightBold,
    color: FONT.headerColor,
    marginBottom: 8,
    letterSpacing: 2,
  },
  subtitleText: {
    fontSize: FONT.subtitleSize,
    color: FONT.mutedColor,
    marginBottom: 40,
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
  fontSize: FONT.bodySize,
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
    fontSize: FONT.bodySize,
    color: '#fff',
    fontWeight: '600',
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 1,
  },
  registerText: {
    fontSize: FONT.bodySize,
    color: FONT.headerColor,
  },
  registerLink: {
    fontSize: FONT.bodySize,
    color: FONT.headerColor,
    fontWeight: 'bold',
  },
  forgotPasswordContainer: {
    marginTop: 5,
    marginBottom: 20,
  },
  forgotPasswordText: {
    color: FONT.headerColor,
    fontSize: FONT.smallSize,
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
    fontSize: FONT.titleSize,
    fontWeight: FONT.weightBold,
    color: FONT.headerColor,
    marginBottom: 10,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: FONT.subtitleSize,
    color: FONT.mutedColor,
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
    fontSize: FONT.bodySize,
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
    fontSize: FONT.bodySize,
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
    fontSize: FONT.bodySize,
    color: FONT.headerColor,
    marginBottom: 10,
    fontWeight: '500',
  },
  supportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 90,
    padding: 10,
  },
  supportButtonText: {
    color: FONT.headerColor,
    fontSize: FONT.bodySize,
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
  bottomActionsContainer: {
    marginTop: 10,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  passwordInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginBottom: 15,
  },
  eyeIcon: {
    position: 'absolute',
    right: 15,
    padding: 8,
    zIndex: 2,
  },
});

export default LoginScreen;

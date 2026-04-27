import React, { useMemo, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { auth, db, ref, get, update, createUserWithEmailAndPassword } from '../firebaseConfig';
import { deleteUser } from 'firebase/auth';
import { BATANGAS_LOCATION_OPTIONS } from '../constants/batangasLocations';
import { useThemeMode } from '../theme/ThemeContext';

const RegisterScreen = ({ navigation }) => {
  const { isDark, colors } = useThemeMode();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [selectedArea, setSelectedArea] = useState(null);
  const [selectedBarangay, setSelectedBarangay] = useState('');
  const [showAreaDropdown, setShowAreaDropdown] = useState(false);
  const [showBarangayDropdown, setShowBarangayDropdown] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const barangayOptions = useMemo(() => selectedArea?.barangays || [], [selectedArea]);

  const handleRegister = async () => {
    setErrorMessage('');
    setSuccessMessage('');

    if (!name.trim() || !email.trim() || !username.trim() || !password.trim() || !confirmPassword.trim()) {
      setErrorMessage('Please fill out all fields');
      return;
    }

    if (!selectedArea || !selectedBarangay) {
      setErrorMessage('Please choose your area and barangay in Batangas');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match');
      return;
    }

    try {
      const normalizedUsername = username.trim();
      const usernameKey = normalizedUsername.toLowerCase();
      const usernameIndexRef = ref(db, `usernames/${usernameKey}`);
      const usernameTakenSnapshot = await get(usernameIndexRef);
      if (usernameTakenSnapshot.exists()) {
        setErrorMessage('Username already taken');
        return;
      }

      const credentials = await createUserWithEmailAndPassword(auth, email.trim(), password.trim());
      const uid = credentials.user.uid;

      const usersRef = ref(db);
      const derivedAddress = `${selectedBarangay}, ${selectedArea.label}, Batangas`;
      try {
        const recheckUsernameSnapshot = await get(usernameIndexRef);
        if (recheckUsernameSnapshot.exists()) {
          await deleteUser(credentials.user).catch(() => {});
          setErrorMessage('Username already taken');
          return;
        }

        await update(usersRef, {
          [`users/${uid}`]: {
            name: name.trim(),
            email: email.trim(),
            username: normalizedUsername,
            usernameKey,
            accountUsername: normalizedUsername,
            area: selectedArea.label,
            barangay: selectedBarangay,
            address: derivedAddress,
            homeLocation: selectedArea.coordinates,
            role: 'shopper',
            approvalStatus: 'approved',
            pasabuyerEnabled: false,
            createdAt: new Date().toISOString(),
            pasapayBalance: 0,
            pasapayTransactions: [],
          },
          [`usernames/${usernameKey}`]: uid,
        });
      } catch (dbError) {
        // Keep Auth and DB in sync if profile write fails.
        await deleteUser(credentials.user).catch(() => {});
        throw dbError;
      }

      setSuccessMessage('Account Created Successfully!');
      navigation.navigate('Login');
    } catch (error) {
      console.error('Registration failed:', error);
      if (error?.code === 'auth/email-already-in-use') {
        setErrorMessage('Email already taken');
      } else if (error?.code === 'auth/invalid-email') {
        setErrorMessage('Invalid email address');
      } else if (error?.code === 'auth/weak-password') {
        setErrorMessage('Password should be at least 6 characters');
      } else if (error?.code === 'auth/configuration-not-found') {
        setErrorMessage('Firebase Auth is not configured. Enable Email/Password sign-in in Firebase Console.');
      } else if (String(error?.code || '').toLowerCase().includes('permission_denied')) {
        setErrorMessage('Database permission denied for username index. Add `usernames` rules in Firebase.');
      } else if (String(error?.message || '').toLowerCase().includes('permission_denied')) {
        setErrorMessage('Database permission denied. Please check Firebase Realtime Database rules.');
      } else {
        setErrorMessage(`Registration failed: ${error?.message || 'Please try again.'}`);
      }
    }
  };

  return (
    <View style={[styles.background, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={[styles.formContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.headerText, { color: colors.text }]}>PASABUY</Text>
          <Text style={[styles.subtitleText, { color: colors.mutedText }]}>Create your account</Text>
          {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
          {successMessage ? <Text style={styles.successText}>{successMessage}</Text> : null}

          <TextInput
            style={[styles.input, { borderColor: colors.border, backgroundColor: colors.surface, color: colors.text }]}
            placeholder="Full Name"
            placeholderTextColor={colors.mutedText}
            value={name}
            onChangeText={setName}
          />
          <TextInput
            style={[styles.input, { borderColor: colors.border, backgroundColor: colors.surface, color: colors.text }]}
            placeholder="Email"
            placeholderTextColor={colors.mutedText}
            value={email}
            onChangeText={setEmail}
          />
          <TextInput
            style={[styles.input, { borderColor: colors.border, backgroundColor: colors.surface, color: colors.text }]}
            placeholder="Username"
            placeholderTextColor={colors.mutedText}
            value={username}
            onChangeText={setUsername}
          />
          <TextInput
            style={[styles.input, { borderColor: colors.border, backgroundColor: colors.surface, color: colors.text }]}
            placeholder="Password"
            placeholderTextColor={colors.mutedText}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
          <TextInput
            style={[styles.input, { borderColor: colors.border, backgroundColor: colors.surface, color: colors.text }]}
            placeholder="Confirm Password"
            placeholderTextColor={colors.mutedText}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
          />

          <TouchableOpacity
            style={[styles.dropdownTrigger, { borderColor: colors.border, backgroundColor: colors.surface }]}
            onPress={() => {
              setShowAreaDropdown((value) => !value);
              setShowBarangayDropdown(false);
            }}
          >
            <Text style={[selectedArea ? styles.dropdownValue : styles.dropdownPlaceholder, { color: selectedArea ? colors.text : colors.mutedText }]}>
              {selectedArea ? selectedArea.label : 'Choose area in Batangas'}
            </Text>
          </TouchableOpacity>
          {showAreaDropdown && (
            <ScrollView style={[styles.dropdownList, { borderColor: colors.border, backgroundColor: colors.surface }]} nestedScrollEnabled showsVerticalScrollIndicator={false}>
              {BATANGAS_LOCATION_OPTIONS.map((area) => (
                <TouchableOpacity
                  key={area.key}
                  style={[styles.dropdownItem, { borderBottomColor: colors.border }]}
                  onPress={() => {
                    setSelectedArea(area);
                    setSelectedBarangay('');
                    setShowAreaDropdown(false);
                  }}
                >
                    <Text style={[styles.dropdownItemText, { color: colors.text }]}>{area.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}

          <TouchableOpacity
            style={[styles.dropdownTrigger, { borderColor: colors.border, backgroundColor: colors.surface }, !selectedArea && styles.dropdownDisabled]}
            disabled={!selectedArea}
            onPress={() => {
              if (!selectedArea) return;
              setShowBarangayDropdown((value) => !value);
              setShowAreaDropdown(false);
            }}
          >
            <Text style={[selectedBarangay ? styles.dropdownValue : styles.dropdownPlaceholder, { color: selectedBarangay ? colors.text : colors.mutedText }]}>
              {selectedBarangay || 'Choose barangay'}
            </Text>
          </TouchableOpacity>
          {showBarangayDropdown && (
            <ScrollView style={[styles.dropdownList, { borderColor: colors.border, backgroundColor: colors.surface }]} nestedScrollEnabled showsVerticalScrollIndicator={false}>
              {barangayOptions.map((barangay) => (
                <TouchableOpacity
                  key={barangay}
                  style={[styles.dropdownItem, { borderBottomColor: colors.border }]}
                  onPress={() => {
                    setSelectedBarangay(barangay);
                    setShowBarangayDropdown(false);
                  }}
                >
                    <Text style={[styles.dropdownItemText, { color: colors.text }]}>{barangay}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}

          <TouchableOpacity style={[styles.registerButton, { backgroundColor: isDark ? '#2F2F35' : '#333' }]} onPress={handleRegister}>
            <Text style={styles.registerButtonText}>Register</Text>
          </TouchableOpacity>

          <View style={styles.loginLinkContainer}>
            <Text style={[styles.loginLinkText, { color: colors.text }]}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={[styles.loginLink, { color: colors.text }]}>Login</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  background: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 24,
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
  dropdownTrigger: {
    width: '100%',
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 15,
    marginBottom: 12,
    backgroundColor: '#fff',
  },
  dropdownDisabled: {
    backgroundColor: '#f3f4f6',
  },
  dropdownPlaceholder: {
    color: '#9ca3af',
    fontSize: 16,
  },
  dropdownValue: {
    color: '#111827',
    fontSize: 16,
  },
  dropdownList: {
    width: '100%',
    maxHeight: 180,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 12,
    backgroundColor: '#fff',
  },
  dropdownItem: {
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  dropdownItemText: {
    color: '#111827',
    fontSize: 15,
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

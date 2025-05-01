import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  ImageBackground,
  Image,
  Alert,
} from 'react-native';
import { db, ref, get, update } from '../firebaseConfig'; // Adjust the path as needed
import Icon from 'react-native-vector-icons/FontAwesome'; // Assuming you're using FontAwesome for icons

const ProfileScreen = ({ navigation, route }) => {
  const { userId } = route.params;
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(true);
  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [isPasswordEditing, setIsPasswordEditing] = useState(false);
  const [originalName, setOriginalName] = useState('');
  const [originalEmail, setOriginalEmail] = useState('');
  const [originalPassword, setOriginalPassword] = useState('');

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userRef = ref(db, 'users/' + userId);
        const snapshot = await get(userRef);
        if (snapshot.exists()) {
          const userData = snapshot.val();
          setName(userData.name);
          setEmail(userData.email);
          setPassword(userData.password);
          setOriginalName(userData.name);
          setOriginalEmail(userData.email);
          setOriginalPassword(userData.password);
        } else {
          setName('Unknown');
          setEmail('Unknown');
          setPassword('Unknown');
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        setName('Error loading name');
        setEmail('Error loading email');
        setPassword('Error loading password');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [userId]);

  const handleEditName = () => {
    setIsEditingName(true);
  };

  const handleEditEmail = () => {
    setIsEditingEmail(true);
  };

  const handleSaveName = async () => {
    if (name.trim() === '') {
      alert('Name cannot be empty');
      return;
    }

    try {
      const userRef = ref(db, 'users/' + userId);
      await update(userRef, { name });
      setOriginalName(name);
      setIsEditingName(false);
    } catch (error) {
      console.error('Error updating name:', error);
      alert('Failed to update name');
    }
  };

  const handleSaveEmail = async () => {
    if (email.trim() === '') {
      alert('Email cannot be empty');
      return;
    }

    try {
      const userRef = ref(db, 'users/' + userId);
      await update(userRef, { email });
      setOriginalEmail(email);
      setIsEditingEmail(false);
    } catch (error) {
      console.error('Error updating email:', error);
      alert('Failed to update email');
    }
  };

  const handleCancelName = () => {
    setName(originalName);
    setIsEditingName(false);
  };

  const handleCancelEmail = () => {
    setEmail(originalEmail);
    setIsEditingEmail(false);
  };

  const handlePasswordEdit = () => {
    setIsPasswordEditing(true);
  };

  const handlePasswordSave = async () => {
    if (newPassword.trim() === '') {
      alert('New password cannot be empty');
      return;
    }

    try {
      const userRef = ref(db, 'users/' + userId);
      await update(userRef, { password: newPassword });
      setPassword(newPassword);
      setIsPasswordEditing(false);
      setNewPassword('');
    } catch (error) {
      console.error('Error updating password:', error);
      alert('Failed to update password');
    }
  };

  const handleLogout = () => {
    navigation.navigate('Login');
  };

  return (
    <ImageBackground
      source={require('../assets/bgapp3.jpg')} // Set the background image here
      style={styles.background}
      resizeMode="cover"
    >
      <View style={styles.container}>
        <Image source={require('../assets/profile.png')} style={styles.profileIcon} />
        <Text style={styles.headerText}>Profile</Text>

        {loading ? (
          <ActivityIndicator size="large" color="#ffffff" />
        ) : (
          <View style={styles.userInfoContainer}>
            {/* Full Name */}
            <View style={styles.userInfoRow}>
              <Text style={styles.label}>Full Name:</Text>
              {isEditingName ? (
                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.input}
                    value={name}
                    onChangeText={setName}
                    autoFocus
                  />
                  <View style={styles.editButtonsContainer}>
                    <TouchableOpacity
                      style={styles.iconButton}
                      onPress={handleSaveName}
                    >
                      <Icon name="check" size={20} color="#4CAF50" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.iconButton}
                      onPress={handleCancelName}
                    >
                      <Icon name="times" size={20} color="#f44336" />
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <View style={styles.infoRow}>
                  <Text style={styles.infoText}>{name}</Text>
                  <TouchableOpacity onPress={handleEditName} style={styles.iconButton}>
                    <Icon name="pencil" size={16} color="#000" />
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* Email */}
            <View style={styles.userInfoRow}>
              <Text style={styles.label}>Email:</Text>
              {isEditingEmail ? (
                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.input}
                    value={email}
                    onChangeText={setEmail}
                  />
                  <View style={styles.editButtonsContainer}>
                    <TouchableOpacity
                      style={styles.iconButton}
                      onPress={handleSaveEmail}
                    >
                      <Icon name="check" size={20} color="#4CAF50" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.iconButton}
                      onPress={handleCancelEmail}
                    >
                      <Icon name="times" size={20} color="#f44336" />
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <View style={styles.infoRow}>
                  <Text style={styles.infoText}>{email}</Text>
                  <TouchableOpacity onPress={handleEditEmail} style={styles.iconButton}>
                    <Icon name="pencil" size={16} color="#000" />
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* Password */}
            <View style={styles.userInfoRow}>
              <Text style={styles.label}>Password:</Text>
              {isPasswordEditing ? (
                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.input}
                    value={newPassword}
                    onChangeText={setNewPassword}
                    secureTextEntry
                    autoFocus
                  />
                  <View style={styles.editButtonsContainer}>
                    <TouchableOpacity
                      style={styles.iconButton}
                      onPress={handlePasswordSave}
                    >
                      <Icon name="check" size={20} color="#4CAF50" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.iconButton}
                      onPress={() => setIsPasswordEditing(false)}
                    >
                      <Icon name="times" size={20} color="#f44336" />
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <View style={styles.infoRow}>
                  <Text style={styles.infoText}>{'******'}</Text>
                  <TouchableOpacity onPress={handlePasswordEdit} style={styles.iconButton}>
                    <Icon name="pencil" size={16} color="#000" />
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        )}

        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.buttonText}>Logout</Text>
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
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(0, 0, 0, 0.7)', // Dark overlay for black-and-white theme
  },
  profileIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 20,
    alignSelf: 'center',
  },
  headerText: {
    fontSize: 32,
    fontWeight: '800',
    marginBottom: 30,
    color: '#ffffff',
    textAlign: 'left',
    textTransform: 'uppercase',
    letterSpacing: 3,
    alignSelf: 'center',
  },
  userInfoContainer: {
    marginBottom: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.8)', // Semi-transparent white background for user info
    padding: 30,
    borderRadius: 12,
    width: '100%',
    shadowColor: '#000000',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
    borderWidth: 2,
    borderColor: '#000000',
  },
  userInfoRow: {
    marginBottom: 12,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
    textAlign: 'left',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  input: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000000',
    borderBottomWidth: 1,
    borderBottomColor: '#000000',
    padding: 5,
    width: '70%',
  },
  editButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    width: '30%',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000000',
    textAlign: 'left',
  },
  iconButton: {
    marginLeft: 10,
  },
  buttonContainer: {
    width: '100%',
    alignItems: 'center',
  },
  logoutButton: {
    backgroundColor: '#f44336',
    padding: 18,
    borderRadius: 12,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 5,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
});

export default ProfileScreen;

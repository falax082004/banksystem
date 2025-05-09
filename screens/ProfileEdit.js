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
import { db, ref, get, update } from '../firebaseConfig';
import Icon from 'react-native-vector-icons/FontAwesome';

const ProfileEdit = ({ navigation, route }) => {
  const { userId } = route.params;
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [address, setAddress] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(true);
  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [isPasswordEditing, setIsPasswordEditing] = useState(false);
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [isEditingPhone, setIsEditingPhone] = useState(false);
  const [originalName, setOriginalName] = useState('');
  const [originalEmail, setOriginalEmail] = useState('');
  const [originalPassword, setOriginalPassword] = useState('');
  const [originalAddress, setOriginalAddress] = useState('');
  const [originalPhone, setOriginalPhone] = useState('');

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
          setAddress(userData.address || '');
          setPhoneNumber(userData.phoneNumber || '');
          setOriginalName(userData.name);
          setOriginalEmail(userData.email);
          setOriginalPassword(userData.password);
          setOriginalAddress(userData.address || '');
          setOriginalPhone(userData.phoneNumber || '');
        } else {
          setName('Unknown');
          setEmail('Unknown');
          setPassword('Unknown');
          setAddress('Unknown');
          setPhoneNumber('Unknown');
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        setName('Error');
        setEmail('Error');
        setPassword('Error');
        setAddress('Error');
        setPhoneNumber('Error');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [userId]);

  const handleEditName = () => setIsEditingName(true);
  const handleEditEmail = () => setIsEditingEmail(true);
  const handlePasswordEdit = () => setIsPasswordEditing(true);
  const handleEditAddress = () => setIsEditingAddress(true);
  const handleEditPhone = () => setIsEditingPhone(true);

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

  const handleSaveAddress = async () => {
    if (address.trim() === '') {
      alert('Address cannot be empty');
      return;
    }

    try {
      const userRef = ref(db, 'users/' + userId);
      await update(userRef, { address });
      setOriginalAddress(address);
      setIsEditingAddress(false);
    } catch (error) {
      console.error('Error updating address:', error);
      alert('Failed to update address');
    }
  };

  const handleSavePhone = async () => {
    if (phoneNumber.trim() === '') {
      alert('Phone number cannot be empty');
      return;
    }

    try {
      const userRef = ref(db, 'users/' + userId);
      await update(userRef, { phoneNumber });
      setOriginalPhone(phoneNumber);
      setIsEditingPhone(false);
    } catch (error) {
      console.error('Error updating phone number:', error);
      alert('Failed to update phone number');
    }
  };

  const handlePasswordSave = async () => {
    if (newPassword.trim() === '' || confirmNewPassword.trim() === '') {
      alert('Both password fields cannot be empty');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      alert('Passwords do not match');
      return;
    }

    try {
      const userRef = ref(db, 'users/' + userId);
      await update(userRef, { password: newPassword });
      setPassword(newPassword);
      setNewPassword('');
      setConfirmNewPassword('');
      setIsPasswordEditing(false);
    } catch (error) {
      console.error('Error updating password:', error);
      alert('Failed to update password');
    }
  };

  return (
    <ImageBackground
      source={require('../assets/bgapp3.jpg')}
      style={styles.background}
      resizeMode="cover"
    >
      <View style={styles.container}>
        <Image source={require('../assets/apollo.png')} style={styles.profileIcon} />
        <Text style={styles.headerText}>Profile</Text>

        {loading ? (
          <ActivityIndicator size="large" color="#ffffff" />
        ) : (
          <View style={styles.userInfoContainer}>
            {/* Name */}
            <View style={styles.userInfoRow}>
              <Text style={styles.label}>Full Name:</Text>
              {isEditingName ? (
                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.input}
                    value={name}
                    onChangeText={setName}
                  />
                  <View style={styles.editButtonsContainer}>
                    <TouchableOpacity style={styles.iconButton} onPress={handleSaveName}>
                      <Icon name="check" size={20} color="#4CAF50" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.iconButton} onPress={() => {
                      setName(originalName);
                      setIsEditingName(false);
                    }}>
                      <Icon name="times" size={20} color="#f44336" />
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <View style={styles.infoRow}>
                  <Text style={styles.infoText}>{name}</Text>
                  <TouchableOpacity style={styles.iconButton} onPress={handleEditName}>
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
                    <TouchableOpacity style={styles.iconButton} onPress={handleSaveEmail}>
                      <Icon name="check" size={20} color="#4CAF50" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.iconButton} onPress={() => {
                      setEmail(originalEmail);
                      setIsEditingEmail(false);
                    }}>
                      <Icon name="times" size={20} color="#f44336" />
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <View style={styles.infoRow}>
                  <Text style={styles.infoText}>{email}</Text>
                  <TouchableOpacity style={styles.iconButton} onPress={handleEditEmail}>
                    <Icon name="pencil" size={16} color="#000" />
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* Address */}
            <View style={styles.userInfoRow}>
              <Text style={styles.label}>Address:</Text>
              {isEditingAddress ? (
                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.input}
                    value={address}
                    onChangeText={setAddress}
                  />
                  <View style={styles.editButtonsContainer}>
                    <TouchableOpacity style={styles.iconButton} onPress={handleSaveAddress}>
                      <Icon name="check" size={20} color="#4CAF50" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.iconButton} onPress={() => {
                      setAddress(originalAddress);
                      setIsEditingAddress(false);
                    }}>
                      <Icon name="times" size={20} color="#f44336" />
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <View style={styles.infoRow}>
                  <Text style={styles.infoText}>{address || 'No address provided'}</Text>
                  <TouchableOpacity style={styles.iconButton} onPress={handleEditAddress}>
                    <Icon name="pencil" size={16} color="#000" />
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* Phone Number */}
            <View style={styles.userInfoRow}>
              <Text style={styles.label}>Phone Number:</Text>
              {isEditingPhone ? (
                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.input}
                    value={phoneNumber}
                    onChangeText={setPhoneNumber}
                    keyboardType="phone-pad"
                  />
                  <View style={styles.editButtonsContainer}>
                    <TouchableOpacity style={styles.iconButton} onPress={handleSavePhone}>
                      <Icon name="check" size={20} color="#4CAF50" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.iconButton} onPress={() => {
                      setPhoneNumber(originalPhone);
                      setIsEditingPhone(false);
                    }}>
                      <Icon name="times" size={20} color="#f44336" />
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <View style={styles.infoRow}>
                  <Text style={styles.infoText}>{phoneNumber || 'No phone number provided'}</Text>
                  <TouchableOpacity style={styles.iconButton} onPress={handleEditPhone}>
                    <Icon name="pencil" size={16} color="#000" />
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* Password */}
            <View style={styles.userInfoRow}>
              <Text style={styles.label}>Change Password:</Text>
              {isPasswordEditing ? (
                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.input}
                    value={newPassword}
                    onChangeText={setNewPassword}
                    secureTextEntry
                  />
                </View>
              ) : (
                <View style={styles.infoRow}>
                  <Text style={styles.infoText}>******</Text>
                  <TouchableOpacity style={styles.iconButton} onPress={handlePasswordEdit}>
                    <Icon name="pencil" size={16} color="#000" />
                  </TouchableOpacity>
                </View>
              )}

              {isPasswordEditing && (
                <>
                  <Text style={styles.label}>Confirm New Password:</Text>
                  <View style={styles.inputContainer}>
                    <TextInput
                      style={styles.input}
                      value={confirmNewPassword}
                      onChangeText={setConfirmNewPassword}
                      secureTextEntry
                    />
                    <View style={styles.editButtonsContainer}>
                      <TouchableOpacity style={styles.iconButton} onPress={handlePasswordSave}>
                        <Icon name="check" size={20} color="#4CAF50" />
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.iconButton} onPress={() => setIsPasswordEditing(false)}>
                        <Icon name="times" size={20} color="#f44336" />
                      </TouchableOpacity>
                    </View>
                  </View>
                </>
              )}
            </View>
          </View>
        )}
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
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  profileIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignSelf: 'center',
    marginBottom: 20,
  },
  headerText: {
    fontSize: 32,
    fontWeight: '800',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 30,
  },
  userInfoContainer: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    padding: 20,
    borderRadius: 12,
    marginBottom: 30,
  },
  userInfoRow: {
    marginBottom: 15,
  },
  label: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#555',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 6,
    marginBottom: 10,
    paddingLeft: 10,
    flex: 1,
    backgroundColor: '#fff',
  },
  editButtonsContainer: {
    flexDirection: 'row',
  },
  iconButton: {
    marginLeft: 10,
    padding: 5,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoText: {
    fontSize: 16,
    color: '#333',
  },
});

export default ProfileEdit;

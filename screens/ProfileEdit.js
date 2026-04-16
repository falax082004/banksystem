import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { db, ref, get, update } from '../firebaseConfig';
import Icon from 'react-native-vector-icons/FontAwesome';
import { BATANGAS_LOCATION_OPTIONS, getBatangasLocationByLabel } from '../constants/batangasLocations';

const ProfileEdit = ({ navigation, route }) => {
  const { userId } = route.params;
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [address, setAddress] = useState('');
  const [selectedArea, setSelectedArea] = useState(null);
  const [selectedBarangay, setSelectedBarangay] = useState('');
  const [originalArea, setOriginalArea] = useState(null);
  const [originalBarangay, setOriginalBarangay] = useState('');
  const [showAreaDropdown, setShowAreaDropdown] = useState(false);
  const [showBarangayDropdown, setShowBarangayDropdown] = useState(false);
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
          const registeredAddress =
            userData.barangay && userData.area
              ? `${userData.barangay}, ${userData.area}, Batangas`
              : '';
          const addressToShow = userData.address || registeredAddress || '';
          setAddress(addressToShow);
          // Initialize dropdown selections from registered location.
          const matchedArea = getBatangasLocationByLabel(userData.area);
          setSelectedArea(matchedArea);
          setSelectedBarangay(userData.barangay || '');
          setOriginalArea(matchedArea);
          setOriginalBarangay(userData.barangay || '');
          setPhoneNumber(userData.phoneNumber || '');
          setOriginalName(userData.name);
          setOriginalEmail(userData.email);
          setOriginalPassword(userData.password);
          setOriginalAddress(addressToShow);
          setOriginalPhone(userData.phoneNumber || '');
        } else {
          setName('Unknown');
          setEmail('Unknown');
          setPassword('Unknown');
          setAddress('Unknown');
          setSelectedArea(null);
          setSelectedBarangay('');
          setOriginalArea(null);
          setOriginalBarangay('');
          setPhoneNumber('Unknown');
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        setName('Error');
        setEmail('Error');
        setPassword('Error');
        setAddress('Error');
        setSelectedArea(null);
        setSelectedBarangay('');
        setOriginalArea(null);
        setOriginalBarangay('');
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
  const handleEditAddress = () => {
    setSelectedArea(originalArea);
    setSelectedBarangay(originalBarangay);
    setShowAreaDropdown(false);
    setShowBarangayDropdown(false);
    setAddress(originalAddress);
    setIsEditingAddress(true);
  };
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
    if (!selectedArea || !selectedBarangay) {
      alert('Please select your area and barangay');
      return;
    }

    const derivedAddress = `${selectedBarangay}, ${selectedArea.label}, Batangas`;
    try {
      const userRef = ref(db, 'users/' + userId);
      await update(userRef, {
        address: derivedAddress,
        area: selectedArea.label,
        barangay: selectedBarangay,
        homeLocation: selectedArea.coordinates,
      });
      setAddress(derivedAddress);
      setOriginalAddress(derivedAddress);
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
    <View style={styles.background}>
      <View style={styles.container}>
        <View style={styles.topBar}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Icon name="times" size={14} color="#333" />
          </TouchableOpacity>
        </View>
        <View style={styles.profileIcon}>
          <Icon name="user" size={48} color="#333" />
        </View>
        <Text style={styles.headerText}>Edit Profile</Text>

        {loading ? (
          <ActivityIndicator size="large" color="#333" />
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
                  <View style={{ flex: 1 }}>
                    <TouchableOpacity
                      style={styles.dropdownTrigger}
                      onPress={() => {
                        setShowAreaDropdown((v) => !v);
                        setShowBarangayDropdown(false);
                      }}
                    >
                      <Text style={selectedArea ? styles.dropdownValue : styles.dropdownPlaceholder}>
                        {selectedArea ? selectedArea.label : 'Choose area'}
                      </Text>
                    </TouchableOpacity>
                    {showAreaDropdown && (
                      <ScrollView style={styles.dropdownList} nestedScrollEnabled showsVerticalScrollIndicator={false}>
                        {BATANGAS_LOCATION_OPTIONS.map((area) => (
                          <TouchableOpacity
                            key={area.key}
                            style={styles.dropdownItem}
                            onPress={() => {
                              setSelectedArea(area);
                              setSelectedBarangay('');
                              setAddress('');
                              setShowAreaDropdown(false);
                            }}
                          >
                            <Text style={styles.dropdownItemText}>{area.label}</Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    )}

                    <TouchableOpacity
                      style={[styles.dropdownTrigger, !selectedArea && styles.dropdownDisabled]}
                      disabled={!selectedArea}
                      onPress={() => {
                        if (!selectedArea) return;
                        setShowBarangayDropdown((v) => !v);
                        setShowAreaDropdown(false);
                      }}
                    >
                      <Text style={selectedBarangay ? styles.dropdownValue : styles.dropdownPlaceholder}>
                        {selectedBarangay || 'Choose barangay'}
                      </Text>
                    </TouchableOpacity>
                    {selectedArea && showBarangayDropdown && (
                      <ScrollView style={styles.dropdownList} nestedScrollEnabled showsVerticalScrollIndicator={false}>
                        {selectedArea.barangays.map((barangay) => (
                          <TouchableOpacity
                            key={barangay}
                            style={styles.dropdownItem}
                            onPress={() => {
                              setSelectedBarangay(barangay);
                              setAddress(`${barangay}, ${selectedArea.label}, Batangas`);
                              setShowBarangayDropdown(false);
                            }}
                          >
                            <Text style={styles.dropdownItemText}>{barangay}</Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    )}
                  </View>
                  <View style={styles.editButtonsContainer}>
                    <TouchableOpacity style={styles.iconButton} onPress={handleSaveAddress}>
                      <Icon name="check" size={20} color="#4CAF50" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.iconButton} onPress={() => {
                      setSelectedArea(originalArea);
                      setSelectedBarangay(originalBarangay);
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
    padding: 20,
  },
  topBar: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  backButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  profileIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignSelf: 'center',
    marginBottom: 20,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ddd',
  },
  headerText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 30,
  },
  userInfoContainer: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 8,
    marginBottom: 30,
    borderWidth: 2,
    borderColor: '#ddd',
  },
  userInfoRow: {
    marginBottom: 15,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    height: 50,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 10,
    paddingLeft: 15,
    flex: 1,
    backgroundColor: '#fff',
    fontSize: 16,
  },
  editButtonsContainer: {
    flexDirection: 'row',
  },
  iconButton: {
    marginLeft: 10,
    padding: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  infoText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  dropdownTrigger: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 11,
    backgroundColor: '#fff',
    marginBottom: 8,
  },
  dropdownDisabled: {
    backgroundColor: '#f3f4f6',
  },
  dropdownPlaceholder: {
    color: '#9ca3af',
    fontSize: 14,
  },
  dropdownValue: {
    color: '#111827',
    fontSize: 14,
  },
  dropdownList: {
    maxHeight: 180,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#fff',
  },
  dropdownItem: {
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  dropdownItemText: {
    color: '#111827',
    fontSize: 13,
  },
});

export default ProfileEdit;

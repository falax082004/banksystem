import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  ScrollView,
  ActivityIndicator,
  SafeAreaView,
  Modal,
  Pressable,
  TextInput
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import { db, ref, get, update } from '../firebaseConfig';

const ProfileScreen = ({ navigation, route }) => {
  const { userId } = route.params;
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userRef = ref(db, 'users/' + userId);
        const snapshot = await get(userRef);
        if (snapshot.exists()) {
          const userData = snapshot.val();
          setName(userData.name || 'User');
          setPhone(userData.phone || 'Unknown');
          setEditName(userData.name || '');
          setEditPhone(userData.phone || '');
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchUserData();
  }, [userId]);

  const handleLogout = () => {
    navigation.navigate('Login');
  };

  const handleProfilePress = () => {
    setModalVisible(true);
  };

  const handleSaveChanges = async () => {
    try {
      const userRef = ref(db, 'users/' + userId);
      await update(userRef, {
        name: editName,
        phone: editPhone
      });
      setName(editName);
      setPhone(editPhone);
      setModalVisible(false);
    } catch (error) {
      console.error('Error saving user data:', error);
    }
  };

  const MenuItem = ({ icon, label, onPress }) => (
    <TouchableOpacity style={styles.menuItem} onPress={onPress}>
      <View style={styles.menuItemContent}>
        <Icon name={icon} size={20} color="#FFF" />
        <Text style={styles.menuLabel}>{label}</Text>
      </View>
      <Icon name="angle-right" size={20} color="#888" />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <TouchableOpacity style={styles.profileCard} onPress={handleProfilePress}>
          <Image
            source={require('../assets/apollo.png')}
            style={styles.avatar}
          />
          <View style={styles.userInfo}>
            <Text style={styles.name}>{name}</Text>
            <Text style={styles.phone}>{phone}</Text>
          </View>
          <Icon name="angle-right" size={20} color="#888" />
        </TouchableOpacity>

        <View style={styles.verificationCard}>
          <Icon name="check-circle" size={16} color="#76FF03" />
          <Text style={styles.verificationText}>Fully Verified</Text>
        </View>

        <View style={styles.stretchArea}>
          <ScrollView contentContainerStyle={styles.scroll}>
            {loading ? (
              <ActivityIndicator size="large" color="#76FF03" />
            ) : (
              <View style={styles.menuContainer}>
                <MenuItem
                  icon="link"
                  label="My Linked Accounts"
                  onPress={() => navigation.navigate('My Linked Accounts', { userId })}
                />
                <MenuItem
                  icon="qrcode"
                  label="My QR Codes"
                  onPress={() => navigation.navigate('MyQRCode' , { userId, fullName: name })}
                />
                <MenuItem
                  icon="credit-card"
                  label="Profile Limits"
                  onPress={() => navigation.navigate('ProfileLimits', { userId })}
                />
                <MenuItem
                  icon="tags"
                  label="Promos"
                  onPress={() => navigation.navigate('Promos')}
                />
                <MenuItem
                  icon="gift"
                  label="Voucher Pocket"
                  onPress={() => navigation.navigate('Voucher')}
                />
                <MenuItem
                  icon="building"
                  label="Partner Merchants"
                  onPress={() => navigation.navigate('Partners')}
                />
                <MenuItem
                  icon="user-plus"
                  label="Refer Friends"
                  onPress={() => navigation.navigate('ReferFriends', { userId, fullName: name })}
                />
                <MenuItem
                  icon="cog"
                  label="Settings"
                  onPress={() => navigation.navigate('Settings', { userId })}
                />
                <MenuItem
                  icon="question-circle"
                  label="Help"
                  onPress={() => navigation.navigate('Help')}
                />
                <MenuItem
                  icon="sign-out"
                  label="Log out"
                  onPress={handleLogout}
                />
              </View>
            )}
          </ScrollView>
        </View>

        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalBackground}>
            <View style={styles.modalContainer}>
              <Text style={styles.modalTitle}>Edit Profile</Text>

              <TextInput
                style={styles.input}
                value={editName}
                onChangeText={setEditName}
                placeholder="Enter your name"
                placeholderTextColor="#888"
              />
              <TextInput
                style={styles.input}
                value={editPhone}
                onChangeText={setEditPhone}
                placeholder="Enter your phone number"
                placeholderTextColor="#888"
                keyboardType="phone-pad"
              />

              <View style={styles.buttonContainer}>
                <Pressable style={styles.saveButton} onPress={handleSaveChanges}>
                  <Text style={styles.saveButtonText}>Save Changes</Text>
                </Pressable>
                <Pressable style={styles.closeButton} onPress={() => setModalVisible(false)}>
                  <Text style={styles.closeButtonText}>Close</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#333',
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 10,
    backgroundColor: '#333',
  },
  scroll: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#444',
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    marginBottom: 10,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    marginRight: 15,
    backgroundColor: '#e0e0e0',
  },
  userInfo: {
    flex: 1,
  },
  name: {
    fontSize: 18,
    color: '#FFF',
    fontWeight: '600',
  },
  phone: {
    fontSize: 14,
    color: '#AAA',
  },
  verificationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#555',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 10,
  },
  verificationText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#76FF03',
    fontWeight: '500',
  },
  menuContainer: {
    backgroundColor: '#444',
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 12,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
    marginBottom: 20,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 30,
    borderBottomWidth: 1,
    borderBottomColor: '#555',
  },
  menuItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuLabel: {
    marginLeft: 15,
    fontSize: 16,
    color: '#FFF',
  },
  stretchArea: {
    flex: 1,
  },
  modalBackground: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    width: 300,
    backgroundColor: '#444',
    borderRadius: 10,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    color: '#FFF',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    backgroundColor: '#555',
    padding: 10,
    borderRadius: 8,
    color: '#FFF',
    marginBottom: 15,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  saveButton: {
    backgroundColor: '#76FF03',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  saveButtonText: {
    color: '#333',
    fontWeight: '500',
  },
  closeButton: {
    backgroundColor: '#AAA',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  closeButtonText: {
    color: '#333',
    fontWeight: '500',
  },
});

export default ProfileScreen;

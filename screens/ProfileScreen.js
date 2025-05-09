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
  TextInput,
  Pressable,
  Alert
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome5'; // Updated to FontAwesome5
import { db, ref, get } from '../firebaseConfig';

const ProfileScreen = ({ navigation, route }) => {
  const { userId } = route.params;
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(true);
  const [hasMpin, setHasMpin] = useState(false);
  const [showMpinModal, setShowMpinModal] = useState(false);
  const [mpin, setMpin] = useState('');
  const [pendingNavigation, setPendingNavigation] = useState(null);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userRef = ref(db, 'users/' + userId);
        const snapshot = await get(userRef);
        if (snapshot.exists()) {
          const userData = snapshot.val();
          setName(userData.name || 'User');
          setPhoneNumber(userData.phoneNumber || 'No phone number');
          setHasMpin(!!userData.mpin);
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

  const verifyMpin = async () => {
    try {
      const userRef = ref(db, `users/${userId}`);
      const snapshot = await get(userRef);
      if (snapshot.exists()) {
        const userData = snapshot.val();
        if (userData.mpin === mpin) {
          setShowMpinModal(false);
          setMpin('');
          if (pendingNavigation) {
            navigation.navigate(pendingNavigation.screen, pendingNavigation.params);
            setPendingNavigation(null);
          }
        } else {
          Alert.alert('Error', 'Invalid MPIN');
        }
      }
    } catch (error) {
      console.error('Error verifying MPIN:', error);
      Alert.alert('Error', 'Failed to verify MPIN');
    }
  };

  const handleProtectedNavigation = (screen, params = {}) => {
    if (hasMpin) {
      setPendingNavigation({ screen, params });
      setShowMpinModal(true);
    } else {
      navigation.navigate(screen, params);
    }
  };

  const MenuItem = ({ icon, label, onPress, requiresMpin = false }) => (
    <TouchableOpacity 
      style={styles.menuItem} 
      onPress={() => requiresMpin ? handleProtectedNavigation(label, { userId, fullName: name }) : onPress()}
    >
      <View style={styles.menuItemContent}>
        <Icon name={icon} size={18} color="#FFF" solid />
        <Text style={styles.menuLabel}>{label}</Text>
      </View>
      <Icon name="chevron-right" size={16} color="#888" />
    </TouchableOpacity>
  );

  const handleProfileImagePress = () => {
    navigation.navigate('ProfileEdit', { userId });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <TouchableOpacity style={styles.profileCard} onPress={handleProfileImagePress}>
          <Image source={require('../assets/apollo.png')} style={styles.avatar} />
          <View style={styles.userInfo}>
            <Text style={styles.name}>{name}</Text>
            <Text style={styles.phone}>{phoneNumber}</Text>
          </View>
          <Icon name="chevron-right" size={16} color="#888" />
        </TouchableOpacity>

        <View style={styles.verificationCard}>
          <Icon name="check-circle" size={16} color="#76FF03" solid />
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
                  requiresMpin={true}
                />
                <MenuItem 
                  icon="qrcode" 
                  label="MyQRCode" 
                  requiresMpin={true}
                />
                <MenuItem 
                  icon="wallet" 
                  label="ProfileLimits" 
                  onPress={() => navigation.navigate('ProfileLimits', { userId })}
                />
                <MenuItem 
                  icon="credit-card" 
                  label="ManageCards" 
                  requiresMpin={true}
                />
                <MenuItem 
                  icon="chart-line" 
                  label="Investment" 
                  requiresMpin={true}
                />
                <MenuItem 
                  icon="hands-helping" 
                  label="Charity" 
                  requiresMpin={true}
                />
                <MenuItem 
                  icon="user-friends" 
                  label="ReferFriends" 
                  onPress={() => navigation.navigate('ReferFriends', { userId, fullName: name })}
                />
                <MenuItem 
                  icon="cog" 
                  label="Settings" 
                  requiresMpin={true}
                />
                <MenuItem 
                  icon="file" 
                  label="Terms" 
                  onPress={() => navigation.navigate('Terms')}
                />
                <MenuItem 
                  icon="question-circle" 
                  label="Help" 
                  onPress={() => navigation.navigate('Help')}
                />
                <MenuItem 
                  icon="sign-out-alt" 
                  label="Log out" 
                  onPress={handleLogout}
                />
              </View>
            )}
          </ScrollView>
        </View>

        {/* MPIN Modal */}
        <Modal
          transparent={true}
          visible={showMpinModal}
          animationType="fade"
          onRequestClose={() => setShowMpinModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>Enter MPIN</Text>
              <Text style={styles.modalSubtitle}>Please enter your MPIN to continue</Text>
              <TextInput
                style={styles.mpinInput}
                value={mpin}
                onChangeText={text => setMpin(text.replace(/[^0-9]/g, ''))}
                keyboardType="numeric"
                maxLength={6}
                secureTextEntry
                placeholder="Enter MPIN"
                placeholderTextColor="#888"
              />
              <View style={styles.modalButtonContainer}>
                <Pressable style={styles.modalButton} onPress={verifyMpin}>
                  <Text style={styles.modalButtonText}>Verify</Text>
                </Pressable>
                <Pressable 
                  style={[styles.modalButton, { backgroundColor: '#666' }]} 
                  onPress={() => {
                    setShowMpinModal(false);
                    setMpin('');
                    setPendingNavigation(null);
                  }}
                >
                  <Text style={styles.modalButtonText}>Cancel</Text>
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
    backgroundColor: '#111',
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 10,
    backgroundColor: '#111',
  },
  scroll: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#222',
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
    backgroundColor: '#333',
  },
  userInfo: {
    flex: 1,
  },
  name: {
    fontSize: 18,
    color: '#fff',
    fontWeight: '600',
  },
  phone: {
    fontSize: 14,
    color: '#888',
  },
  verificationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#222',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 10,
  },
  verificationText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#fff',
    fontWeight: '500',
  },
  menuContainer: {
    backgroundColor: '#222',
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
    borderBottomColor: '#333',
  },
  menuItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuLabel: {
    marginLeft: 15,
    fontSize: 16,
    color: '#fff',
  },
  stretchArea: {
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCard: {
    backgroundColor: '#222',
    borderRadius: 15,
    padding: 20,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 16,
    color: '#888',
    marginBottom: 20,
    textAlign: 'center',
  },
  mpinInput: {
    height: 50,
    width: '100%',
    backgroundColor: '#333',
    borderRadius: 10,
    paddingHorizontal: 15,
    fontSize: 18,
    marginBottom: 20,
    color: '#fff',
    textAlign: 'center',
    letterSpacing: 8,
  },
  modalButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  modalButton: {
    backgroundColor: '#444',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 5,
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default ProfileScreen;

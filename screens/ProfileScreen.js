import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  ScrollView,
  ActivityIndicator,
  SafeAreaView
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome5'; // Updated to FontAwesome5
import { db, ref, get } from '../firebaseConfig';

const ProfileScreen = ({ navigation, route }) => {
  const { userId } = route.params;
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userRef = ref(db, 'users/' + userId);
        const snapshot = await get(userRef);
        if (snapshot.exists()) {
          const userData = snapshot.val();
          setName(userData.name || 'User');
          setPhone(userData.phone || 'Unknown');
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

  const MenuItem = ({ icon, label, onPress }) => (
    <TouchableOpacity style={styles.menuItem} onPress={onPress}>
      <View style={styles.menuItemContent}>
        <Icon name={icon} size={18} color="#FFF" solid />
        <Text style={styles.menuLabel}>{label}</Text>
        
      </View>
      <Icon name="chevron-right" size={16} color="#888" />
    </TouchableOpacity>
  );

  const handleProfileImagePress = () => {
    
    // Navigate to a screen for profile editing or another relevant screen
    navigation.navigate('ProfileEdit', { userId });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <TouchableOpacity style={styles.profileCard} onPress={handleProfileImagePress}>
          <Image source={require('../assets/apollo.png')} style={styles.avatar} />
          <View style={styles.userInfo}>
            <Text style={styles.name}>{name}</Text>
            <Text style={styles.phone}>{phone}</Text>
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
                <MenuItem icon="link" label="My Linked Accounts" onPress={() => navigation.navigate('My Linked Accounts', { userId })} />
                <MenuItem icon="qrcode" label="My QR Codes" onPress={() => navigation.navigate('MyQRCode', { userId, fullName: name })} />
                <MenuItem icon="wallet" label="Profile Limits" onPress={() => navigation.navigate('ProfileLimits', { userId })} />
                <MenuItem icon="credit-card" label="Manage Cards" onPress={() => navigation.navigate('ManageCards', { userId })} />
                <MenuItem icon="chart-line" label="Investment Hub" onPress={() => navigation.navigate('Investment',{ userId, fullName: name })} />
                <MenuItem icon="hands-helping" label="Charity and Donations" onPress={() => navigation.navigate('Charity',{ userId, fullName: name })} />
                <MenuItem icon="user-friends" label="Refer Friends" onPress={() => navigation.navigate('ReferFriends', { userId, fullName: name })} />
                <MenuItem icon="cog" label="Settings" onPress={() => navigation.navigate('Settings', { userId })} />
                <MenuItem icon="question-circle" label="Help" onPress={() => navigation.navigate('Help')} />
                <MenuItem icon="sign-out-alt" label="Log out" onPress={handleLogout} />
              </View>
            )}
          </ScrollView>
        </View>
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
});

export default ProfileScreen;

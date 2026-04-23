import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  SafeAreaView,
  Modal,
  TextInput,
  Pressable,
  Alert,
  Switch,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome5';
import { FONT } from '../styles/typography';
import { db, ref, get, update, set, push } from '../firebaseConfig';
import { useThemeMode } from '../theme/ThemeContext';

const ProfileScreen = ({ navigation, route }) => {
  const { isDark, colors, toggleTheme } = useThemeMode();
  const { userId } = route.params;
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [userRole, setUserRole] = useState('');
  const [pasabuyerEnabled, setPasabuyerEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [hasMpin, setHasMpin] = useState(false);
  const [showMpinModal, setShowMpinModal] = useState(false);
  const [mpin, setMpin] = useState('');
  const [pendingNavigation, setPendingNavigation] = useState(null);
  const [ratingAverage, setRatingAverage] = useState(0);
  const [ratingCount, setRatingCount] = useState(0);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userRef = ref(db, 'users/' + userId);
        const snapshot = await get(userRef);
        if (snapshot.exists()) {
          const userData = snapshot.val();
          setName(userData.name || 'User');
          setPhoneNumber(userData.phoneNumber || 'No phone number');
          setUserRole(userData.role || '');
          setPasabuyerEnabled(!!userData.pasabuyerEnabled);
          setHasMpin(!!userData.mpin);
          setRatingAverage(Number(userData.ratingAverage || 0));
          setRatingCount(Number(userData.ratingCount || 0));
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
    Alert.alert(
      'Log out',
      'Are you sure you want to log out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Log out', style: 'destructive', onPress: () => navigation.navigate('Login') }
      ]
    );
  };

  const handleApplyForRole = async (requestedRole) => {
    try {
      if (!userId) {
        Alert.alert('Error', 'User not found. Please login again.');
        return;
      }
      const userRef = ref(db, `users/${userId}`);
      const snapshot = await get(userRef);
      const roleLabel = requestedRole === 'rider' ? 'Rider' : 'Pasabuyer';

      if (!snapshot.exists()) {
        const nowIso = new Date().toISOString();
        const payload = {
          name: name || 'User',
          phoneNumber: phoneNumber || '',
          role: 'shopper',
          createdAt: nowIso,
          requestedRole,
          approvalStatus: 'pending',
        };
        await set(userRef, payload);
      } else {
        await update(userRef, { requestedRole, approvalStatus: 'pending', roleRequestedAt: new Date().toISOString() });
      }

      const notifRef = push(ref(db, `users/${userId}/notifications`));
      await set(notifRef, {
        type: 'application_submitted',
        title: 'Application Submitted',
        message: 'Your application has been submitted and is waiting for admin approval.',
        read: false,
        createdAt: new Date().toISOString(),
      });

      Alert.alert(
        'Application Submitted',
        `Your ${roleLabel} application has been sent for review. Please wait for admin approval before accessing this role.`,
        [{ text: 'OK', onPress: () => navigation.navigate('Login') }]
      );
    } catch (e) {
      Alert.alert('Error', e.message || 'Failed to submit application');
    }
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
      style={[styles.menuItem, { borderBottomColor: colors.border }]}
      onPress={() => requiresMpin ? handleProtectedNavigation(label, { userId, fullName: name }) : onPress()}
      activeOpacity={0.7}
    >
      <View style={styles.menuItemContent}>
        <View style={styles.iconContainer}>
          <Icon name={icon} size={18} color={colors.text} solid />
        </View>
        <Text style={[styles.menuLabel, { color: colors.text }]}>{label}</Text>
      </View>
      <View style={styles.chevronContainer}>
        <Icon name="chevron-right" size={16} color={colors.mutedText} />
      </View>
    </TouchableOpacity>
  );

  const handleProfileImagePress = () => {
    navigation.navigate('ProfileEdit', { userId });
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <TouchableOpacity style={[styles.profileCard, { backgroundColor: colors.surface, borderColor: colors.border }]} onPress={handleProfileImagePress}>
          <View style={[styles.avatar, { backgroundColor: isDark ? '#2A2A2D' : '#f0f0f0', borderColor: colors.border }]}>
            <Icon name="user" size={32} color={colors.text} />
          </View>
          <View style={styles.userInfo}>
            <Text style={[styles.name, { color: colors.text }]}>{name}</Text>
            <Text style={[styles.phone, { color: colors.mutedText }]}>{phoneNumber}</Text>
            <Text style={[styles.role, { color: colors.mutedText }]}>
              {userRole === 'rider' ? 'Delivery Rider' : userRole === 'shopper' ? 'Shopper/Pasabuyer' : 'No Role Selected'}
            </Text>
          </View>
          <Icon name="chevron-right" size={16} color={colors.mutedText} />
        </TouchableOpacity>

        <View style={[styles.verificationCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Icon name="check-circle" size={16} color="#00c853" solid />
          <Text style={[styles.verificationText, { color: colors.text }]}>Verified User</Text>
        </View>
        <View style={[styles.verificationCard, { backgroundColor: colors.surface, borderColor: colors.border, alignSelf: 'stretch', justifyContent: 'space-between' }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Icon name="moon" size={16} color={isDark ? '#FFD54F' : '#333'} />
            <Text style={[styles.verificationText, { color: colors.text }]}>Dark Mode</Text>
          </View>
          <Switch value={isDark} onValueChange={toggleTheme} />
        </View>
        {(userRole === 'rider' || pasabuyerEnabled) && (
          <View style={[styles.ratingCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Icon name="star" size={16} color="#FFC107" solid />
            <Text style={[styles.ratingText, { color: colors.text }]}>
              Rating: {ratingCount > 0 ? `${ratingAverage.toFixed(1)} / 5` : 'No ratings yet'}
              {ratingCount > 0 ? ` (${ratingCount})` : ''}
            </Text>
          </View>
        )}

        <View style={styles.stretchArea}>
          <ScrollView contentContainerStyle={styles.scroll}>
            {loading ? (
              <ActivityIndicator size="large" color="#333" />
            ) : (
              <View style={[styles.menuContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                {userRole === 'rider' ? (
                  <>
                    <MenuItem
                      icon="wallet"
                      label="Pasapay"
                      onPress={() => navigation.navigate('Pasapay', { userId })}
                    />
                    <MenuItem 
                      icon="motorcycle" 
                      label="My Deliveries" 
                      onPress={() => navigation.navigate('DeliveryHistory', { userId })}
                    />
                    <MenuItem 
                      icon="wallet" 
                      label="Earnings" 
                      onPress={() => navigation.navigate('Earnings', { userId })}
                    />
                    <MenuItem 
                      icon="calendar-check" 
                      label="Availability" 
                      onPress={() => navigation.navigate('Availability', { userId })}
                    />
                  </>
                ) : (
                  <>
                    <MenuItem
                      icon="wallet"
                      label="Pasapay"
                      onPress={() => navigation.navigate('Pasapay', { userId })}
                    />
                    {pasabuyerEnabled ? (
                      <>
                        <MenuItem 
                          icon="briefcase" 
                          label="Requests" 
                          onPress={() => navigation.navigate('PasabuyerRequests', { userId })}
                        />
                        <MenuItem 
                          icon="wallet" 
                          label="Earnings" 
                          onPress={() => navigation.navigate('Earnings', { userId, userType: 'pasabuyer' })}
                        />
                        <MenuItem 
                          icon="calendar-check" 
                          label="Availability" 
                          onPress={() => navigation.navigate('Availability', { userId, userType: 'pasabuyer' })}
                        />
                        <MenuItem 
                          icon="ticket-alt" 
                          label="Vouchers" 
                          onPress={() => navigation.navigate('Vouchers')}
                        />
                        <MenuItem 
                          icon="user-friends" 
                          label="Refer Friends" 
                          onPress={() => navigation.navigate('ReferFriends', { userId, fullName: name })}
                        />
                      </>
                    ) : (
                      <>
                        <MenuItem 
                          icon="ticket-alt" 
                          label="Vouchers" 
                          onPress={() => navigation.navigate('Vouchers')}
                        />
                        <MenuItem 
                          icon="shopping-bag" 
                          label="Apply as Pasabuyer"
                          onPress={() => handleApplyForRole('pasabuyer')}
                        />
                        <MenuItem
                          icon="motorcycle"
                          label="Apply as Rider"
                          onPress={() => handleApplyForRole('rider')}
                        />
                        <MenuItem 
                          icon="user-friends" 
                          label="Refer Friends" 
                          onPress={() => navigation.navigate('ReferFriends', { userId, fullName: name })}
                        />
                      </>
                    )}
                  </>
                )}

                {/* Settings removed */}
                <MenuItem 
                  icon="file" 
                  label="Terms & Conditions" 
                  onPress={() => navigation.navigate('Terms')}
                />
                <MenuItem 
                  icon="question-circle" 
                  label="Help & Support" 
                  onPress={() => navigation.navigate('Help', { userId })}
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
            <View style={[styles.modalCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Enter MPIN</Text>
              <Text style={[styles.modalSubtitle, { color: colors.mutedText }]}>Please enter your MPIN to continue</Text>
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
    backgroundColor: '#f5f5f5',
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 10,
    backgroundColor: '#f5f5f5',
  },
  scroll: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#ddd',
    marginBottom: 10,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    marginRight: 15,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  userInfo: {
    flex: 1,
  },
  name: {
    fontSize: FONT.bodySize,
    color: FONT.headerColor,
    fontWeight: '600',
  },
  phone: {
    fontSize: FONT.smallSize,
    color: FONT.mutedColor,
  },
  role: {
    fontSize: FONT.smallSize,
    color: FONT.secondaryMuted,
    fontStyle: 'italic',
    marginTop: 2,
  },
  verificationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  verificationText: {
    marginLeft: 8,
    fontSize: FONT.smallSize,
    color: FONT.headerColor,
    fontWeight: '500',
  },
  ratingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  ratingText: {
    marginLeft: 8,
    fontSize: FONT.smallSize,
    color: FONT.headerColor,
    fontWeight: '500',
  },
  menuContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 2,
    borderColor: '#ddd',
    marginBottom: 20,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    minHeight: 50,
  },
  menuItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuLabel: {
    marginLeft: 15,
    fontSize: FONT.bodySize,
    color: FONT.headerColor,
    flex: 1,
  },
  iconContainer: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chevronContainer: {
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
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
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 20,
    width: '90%',
    maxWidth: 400,
    borderWidth: 2,
    borderColor: '#ddd',
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
  mpinInput: {
    height: 50,
    width: '100%',
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    paddingHorizontal: 15,
    fontSize: FONT.bodySize,
    marginBottom: 20,
    color: FONT.headerColor,
    textAlign: 'center',
    letterSpacing: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  modalButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  modalButton: {
    backgroundColor: '#333',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 5,
  },
  modalButtonText: {
    color: '#fff',
    fontSize: FONT.bodySize,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default ProfileScreen;

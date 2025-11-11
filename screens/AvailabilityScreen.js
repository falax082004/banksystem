import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Switch,
  ScrollView,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome5';
import { FONT } from '../styles/typography';
import { db, ref, get, set, onValue, off } from '../firebaseConfig';

const AvailabilityScreen = ({ navigation, route }) => {
  const { userId, userType } = route.params || {};
  const isPasabuyer = userType === 'pasabuyer';
  const [isAvailable, setIsAvailable] = useState(true);
  const [loading, setLoading] = useState(true);
  const [availabilityData, setAvailabilityData] = useState({
    isOnline: true,
    workingHours: {
      start: '08:00',
      end: '20:00',
    },
    maxDistance: 5, // km
    vehicleType: 'motorcycle',
  });

  useEffect(() => {
    if (!userId) return;
    
    // Load availability settings from database
    // Riders: riders/{userId}/availability
    // Pasabuyers: pasabuyers/{userId}/availability
    const path = isPasabuyer ? `pasabuyers/${userId}/availability` : `riders/${userId}/availability`;
    const availabilityRef = ref(db, path);
    const unsub = onValue(availabilityRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        setAvailabilityData(prev => ({ ...prev, ...data }));
        setIsAvailable(data.isOnline !== false);
      } else {
        // Set default values
        const defaultData = {
          isOnline: true,
          workingHours: {
            start: '08:00',
            end: '20:00',
          },
          maxDistance: 5,
          vehicleType: 'motorcycle',
        };
        setAvailabilityData(defaultData);
        setIsAvailable(true);
      }
      setLoading(false);
    });
    
    return () => off(availabilityRef, 'value', unsub);
  }, [userId, isPasabuyer]);

  const saveAvailability = async (updates) => {
    if (!userId) return;
    
    try {
      const path = isPasabuyer ? `pasabuyers/${userId}/availability` : `riders/${userId}/availability`;
      const availabilityRef = ref(db, path);
      const currentData = { ...availabilityData, ...updates };
      await set(availabilityRef, currentData);
      setAvailabilityData(currentData);
      Alert.alert('Success', 'Availability settings updated');
    } catch (error) {
      Alert.alert('Error', 'Failed to update availability settings');
      console.error('Error saving availability:', error);
    }
  };

  const handleToggleAvailability = (value) => {
    setIsAvailable(value);
    saveAvailability({ isOnline: value });
  };

  const handleMaxDistanceChange = (distance) => {
    saveAvailability({ maxDistance: distance });
  };

  const handleVehicleTypeChange = (type) => {
    saveAvailability({ vehicleType: type });
  };

  const vehicleTypes = [
    { id: 'motorcycle', label: 'Motorcycle', icon: 'motorcycle' },
    { id: 'bicycle', label: 'Bicycle', icon: 'bicycle' },
    { id: 'car', label: 'Car', icon: 'car' },
    { id: 'walking', label: 'Walking', icon: 'walking' },
  ];

  const distanceOptions = [3, 5, 10, 15, 20];

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Icon name="spinner" size={40} color="#333" />
          <Text style={styles.loadingText}>Loading availability settings...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Availability</Text>
        <Text style={styles.subtitle}>
          Manage your {isPasabuyer ? 'pasabuy' : 'delivery'} availability
        </Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Online Status */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Icon name="power-off" size={18} color="#333" />
            <Text style={styles.sectionTitle}>Online Status</Text>
          </View>
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Go Online</Text>
              <Text style={styles.settingDescription}>
                {isAvailable 
                  ? 'You are currently online and can receive orders' 
                  : 'You are offline and will not receive new orders'}
              </Text>
            </View>
            <Switch
              value={isAvailable}
              onValueChange={handleToggleAvailability}
              trackColor={{ false: '#ccc', true: '#00C853' }}
              thumbColor={isAvailable ? '#fff' : '#f4f3f4'}
            />
          </View>
        </View>

        {/* Maximum Distance */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Icon name="route" size={18} color="#333" />
            <Text style={styles.sectionTitle}>Maximum Distance</Text>
          </View>
          <Text style={styles.settingDescription}>
            Maximum distance you're willing to travel for deliveries
          </Text>
          <View style={styles.distanceOptions}>
            {distanceOptions.map((distance) => (
              <TouchableOpacity
                key={distance}
                style={[
                  styles.distanceOption,
                  availabilityData.maxDistance === distance && styles.distanceOptionActive,
                ]}
                onPress={() => handleMaxDistanceChange(distance)}
              >
                <Text
                  style={[
                    styles.distanceOptionText,
                    availabilityData.maxDistance === distance && styles.distanceOptionTextActive,
                  ]}
                >
                  {distance} km
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Vehicle Type */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Icon name="car-side" size={18} color="#333" />
            <Text style={styles.sectionTitle}>Vehicle Type</Text>
          </View>
          <Text style={styles.settingDescription}>
            Select your primary mode of transportation
          </Text>
          <View style={styles.vehicleOptions}>
            {vehicleTypes.map((vehicle) => (
              <TouchableOpacity
                key={vehicle.id}
                style={[
                  styles.vehicleOption,
                  availabilityData.vehicleType === vehicle.id && styles.vehicleOptionActive,
                ]}
                onPress={() => handleVehicleTypeChange(vehicle.id)}
              >
                <Icon
                  name={vehicle.icon}
                  size={20}
                  color={availabilityData.vehicleType === vehicle.id ? '#fff' : '#333'}
                />
                <Text
                  style={[
                    styles.vehicleOptionText,
                    availabilityData.vehicleType === vehicle.id && styles.vehicleOptionTextActive,
                  ]}
                >
                  {vehicle.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Working Hours Info */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Icon name="clock" size={18} color="#333" />
            <Text style={styles.sectionTitle}>Working Hours</Text>
          </View>
          <View style={styles.workingHoursInfo}>
            <Text style={styles.workingHoursText}>
              {availabilityData.workingHours.start} - {availabilityData.workingHours.end}
            </Text>
            <Text style={styles.settingDescription}>
              Your preferred working hours (coming soon: customizable schedule)
            </Text>
          </View>
        </View>

        {/* Info Card */}
        <View style={styles.infoCard}>
          <Icon name="info-circle" size={20} color="#007AFF" />
          <Text style={styles.infoText}>
            When you're online, you'll receive notifications for nearby orders within your maximum distance.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: FONT.titleSize,
    fontWeight: FONT.weightBold,
    color: FONT.headerColor,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: FONT.subtitleSize,
    color: FONT.mutedColor,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: FONT.bodySize,
    color: FONT.mutedColor,
    marginTop: 12,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: FONT.bodySize,
    fontWeight: FONT.weightBold,
    color: FONT.headerColor,
    marginLeft: 8,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingLabel: {
    fontSize: FONT.bodySize,
    fontWeight: '600',
    color: FONT.headerColor,
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: FONT.smallSize,
    color: FONT.mutedColor,
    marginTop: 4,
  },
  distanceOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
    gap: 8,
  },
  distanceOption: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#f9f9f9',
    marginRight: 8,
    marginBottom: 8,
  },
  distanceOptionActive: {
    backgroundColor: '#333',
    borderColor: '#333',
  },
  distanceOptionText: {
    fontSize: FONT.bodySize,
    color: FONT.headerColor,
    fontWeight: '600',
  },
  distanceOptionTextActive: {
    color: '#fff',
  },
  vehicleOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
    gap: 8,
  },
  vehicleOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#f9f9f9',
    marginRight: 8,
    marginBottom: 8,
    minWidth: 120,
  },
  vehicleOptionActive: {
    backgroundColor: '#333',
    borderColor: '#333',
  },
  vehicleOptionText: {
    fontSize: FONT.bodySize,
    color: FONT.headerColor,
    fontWeight: '600',
    marginLeft: 8,
  },
  vehicleOptionTextActive: {
    color: '#fff',
  },
  workingHoursInfo: {
    marginTop: 8,
  },
  workingHoursText: {
    fontSize: FONT.bodySize,
    fontWeight: '600',
    color: FONT.headerColor,
    marginBottom: 4,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#E3F2FD',
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#BBDEFB',
  },
  infoText: {
    flex: 1,
    fontSize: FONT.smallSize,
    color: '#1976D2',
    marginLeft: 12,
    lineHeight: 20,
  },
});

export default AvailabilityScreen;


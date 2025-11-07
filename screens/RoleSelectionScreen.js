import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { db, ref, get, set } from '../firebaseConfig';
import Icon from 'react-native-vector-icons/FontAwesome5';
import { FONT } from '../styles/typography';

const RoleSelectionScreen = ({ navigation, route }) => {
  const { userId } = route.params;
  const [selectedRole, setSelectedRole] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleRoleSelection = async (role) => {
    setSelectedRole(role);
    setIsLoading(true);

    try {
      const userRef = ref(db, `users/${userId}`);
      const snapshot = await get(userRef);

      if (!snapshot.exists()) {
        Alert.alert('Error', 'User not found. Please try logging in again.');
        setIsLoading(false);
        return;
      }

      const userData = snapshot.val();

      // Prototype: directly assign role without verification
      const updatedUserData = {
        ...userData,
        role: role,
        roleSelectedAt: new Date().toISOString()
      };
      await set(userRef, updatedUserData);

      setIsLoading(false);
      Alert.alert(
        'Role Selected!',
        `You are now registered as a ${role === 'rider' ? 'Delivery Rider' : 'Shopper/Pasabuyer'}`,
        [
          {
            text: 'Continue',
            onPress: () => navigation.navigate('Home', { userId })
          }
        ]
      );
    } catch (error) {
      setIsLoading(false);
      Alert.alert('Error', `Failed to save role selection: ${error.message}`);
    }
  };

  const RoleCard = ({ role, title, description, icon, features, onPress, isSelected }) => (
    <TouchableOpacity 
      style={[styles.roleCard, isSelected && styles.selectedCard]} 
      onPress={onPress}
    >
      <View style={styles.roleHeader}>
        <Icon name={icon} size={40} color={isSelected ? "#333" : "#666"} />
        <Text style={[styles.roleTitle, isSelected && styles.selectedText]}>{title}</Text>
      </View>
      
      <Text style={[styles.roleDescription, isSelected && styles.selectedText]}>
        {description}
      </Text>
      
      <View style={styles.featuresContainer}>
        {features.map((feature, index) => (
          <View key={index} style={styles.featureItem}>
            <Icon name="check" size={12} color={isSelected ? "#333" : "#666"} />
            <Text style={[styles.featureText, isSelected && styles.selectedText]}>
              {feature}
            </Text>
          </View>
        ))}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Choose Your Role</Text>
        <Text style={styles.headerSubtitle}>
          Select how you want to use Pasabuy
        </Text>
      </View>

      <View style={styles.rolesContainer}>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#333" />
            <Text style={styles.loadingText}>Saving your role selection...</Text>
          </View>
        ) : (
          <>
            <RoleCard
              role="rider"
              title="Delivery Rider"
              description="Deliver orders and earn money by transporting items for customers"
              icon="motorcycle"
              features={[
                "Earn money per delivery",
                "Flexible working hours",
                "Real-time order tracking",
                "Customer ratings system"
              ]}
              onPress={() => handleRoleSelection('rider')}
              isSelected={selectedRole === 'rider'}
            />

            <RoleCard
              role="shopper"
              title="Shopper / Pasabuyer"
              description="Order items and optionally earn by helping others on the same route"
              icon="shopping-cart"
              features={[
                "Order items for yourself",
                "Side hustle opportunities",
                "Help others on same route",
                "Earn commission on pasabuy orders"
              ]}
              onPress={() => handleRoleSelection('shopper')}
              isSelected={selectedRole === 'shopper'}
            />
          </>
        )}
      </View>

      <View style={styles.noteContainer}>
        <Icon name="info-circle" size={16} color="#666" />
        <Text style={styles.noteText}>
          You can change your role later in settings
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
    marginTop: 40,
  },
  headerTitle: {
    fontSize: FONT.titleSize,
    fontWeight: FONT.weightBold,
    color: FONT.headerColor,
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: FONT.subtitleSize,
    color: FONT.mutedColor,
    textAlign: 'center',
  },
  rolesContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  roleCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#ddd',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  selectedCard: {
    borderColor: '#333',
    backgroundColor: '#f9f9f9',
  },
  roleHeader: {
    alignItems: 'center',
    marginBottom: 15,
  },
  roleTitle: {
    fontSize: FONT.bodySize,
    fontWeight: FONT.weightBold,
    color: FONT.headerColor,
    marginTop: 10,
  },
  selectedText: {
    color: '#333',
  },
  roleDescription: {
    fontSize: FONT.smallSize,
    color: FONT.mutedColor,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  featuresContainer: {
    marginTop: 10,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  featureText: {
    fontSize: FONT.smallSize,
    color: FONT.mutedColor,
    marginLeft: 8,
  },
  noteContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    paddingVertical: 15,
  },
  noteText: {
    fontSize: FONT.smallSize,
    color: FONT.mutedColor,
    marginLeft: 8,
    fontStyle: 'italic',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: FONT.bodySize,
    color: FONT.mutedColor,
    marginTop: 10,
  },
});

export default RoleSelectionScreen;

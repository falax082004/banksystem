import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  FlatList,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Feather';
import { FONT } from '../styles/typography';

const HomeScreen = ({ navigation, route }) => {
  const { userId } = route.params;
  const [userName, setUserName] = useState('');


  // Fetch minimal user display name only
  const fetchUserData = async () => {
    try {
      // Lazy import to avoid tight coupling; only name is needed now
      const { db, ref, get } = await import('../firebaseConfig');
      const userRef = ref(db, 'users/' + userId);
      const snapshot = await get(userRef);
      if (snapshot.exists()) {
        const userData = snapshot.val();
        setUserName(userData.name || userId);
      } else {
        setUserName(userId);
      }
    } catch {}
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchUserData();
    }, [userId])
  );

  // No banking modals/actions

  // Simple wireframe card
  const renderCard = () => null;

  return (
    <View style={styles.background}>
      <View style={styles.jpContainer}>
        {/* Header */}
        <View style={styles.jpHeaderRow}>
          <Text style={styles.jpDate}>{new Date().toISOString().slice(0, 10).replace(/-/g, '.')}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Icon name="bell" size={22} color="#333" style={{ marginRight: 16 }} />
            <Icon name="user" size={22} color="#333" />
          </View>
        </View>
        <Text style={styles.jpWelcome}>Hi, {userName || 'User'}!</Text>


        {/* Card removed */}

        {/* Banking actions removed */}

        {/* Transactions removed */}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  background: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  jpContainer: { flex: 1, padding: 20 },
  jpHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  jpDate: { fontSize: FONT.smallSize, color: FONT.headerColor },
  jpWelcome: { fontSize: FONT.titleSize, color: FONT.headerColor, marginTop: 10 },
  jpHomeTitle: { fontSize: FONT.bodySize, fontWeight: FONT.weightBold, color: '#fff' },
  // Styles for removed banking components have been cleaned up
  // Card styles removed
});

export default HomeScreen;

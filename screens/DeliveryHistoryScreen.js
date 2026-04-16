import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome5';
import { FONT } from '../styles/typography';
import { db, ref, onValue, off } from '../firebaseConfig';

const DeliveryHistoryScreen = ({ navigation, route }) => {
  const { userId } = route.params || {};
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    
    // Get all deliveries including delivered and cancelled ones (history)
    const deliveriesRef = ref(db, `riderDeliveries/${userId}`);
    const unsub = onValue(deliveriesRef, (snapshot) => {
      if (snapshot.exists()) {
        const deliveriesData = snapshot.val();
        let deliveriesList = Object.keys(deliveriesData).map(key => ({ 
          id: key, 
          ...deliveriesData[key] 
        }));
        
        // Sort by creation date (newest first)
        deliveriesList.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
        setDeliveries(deliveriesList);
      } else {
        setDeliveries([]);
      }
      setLoading(false);
    });
    
    return () => off(deliveriesRef, 'value', unsub);
  }, [userId]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return '#FFA500';
      case 'rider_assigned': return '#007AFF';
      case 'shopping': return '#9C27B0';
      case 'on_way': return '#2196F3';
      case 'delivered': return '#00C853';
      case 'cancelled': return '#FF6B6B';
      default: return '#666';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return 'clock';
      case 'rider_assigned': return 'user-check';
      case 'shopping': return 'shopping-cart';
      case 'on_way': return 'truck';
      case 'delivered': return 'check-circle';
      case 'cancelled': return 'times-circle';
      default: return 'question-circle';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleViewOrder = (order) => {
    navigation.navigate('TrackOrder', { 
      order, 
      userId, 
      viewerRole: 'rider' 
    });
  };

  const DeliveryCard = ({ delivery }) => {
    const isCompleted = delivery.status === 'delivered' || delivery.status === 'cancelled';
    
    return (
      <TouchableOpacity 
        style={styles.deliveryCard}
        onPress={() => handleViewOrder(delivery)}
      >
        <View style={styles.deliveryHeader}>
          <View style={styles.deliveryInfo}>
            <Text style={styles.orderNumber}>
              Order #{delivery.orderNumber || delivery.id}
            </Text>
            <Text style={styles.deliveryDate}>
              {formatDate(delivery.createdAt)}
            </Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(delivery.status) }]}>
            <Icon name={getStatusIcon(delivery.status)} size={12} color="#fff" />
            <Text style={styles.statusText}>
              {delivery.status.replace('_', ' ').toUpperCase()}
            </Text>
          </View>
        </View>

        {delivery.stores && delivery.stores.length > 0 && (
          <View style={styles.storesSection}>
            <Text style={styles.storesLabel}>
              Stores ({delivery.stores.length}):
            </Text>
            {delivery.stores.slice(0, 3).map((store, index) => (
              <View key={index} style={styles.storeItem}>
                <Icon name="store" size={12} color="#666" />
                <Text style={styles.storeName}>{store.storeName}</Text>
              </View>
            ))}
            {delivery.stores.length > 3 && (
              <Text style={styles.moreStores}>
                +{delivery.stores.length - 3} more stores
              </Text>
            )}
          </View>
        )}

        <View style={styles.deliveryFooter}>
          <View style={styles.totalSection}>
            <Text style={styles.totalLabel}>Total Amount:</Text>
            <Text style={styles.totalAmount}>₱{delivery.totalAmount || 0}</Text>
          </View>
          {delivery.distanceKm && (
            <View style={styles.distanceSection}>
              <Icon name="route" size={12} color="#666" />
              <Text style={styles.distanceText}>
                {delivery.distanceKm} km
              </Text>
            </View>
          )}
        </View>

        {isCompleted && delivery.status === 'delivered' && (
          <View style={styles.completedBadge}>
            <Icon name="check-circle" size={14} color="#00C853" />
            <Text style={styles.completedText}>Successfully delivered</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const completedCount = deliveries.filter(d => d.status === 'delivered').length;
  const activeCount = deliveries.filter(d => 
    d.status !== 'delivered' && d.status !== 'cancelled'
  ).length;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Icon name="arrow-left" size={14} color="#333" />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Delivery History</Text>
            <Text style={styles.subtitle}>
              {activeCount} active • {completedCount} completed
            </Text>
          </View>
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <Icon name="spinner" size={40} color="#333" />
          <Text style={styles.loadingText}>Loading deliveries...</Text>
        </View>
      ) : deliveries.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Icon name="box-open" size={60} color="#ccc" />
          <Text style={styles.emptyText}>No delivery history</Text>
          <Text style={styles.emptySubtext}>
            Start accepting orders to see your delivery history here
          </Text>
        </View>
      ) : (
        <ScrollView style={styles.deliveriesList} showsVerticalScrollIndicator={false}>
          {deliveries.map(delivery => (
            <DeliveryCard key={delivery.id} delivery={delivery} />
          ))}
        </ScrollView>
      )}
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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
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
    marginRight: 10,
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
    paddingHorizontal: 40,
  },
  loadingText: {
    fontSize: FONT.bodySize,
    color: FONT.mutedColor,
    marginTop: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: FONT.subtitleSize,
    color: FONT.mutedColor,
    marginTop: 16,
    fontWeight: '500',
  },
  emptySubtext: {
    fontSize: FONT.smallSize,
    color: FONT.secondaryMuted,
    marginTop: 8,
    textAlign: 'center',
  },
  deliveriesList: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  deliveryCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginVertical: 6,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  deliveryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  deliveryInfo: {
    flex: 1,
  },
  orderNumber: {
    fontSize: FONT.bodySize,
    fontWeight: FONT.weightBold,
    color: FONT.headerColor,
    marginBottom: 2,
  },
  deliveryDate: {
    fontSize: FONT.smallSize,
    color: FONT.mutedColor,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  storesSection: {
    marginBottom: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  storesLabel: {
    fontSize: FONT.bodySize,
    fontWeight: '600',
    color: FONT.headerColor,
    marginBottom: 6,
  },
  storeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  storeName: {
    fontSize: FONT.bodySize,
    color: FONT.mutedColor,
    marginLeft: 8,
  },
  moreStores: {
    fontSize: FONT.smallSize,
    color: FONT.secondaryMuted,
    fontStyle: 'italic',
    marginTop: 4,
  },
  deliveryFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  totalSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: FONT.bodySize,
    color: FONT.mutedColor,
    marginRight: 8,
  },
  totalAmount: {
    fontSize: FONT.bodySize,
    fontWeight: FONT.weightBold,
    color: FONT.headerColor,
  },
  distanceSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  distanceText: {
    fontSize: FONT.smallSize,
    color: FONT.mutedColor,
    marginLeft: 4,
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  completedText: {
    fontSize: FONT.smallSize,
    color: '#00C853',
    marginLeft: 6,
    fontWeight: '600',
  },
});

export default DeliveryHistoryScreen;


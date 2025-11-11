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

const PasabuyerRequestsScreen = ({ navigation, route }) => {
  const { userId } = route.params || {};
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    
    // Get all pasabuyer requests including delivered and cancelled ones (history)
    // Pasabuyers use the same riderDeliveries path as riders
    const requestsRef = ref(db, `riderDeliveries/${userId}`);
    const unsub = onValue(requestsRef, (snapshot) => {
      if (snapshot.exists()) {
        const requestsData = snapshot.val();
        let requestsList = Object.keys(requestsData).map(key => ({ 
          id: key, 
          ...requestsData[key] 
        }));
        
        // Sort by creation date (newest first)
        requestsList.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
        setRequests(requestsList);
      } else {
        setRequests([]);
      }
      setLoading(false);
    });
    
    return () => off(requestsRef, 'value', unsub);
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

  const handleViewRequest = (request) => {
    navigation.navigate('TrackOrder', { 
      order: request, 
      userId, 
      viewerRole: 'pasabuyer' 
    });
  };

  const RequestCard = ({ request }) => {
    const isCompleted = request.status === 'delivered' || request.status === 'cancelled';
    
    return (
      <TouchableOpacity 
        style={styles.requestCard}
        onPress={() => handleViewRequest(request)}
      >
        <View style={styles.requestHeader}>
          <View style={styles.requestInfo}>
            <Text style={styles.orderNumber}>
              Order #{request.orderNumber || request.id}
            </Text>
            <Text style={styles.requestDate}>
              {formatDate(request.createdAt)}
            </Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(request.status) }]}>
            <Icon name={getStatusIcon(request.status)} size={12} color="#fff" />
            <Text style={styles.statusText}>
              {request.status.replace('_', ' ').toUpperCase()}
            </Text>
          </View>
        </View>

        {request.stores && request.stores.length > 0 && (
          <View style={styles.storesSection}>
            <Text style={styles.storesLabel}>
              Stores ({request.stores.length}):
            </Text>
            {request.stores.slice(0, 3).map((store, index) => (
              <View key={index} style={styles.storeItem}>
                <Icon name="store" size={12} color="#666" />
                <Text style={styles.storeName}>{store.storeName}</Text>
              </View>
            ))}
            {request.stores.length > 3 && (
              <Text style={styles.moreStores}>
                +{request.stores.length - 3} more stores
              </Text>
            )}
          </View>
        )}

        <View style={styles.requestFooter}>
          <View style={styles.totalSection}>
            <Text style={styles.totalLabel}>Total Amount:</Text>
            <Text style={styles.totalAmount}>₱{request.totalAmount || 0}</Text>
          </View>
          {request.distanceKm && (
            <View style={styles.distanceSection}>
              <Icon name="route" size={12} color="#666" />
              <Text style={styles.distanceText}>
                {request.distanceKm} km
              </Text>
            </View>
          )}
        </View>

        {isCompleted && request.status === 'delivered' && (
          <View style={styles.completedBadge}>
            <Icon name="check-circle" size={14} color="#00C853" />
            <Text style={styles.completedText}>Successfully completed</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const completedCount = requests.filter(r => r.status === 'delivered').length;
  const activeCount = requests.filter(r => 
    r.status !== 'delivered' && r.status !== 'cancelled'
  ).length;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Request History</Text>
        <Text style={styles.subtitle}>
          {activeCount} active • {completedCount} completed
        </Text>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <Icon name="spinner" size={40} color="#333" />
          <Text style={styles.loadingText}>Loading requests...</Text>
        </View>
      ) : requests.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Icon name="box-open" size={60} color="#ccc" />
          <Text style={styles.emptyText}>No request history</Text>
          <Text style={styles.emptySubtext}>
            Start accepting pasabuy requests to see your history here
          </Text>
        </View>
      ) : (
        <ScrollView style={styles.requestsList} showsVerticalScrollIndicator={false}>
          {requests.map(request => (
            <RequestCard key={request.id} request={request} />
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
  requestsList: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  requestCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginVertical: 6,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  requestInfo: {
    flex: 1,
  },
  orderNumber: {
    fontSize: FONT.bodySize,
    fontWeight: FONT.weightBold,
    color: FONT.headerColor,
    marginBottom: 2,
  },
  requestDate: {
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
  requestFooter: {
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

export default PasabuyerRequestsScreen;


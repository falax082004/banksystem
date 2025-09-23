import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  SafeAreaView,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome5';
import { db, ref, get, orderByChild, query, onValue, off } from '../firebaseConfig';

const OrdersScreen = ({ navigation, route }) => {
  const { userId, viewerRole } = route.params || {};
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadOrders = async () => {
    console.log('=== LOAD ORDERS DEBUG ===');
    console.log('User ID:', userId);
    console.log('User ID type:', typeof userId);
    
    if (!userId) {
      console.log('❌ No userId provided');
      setLoading(false);
      return;
    }

    try {
      console.log('Loading orders for user:', userId);
      const ordersRef = ref(db, `orders/${userId}`);
      console.log('Firebase path:', `orders/${userId}`);
      
      const snapshot = await get(ordersRef);
      console.log('Snapshot exists:', snapshot.exists());
      console.log('Snapshot value:', snapshot.val());
      
      if (snapshot.exists()) {
        const ordersData = snapshot.val();
        console.log('Raw orders data:', ordersData);
        console.log('Orders data keys:', Object.keys(ordersData));
        
        let ordersList = Object.keys(ordersData).map(key => {
          const order = {
            id: key,
            ...ordersData[key]
          };
          console.log('Processing order:', key, order);
          return order;
        });
        // If rider view, hide delivered orders
        if (viewerRole === 'rider') {
          ordersList = ordersList.filter(o => o.status !== 'delivered');
        }
        
        // Sort by creation date (newest first)
        ordersList.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        
        console.log('✅ Loaded orders successfully:', ordersList);
        console.log('Orders count:', ordersList.length);
        setOrders(ordersList);
      } else {
        console.log('ℹ️ No orders found for user');
        setOrders([]);
      }
    } catch (error) {
      console.error('❌ Error loading orders:', error);
      console.error('Error details:', error.message);
      console.error('Error code:', error.code);
      Alert.alert('Error', `Failed to load orders: ${error.message}`);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    const path = viewerRole === 'rider' ? `riderDeliveries/${userId}` : `orders/${userId}`;
    const ordersRef = ref(db, path);
    const unsub = onValue(ordersRef, (snapshot) => {
      if (snapshot.exists()) {
        const ordersData = snapshot.val();
        let ordersList = Object.keys(ordersData).map(key => ({ id: key, ...ordersData[key] }));
        if (viewerRole === 'rider') {
          ordersList = ordersList.filter(o => o.status !== 'delivered');
        }
        ordersList.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setOrders(ordersList);
      } else {
        setOrders([]);
      }
      setLoading(false);
    });
    return () => off(ordersRef, 'value', unsub);
  }, [userId, viewerRole]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return '#FFA500';
      case 'in_progress': return '#007AFF';
      case 'completed': return '#00C853';
      case 'cancelled': return '#FF6B6B';
      default: return '#666';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return 'clock';
      case 'in_progress': return 'truck';
      case 'completed': return 'check-circle';
      case 'cancelled': return 'times-circle';
      default: return 'question-circle';
    }
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = date - now;
    const diffMins = Math.round(diffMs / (1000 * 60));
    
    if (diffMins < 0) {
      return `${Math.abs(diffMins)} minutes ago`;
    } else if (diffMins < 60) {
      return `in ${diffMins} minutes`;
    } else {
      const diffHours = Math.round(diffMins / 60);
      return `in ${diffHours} hour${diffHours !== 1 ? 's' : ''}`;
    }
  };

  const handleTrackOrder = (order) => {
    navigation.navigate('TrackOrder', { order, userId, viewerRole: viewerRole || 'shopper' });
  };

  const handleReorder = (order) => {
    Alert.alert(
      'Reorder',
      'Add these stores to your cart?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Add to Cart',
          onPress: () => {
            // Convert order stores to cart format
            const cartItems = order.stores.map(store => ({
              id: Date.now() + Math.random(),
              storeId: store.storeId,
              storeName: store.storeName,
              storeAddress: store.storeAddress,
              storeCategory: store.storeCategory,
              quantity: store.quantity,
              addedAt: new Date().toISOString()
            }));
            
            navigation.navigate('Cart', { cart: cartItems, userId });
          }
        }
      ]
    );
  };

  const OrderCard = ({ order }) => (
    <View style={styles.orderCard}>
      <View style={styles.orderHeader}>
        <View style={styles.orderInfo}>
          <Text style={styles.orderId}>Order #{order.orderNumber || order.id}</Text>
          <Text style={styles.orderDate}>
            {new Date(order.createdAt).toLocaleDateString()}
          </Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) }]}>
          <Icon name={getStatusIcon(order.status)} size={12} color="#fff" />
          <Text style={styles.statusText}>{order.status.replace('_', ' ').toUpperCase()}</Text>
        </View>
      </View>

      <View style={styles.storesSection}>
        <Text style={styles.storesLabel}>Stores ({order.stores.length}):</Text>
        {order.stores.map((store, index) => (
          <View key={index} style={styles.storeItem}>
            <Icon name="store" size={14} color="#666" />
            <Text style={styles.storeName}>{store.storeName}</Text>
            <Text style={styles.storeQuantity}>x{store.quantity}</Text>
          </View>
        ))}
      </View>

      <View style={styles.orderFooter}>
        <View style={styles.totalSection}>
          <Text style={styles.totalLabel}>Total:</Text>
          <Text style={styles.totalAmount}>₱{order.totalAmount}</Text>
        </View>

        <View style={styles.actionsSection}>
          <TouchableOpacity 
            style={styles.trackButton}
            onPress={() => handleTrackOrder(order)}
          >
            <Icon name="map-marker-alt" size={14} color="#007AFF" />
            <Text style={styles.trackButtonText}>Track</Text>
          </TouchableOpacity>
          
          {order.status === 'completed' && (
            <TouchableOpacity 
              style={styles.reorderButton}
              onPress={() => handleReorder(order)}
            >
              <Icon name="redo" size={14} color="#333" />
              <Text style={styles.reorderButtonText}>Reorder</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {order.status === 'in_progress' && (
        <View style={styles.deliveryInfo}>
          <Icon name="clock" size={14} color="#007AFF" />
          <Text style={styles.deliveryText}>
            Estimated delivery: {formatTime(order.estimatedDelivery)}
          </Text>
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.headerText}>
            <Text style={styles.title}>My Orders</Text>
            <Text style={styles.subtitle}>
              {orders.length} order{orders.length !== 1 ? 's' : ''} total
            </Text>
          </View>
          <TouchableOpacity 
            style={styles.refreshButton}
            onPress={loadOrders}
            disabled={loading}
          >
            <Icon name="sync-alt" size={16} color="#333" />
            <Text style={styles.refreshButtonText}>Refresh</Text>
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <Icon name="spinner" size={40} color="#333" />
          <Text style={styles.loadingText}>Loading orders...</Text>
        </View>
      ) : orders.length === 0 ? (
        <View style={styles.emptyOrders}>
          <Icon name="hand-holding" size={60} color="#ccc" />
          <Text style={styles.emptyOrdersText}>
            {viewerRole === 'rider' ? 'You recently have no pasabuy requests' : 'No orders yet'}
          </Text>
          {viewerRole !== 'rider' && (
            <Text style={styles.emptyOrdersSubtext}>
              Start shopping to see your orders here
            </Text>
          )}
        </View>
      ) : (
        <ScrollView style={styles.ordersList} showsVerticalScrollIndicator={false}>
          {orders.map(order => (
            <OrderCard key={order.id} order={order} />
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
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  refreshButtonText: {
    color: '#333',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 12,
  },
  emptyOrders: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyOrdersText: {
    fontSize: 20,
    color: '#666',
    marginTop: 16,
    fontWeight: '500',
  },
  emptyOrdersSubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
  browseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#333',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 20,
  },
  browseButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  ordersList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  orderCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  orderInfo: {
    flex: 1,
  },
  orderId: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  orderDate: {
    fontSize: 12,
    color: '#666',
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
  },
  storesLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
  },
  storeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  storeName: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
    flex: 1,
  },
  storeQuantity: {
    fontSize: 12,
    color: '#999',
    fontWeight: 'bold',
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 14,
    color: '#666',
    marginRight: 8,
  },
  totalAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  actionsSection: {
    flexDirection: 'row',
  },
  trackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    marginLeft: 8,
  },
  trackButtonText: {
    color: '#007AFF',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  reorderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    marginLeft: 8,
  },
  reorderButtonText: {
    color: '#333',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  deliveryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  deliveryText: {
    fontSize: 12,
    color: '#007AFF',
    marginLeft: 6,
    fontWeight: '500',
  },
});

export default OrdersScreen;
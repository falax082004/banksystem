import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome5';
import { db, ref, set, onValue, off } from '../firebaseConfig';
import { earningsService } from '../services/earningsService';

const TrackOrderScreen = ({ navigation, route }) => {
  const { order, userId, viewerRole } = route.params || {};
  const isRiderView = viewerRole === 'pasabuyer' || viewerRole === 'rider';
  const [currentStep, setCurrentStep] = useState(0);
  const [trackingOrder, setTrackingOrder] = useState(order);
  const [riderLocation, setRiderLocation] = useState(null);
  const [estimatedTime, setEstimatedTime] = useState('');

  useEffect(() => {
    if (!order) return;

    // Initialize
    setTrackingOrder(order);
    updateTrackingStatus(order);

    // Live subscribe to shopper order if available
    let unsubUserOrder;
    if (order?.userId && order?.id) {
      const userOrderRef = ref(db, `orders/${order.userId}/${order.id}`);
      unsubUserOrder = onValue(userOrderRef, (snapshot) => {
        if (snapshot.exists()) {
          const val = snapshot.val();
          setTrackingOrder(val);
          updateTrackingStatus(val);
        }
      });
    }

    // Prototype: simulate rider location
    const locationInterval = setInterval(() => {
      updateRiderLocation();
    }, 5000);

    return () => {
      if (order?.userId && order?.id && unsubUserOrder) {
        const userOrderRef = ref(db, `orders/${order.userId}/${order.id}`);
        off(userOrderRef, 'value', unsubUserOrder);
      }
      clearInterval(locationInterval);
    };
  }, [order]);

  const updateTrackingStatus = (orderData) => {
    const status = orderData.status;
    let step = 0;
    
    switch (status) {
      case 'pending':
        step = 0;
        break;
      case 'confirmed':
        step = 1;
        break;
      case 'rider_assigned':
        step = 2;
        break;
      case 'shopping':
        step = 3;
        break;
      case 'on_way':
        step = 4;
        break;
      case 'delivered':
        step = 5;
        break;
      default:
        step = 0;
    }
    
    setCurrentStep(step);
    updateEstimatedTime(orderData);
  };

  const updateRiderLocation = () => {
    // Simulate rider location (in real app, this would come from GPS)
    const locations = [
      { lat: 14.5995, lng: 120.9842, address: 'Near Jollibee, Manila' },
      { lat: 14.5547, lng: 121.0244, address: 'Ayala Avenue, Makati' },
      { lat: 14.5503, lng: 121.0490, address: 'BGC, Taguig' },
      { lat: 14.6760, lng: 121.0437, address: 'EDSA, Quezon City' },
    ];
    
    const randomLocation = locations[Math.floor(Math.random() * locations.length)];
    setRiderLocation(randomLocation);
  };

  const updateEstimatedTime = (orderData) => {
    if (orderData.estimatedDelivery) {
      const now = new Date();
      const deliveryTime = new Date(orderData.estimatedDelivery);
      const diffMs = deliveryTime - now;
      const diffMins = Math.round(diffMs / (1000 * 60));
      
      if (diffMins <= 0) {
        setEstimatedTime('Arriving now');
      } else if (diffMins < 60) {
        setEstimatedTime(`${diffMins} minutes`);
      } else {
        const hours = Math.floor(diffMins / 60);
        const mins = diffMins % 60;
        setEstimatedTime(`${hours}h ${mins}m`);
      }
    }
  };

  const simulateOrderProgress = () => {
    // Prototype: advance status locally through steps
    const statuses = ['pending', 'confirmed', 'rider_assigned', 'shopping', 'on_way', 'delivered'];
    const currentStatus = trackingOrder?.status || 'pending';
    const currentIndex = statuses.indexOf(currentStatus);
    if (currentIndex < statuses.length - 1) {
      const nextStatus = statuses[currentIndex + 1];
      const updated = { ...trackingOrder, status: nextStatus };
      setTrackingOrder(updated);
      updateTrackingStatus(updated);
    }
  };

  const trackingSteps = [
    {
      id: 0,
      title: isRiderView ? 'Order Accepted/Available' : 'Order Confirmed',
      description: isRiderView ? 'You accepted or can accept this order' : 'Your order has been received and confirmed',
      icon: 'check-circle',
      completed: currentStep >= 0,
      status: trackingOrder?.status === 'pending' ? 'current' : currentStep > 0 ? 'completed' : 'pending',
    },
    {
      id: 1,
      title: isRiderView ? 'You Accepted' : 'Rider Assigned',
      description: isRiderView ? 'You accepted this order' : 'A delivery rider has been assigned to your order',
      icon: 'user',
      completed: currentStep >= 1,
      status: trackingOrder?.status === 'rider_assigned' ? 'current' : currentStep > 1 ? 'completed' : 'pending',
    },
    {
      id: 2,
      title: isRiderView ? 'Shopping/Pickup' : 'Shopping in Progress',
      description: isRiderView ? 'Proceed to shop or pick up items' : 'Your rider is currently shopping at the stores',
      icon: 'shopping-cart',
      completed: currentStep >= 2,
      status: trackingOrder?.status === 'shopping' ? 'current' : currentStep > 2 ? 'completed' : 'pending',
    },
    {
      id: 3,
      title: isRiderView ? 'Delivering' : 'On the Way',
      description: isRiderView ? 'Delivering items to customer' : 'Your order is on its way to you',
      icon: 'truck',
      completed: currentStep >= 3,
      status: trackingOrder?.status === 'on_way' ? 'current' : currentStep > 3 ? 'completed' : 'pending',
    },
    {
      id: 4,
      title: 'Delivered',
      description: viewerRole === 'pasabuyer' ? 'Mark delivered when done' : 'Your order has been delivered successfully',
      icon: 'home',
      completed: currentStep >= 4,
      status: trackingOrder?.status === 'delivered' ? 'completed' : 'pending',
    },
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return '#FFA500';
      case 'confirmed': return '#2196F3';
      case 'rider_assigned': return '#9C27B0';
      case 'shopping': return '#FF9800';
      case 'on_way': return '#007AFF';
      case 'delivered': return '#00C853';
      default: return '#666';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return 'clock';
      case 'confirmed': return 'check-circle';
      case 'rider_assigned': return 'user';
      case 'shopping': return 'shopping-cart';
      case 'on_way': return 'truck';
      case 'delivered': return 'check-circle';
      default: return 'question-circle';
    }
  };

  const getEstimatedTime = () => {
    const now = new Date();
    const deliveryTime = new Date(trackingOrder?.estimatedDelivery || order?.estimatedDelivery || now);
    const diffMs = deliveryTime - now;
    const diffMins = Math.round(diffMs / (1000 * 60));
    
    if (diffMins <= 0) {
      return 'Arriving now';
    } else if (diffMins < 60) {
      return `${diffMins} minutes`;
    } else {
      const hours = Math.floor(diffMins / 60);
      const mins = diffMins % 60;
      return `${hours}h ${mins}m`;
    }
  };

  const TrackingStep = ({ step, isLast }) => {
    const getStepIconColor = () => {
      if (step.status === 'completed') return '#fff';
      if (step.status === 'current') return '#fff';
      return '#ccc';
    };

    const getStepIconBg = () => {
      if (step.status === 'completed') return '#00C853';
      if (step.status === 'current') return '#007AFF';
      return '#f0f0f0';
    };

    const getStepTitleColor = () => {
      if (step.status === 'completed') return '#333';
      if (step.status === 'current') return '#007AFF';
      return '#666';
    };

    return (
      <View style={styles.stepContainer}>
        <View style={styles.stepIconContainer}>
          <View style={[
            styles.stepIcon,
            { backgroundColor: getStepIconBg() }
          ]}>
            <Icon 
              name={step.icon} 
              size={16} 
              color={getStepIconColor()} 
            />
          </View>
          {!isLast && (
            <View style={[
              styles.stepLine,
              step.completed && styles.stepLineCompleted
            ]} />
          )}
        </View>
        
        <View style={styles.stepContent}>
          <View style={styles.stepHeader}>
            <Text style={[
              styles.stepTitle,
              { color: getStepTitleColor() }
            ]}>
              {step.title}
            </Text>
            {step.status === 'current' && (
              <View style={styles.currentBadge}>
                <Text style={styles.currentBadgeText}>CURRENT</Text>
              </View>
            )}
          </View>
          <Text style={styles.stepDescription}>
            {step.description}
          </Text>
          {step.status === 'current' && step.id === 3 && riderLocation && (
            <View style={styles.locationInfo}>
              <Icon name="map-marker-alt" size={12} color="#007AFF" />
              <Text style={styles.locationText}>{riderLocation.address}</Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  if (!order) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Icon name="exclamation-triangle" size={60} color="#ff6b6b" />
          <Text style={styles.errorText}>Order not found</Text>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-left" size={20} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>Track Order</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Order Summary */}
        <View style={styles.orderSummary}>
          <View style={styles.orderHeader}>
            <Text style={styles.orderId}>Order #{trackingOrder?.orderNumber || order.id}</Text>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(trackingOrder?.status || 'pending') }]}>
              <Icon name={getStatusIcon(trackingOrder?.status || 'pending')} size={12} color="#fff" />
              <Text style={styles.statusText}>{(trackingOrder?.status || 'PENDING').toUpperCase()}</Text>
            </View>
          </View>
          
          <View style={styles.deliveryInfo}>
            <View style={styles.deliveryItem}>
              <Icon name="clock" size={16} color="#007AFF" />
              <Text style={styles.deliveryLabel}>Estimated delivery:</Text>
              <Text style={styles.deliveryValue}>{estimatedTime || getEstimatedTime()}</Text>
            </View>
            
            <View style={styles.deliveryItem}>
              <Icon name="map-marker-alt" size={16} color="#007AFF" />
              <Text style={styles.deliveryLabel}>Total amount:</Text>
              <Text style={styles.deliveryValue}>₱{trackingOrder?.totalAmount || order.totalAmount}</Text>
            </View>

            {riderLocation && (
              <View style={styles.deliveryItem}>
                <Icon name="truck" size={16} color="#007AFF" />
                <Text style={styles.deliveryLabel}>Rider location:</Text>
                <Text style={styles.deliveryValue}>{riderLocation.address}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Tracking Steps */}
        <View style={styles.trackingSection}>
          <Text style={styles.sectionTitle}>Order Progress</Text>
          {trackingSteps.map((step, index) => (
            <TrackingStep 
              key={step.id} 
              step={step} 
              isLast={index === trackingSteps.length - 1}
            />
          ))}
        </View>

        {/* Store Details */}
        <View style={styles.storesSection}>
          <Text style={styles.sectionTitle}>Stores in this order</Text>
          {order.stores.map((store, index) => (
            <View key={index} style={styles.storeItem}>
              <View style={styles.storeIcon}>
                <Icon name="store" size={16} color="#666" />
              </View>
              <View style={styles.storeInfo}>
                <Text style={styles.storeName}>{store.storeName}</Text>
                <Text style={styles.storeAddress}>{store.storeAddress}</Text>
                <Text style={styles.storeCategory}>{store.storeCategory}</Text>
              </View>
              <View style={styles.storeQuantity}>
                <Text style={styles.quantityText}>x{store.quantity}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Real-time Status */}
        <View style={styles.realtimeSection}>
            <View style={styles.realtimeHeader}>
            <Icon name="wifi" size={16} color="#00C853" />
              <Text style={styles.realtimeText}>Live Tracking Active</Text>
            <View style={styles.pulseDot} />
          </View>
          <Text style={styles.realtimeSubtext}>
            Updates every 5 seconds • Last updated: {new Date().toLocaleTimeString()}
          </Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsSection}>
            {viewerRole === 'shopper' && (
              <TouchableOpacity
                style={[styles.contactButton, { backgroundColor: '#FFF0F0', borderColor: '#FFCDD2' }]}
                onPress={async () => {
                  // Shopper cancel policy: allowed with fees depending on status
                  const status = (trackingOrder?.status || order?.status || 'pending');
                  let fee = 0;
                  if (status === 'pending' || status === 'confirmed') {
                    fee = 0; // free
                  } else if (status === 'rider_assigned' || status === 'shopping') {
                    fee = Math.round((order?.totalAmount || 50) * 0.2); // 20% as compensation
                  } else if (status === 'on_way') {
                    fee = Math.round((order?.totalAmount || 50) * 0.5); // 50%
                  } else if (status === 'delivered') {
                    return; // can't cancel
                  }

                  try {
                    const shopperId = order?.ownerId || order?.userId;
                    const cancelled = { ...(trackingOrder || order), status: 'cancelled', cancellationFee: fee };
                    if (order?.id && shopperId) {
                      const userOrderRef = ref(db, `orders/${shopperId}/${order.id}`);
                      await set(userOrderRef, cancelled);
                    }
                    if (order?.id && order?.assignedTo) {
                      const riderRef = ref(db, `riderDeliveries/${order.assignedTo}/${order.id}`);
                      await set(riderRef, null); // remove from rider deliveries list
                    }
                    if (order?.id) {
                      const poolRef = ref(db, `availableOrders/${order.id}`);
                      await set(poolRef, null);
                    }
                    // Record rider compensation if assigned
                    try {
                      if (order?.assignedTo && fee > 0) {
                        await earningsService.recordCancellationComp(order.assignedTo, { ...order, cancellationFee: fee });
                      }
                    } catch {}
                    setTrackingOrder(cancelled);
                    updateTrackingStatus(cancelled);
                  } catch {}
                }}
              >
                <Icon name="times-circle" size={16} color="#C62828" />
                <Text style={[styles.contactButtonText, { color: '#C62828' }]}>Cancel Order</Text>
              </TouchableOpacity>
            )}
            {(viewerRole === 'shopper' && ['rider_assigned','shopping','on_way'].includes((trackingOrder?.status || order?.status || 'pending'))) ? (
              <TouchableOpacity style={styles.contactButton} onPress={() => navigation.navigate('Chat', { orderId: (trackingOrder?.id || order?.id), userId, viewerRole })}>
                <Icon name="comments" size={16} color="#007AFF" />
                <Text style={styles.contactButtonText}>Contact Rider</Text>
              </TouchableOpacity>
            ) : (viewerRole === 'pasabuyer' || viewerRole === 'rider') && (
              // Rider can only contact shopper AFTER accepting (assigned) and from rider_assigned onward
              (['rider_assigned','shopping','on_way'].includes((trackingOrder?.status || order?.status || 'pending')) && (userId && (order?.assignedTo === userId || trackingOrder?.assignedTo === userId))) ? (
              <TouchableOpacity style={styles.contactButton} onPress={() => navigation.navigate('Chat', { orderId: (trackingOrder?.id || order?.id), userId, viewerRole, order: (trackingOrder || order), shopperId: (order?.ownerId || order?.userId), riderId: (order?.assignedTo || trackingOrder?.assignedTo) })}>
                <Icon name="comments" size={16} color="#007AFF" />
                <Text style={styles.contactButtonText}>Contact Shopper</Text>
              </TouchableOpacity>
              ) : null
            )}
          
          <TouchableOpacity style={styles.supportButton}>
            <Icon name="question-circle" size={16} color="#666" />
            <Text style={styles.supportButtonText}>Get Support</Text>
          </TouchableOpacity>
            { (viewerRole === 'pasabuyer' || viewerRole === 'rider') && (trackingOrder?.status === 'rider_assigned' || (trackingOrder?.status || order?.status) === 'rider_assigned') && (
              <TouchableOpacity
                style={[styles.contactButton, { backgroundColor: '#E3F2FD', borderColor: '#BBDEFB' }]}
                onPress={async () => {
                  // Start shopping: set status to 'shopping' (prototype)
                  try {
                    const shopperId = order?.ownerId || order?.userId;
                    const updated = { ...(trackingOrder || order), status: 'shopping' };
                    if (order?.id && shopperId) {
                      const userOrderRef = ref(db, `orders/${shopperId}/${order.id}`);
                      await set(userOrderRef, updated);
                    }
                    if (order?.id && userId) {
                      const riderRef = ref(db, `riderDeliveries/${userId}/${order.id}`);
                      await set(riderRef, { ...(trackingOrder || order), status: 'shopping', assignedTo: userId });
                    }
                    // Ensure both are chat participants
                    if (order?.id && shopperId) {
                      const shopperChatRef = ref(db, `chats/${order.id}/participants/${shopperId}`);
                      await set(shopperChatRef, true);
                    }
                    if (order?.id && userId) {
                      const riderChatRef = ref(db, `chats/${order.id}/participants/${userId}`);
                      await set(riderChatRef, true);
                    }
                    setTrackingOrder(updated);
                    updateTrackingStatus(updated);
                  } catch (e) {
                    // ignore prototype errors
                  }
                }}
              >
                <Icon name="shopping-cart" size={16} color="#007AFF" />
                <Text style={[styles.contactButtonText, { color: '#007AFF' }]}>Start Shopping</Text>
              </TouchableOpacity>
            )}

            { (viewerRole === 'pasabuyer' || viewerRole === 'rider') && (trackingOrder?.status === 'shopping' || (trackingOrder?.status || order?.status) === 'shopping') && (
              <TouchableOpacity
                style={[styles.contactButton, { backgroundColor: '#FFF3E0', borderColor: '#FFE0B2' }]}
                onPress={async () => {
                  // Pickup complete: set status to 'on_way' (prototype)
                  try {
                    const shopperId = order?.ownerId || order?.userId;
                    const updated = { ...(trackingOrder || order), status: 'on_way' };
                    if (order?.id && shopperId) {
                      const userOrderRef = ref(db, `orders/${shopperId}/${order.id}`);
                      await set(userOrderRef, updated);
                    }
                    if (order?.id && userId) {
                      const riderRef = ref(db, `riderDeliveries/${userId}/${order.id}`);
                      await set(riderRef, { ...(trackingOrder || order), status: 'on_way', assignedTo: userId });
                    }
                    setTrackingOrder(updated);
                    updateTrackingStatus(updated);
                  } catch (e) {
                    // ignore prototype errors
                  }
                }}
              >
                <Icon name="box-open" size={16} color="#D35400" />
                <Text style={[styles.contactButtonText, { color: '#D35400' }]}>Pickup Complete</Text>
              </TouchableOpacity>
            )}
            { (viewerRole === 'pasabuyer' || viewerRole === 'rider') && (trackingOrder?.status === 'on_way' || (trackingOrder?.status || order?.status) === 'on_way') && (
              <TouchableOpacity
                style={[styles.contactButton, { backgroundColor: '#E8F5E8', borderColor: '#C8E6C9' }]}
                onPress={async () => {
                  // Mark delivered (prototype). Update both pools if available
                  try {
                    const delivered = { ...(trackingOrder || order), status: 'delivered' };
                    const shopperId = order?.ownerId || order?.userId;
                    // Reflect on shopper's order
                    if (order?.id && shopperId) {
                      const userOrderRef = ref(db, `orders/${shopperId}/${order.id}`);
                      await set(userOrderRef, delivered);
                    }
                    // Reflect on rider's deliveries bucket
                    if (order?.id && userId) {
                      const riderRef = ref(db, `riderDeliveries/${userId}/${order.id}`);
                      await set(riderRef, { ...(trackingOrder || order), status: 'delivered', assignedTo: userId });
                    }
                    // Remove from available pool definitively
                    if (order?.id) {
                      const poolRef = ref(db, `availableOrders/${order.id}`);
                      await set(poolRef, null);
                    }
                    // Record earning for rider/pasabuyer based on database
                    try {
                      const riderId = userId;
                      if (riderId) {
                        await earningsService.recordDeliveryEarning(riderId, delivered);
                      }
                    } catch (e) {
                      // ignore earning errors in prototype flow
                    }
                    setTrackingOrder(delivered);
                    updateTrackingStatus(delivered);
                  } catch (e) {
                    // ignore prototype errors
                  }
                }}
              >
                <Icon name="check" size={16} color="#2E7D32" />
                <Text style={[styles.contactButtonText, { color: '#2E7D32' }]}>Mark Delivered</Text>
              </TouchableOpacity>
            )}
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  placeholder: {
    width: 36,
  },
  content: {
    flex: 1,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  errorText: {
    fontSize: 18,
    color: '#666',
    marginTop: 16,
    fontWeight: '500',
  },
  backButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 20,
  },
  orderSummary: {
    backgroundColor: '#fff',
    margin: 20,
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  orderId: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
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
  deliveryInfo: {
    gap: 12,
  },
  deliveryItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  deliveryLabel: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
    flex: 1,
  },
  deliveryValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  trackingSection: {
    backgroundColor: '#fff',
    margin: 20,
    marginTop: 0,
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  stepContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  stepIconContainer: {
    alignItems: 'center',
    marginRight: 16,
  },
  stepIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ddd',
  },
  stepIconCompleted: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  stepLine: {
    width: 2,
    height: 40,
    backgroundColor: '#ddd',
    marginTop: 8,
  },
  stepLineCompleted: {
    backgroundColor: '#007AFF',
  },
  stepContent: {
    flex: 1,
    paddingTop: 4,
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    flex: 1,
  },
  stepTitleCompleted: {
    color: '#333',
  },
  currentBadge: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  currentBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  stepDescription: {
    fontSize: 14,
    color: '#999',
    lineHeight: 20,
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  locationText: {
    fontSize: 12,
    color: '#007AFF',
    marginLeft: 4,
    fontStyle: 'italic',
  },
  storesSection: {
    backgroundColor: '#fff',
    margin: 20,
    marginTop: 0,
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  storeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  storeIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  storeInfo: {
    flex: 1,
  },
  storeName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  storeAddress: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  storeCategory: {
    fontSize: 12,
    color: '#999',
  },
  storeQuantity: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  quantityText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333',
  },
  actionsSection: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
  },
  contactButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E3F2FD',
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  contactButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  supportButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0f0f0',
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  supportButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  realtimeSection: {
    backgroundColor: '#E8F5E8',
    margin: 20,
    marginTop: 0,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#C8E6C9',
  },
  realtimeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  realtimeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2E7D32',
    marginLeft: 8,
    flex: 1,
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#00C853',
    marginLeft: 8,
  },
  realtimeSubtext: {
    fontSize: 12,
    color: '#4CAF50',
    marginLeft: 24,
  },
});

export default TrackOrderScreen;
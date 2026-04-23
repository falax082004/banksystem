import React, { useRef, useState, useEffect } from 'react';
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
import { FONT } from '../styles/typography';
import { db, ref, set, get, push, update, onValue, off } from '../firebaseConfig';
import { earningsService } from '../services/earningsService';
import { orderActionsService } from '../services/orderActionsService';
import * as Location from 'expo-location';
import { useThemeMode } from '../theme/ThemeContext';

const formatPeso = (value) => `₱${Math.round(Number(value || 0))}`;

const TrackOrderScreen = ({ navigation, route }) => {
  const { isDark, colors } = useThemeMode();
  const { order, userId, viewerRole } = route.params || {};
  const isRiderView = viewerRole === 'pasabuyer' || viewerRole === 'rider';
  const [currentStep, setCurrentStep] = useState(0);
  const [trackingOrder, setTrackingOrder] = useState(order);
  const [riderLocation, setRiderLocation] = useState(null);
  const [estimatedTime, setEstimatedTime] = useState('');
  const [ratingScore, setRatingScore] = useState(0);
  const [ratingSubmitting, setRatingSubmitting] = useState(false);
  const locationWatchRef = useRef(null);

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

    // Live subscribe to rider/pasabuyer location for this order
    let unsubOrderLocation;
    if (order?.id) {
      const locRef = ref(db, `orderLocations/${order.id}`);
      unsubOrderLocation = onValue(locRef, (snapshot) => {
        if (snapshot.exists()) {
          setRiderLocation(snapshot.val());
        }
      });
    }

    const startRiderGpsSharing = async () => {
      // Only the assigned rider/pasabuyer should publish GPS
      const assignedTo = (trackingOrder?.assignedTo ?? order?.assignedTo) || null;
      const isAssignedSelf = isRiderView && userId && (assignedTo === userId);
      if (!isAssignedSelf || !order?.id) return;

      const status = trackingOrder?.status || order?.status || 'pending';
      if (['delivered', 'cancelled'].includes(status)) return;

      try {
        // Do not auto-prompt location permission here; only use if already granted.
        const { status: permStatus } = await Location.getForegroundPermissionsAsync();
        if (permStatus !== 'granted') {
          return;
        }
        // Stop any previous watcher
        try {
          locationWatchRef.current?.remove?.();
        } catch {}

        locationWatchRef.current = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.Balanced,
            timeInterval: 5000,
            distanceInterval: 10,
          },
          async (pos) => {
            try {
              const coords = pos?.coords;
              if (!coords) return;
              const payload = {
                riderId: userId,
                lat: coords.latitude,
                lng: coords.longitude,
                accuracy: coords.accuracy ?? null,
                heading: coords.heading ?? null,
                speed: coords.speed ?? null,
                updatedAt: new Date().toISOString(),
              };
              await set(ref(db, `orderLocations/${order.id}`), payload);
            } catch {}
          }
        );
      } catch {}
    };

    startRiderGpsSharing();

    return () => {
      if (order?.userId && order?.id && unsubUserOrder) {
        const userOrderRef = ref(db, `orders/${order.userId}/${order.id}`);
        off(userOrderRef, 'value', unsubUserOrder);
      }
      if (order?.id && unsubOrderLocation) {
        const locRef = ref(db, `orderLocations/${order.id}`);
        off(locRef, 'value', unsubOrderLocation);
      }
      try {
        locationWatchRef.current?.remove?.();
      } catch {}
      locationWatchRef.current = null;
    };
  }, [order, userId, isRiderView, trackingOrder?.assignedTo, trackingOrder?.status]);

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
      title: isRiderView ? 'Order Accepted' : 'Order Placed',
      description: isRiderView ? 'This order is assigned to you.' : 'Your order has been posted and is waiting for an assignee.',
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
      return isDark ? '#2A2A2D' : '#f0f0f0';
    };

    const getStepTitleColor = () => {
      if (step.status === 'completed') return colors.text;
      if (step.status === 'current') return '#007AFF';
      return colors.mutedText;
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
              <Text style={styles.locationText}>
                {typeof riderLocation?.lat === 'number' && typeof riderLocation?.lng === 'number'
                  ? `Lat ${riderLocation.lat.toFixed(5)}, Lng ${riderLocation.lng.toFixed(5)}`
                  : riderLocation?.address || 'Location updating...'}
              </Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  const canRateDelivery =
    viewerRole === 'shopper' &&
    (trackingOrder?.status || order?.status) === 'delivered' &&
    !trackingOrder?.ratedByShopper &&
    !!(trackingOrder?.assignedTo || order?.assignedTo);

  const submitRating = async () => {
    try {
      const activeOrder = trackingOrder || order;
      const assigneeId = activeOrder?.assignedTo;
      const shopperId = activeOrder?.ownerId || activeOrder?.userId;
      if (!assigneeId || !shopperId) {
        Alert.alert('Rating Unavailable', 'This order has no assigned rider/pasabuyer.');
        return;
      }
      if (ratingScore < 1 || ratingScore > 5) {
        Alert.alert('Rating Required', 'Please select 1 to 5 stars.');
        return;
      }

      setRatingSubmitting(true);
      const ratingRef = push(ref(db, `users/${assigneeId}/ratings`));
      const ratingPayload = {
        id: ratingRef.key,
        orderId: activeOrder.id,
        orderNumber: activeOrder.orderNumber || null,
        fromUserId: userId,
        score: ratingScore,
        comment: '',
        roleRated: activeOrder.assignedRole || 'rider',
        createdAt: new Date().toISOString(),
      };
      await set(ratingRef, ratingPayload);

      const assigneeRef = ref(db, `users/${assigneeId}`);
      const assigneeSnap = await get(assigneeRef);
      const assigneeData = assigneeSnap.exists() ? assigneeSnap.val() : {};
      const previousCount = Number(assigneeData.ratingCount || 0);
      const previousAverage = Number(assigneeData.ratingAverage || 0);
      const nextCount = previousCount + 1;
      const nextAverage = Number((((previousAverage * previousCount) + ratingScore) / nextCount).toFixed(2));
      await update(assigneeRef, {
        ratingCount: nextCount,
        ratingAverage: nextAverage,
      });

      const patch = { ratedByShopper: true, shopperRating: ratingScore };
      await update(ref(db, `orders/${shopperId}/${activeOrder.id}`), patch);
      if (assigneeId) {
        await update(ref(db, `riderDeliveries/${assigneeId}/${activeOrder.id}`), patch);
      }

      setTrackingOrder((prev) => ({ ...(prev || activeOrder), ...patch }));
      Alert.alert('Rating Submitted', 'Thanks for rating your rider/pasabuyer.');
    } catch (error) {
      Alert.alert('Rating Failed', error.message || 'Unable to save rating.');
    } finally {
      setRatingSubmitting(false);
    }
  };

  if (!order) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.errorContainer}>
          <Icon name="exclamation-triangle" size={60} color="#ff6b6b" />
          <Text style={[styles.errorText, { color: colors.mutedText }]}>Order not found</Text>
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
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-left" size={20} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Track Order</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Order Summary */}
        <View style={[styles.orderSummary, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.orderHeader}>
            <Text style={[styles.orderId, { color: colors.text }]}>Order #{trackingOrder?.orderNumber || order.id}</Text>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(trackingOrder?.status || 'pending') }]}>
              <Icon name={getStatusIcon(trackingOrder?.status || 'pending')} size={12} color="#fff" />
              <Text style={styles.statusText}>{(trackingOrder?.status || 'PENDING').toUpperCase()}</Text>
            </View>
          </View>
          
          <View style={styles.deliveryInfo}>
            <View style={styles.deliveryItem}>
              <Icon name="clock" size={16} color="#007AFF" />
              <Text style={[styles.deliveryLabel, { color: colors.mutedText }]}>Estimated delivery:</Text>
              <Text style={[styles.deliveryValue, { color: colors.text }]}>{estimatedTime || getEstimatedTime()}</Text>
            </View>
            
            <View style={styles.deliveryItem}>
              <Icon name="map-marker-alt" size={16} color="#007AFF" />
              <Text style={[styles.deliveryLabel, { color: colors.mutedText }]}>Total amount:</Text>
              <Text style={[styles.deliveryValue, { color: colors.text }]}>{formatPeso(trackingOrder?.totalAmount || order.totalAmount)}</Text>
            </View>

            <View style={styles.deliveryItem}>
              <Icon name="credit-card" size={16} color="#007AFF" />
              <Text style={[styles.deliveryLabel, { color: colors.mutedText }]}>Payment:</Text>
              <Text style={[styles.deliveryValue, { color: colors.text }]}>
                {(trackingOrder?.paymentChannel || trackingOrder?.paymentMethod || order.paymentChannel || order.paymentMethod || 'cash').toString()}
              </Text>
            </View>

            {(viewerRole === 'rider' || viewerRole === 'pasabuyer') && (trackingOrder?.paymentMethod === 'cash' || order.paymentMethod === 'cash') && (
              <View style={styles.deliveryItem}>
                <Icon name="wallet" size={16} color="#007AFF" />
                <Text style={[styles.deliveryLabel, { color: colors.mutedText }]}>Required Pasapay:</Text>
                <Text style={[styles.deliveryValue, { color: colors.text }]}>
                  {formatPeso(trackingOrder?.cashReserveRequired || order.cashReserveRequired)}
                </Text>
              </View>
            )}

            <View style={styles.deliveryItem}>
              <Icon name="home" size={16} color="#007AFF" />
              <Text style={[styles.deliveryLabel, { color: colors.mutedText }]}>Address:</Text>
              <Text style={[styles.deliveryValue, { color: colors.text }]}>{trackingOrder?.deliveryAddress || order.deliveryAddress || 'No address saved'}</Text>
            </View>

            {riderLocation && (
              <View style={styles.deliveryItem}>
                <Icon name="truck" size={16} color="#007AFF" />
                <Text style={[styles.deliveryLabel, { color: colors.mutedText }]}>Rider location:</Text>
                <Text style={[styles.deliveryValue, { color: colors.text }]}>
                  {typeof riderLocation?.lat === 'number' && typeof riderLocation?.lng === 'number'
                    ? `Lat ${riderLocation.lat.toFixed(5)}, Lng ${riderLocation.lng.toFixed(5)}`
                    : riderLocation?.address || 'Location updating...'}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Tracking Steps */}
        <View style={[styles.trackingSection, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Order Progress</Text>
          {trackingSteps.map((step, index) => (
            <TrackingStep 
              key={step.id} 
              step={step} 
              isLast={index === trackingSteps.length - 1}
            />
          ))}
        </View>

        {/* Store Details */}
        <View style={[styles.storesSection, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Stores in this order</Text>
          {order.stores.map((store, index) => (
            <View key={index} style={[styles.storeItem, { borderBottomColor: colors.border }]}>
              <View style={[styles.storeIcon, { backgroundColor: isDark ? '#2A2A2D' : '#f0f0f0' }]}>
                <Icon name="store" size={16} color={colors.mutedText} />
              </View>
              <View style={styles.storeInfo}>
                <Text style={[styles.storeName, { color: colors.text }]}>{store.storeName}</Text>
                <Text style={[styles.storeAddress, { color: colors.mutedText }]}>{store.storeAddress}</Text>
                <Text style={[styles.storeCategory, { color: colors.mutedText }]}>{store.storeCategory}</Text>
              </View>
              <View style={[styles.storeQuantity, { backgroundColor: isDark ? '#2A2A2D' : '#f0f0f0' }]}>
                <Text style={[styles.quantityText, { color: colors.text }]}>x{store.serviceQuantity || store.quantity || 1}</Text>
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
                  Alert.alert(
                    'Cancel Order',
                    'Do you want to cancel this order? Cancellation fees may apply depending on the current status.',
                    [
                      { text: 'Keep Order', style: 'cancel' },
                      {
                        text: 'Cancel Order',
                        style: 'destructive',
                        onPress: async () => {
                          try {
                            const cancelled = await orderActionsService.cancelOrder({ order: trackingOrder || order });
                            setTrackingOrder(cancelled);
                            updateTrackingStatus(cancelled);
                          } catch (error) {
                            Alert.alert('Cancellation Failed', error.message || 'Unable to cancel this order.');
                          }
                        },
                      },
                    ]
                  );
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
                  try {
                    const updated = await orderActionsService.updateOrderStatus({ order: trackingOrder || order, userId, status: 'shopping' });
                    setTrackingOrder(updated);
                    updateTrackingStatus(updated);
                  } catch (e) {
                    Alert.alert('Update Failed', e.message || 'Unable to start shopping.');
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
                  try {
                    const updated = await orderActionsService.updateOrderStatus({ order: trackingOrder || order, userId, status: 'on_way' });
                    setTrackingOrder(updated);
                    updateTrackingStatus(updated);
                  } catch (e) {
                    Alert.alert('Update Failed', e.message || 'Unable to mark pickup complete.');
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
                  try {
                    const delivered = await orderActionsService.updateOrderStatus({ order: trackingOrder || order, userId, status: 'delivered' });
                    setTrackingOrder(delivered);
                    updateTrackingStatus(delivered);
                  } catch (e) {
                    Alert.alert('Update Failed', e.message || 'Unable to mark this order delivered.');
                  }
                }}
              >
                <Icon name="check" size={16} color="#2E7D32" />
                <Text style={[styles.contactButtonText, { color: '#2E7D32' }]}>Mark Delivered</Text>
              </TouchableOpacity>
            )}
        </View>

        {canRateDelivery && (
        <View style={[styles.ratingPanel, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Rate your {trackingOrder?.assignedRole === 'pasabuyer' ? 'pasabuyer' : 'rider'}</Text>
            <View style={styles.starsRow}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity key={star} onPress={() => setRatingScore(star)}>
                  <Icon name="star" size={26} color={star <= ratingScore ? '#FFC107' : '#ddd'} />
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity
              style={[styles.contactButton, !ratingSubmitting ? null : { opacity: 0.7 }]}
              onPress={submitRating}
              disabled={ratingSubmitting}
            >
              <Icon name="check-circle" size={16} color="#007AFF" />
              <Text style={styles.contactButtonText}>{ratingSubmitting ? 'Submitting...' : 'Submit Rating'}</Text>
            </TouchableOpacity>
          </View>
        )}
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
    fontSize: FONT.titleSize,
    fontWeight: FONT.weightBold,
    color: FONT.headerColor,
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
    fontSize: FONT.subtitleSize,
    color: FONT.mutedColor,
    marginTop: 16,
    fontWeight: '500',
  },
  backButtonText: {
    color: '#007AFF',
    fontSize: FONT.bodySize,
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
    fontSize: FONT.bodySize,
    fontWeight: FONT.weightBold,
    color: FONT.headerColor,
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
    fontSize: FONT.bodySize,
    color: FONT.mutedColor,
    marginLeft: 8,
    flex: 1,
  },
  deliveryValue: {
    fontSize: FONT.bodySize,
    fontWeight: FONT.weightBold,
    color: FONT.headerColor,
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
    fontSize: FONT.bodySize,
    fontWeight: FONT.weightBold,
    color: FONT.headerColor,
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
    fontSize: FONT.bodySize,
    fontWeight: '600',
    color: FONT.mutedColor,
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
    fontSize: FONT.smallSize,
    color: FONT.secondaryMuted || '#999',
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
    fontSize: FONT.bodySize,
    fontWeight: FONT.weightBold,
    color: FONT.headerColor,
    marginBottom: 2,
  },
  storeAddress: {
    fontSize: FONT.smallSize,
    color: FONT.mutedColor,
    marginBottom: 2,
  },
  storeCategory: {
    fontSize: FONT.smallSize,
    color: FONT.secondaryMuted,
  },
  storeQuantity: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  quantityText: {
    fontSize: FONT.smallSize,
    fontWeight: 'bold',
    color: FONT.headerColor,
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
    fontSize: FONT.bodySize,
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
    color: FONT.mutedColor,
    fontSize: FONT.bodySize,
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
    fontSize: FONT.bodySize,
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
  ratingPanel: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 16,
  },
  starsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
});

export default TrackOrderScreen;
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
import { useFocusEffect } from '@react-navigation/native';
import { cartService } from '../services/cartService';
import { db, ref, get } from '../firebaseConfig';
import { orderService } from '../services/orderService';
import { FONT } from '../styles/typography';
import { pasapayService } from '../services/pasapayService';

const CartScreen = ({ navigation, route }) => {
  const { userId } = route.params || {};
  const [cart, setCart] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [paymentChannel, setPaymentChannel] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [pasapayBalance, setPasapayBalance] = useState(0);

  console.log('CartScreen: Received userId:', userId);

  // Get cart from service
  useEffect(() => {
    console.log('CartScreen: Loading cart...');
    const currentCart = cartService.getCart();
    console.log('CartScreen: Loaded cart:', currentCart);
    setCart(currentCart);
  }, []);

  // Refresh cart when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      const currentCart = cartService.getCart();
      console.log('CartScreen: Refreshing cart:', currentCart);
      setCart(currentCart);

      const loadCheckoutData = async () => {
        if (!userId) return;
        try {
          const snapshot = await get(ref(db, `users/${userId}`));
          if (snapshot.exists()) {
            const data = snapshot.val();
            setDeliveryAddress(
              data.address ||
              (data.barangay && data.area ? `${data.barangay}, ${data.area}, Batangas` : '')
            );
            setPasapayBalance(Number(data.pasapayBalance || 0));
          }
        } catch (error) {
          console.error('CartScreen: Failed to load checkout data', error);
        }
      };

      loadCheckoutData();
    }, [])
  );

  const removeFromCart = (itemId) => {
    const updatedCart = cartService.removeFromCart(itemId);
    setCart(updatedCart);
  };

  const updateQuantity = (itemId, newQuantity) => {
    const updatedCart = cartService.updateQuantity(itemId, newQuantity);
    setCart(updatedCart);
  };

  const calculateTotal = () => {
    return cartService.getTotalAmount();
  };

  const handleCheckout = async () => {
    if (cart.length === 0) {
      Alert.alert('Empty Cart', 'Please add some stores to your cart first.');
      return;
    }

    if (!userId) {
      Alert.alert('Error', 'User not found. Please login again.');
      return;
    }

    if (!deliveryAddress) {
      Alert.alert('Address Required', 'Please set your Batangas area and barangay in your profile first.');
      return;
    }

    if (paymentMethod === 'online' && !paymentChannel) {
      Alert.alert('Payment Channel Required', 'Choose GCash, Maya, PayPal, or Card for online payment.');
      return;
    }

    const totalAmount = calculateTotal();
    const cashReserveRequired = pasapayService.getRequiredCashReserve(totalAmount);

    if (paymentMethod === 'pasapay' && pasapayBalance < totalAmount) {
      Alert.alert('Insufficient Pasapay', 'Your Pasapay balance is not enough for this payment.');
      return;
    }

    setIsLoading(true);
    
    try {
      await orderService.createOrderFromCart(userId, {
        paymentMethod,
        paymentChannel: paymentMethod === 'online' ? paymentChannel : '',
        deliveryAddress,
      });
      // Immediately clear cart and go to Orders
      cartService.clearCart();
      setCart([]);
      if (paymentMethod === 'pasapay') {
        setPasapayBalance((value) => Math.max(0, value - totalAmount));
      }
      setIsLoading(false);
      if (paymentMethod === 'cash') {
        Alert.alert(
          'Order Placed',
          `Cash payment selected. Riders or pasabuyers will need at least ₱${cashReserveRequired} Pasapay balance before they can accept this order.`
        );
      }
      navigation.navigate('Home', { userId, screen: 'Orders' });
    } catch (error) {
      setIsLoading(false);
      Alert.alert('Error', `Failed to place order: ${error.message}`);
    }
  };

  const paymentOptions = [
    { id: 'cash', label: 'Cash' },
    { id: 'online', label: 'Online' },
    { id: 'pasapay', label: 'Pasapay' },
  ];

  const totalAmount = calculateTotal();
  const cashReserveRequired = cart.length > 0 ? pasapayService.getRequiredCashReserve(totalAmount) : 0;

  const CartItem = ({ store }) => (
    <View style={styles.cartItem}>
      <View style={styles.itemInfo}>
        <Text style={styles.storeName}>{store.storeName}</Text>
        <Text style={styles.storeCategory}>{store.storeCategory}</Text>
        <Text style={styles.storeAddress}>{store.storeAddress}</Text>
        {(store.items || []).map(line => (
          <View key={`${store.storeId}-${line.itemId}`} style={styles.lineRow}>
            <Text style={styles.lineName}>{line.itemName}</Text>
            <View style={styles.lineRight}>
              <Text style={styles.linePrice}>₱{line.itemPrice}</Text>
              <View style={styles.lineQtyControls}>
                <TouchableOpacity
                  style={styles.quantityButton}
                  onPress={() => {
                    cartService.updateItemQuantity({ storeId: store.storeId, itemId: line.itemId, newQuantity: line.quantity - 1 });
                    setCart([...cartService.getCart()]);
                  }}
                >
                  <Icon name="minus" size={12} color="#333" />
                </TouchableOpacity>
                <Text style={styles.lineQtyText}>{line.quantity}</Text>
                <TouchableOpacity
                  style={styles.quantityButton}
                  onPress={() => {
                    cartService.updateItemQuantity({ storeId: store.storeId, itemId: line.itemId, newQuantity: line.quantity + 1 });
                    setCart([...cartService.getCart()]);
                  }}
                >
                  <Icon name="plus" size={12} color="#333" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.itemControls}>
        <TouchableOpacity 
          style={styles.removeButton}
          onPress={() => removeFromCart(store.id)}
        >
          <Icon name="trash" size={16} color="#ff6b6b" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 8, marginRight: 8 }}>
            <Icon name="arrow-left" size={18} color="#333" />
          </TouchableOpacity>
          <View style={styles.headerText}>
            <Text style={styles.title}>Shopping Cart</Text>
            <Text style={styles.subtitle}>
              {cart.length} store{cart.length !== 1 ? 's' : ''} selected
            </Text>
          </View>
          <View style={styles.headerActions}>
            {cart.length > 0 && (
              <TouchableOpacity 
                style={styles.continueShoppingButton}
                onPress={() => navigation.navigate('Browse')}
              >
                <Icon name="plus" size={16} color="#333" />
                <Text style={styles.continueShoppingText}>Add More</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>

      {cart.length === 0 ? (
        <View style={styles.emptyCart}>
          <Icon name="shopping-cart" size={60} color="#ccc" />
          <Text style={styles.emptyCartText}>Your cart is empty</Text>
          <Text style={styles.emptyCartSubtext}>
            Browse stores and add them to your cart to get started
          </Text>
          <TouchableOpacity 
            style={styles.browseButton}
            onPress={() => navigation.goBack()}
          >
            <Icon name="compass" size={16} color="#fff" />
            <Text style={styles.browseButtonText}>Browse Stores</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <ScrollView style={styles.cartItems} showsVerticalScrollIndicator={false}>
              {cart.map(store => (
                <CartItem key={store.id} store={store} />
            ))}
          </ScrollView>

          <View style={styles.checkoutSection}>
            <View style={styles.totalSection}>
              <Text style={styles.totalLabel}>Total Amount:</Text>
              <Text style={styles.totalAmount}>₱{calculateTotal()}</Text>
            </View>

            <View style={styles.addressCard}>
              <Text style={styles.checkoutLabel}>Delivery Address</Text>
              <Text style={styles.addressValue}>{deliveryAddress || 'Set your area and barangay in profile first.'}</Text>
            </View>

            <View style={styles.paymentCard}>
              <Text style={styles.checkoutLabel}>Payment Method</Text>
              <View style={styles.paymentOptionsRow}>
                {paymentOptions.map((option) => {
                  const active = paymentMethod === option.id;
                  return (
                    <TouchableOpacity
                      key={option.id}
                      style={[styles.paymentChip, active && styles.paymentChipActive]}
                      onPress={() => {
                        setPaymentMethod(option.id);
                        if (option.id !== 'online') {
                          setPaymentChannel('');
                        }
                      }}
                    >
                      <Text style={[styles.paymentChipText, active && styles.paymentChipTextActive]}>{option.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {paymentMethod === 'online' && (
                <>
                  <Text style={styles.checkoutLabel}>Online Channel</Text>
                  <View style={styles.paymentOptionsRow}>
                    {['GCash', 'Maya', 'PayPal', 'Card'].map((channel) => {
                      const active = paymentChannel === channel;
                      return (
                        <TouchableOpacity
                          key={channel}
                          style={[styles.paymentChip, active && styles.paymentChipActive]}
                          onPress={() => setPaymentChannel(channel)}
                        >
                          <Text style={[styles.paymentChipText, active && styles.paymentChipTextActive]}>{channel}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </>
              )}

              {paymentMethod === 'pasapay' && (
                <Text style={styles.checkoutInfoText}>
                  Pasapay balance: ₱{pasapayBalance.toFixed(2)}
                </Text>
              )}

              {paymentMethod === 'cash' && (
                <Text style={styles.checkoutInfoText}>
                  Cash orders require at least ₱{cashReserveRequired} Pasapay balance before a rider or pasabuyer can accept them.
                </Text>
              )}
            </View>
            
            <View style={styles.checkoutInfo}>
              <Text style={styles.checkoutInfoText}>
                • ₱50 per store visit
              </Text>
              <Text style={styles.checkoutInfoText}>
                • Estimated delivery: 30 minutes
              </Text>
            </View>

            <TouchableOpacity 
              style={[styles.checkoutButton, isLoading && styles.checkoutButtonDisabled]}
              onPress={handleCheckout}
              disabled={isLoading}
            >
              {isLoading ? (
                <Text style={styles.checkoutButtonText}>Processing...</Text>
              ) : (
                <>
                  <Icon name="credit-card" size={16} color="#fff" />
                  <Text style={styles.checkoutButtonText}>Proceed to Checkout</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </>
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
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  continueShoppingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  continueShoppingText: {
    color: '#333',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
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
  emptyCart: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyCartText: {
    fontSize: FONT.subtitleSize,
    color: FONT.mutedColor,
    marginTop: 16,
    fontWeight: '500',
  },
  emptyCartSubtext: {
    fontSize: FONT.smallSize,
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
    fontSize: FONT.bodySize,
    fontWeight: '600',
    marginLeft: 8,
  },
  
  cartItems: {
    flex: 1,
    paddingHorizontal: 20,
  },
  cartItem: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginVertical: 6,
    borderWidth: 1,
    borderColor: '#ddd',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemInfo: {
    flex: 1,
  },
  storeName: {
    fontSize: FONT.bodySize,
    fontWeight: FONT.weightBold,
    color: FONT.headerColor,
    marginBottom: 2,
  },
  storeCategory: {
    fontSize: FONT.smallSize,
    color: FONT.mutedColor,
    marginBottom: 2,
  },
  storeAddress: {
    fontSize: FONT.smallSize,
    color: '#999',
  },
  itemControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  lineQtyControls: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 6,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  lineQtyText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginHorizontal: 10,
    minWidth: 16,
    textAlign: 'center',
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 6,
    marginRight: 12,
  },
  quantityButton: {
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 4,
    margin: 2,
  },
  quantityText: {
    fontSize: FONT.bodySize,
    fontWeight: FONT.weightBold,
    color: FONT.headerColor,
    marginHorizontal: 12,
  },
  removeButton: {
    padding: 8,
  },
  checkoutSection: {
    backgroundColor: '#fff',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  addressCard: {
    backgroundColor: '#f9f9f9',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  paymentCard: {
    backgroundColor: '#f9f9f9',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  checkoutLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  addressValue: {
    color: '#666',
    fontSize: 14,
  },
  paymentOptionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  paymentChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
    marginRight: 8,
    marginBottom: 8,
  },
  paymentChipActive: {
    backgroundColor: '#333',
    borderColor: '#333',
  },
  paymentChipText: {
    color: '#333',
    fontWeight: '600',
    fontSize: 13,
  },
  paymentChipTextActive: {
    color: '#fff',
  },
  totalSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  totalLabel: {
    fontSize: FONT.bodySize,
    fontWeight: '600',
    color: FONT.headerColor,
  },
  totalAmount: {
    fontSize: FONT.totalSize,
    fontWeight: 'bold',
    color: FONT.headerColor,
  },
  checkoutInfo: {
    marginBottom: 20,
  },
  checkoutInfoText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  checkoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#333',
    paddingVertical: 16,
    borderRadius: 8,
  },
  checkoutButtonDisabled: {
    backgroundColor: '#999',
  },
  checkoutButtonText: {
    color: '#fff',
    fontSize: FONT.bodySize,
    fontWeight: 'bold',
    marginLeft: 8,
  },
});

export default CartScreen;
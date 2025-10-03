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
import { db, ref, push, set, get } from '../firebaseConfig';
import { orderService } from '../services/orderService';

const CartScreen = ({ navigation, route }) => {
  const { userId } = route.params || {};
  const [cart, setCart] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

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

    setIsLoading(true);
    
    try {
      const saved = await orderService.createOrderFromCart(userId);
      // Immediately clear cart and go to Orders
      cartService.clearCart();
      setCart([]);
      setIsLoading(false);
      navigation.navigate('Home', { userId, screen: 'Orders' });
    } catch (error) {
      setIsLoading(false);
      Alert.alert('Error', `Failed to place order: ${error.message}`);
    }
  };

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
              <View style={styles.quantityControls}>
                <TouchableOpacity 
                  style={styles.quantityButton}
                  onPress={() => { cartService.updateItemQuantity({ storeId: store.storeId, itemId: line.itemId, newQuantity: line.quantity - 1 }); setCart([...cart]); }}
                >
                  <Icon name="minus" size={12} color="#333" />
                </TouchableOpacity>
                <Text style={styles.quantityText}>{line.quantity}</Text>
                <TouchableOpacity 
                  style={styles.quantityButton}
                  onPress={() => { cartService.updateItemQuantity({ storeId: store.storeId, itemId: line.itemId, newQuantity: line.quantity + 1 }); setCart([...cart]); }}
                >
                  <Icon name="plus" size={12} color="#333" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.itemControls}>
        <View style={styles.quantityControls}>
          <TouchableOpacity 
            style={styles.quantityButton}
            onPress={() => updateQuantity(store.id, (store.serviceQuantity || 1) - 1)}
          >
            <Icon name="minus" size={12} color="#333" />
          </TouchableOpacity>
          <Text style={styles.quantityText}>{store.serviceQuantity || 1}</Text>
          <TouchableOpacity 
            style={styles.quantityButton}
            onPress={() => updateQuantity(store.id, (store.serviceQuantity || 1) + 1)}
          >
            <Icon name="plus" size={12} color="#333" />
          </TouchableOpacity>
        </View>
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
            onPress={() => navigation.navigate('Browse')}
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
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  emptyCart: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyCartText: {
    fontSize: 20,
    color: '#666',
    marginTop: 16,
    fontWeight: '500',
  },
  emptyCartSubtext: {
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
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  storeCategory: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  storeAddress: {
    fontSize: 12,
    color: '#999',
  },
  itemControls: {
    flexDirection: 'row',
    alignItems: 'center',
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
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
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
  totalSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  totalAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
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
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
});

export default CartScreen;
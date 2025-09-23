// Simple cart service to manage cart state across screens
let cart = [];

export const cartService = {
  getCart: () => {
    console.log('Getting cart:', cart);
    return cart;
  },
  
  addToCart: (store) => {
    console.log('Adding to cart:', store.name);
    const existingItem = cart.find(item => item.storeId === store.id);
    
    if (existingItem) {
      // If store already in cart, increase quantity
      cart = cart.map(item => 
        item.storeId === store.id 
          ? { ...item, quantity: item.quantity + 1 }
          : item
      );
      console.log('Updated existing item quantity');
    } else {
      // Add new store to cart
      const cartItem = {
        id: Date.now() + Math.random(), // Better ID generation
        storeId: store.id,
        storeName: store.name,
        storeAddress: store.address,
        storeCategory: store.category,
        quantity: 1,
        addedAt: new Date().toISOString()
      };
      cart = [...cart, cartItem];
      console.log('Added new item to cart');
    }
    
    console.log('Cart after add:', cart);
    return cart;
  },
  
  removeFromCart: (itemId) => {
    console.log('Removing from cart:', itemId);
    cart = cart.filter(item => item.id !== itemId);
    console.log('Cart after remove:', cart);
    return cart;
  },
  
  updateQuantity: (itemId, newQuantity) => {
    console.log('Updating quantity:', itemId, newQuantity);
    if (newQuantity <= 0) {
      return cartService.removeFromCart(itemId);
    }
    
    cart = cart.map(item => 
      item.id === itemId 
        ? { ...item, quantity: newQuantity }
        : item
    );
    console.log('Cart after quantity update:', cart);
    return cart;
  },
  
  clearCart: () => {
    console.log('Clearing cart');
    cart = [];
    return cart;
  },
  
  getCartCount: () => {
    const count = cart.length;
    console.log('Cart count:', count);
    return count;
  },
  
  getTotalAmount: () => {
    // For demo purposes, each store visit costs ₱50
    const total = cart.reduce((total, item) => total + (item.quantity * 50), 0);
    console.log('Total amount:', total);
    return total;
  },

  // Test function to verify cart service works
  testCart: () => {
    console.log('=== CART SERVICE TEST ===');
    console.log('Initial cart:', cart);
    console.log('Cart count:', cart.length);
    console.log('Total amount:', cartService.getTotalAmount());
    console.log('=== END TEST ===');
    return cart;
  },

  // Add sample data for testing
  addSampleData: () => {
    const sampleStore = {
      id: Date.now(),
      storeId: 1,
      storeName: 'Jollibee',
      storeAddress: '123 Main St, Manila',
      storeCategory: 'Fast Food',
      quantity: 1,
      addedAt: new Date().toISOString()
    };
    cart = [sampleStore];
    console.log('Added sample data to cart:', cart);
    return cart;
  }
};

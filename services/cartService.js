// Simple cart service to manage cart state across screens
// New structure: cart contains store entries with item lines for accurate totals
let cart = [];

export const cartService = {
  getCart: () => {
    console.log('Getting cart:', cart);
    return cart;
  },
  
  addToCart: (store) => {
    // Back-compat: adding a store with quantity as a service fee-only entry
    console.log('Adding to cart (legacy store add):', store.name);
    const existing = cart.find(s => s.storeId === store.id);
    if (existing) {
      existing.serviceQuantity = (existing.serviceQuantity || 0) + 1;
    } else {
      cart.push({
        id: Date.now() + Math.random(),
        storeId: store.id,
        storeName: store.name,
        storeAddress: store.address,
        storeCategory: store.category,
        items: [],
        serviceQuantity: 1,
        addedAt: new Date().toISOString(),
      });
    }
    console.log('Cart after legacy add:', cart);
    return cart;
  },

  addStoreItemsToCart: ({ storeId, storeName, storeAddress, storeCategory, items }) => {
    console.log('Adding store items to cart:', storeName, items);
    let storeEntry = cart.find(s => s.storeId === storeId);
    if (!storeEntry) {
      storeEntry = {
        id: Date.now() + Math.random(),
        storeId,
        storeName,
        storeAddress,
        storeCategory,
        items: [],
        serviceQuantity: 1,
        addedAt: new Date().toISOString(),
      };
      cart.push(storeEntry);
    }
    items.forEach(line => {
      const existingLine = storeEntry.items.find(i => i.itemId === line.itemId);
      if (existingLine) {
        existingLine.quantity += line.quantity;
        // keep the latest price for consistency
        existingLine.itemPrice = line.itemPrice;
      } else {
        storeEntry.items.push({ ...line });
      }
    });
    console.log('Cart after item add:', cart);
    return cart;
  },
  
  removeFromCart: (itemId) => {
    console.log('Removing from cart:', itemId);
    cart = cart.filter(item => item.id !== itemId);
    console.log('Cart after remove:', cart);
    return cart;
  },
  
  updateQuantity: (itemId, newQuantity) => {
    // Update quantity for a store-level legacy entry
    console.log('Updating legacy store quantity:', itemId, newQuantity);
    if (newQuantity <= 0) {
      return cartService.removeFromCart(itemId);
    }
    cart = cart.map(item => item.id === itemId ? { ...item, serviceQuantity: newQuantity } : item);
    console.log('Cart after store quantity update:', cart);
    return cart;
  },

  updateItemQuantity: ({ storeId, itemId, newQuantity }) => {
    console.log('Updating item quantity:', storeId, itemId, newQuantity);
    const storeEntry = cart.find(s => s.storeId === storeId);
    if (!storeEntry) return cart;
    if (newQuantity <= 0) {
      storeEntry.items = storeEntry.items.filter(i => i.itemId !== itemId);
    } else {
      storeEntry.items = storeEntry.items.map(i => i.itemId === itemId ? { ...i, quantity: newQuantity } : i);
    }
    return cart;
  },
  
  clearCart: () => {
    console.log('Clearing cart');
    cart = [];
    return cart;
  },
  
  getCartCount: () => {
    // Count total item lines across stores, fallback to stores count
    const lines = cart.reduce((sum, s) => sum + (s.items?.length || 0), 0);
    const count = lines > 0 ? lines : cart.length;
    console.log('Cart count:', count);
    return count;
  },
  
  getTotalAmount: () => {
    // Item subtotal + service fee per store (₱50)
    const itemSubtotal = cart.reduce((sum, s) => sum + (s.items || []).reduce((t, i) => t + i.itemPrice * i.quantity, 0), 0);
    const serviceFee = cart.reduce((sum, s) => sum + 50 * (s.serviceQuantity || 1), 0);
    const total = itemSubtotal + serviceFee;
    console.log('Totals -> items:', itemSubtotal, 'service:', serviceFee, 'total:', total);
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

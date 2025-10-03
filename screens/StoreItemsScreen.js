import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome5';
import { cartService } from '../services/cartService';

const StoreItemsScreen = ({ navigation, route }) => {
  const { store, userId } = route.params || {};
  const [quantities, setQuantities] = useState({});

  const items = useMemo(() => {
    // Demo catalog per store with prices
    const catalogs = {
      1: [
        { id: 'chickenjoy', name: 'Chicken Joy', price: 89 },
        { id: 'jollyspaghetti', name: 'Jolly Spaghetti', price: 65 },
        { id: 'burgersteak', name: 'Burger Steak', price: 79 },
      ],
      2: [
        { id: 'bigmac', name: 'Big Mac', price: 150 },
        { id: 'mcflurry', name: 'McFlurry', price: 59 },
        { id: 'nuggets6', name: 'Chicken McNuggets (6pc)', price: 99 },
      ],
      3: [
        { id: 'frappuccino', name: 'Frappuccino', price: 180 },
        { id: 'latte', name: 'Latte', price: 140 },
        { id: 'pastries', name: 'Pastries', price: 95 },
      ],
      4: [
        { id: 'snacks', name: 'Snacks', price: 45 },
        { id: 'drinks', name: 'Drinks', price: 35 },
        { id: 'groceries', name: 'Basic Groceries', price: 120 },
      ],
      5: [
        { id: 'produce', name: 'Fresh Produce', price: 200 },
        { id: 'household', name: 'Household Items', price: 150 },
        { id: 'groceries', name: 'Groceries', price: 300 },
      ],
    };
    return catalogs[store?.id] || [];
  }, [store]);

  const updateQty = (itemId, delta) => {
    setQuantities(prev => {
      const next = { ...prev };
      const current = next[itemId] || 0;
      const updated = Math.max(0, current + delta);
      if (updated === 0) delete next[itemId]; else next[itemId] = updated;
      return next;
    });
  };

  const subtotal = useMemo(() => {
    return items.reduce((sum, it) => sum + (quantities[it.id] || 0) * it.price, 0);
  }, [items, quantities]);

  const addSelectedToCart = () => {
    if (!store) {
      Alert.alert('Error', 'No store selected');
      return;
    }
    const selected = items
      .filter(it => (quantities[it.id] || 0) > 0)
      .map(it => ({
        itemId: it.id,
        itemName: it.name,
        itemPrice: it.price,
        quantity: quantities[it.id],
      }));

    if (selected.length === 0) {
      Alert.alert('Nothing Selected', 'Choose at least one item.');
      return;
    }

    cartService.addStoreItemsToCart({
      storeId: store.id,
      storeName: store.name,
      storeAddress: store.address,
      storeCategory: store.category,
      items: selected,
    });

    Alert.alert('Added', 'Items added to cart.', [
      { text: 'View Cart', onPress: () => navigation.navigate('Cart', { userId }) },
      { text: 'Continue', onPress: () => navigation.goBack() },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Icon name="chevron-left" size={18} color="#333" />
        </TouchableOpacity>
        <View style={styles.headerText}>
          <Text style={styles.title}>{store?.name}</Text>
          <Text style={styles.subtitle}>{store?.address}</Text>
        </View>
      </View>

      <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
        {items.map(it => (
          <View key={it.id} style={styles.itemRow}>
            <View style={styles.itemInfo}>
              <Text style={styles.itemName}>{it.name}</Text>
              <Text style={styles.itemPrice}>₱{it.price}</Text>
            </View>
            <View style={styles.qtyControls}>
              <TouchableOpacity style={styles.qtyBtn} onPress={() => updateQty(it.id, -1)}>
                <Icon name="minus" size={12} color="#333" />
              </TouchableOpacity>
              <Text style={styles.qtyText}>{quantities[it.id] || 0}</Text>
              <TouchableOpacity style={styles.qtyBtn} onPress={() => updateQty(it.id, 1)}>
                <Icon name="plus" size={12} color="#333" />
              </TouchableOpacity>
            </View>
          </View>
        ))}
        {items.length === 0 && (
          <View style={styles.empty}> 
            <Text style={styles.emptyText}>No items available.</Text>
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.summary}> 
          <Text style={styles.summaryLabel}>Subtotal</Text>
          <Text style={styles.summaryValue}>₱{subtotal}</Text>
        </View>
        <TouchableOpacity style={styles.addButton} onPress={addSelectedToCart}>
          <Icon name="shopping-bag" size={16} color="#fff" />
          <Text style={styles.addButtonText}>Add Selected to Cart</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
  backBtn: { padding: 8, marginRight: 12 },
  headerText: { flex: 1 },
  title: { fontSize: 20, fontWeight: 'bold', color: '#333' },
  subtitle: { fontSize: 12, color: '#666', marginTop: 2 },
  list: { flex: 1, paddingHorizontal: 20 },
  itemRow: { backgroundColor: '#fff', borderRadius: 8, padding: 14, marginVertical: 6, borderWidth: 1, borderColor: '#ddd', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 16, fontWeight: '600', color: '#333' },
  itemPrice: { fontSize: 14, color: '#666', marginTop: 2 },
  qtyControls: { flexDirection: 'row', alignItems: 'center' },
  qtyBtn: { width: 30, height: 30, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff', borderRadius: 4, margin: 2, borderWidth: 1, borderColor: '#ddd' },
  qtyText: { fontSize: 16, fontWeight: 'bold', color: '#333', marginHorizontal: 10 },
  footer: { backgroundColor: '#fff', padding: 20, borderTopWidth: 1, borderTopColor: '#eee' },
  summary: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  summaryLabel: { fontSize: 16, color: '#666' },
  summaryValue: { fontSize: 20, fontWeight: 'bold', color: '#333' },
  addButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#333', paddingVertical: 14, borderRadius: 8 },
  addButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginLeft: 8 },
  empty: { padding: 30, alignItems: 'center' },
  emptyText: { color: '#999' },
});

export default StoreItemsScreen;




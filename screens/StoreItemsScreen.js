import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome5';
import { FONT } from '../styles/typography';
import { cartService } from '../services/cartService';
import { useThemeMode } from '../theme/ThemeContext';

const StoreItemsScreen = ({ navigation, route }) => {
  const { isDark, colors } = useThemeMode();
  const { store, userId } = route.params || {};
  const [quantities, setQuantities] = useState({});

  const items = useMemo(() => {
    // Prefer store-provided items (Batangas-generated stores).
    if (Array.isArray(store?.items) && store.items.length > 0) {
      return store.items.map((it, idx) => ({
        id: it.id || `${store?.id || 'store'}-item-${idx + 1}`,
        name: it.name,
        price: Number(it.price || 0),
      }));
    }
    return [];
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
      area: store.area,
      coordinates: store.coordinates,
    });

    Alert.alert('Added', 'Items added to cart.', [
      { text: 'View Cart', onPress: () => navigation.navigate('Cart', { userId }) },
      { text: 'Continue', onPress: () => navigation.goBack() },
    ]);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Icon name="chevron-left" size={18} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerText}>
          <Text style={[styles.title, { color: colors.text }]}>{store?.name}</Text>
          <Text style={[styles.subtitle, { color: colors.mutedText }]}>{store?.address}</Text>
        </View>
      </View>

      <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
        {items.map(it => (
          <View key={it.id} style={[styles.itemRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.itemInfo}>
              <Text style={[styles.itemName, { color: colors.text }]}>{it.name}</Text>
              <Text style={[styles.itemPrice, { color: colors.mutedText }]}>₱{it.price}</Text>
            </View>
            <View style={styles.qtyControls}>
              <TouchableOpacity style={[styles.qtyBtn, { backgroundColor: isDark ? '#2A2A2D' : '#fff', borderColor: colors.border }]} onPress={() => updateQty(it.id, -1)}>
                <Icon name="minus" size={12} color={colors.text} />
              </TouchableOpacity>
              <Text style={[styles.qtyText, { color: colors.text }]}>{quantities[it.id] || 0}</Text>
              <TouchableOpacity style={[styles.qtyBtn, { backgroundColor: isDark ? '#2A2A2D' : '#fff', borderColor: colors.border }]} onPress={() => updateQty(it.id, 1)}>
                <Icon name="plus" size={12} color={colors.text} />
              </TouchableOpacity>
            </View>
          </View>
        ))}
        {items.length === 0 && (
          <View style={styles.empty}> 
            <Text style={[styles.emptyText, { color: colors.mutedText }]}>No items available.</Text>
          </View>
        )}
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
        <View style={styles.summary}> 
          <Text style={[styles.summaryLabel, { color: colors.mutedText }]}>Subtotal</Text>
          <Text style={[styles.summaryValue, { color: colors.text }]}>₱{subtotal}</Text>
        </View>
        <TouchableOpacity style={[styles.addButton, { backgroundColor: isDark ? '#2F2F35' : '#333' }]} onPress={addSelectedToCart}>
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
  title: { fontSize: FONT.titleSize, fontWeight: FONT.weightBold, color: FONT.headerColor },
  subtitle: { fontSize: FONT.smallSize, color: FONT.mutedColor, marginTop: 2 },
  list: { flex: 1, paddingHorizontal: 20 },
  itemRow: { backgroundColor: '#fff', borderRadius: 8, padding: 14, marginVertical: 6, borderWidth: 1, borderColor: '#ddd', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  itemInfo: { flex: 1 },
  itemName: { fontSize: FONT.bodySize, fontWeight: '600', color: FONT.headerColor },
  itemPrice: { fontSize: FONT.smallSize, color: FONT.mutedColor, marginTop: 2 },
  qtyControls: { flexDirection: 'row', alignItems: 'center' },
  qtyBtn: { width: 30, height: 30, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff', borderRadius: 4, margin: 2, borderWidth: 1, borderColor: '#ddd' },
  qtyText: { fontSize: FONT.bodySize, fontWeight: 'bold', color: FONT.headerColor, marginHorizontal: 10 },
  footer: { backgroundColor: '#fff', padding: 20, borderTopWidth: 1, borderTopColor: '#eee' },
  summary: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  summaryLabel: { fontSize: FONT.bodySize, color: FONT.mutedColor },
  summaryValue: { fontSize: FONT.totalSize, fontWeight: FONT.weightBold, color: FONT.headerColor },
  addButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#333', paddingVertical: 14, borderRadius: 8 },
  addButtonText: { color: '#fff', fontSize: FONT.bodySize, fontWeight: 'bold', marginLeft: 8 },
  empty: { padding: 30, alignItems: 'center' },
  emptyText: { color: '#999' },
});

export default StoreItemsScreen;




import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView, TextInput } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome5';
import { FONT } from '../styles/typography';
import { useFocusEffect } from '@react-navigation/native';
import { cartService } from '../services/cartService';
import { db, ref, get } from '../firebaseConfig';
import { BATANGAS_LOCATION_OPTIONS } from '../constants/batangasLocations';

// 3 stores per city/municipality (Batangas-only) - list UI only (no map)
const STORE_TEMPLATES = [
  {
    suffix: 'Food Hub',
    category: 'Restaurant',
    items: [
      { name: 'Chicken Meal', price: 99 },
      { name: 'Spaghetti Tray', price: 85 },
      { name: 'Milk Tea', price: 75 },
    ],
  },
  {
    suffix: 'Grocery Corner',
    category: 'Supermarket',
    items: [
      { name: 'Rice 1kg', price: 79 },
      { name: 'Vegetable Pack', price: 99 },
      { name: 'House Essentials', price: 150 },
    ],
  },
  {
    suffix: 'Mini Mart',
    category: 'Convenience Store',
    items: [
      { name: 'Drinks Set', price: 65 },
      { name: 'Snacks Pack', price: 55 },
      { name: 'Instant Noodles', price: 75 },
    ],
  },
];

const generateBatangasStores = () => {
  const stores = [];
  BATANGAS_LOCATION_OPTIONS.forEach((loc, locIdx) => {
    STORE_TEMPLATES.forEach((tpl, tplIdx) => {
      const storeIndex = tplIdx + 1;
      const id = `${loc.key}-${storeIndex}`;
      const barangay = loc.barangays[(storeIndex - 1) % Math.max(1, loc.barangays.length)] || loc.barangays[0] || 'Poblacion';
      const baseLat = loc.coordinates?.latitude || 14.0;
      const baseLng = loc.coordinates?.longitude || 121.0;
      const lat = Number((baseLat + (locIdx % 7) * 0.002 + tplIdx * 0.001).toFixed(6));
      const lng = Number((baseLng + (tplIdx % 5) * 0.002 + locIdx * 0.001).toFixed(6));

      stores.push({
        id,
        name: `${loc.label} ${tpl.suffix}`,
        category: tpl.category,
        rating: Number((4.1 + ((locIdx + tplIdx) % 6) * 0.1).toFixed(1)),
        distance: `${(0.6 + ((locIdx + tplIdx) % 10) * 0.2).toFixed(1)} km`,
        address: `${barangay}, ${loc.label}, Batangas`,
        area: loc.label,
        coordinates: { latitude: lat, longitude: lng },
        items: tpl.items.map((it, itemIdx) => ({
          id: `${id}-item-${itemIdx + 1}`,
          name: it.name,
          price: it.price + (tplIdx === 0 ? 0 : tplIdx === 1 ? 0 : 0),
        })),
      });
    });
  });
  return stores;
};

const BrowseBatangasStoresScreen = ({ navigation, route }) => {
  const { userId } = route.params || {};
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showOtherCities, setShowOtherCities] = useState(false);
  const [userArea, setUserArea] = useState(null);
  const [cartCount, setCartCount] = useState(0);

  const allStores = useMemo(() => generateBatangasStores(), []);

  const baseStores = useMemo(() => {
    if (!userArea) return allStores;
    if (showOtherCities) return allStores;
    return allStores.filter((s) => s.area === userArea);
  }, [allStores, userArea, showOtherCities]);

  useEffect(() => {
    const init = async () => {
      try {
        if (userId) {
          const userSnap = await get(ref(db, `users/${userId}`));
          const area = userSnap.exists() ? userSnap.val()?.area || null : null;
          setUserArea(area);
          setSearchResults(allStores.filter((s) => !area || showOtherCities ? true : s.area === area));
        } else {
          setSearchResults(allStores);
        }
      } catch {
        setSearchResults(allStores);
      }
    };
    init();
  }, [userId, allStores, showOtherCities]);

  useFocusEffect(
    React.useCallback(() => {
      setCartCount(cartService.getCartCount());
    }, [])
  );

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults(baseStores);
      return;
    }
    const q = searchQuery.trim().toLowerCase();
    const filtered = baseStores.filter((store) => {
      const inItems = (store.items || []).some((it) => it.name.toLowerCase().includes(q));
      return (
        store.name.toLowerCase().includes(q) ||
        store.category.toLowerCase().includes(q) ||
        store.address.toLowerCase().includes(q) ||
        inItems
      );
    });
    setSearchResults(filtered);
  }, [searchQuery, baseStores]);

  const StoreCard = ({ store }) => (
    <TouchableOpacity style={styles.storeCard} onPress={() => navigation.navigate('StoreItems', { store, userId: userId || 'user123' })}>
      <View style={styles.storeHeader}>
        <View style={styles.storeInfo}>
          <Text style={styles.storeName}>{store.name}</Text>
          <Text style={styles.storeCategory}>{store.category}</Text>
        </View>
        <View style={styles.storeRating}>
          <Icon name="star" size={14} color="#FFD700" />
          <Text style={styles.ratingText}>{store.rating}</Text>
        </View>
      </View>

      <Text style={styles.storeAddress}>{store.address}</Text>
      <Text style={styles.storeDistance}>
        {store.area} • {store.distance} away
      </Text>

      <View style={styles.storeItems}>
        <Text style={styles.itemsLabel}>Popular items:</Text>
        <Text style={styles.itemsText}>{(store.items || []).slice(0, 3).map((x) => x.name).join(', ')}</Text>
      </View>

      <View style={styles.storeActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('StoreItems', { store, userId: userId || 'user123' })}
        >
          <Icon name="list" size={16} color="#333" />
          <Text style={styles.actionText}>Browse Items</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Browse Stores</Text>
        <Text style={styles.subtitle}>
          {userArea ? `Home area: ${userArea}` : 'Batangas prototype stores'}
          {showOtherCities ? ' • Browsing all cities/municipalities' : showOtherCities ? '' : ''}
        </Text>

        <TouchableOpacity
          style={styles.cartButton}
          onPress={() => navigation.navigate('Cart', { userId: userId || 'user123' })}
        >
          <Icon name="shopping-cart" size={24} color="#333" />
          {cartCount > 0 && (
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>{cartCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Icon name="search" size={16} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search stores, items, or categories..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#999"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearButton}>
              <Icon name="times" size={16} color="#666" />
            </TouchableOpacity>
          )}
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.headerActionRow} contentContainerStyle={styles.headerActionRowContent}>
          <TouchableOpacity
            style={styles.mapToggleButton}
            onPress={() => {
              const next = !showOtherCities;
              setShowOtherCities(next);
              setSearchQuery('');
            }}
          >
            <Icon name="globe-asia" size={16} color="#333" />
            <Text style={styles.mapToggleText}>{showOtherCities ? 'My Area Only' : 'Browse Other Cities'}</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      <ScrollView style={styles.resultsContainer} showsVerticalScrollIndicator={false}>
        {searchResults.length === 0 ? (
          <View style={styles.noResults}>
            <Icon name="search" size={40} color="#999" />
            <Text style={styles.noResultsText}>No stores found</Text>
            <Text style={styles.noResultsSubtext}>Try a different search term</Text>
          </View>
        ) : (
          searchResults.map((store) => <StoreCard key={store.id} store={store} />)
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { padding: 20, paddingTop: 20, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
  cartButton: { position: 'absolute', top: 22, right: 20, padding: 8 },
  cartBadge: { position: 'absolute', top: -6, right: -6, backgroundColor: '#ff6b6b', borderRadius: 10, minWidth: 20, height: 20, justifyContent: 'center', alignItems: 'center' },
  cartBadgeText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  title: { fontSize: FONT.titleSize, fontWeight: FONT.weightBold, color: FONT.headerColor, marginBottom: 4 },
  subtitle: { fontSize: FONT.subtitleSize, color: FONT.mutedColor, marginRight: 60 },
  searchContainer: { padding: 20, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
  searchInputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f9f9f9', borderRadius: 8, borderWidth: 1, borderColor: '#ddd', paddingHorizontal: 15 },
  searchIcon: { marginRight: 10 },
  searchInput: { flex: 1, height: 50, fontSize: 16, color: '#333' },
  clearButton: { padding: 5 },
  headerActionRow: { marginTop: 12 },
  headerActionRowContent: { flexDirection: 'row' },
  mapToggleButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6, borderWidth: 1, borderColor: '#ddd' },
  mapToggleText: { marginLeft: 6, fontSize: 14, color: '#333', fontWeight: '600' },
  resultsContainer: { flex: 1, paddingHorizontal: 20, paddingTop: 10 },
  storeCard: { backgroundColor: '#fff', borderRadius: 8, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#ddd' },
  storeHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  storeInfo: { flex: 1 },
  storeName: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 2 },
  storeCategory: { fontSize: 14, color: '#666' },
  storeRating: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f9f9f9', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  ratingText: { marginLeft: 4, fontSize: 14, color: '#333', fontWeight: '500' },
  storeAddress: { fontSize: 14, color: '#666', marginBottom: 4 },
  storeDistance: { fontSize: 12, color: '#888', marginBottom: 12 },
  storeItems: { marginBottom: 12 },
  itemsLabel: { fontSize: 12, color: '#666', marginBottom: 2 },
  itemsText: { fontSize: 14, color: '#333' },
  storeActions: { flexDirection: 'row', justifyContent: 'space-between' },
  actionButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f0f0f0', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6, borderWidth: 1, borderColor: '#ddd', flex: 0.48, justifyContent: 'center' },
  actionText: { marginLeft: 6, fontSize: 14, color: '#333', fontWeight: '600' },
  noResults: { alignItems: 'center', paddingVertical: 40 },
  noResultsText: { fontSize: 18, color: '#666', marginTop: 12, fontWeight: '500' },
  noResultsSubtext: { fontSize: 14, color: '#999', marginTop: 4, textAlign: 'center' },
  resultsContainerSpacer: { height: 20 },
});

export default BrowseBatangasStoresScreen;


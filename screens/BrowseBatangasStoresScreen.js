import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView, TextInput } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome5';
import { FONT } from '../styles/typography';
import { useFocusEffect } from '@react-navigation/native';
import { cartService } from '../services/cartService';
import { db, ref, get } from '../firebaseConfig';
import { BATANGAS_LOCATION_OPTIONS } from '../constants/batangasLocations';
import NotificationBell from './NotificationBell';
import { useThemeMode } from '../theme/ThemeContext';

// 3 stores per city/municipality (Batangas-only), rotated per city for variety.
const STORE_BASES = [
  {
    name: 'Aling Nena Sari-Sari',
    category: 'Sari-Sari Store',
    items: [
      { name: 'Pandesal Pack', price: 35 },
      { name: '3-in-1 Coffee Box', price: 62 },
      { name: 'Instant Noodles (3 pcs)', price: 48 },
    ],
  },
  {
    name: 'Kusina ni Mang Tino',
    category: 'Restaurant',
    items: [
      { name: 'Adobo Meal', price: 95 },
      { name: 'Sinigang Meal', price: 115 },
      { name: 'Iced Tea 16oz', price: 45 },
    ],
  },
  {
    name: 'Batangas Fresh Mart',
    category: 'Supermarket',
    items: [
      { name: 'Rice 1kg', price: 62 },
      { name: 'Eggs (12 pcs)', price: 108 },
      { name: 'Cooking Oil 1L', price: 145 },
    ],
  },
  {
    name: 'Luna Pharmacy',
    category: 'Pharmacy',
    items: [
      { name: 'Paracetamol 10 tabs', price: 38 },
      { name: 'Vitamin C 30 tabs', price: 180 },
      { name: 'Alcohol 500ml', price: 95 },
    ],
  },
  {
    name: 'Pan de Bayan Bakery',
    category: 'Bakery',
    items: [
      { name: 'Pandesal (10 pcs)', price: 45 },
      { name: 'Spanish Bread (4 pcs)', price: 50 },
      { name: 'Ensaymada', price: 55 },
    ],
  },
  {
    name: 'Merienda Express',
    category: 'Snacks',
    items: [
      { name: 'Turon (2 pcs)', price: 40 },
      { name: 'Banana Cue (2 pcs)', price: 35 },
      { name: 'Palamig', price: 30 },
    ],
  },
  {
    name: 'Barangay Mini Mart',
    category: 'Convenience Store',
    items: [
      { name: 'Softdrinks 1.5L', price: 95 },
      { name: 'Bottled Water 500ml', price: 20 },
      { name: 'Snack Combo Pack', price: 75 },
    ],
  },
  {
    name: 'Gulay at Isda Corner',
    category: 'Fresh Goods',
    items: [
      { name: 'Mixed Vegetables Pack', price: 85 },
      { name: 'Galunggong 1/2kg', price: 110 },
      { name: 'Tomato + Onion Set', price: 70 },
    ],
  },
];

const toRealisticPrice = (base) => {
  const value = Number(base || 0);
  if (!Number.isFinite(value) || value <= 0) return 0;
  // heuristic markup for more realistic pricing
  const markup = value <= 100 ? 1.08 : value <= 500 ? 1.1 : 1.05;
  const priced = value * markup;
  // round up to nearest 5 pesos
  return Math.ceil(priced / 5) * 5;
};

const generateBatangasStores = () => {
  const stores = [];
  BATANGAS_LOCATION_OPTIONS.forEach((loc, locIdx) => {
    const baseStart = locIdx % STORE_BASES.length;
    const cityStoreSet = [
      STORE_BASES[baseStart % STORE_BASES.length],
      STORE_BASES[(baseStart + 2) % STORE_BASES.length],
      STORE_BASES[(baseStart + 5) % STORE_BASES.length],
    ];

    cityStoreSet.forEach((base, tplIdx) => {
      const storeIndex = tplIdx + 1;
      const id = `${loc.key}-${storeIndex}`;
      const barangay = loc.barangays[(storeIndex - 1) % Math.max(1, loc.barangays.length)] || loc.barangays[0] || 'Poblacion';
      const baseLat = loc.coordinates?.latitude || 14.0;
      const baseLng = loc.coordinates?.longitude || 121.0;
      const lat = Number((baseLat + (locIdx % 7) * 0.002 + tplIdx * 0.001).toFixed(6));
      const lng = Number((baseLng + (tplIdx % 5) * 0.002 + locIdx * 0.001).toFixed(6));

      stores.push({
        id,
        name: `${base.name} - ${loc.label}`,
        category: base.category,
        rating: Number((4.1 + ((locIdx + tplIdx) % 6) * 0.1).toFixed(1)),
        distance: `${(0.6 + ((locIdx + tplIdx) % 10) * 0.2).toFixed(1)} km`,
        address: `${barangay}, ${loc.label}, Batangas`,
        area: loc.label,
        coordinates: { latitude: lat, longitude: lng },
        items: base.items.map((it, itemIdx) => ({
          id: `${id}-item-${itemIdx + 1}`,
          name: it.name,
          price: toRealisticPrice(it.price),
        })),
      });
    });
  });
  return stores;
};

const BrowseBatangasStoresScreen = ({ navigation, route }) => {
  const { isDark, colors } = useThemeMode();
  const { userId } = route.params || {};
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showAllBatangas, setShowAllBatangas] = useState(false);
  const [userArea, setUserArea] = useState(null);
  const [userBarangay, setUserBarangay] = useState(null);
  const [cartCount, setCartCount] = useState(0);

  const allStores = useMemo(() => generateBatangasStores(), []);

  const baseStores = useMemo(() => {
    if (showAllBatangas) return allStores;
    if (!userArea) return [];
    return allStores.filter((s) => s.area === userArea);
  }, [allStores, userArea, showAllBatangas]);

  useEffect(() => {
    const init = async () => {
      try {
        if (userId) {
          const userSnap = await get(ref(db, `users/${userId}`));
          const area = userSnap.exists() ? userSnap.val()?.area || null : null;
          const barangay = userSnap.exists() ? userSnap.val()?.barangay || null : null;
          setUserArea(area);
          setUserBarangay(barangay);
          setSearchResults(area ? allStores.filter((s) => s.area === area) : []);
        } else {
          setSearchResults([]);
        }
      } catch {
        setSearchResults([]);
      }
    };
    init();
  }, [userId, allStores]);

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
    <TouchableOpacity style={[styles.storeCard, { backgroundColor: colors.surface, borderColor: colors.border }]} onPress={() => navigation.navigate('StoreItems', { store, userId: userId || 'user123' })}>
      <View style={styles.storeHeader}>
        <View style={styles.storeInfo}>
          <Text style={[styles.storeName, { color: colors.text }]}>{store.name}</Text>
          <Text style={[styles.storeCategory, { color: colors.mutedText }]}>{store.category}</Text>
        </View>
        <View style={[styles.storeRating, { backgroundColor: isDark ? '#2A2A2D' : '#f9f9f9', borderColor: colors.border }]}>
          <Icon name="star" size={14} color="#FFD700" />
          <Text style={[styles.ratingText, { color: colors.text }]}>{store.rating}</Text>
        </View>
      </View>

      <Text style={[styles.storeAddress, { color: colors.mutedText }]}>{store.address}</Text>
      <Text style={[styles.storeDistance, { color: colors.mutedText }]}>
        {store.area} • {store.distance} away
      </Text>

      <View style={styles.storeItems}>
        <Text style={[styles.itemsLabel, { color: colors.mutedText }]}>Popular items:</Text>
        <Text style={[styles.itemsText, { color: colors.text }]}>{(store.items || []).slice(0, 3).map((x) => x.name).join(', ')}</Text>
      </View>

      <View style={styles.storeActions}>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: isDark ? '#2A2A2D' : '#f0f0f0', borderColor: colors.border }]}
          onPress={() => navigation.navigate('StoreItems', { store, userId: userId || 'user123' })}
        >
          <Icon name="list" size={16} color={colors.text} />
          <Text style={[styles.actionText, { color: colors.text }]}>Browse Items</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.text }]}>Browse Stores</Text>
        <Text style={[styles.subtitle, { color: colors.mutedText }]}>
          {userArea ? `My Area: ${userArea}${userBarangay ? `, ${userBarangay}` : ''}` : 'Set your Batangas area to browse nearby stores'}
          {showAllBatangas ? ' • Showing all Batangas stores' : userArea ? ' • Showing stores in your area' : ''}
        </Text>

        <View style={styles.headerActions}>
          <NotificationBell userId={userId} navigation={navigation} />
          <TouchableOpacity
            style={styles.cartButton}
            onPress={() => navigation.navigate('Cart', { userId: userId || 'user123' })}
          >
            <Icon name="shopping-cart" size={24} color={colors.text} />
            {cartCount > 0 && (
              <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeText}>{cartCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <View style={[styles.searchContainer, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <View style={[styles.searchInputContainer, { backgroundColor: isDark ? '#2A2A2D' : '#f9f9f9', borderColor: colors.border }]}>
          <Icon name="search" size={16} color={colors.mutedText} style={styles.searchIcon} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search stores, items, or categories..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor={colors.mutedText}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearButton}>
              <Icon name="times" size={16} color={colors.mutedText} />
            </TouchableOpacity>
          )}
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.headerActionRow} contentContainerStyle={styles.headerActionRowContent}>
          <TouchableOpacity
            style={[styles.mapToggleButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => {
              const next = !showAllBatangas;
              setShowAllBatangas(next);
              setSearchQuery('');
            }}
          >
            <Icon name="globe-asia" size={16} color={colors.text} />
            <Text style={[styles.mapToggleText, { color: colors.text }]}>{showAllBatangas ? 'My Area' : 'All Batangas'}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.mapToggleButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => navigation.navigate('NewPasabuyRequest', { userId })}
          >
            <Icon name="shopping-bag" size={16} color={colors.text} />
            <Text style={[styles.mapToggleText, { color: colors.text }]}>New Pasabuy Request</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      <ScrollView style={styles.resultsContainer} showsVerticalScrollIndicator={false}>
        {searchResults.length === 0 ? (
          <View style={styles.noResults}>
            <Icon name="search" size={40} color={colors.mutedText} />
            <Text style={[styles.noResultsText, { color: colors.mutedText }]}>{userArea ? 'No stores found' : 'No area selected yet'}</Text>
            <Text style={[styles.noResultsSubtext, { color: colors.mutedText }]}>
              {userArea ? 'Try a different search term' : 'Set your Batangas area and barangay in your profile first.'}
            </Text>
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
  headerActions: { position: 'absolute', top: 20, right: 20, flexDirection: 'row', alignItems: 'center', gap: 8 },
  cartButton: { padding: 6 },
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
  storeRating: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f9f9f9', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, borderWidth: 1, borderColor: '#ddd' },
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


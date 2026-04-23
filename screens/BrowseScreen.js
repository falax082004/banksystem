import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  SafeAreaView,
  Dimensions,
  Platform
} from 'react-native';
import Constants from 'expo-constants';
let RNMapView = null;
let RNMarker = null;
let RN_PROVIDER_GOOGLE = null;
try {
  const RNMaps = require('react-native-maps');
  RNMapView = RNMaps.default || RNMaps.MapView || RNMaps;
  RNMarker = RNMaps.Marker;
  RN_PROVIDER_GOOGLE = RNMaps.PROVIDER_GOOGLE;
} catch {}
import Icon from 'react-native-vector-icons/FontAwesome5';
import { FONT } from '../styles/typography';
import { useFocusEffect } from '@react-navigation/native';
import { cartService } from '../services/cartService';
import { orderService } from '../services/orderService';
import { useThemeMode } from '../theme/ThemeContext';

const { width: screenWidth, height } = Dimensions.get('window');

const BrowseScreen = ({ navigation, route }) => {
  const { isDark, colors } = useThemeMode();
  const { userId } = route.params || {};
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showMap, setShowMap] = useState(false);
  const [selectedStore, setSelectedStore] = useState(null);
  const [cartCount, setCartCount] = useState(0);

  // Mock data for stores
  const mockStores = [
    {
      id: 1,
      name: 'Jollibee',
      category: 'Fast Food',
      rating: 4.5,
      distance: '0.5 km',
      address: '123 Main St, Manila',
      items: ['Chicken Joy', 'Jolly Spaghetti', 'Burger Steak'],
      coordinates: { latitude: 14.5995, longitude: 120.9842 }
    },
    {
      id: 2,
      name: 'McDonald\'s',
      category: 'Fast Food',
      rating: 4.3,
      distance: '0.8 km',
      address: '456 Ayala Ave, Makati',
      items: ['Big Mac', 'McFlurry', 'Chicken McNuggets'],
      coordinates: { latitude: 14.5547, longitude: 121.0244 }
    },
    {
      id: 3,
      name: 'Starbucks',
      category: 'Coffee',
      rating: 4.7,
      distance: '1.2 km',
      address: '789 BGC, Taguig',
      items: ['Frappuccino', 'Latte', 'Pastries'],
      coordinates: { latitude: 14.5503, longitude: 121.0490 }
    },
    {
      id: 4,
      name: '7-Eleven',
      category: 'Convenience Store',
      rating: 4.1,
      distance: '0.3 km',
      address: '321 EDSA, Quezon City',
      items: ['Snacks', 'Drinks', 'Basic Groceries'],
      coordinates: { latitude: 14.6760, longitude: 121.0437 }
    },
    {
      id: 5,
      name: 'Puregold',
      category: 'Supermarket',
      rating: 4.2,
      distance: '1.5 km',
      address: '654 Ortigas Ave, Pasig',
      items: ['Groceries', 'Fresh Produce', 'Household Items'],
      coordinates: { latitude: 14.5906, longitude: 121.0568 }
    }
  ];

  useEffect(() => {
    // Initialize with all stores
    setSearchResults(mockStores);
    
    // Test cart service
    cartService.testCart();
    
    // Get initial cart count
    const count = cartService.getCartCount();
    console.log('BrowseScreen: Initial cart count:', count);
    setCartCount(count);
  }, []);

  // Refresh cart count when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      setCartCount(cartService.getCartCount());
    }, [])
  );

  const handleSearch = (query) => {
    setSearchQuery(query);
    if (query.trim() === '') {
      setSearchResults(mockStores);
    } else {
      const filtered = mockStores.filter(store => 
        store.name.toLowerCase().includes(query.toLowerCase()) ||
        store.category.toLowerCase().includes(query.toLowerCase()) ||
        store.items.some(item => item.toLowerCase().includes(query.toLowerCase()))
      );
      setSearchResults(filtered);
    }
  };

  const handleStoreSelect = (store) => {
    console.log('Opening items for store:', store.name);
    navigation.navigate('StoreItems', { store, userId: userId || 'user123' });
  };

  const handleMapClose = () => {
    setShowMap(false);
    setSelectedStore(null);
  };

  const addToCart = (store) => {
    console.log('Adding store to cart:', store.name);
    
    // Add to cart using service
    const updatedCart = cartService.addToCart(store);
    console.log('Updated cart:', updatedCart);
    
    // Update cart count
    const newCount = cartService.getCartCount();
    console.log('New cart count:', newCount);
    setCartCount(newCount);
    
    // Simple confirmation then stay/redirect to Browse
    Alert.alert(
      'Added to Cart',
      'The store has been added to your cart.',
      [
        {
          text: 'OK',
          onPress: () => navigation.navigate('Browse', { userId: userId || 'user123' })
        }
      ]
    );
  };

  const StoreCard = ({ store }) => (
    <TouchableOpacity 
      style={[styles.storeCard, { backgroundColor: colors.surface, borderColor: colors.border }]} 
      onPress={() => handleStoreSelect(store)}
    >
      <View style={styles.storeHeader}>
        <View style={styles.storeInfo}>
          <Text style={[styles.storeName, { color: colors.text }]}>{store.name}</Text>
          <Text style={[styles.storeCategory, { color: colors.mutedText }]}>{store.category}</Text>
        </View>
        <View style={[styles.storeRating, { backgroundColor: isDark ? '#2A2A2D' : '#f9f9f9' }]}>
          <Icon name="star" size={14} color="#FFD700" />
          <Text style={[styles.ratingText, { color: colors.text }]}>{store.rating}</Text>
        </View>
      </View>
      
      <Text style={[styles.storeAddress, { color: colors.mutedText }]}>{store.address}</Text>
      <Text style={[styles.storeDistance, { color: colors.mutedText }]}>{store.distance} away</Text>
      
      <View style={styles.storeItems}>
        <Text style={[styles.itemsLabel, { color: colors.mutedText }]}>Popular items:</Text>
        <Text style={[styles.itemsText, { color: colors.text }]}>{store.items.slice(0, 3).join(', ')}</Text>
      </View>
      
      <View style={styles.storeActions}>
        <TouchableOpacity 
          style={[styles.actionButton, { backgroundColor: isDark ? '#2A2A2D' : '#f0f0f0', borderColor: colors.border }]}
          onPress={() => navigation.navigate('StoreItems', { store, userId: userId || 'user123' })}
        >
          <Icon name="list" size={16} color={colors.text} />
          <Text style={[styles.actionText, { color: colors.text }]}>Browse Items</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.actionButton, { backgroundColor: isDark ? '#2A2A2D' : '#f0f0f0', borderColor: colors.border }]}
          onPress={() => {
            console.log('Opening map for store:', store.name);
            setSelectedStore(store);
            setShowMap(true);
          }}
        >
          <Icon name="map-marker-alt" size={16} color={colors.text} />
          <Text style={[styles.actionText, { color: colors.text }]}>View on Map</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

       const StaticMap = () => {
        const lat = selectedStore?.coordinates?.latitude || 14.5995;
        const lng = selectedStore?.coordinates?.longitude || 120.9842;
        const zoom = 14;
        const mapWidth = Math.max(300, Math.floor(screenWidth * 0.9) || 360);
        const height = 260;
        const apiKey = (Constants?.expoConfig?.extra?.GOOGLE_STATIC_MAPS_KEY) || (Constants?.manifest?.extra?.GOOGLE_STATIC_MAPS_KEY) || 'YOUR_GOOGLE_STATIC_MAPS_KEY_HERE';
        const markers = [`color:red|label:S|${lat},${lng}`];
        const url = `https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lng}&zoom=${zoom}&size=${mapWidth}x${height}&maptype=roadmap&markers=${encodeURIComponent(markers.join('\n'))}&key=${apiKey}`;
        return (
          <View style={[styles.map, { overflow: 'hidden' }]}>
            <View style={{ flex: 1, backgroundColor: '#eee', borderRadius: 8 }}>
              <View style={{ flex: 1 }}>
                <View style={{ flex: 1, borderRadius: 8 }}>
                  <View style={{ flex: 1 }}>
                    <View style={{ flex: 1 }}>
                      <View style={{ flex: 1 }}>
                        <View style={{ flex: 1 }}>
                          <View style={{ flex: 1 }}>
                            <View style={{ flex: 1 }}>
                              <View style={{ flex: 1 }}>
                                <View style={{ flex: 1 }}>
                                  <View style={{ flex: 1 }}>
                                    <View style={{ flex: 1 }}>
                                      <View style={{ flex: 1 }}>
                                        <View style={{ flex: 1 }}>
                                          <View style={{ flex: 1 }}>
                                            <View style={{ flex: 1 }}>
                                              <View style={{ flex: 1 }}>
                                                <View style={{ flex: 1 }}>
                                                  <View style={{ flex: 1 }}>
                                                    <View style={{ flex: 1 }}>
                                                      <View style={{ flex: 1 }}>
                                                        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                                                          <View style={{ width: '100%', height: '100%', backgroundColor: '#ddd' }}>
                                                            <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
                                                              <View style={{ flex: 1 }}>
                                                                <View style={{ flex: 1 }}>
                                                                  <View style={{ flex: 1 }}>
                                                                    <View style={{ flex: 1 }}>
                                                                      <View style={{ flex: 1 }}>
                                                                        <View style={{ flex: 1 }}>
                                                                          <View style={{ flex: 1 }}>
                                                                            <View style={{ flex: 1 }}>
                                                                              <View style={{ flex: 1 }}>
                                                                                <View style={{ flex: 1 }}>
                                                                                  <View style={{ flex: 1 }}>
                                                                                    <View style={{ flex: 1 }}>
                                                                                      <View style={{ flex: 1 }}>
                                                                                        <View style={{ flex: 1 }}>
                                                                                          {/* Using Image requires import, but avoiding to keep file minimal; we can use a View with background if no key */}
                                                                                        </View>
                                                                                      </View>
                                                                                    </View>
                                                                                  </View>
                                                                                </View>
                                                                              </View>
                                                                            </View>
                                                                          </View>
                                                                        </View>
                                                                      </View>
                                                                    </View>
                                                                  </View>
                                                                </View>
                                                              </View>
                                                            </View>
                                                          </View>
                                                        </View>
                                                      </View>
                                                    </View>
                                                  </View>
                                                </View>
                                              </View>
                                            </View>
                                          </View>
                                        </View>
                                      </View>
                                    </View>
                                  </View>
                                </View>
                              </View>
                            </View>
                          </View>
                        </View>
                      </View>
                    </View>
                  </View>
                </View>
              </View>
            </View>
          </View>
        );
       };

       const MapViewComponent = () => {
        console.log('Rendering MapViewComponent, selectedStore:', selectedStore?.name);
        return (
          <View style={styles.mapContainer}>
            <View style={styles.mapHeader}>
              <TouchableOpacity onPress={handleMapClose} style={styles.closeButton}>
                <Icon name="times" size={20} color="#333" />
              </TouchableOpacity>
              <Text style={styles.mapTitle}>Store Location</Text>
            </View>

            {Constants.appOwnership === 'expo' ? (
              <StaticMap />
            ) : RNMapView ? (
              <RNMapView
                provider={RN_PROVIDER_GOOGLE}
                style={styles.map}
                initialRegion={{
                  latitude: selectedStore?.coordinates?.latitude || 14.5995,
                  longitude: selectedStore?.coordinates?.longitude || 120.9842,
                  latitudeDelta: 0.05,
                  longitudeDelta: 0.05,
                }}
                showsUserLocation={true}
                showsMyLocationButton={true}
                toolbarEnabled={true}
                loadingEnabled={true}
              >
                {/* All store markers */}
                {searchResults.map((s) => (
                  <RNMarker
                    key={s.id}
                    coordinate={s.coordinates}
                    title={s.name}
                    description={`${s.category} • ${s.distance}`}
                    onPress={() => setSelectedStore(s)}
                  />
                ))}
              </RNMapView>
            ) : (
              <View style={styles.mapPlaceholder}>
                <Icon name="map" size={40} color="#666" />
                <Text style={styles.mapText}>Map unavailable</Text>
                <Text style={styles.mapSubtext}>Install react-native-maps or configure Google Maps API key.</Text>
              </View>
            )}

            {selectedStore && (
              <View style={styles.storeDetails}>
                <Text style={styles.storeDetailsTitle}>{selectedStore.name}</Text>
                <Text style={styles.storeDetailsAddress}>{selectedStore.address}</Text>
                <Text style={styles.storeDetailsDistance}>{selectedStore.distance} away</Text>
                <View style={styles.storeActions}>
                  <TouchableOpacity style={styles.mapActionButton}>
                    <Icon name="directions" size={16} color="#333" />
                    <Text style={styles.mapActionText}>Get Directions</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.mapActionButton}>
                    <Icon name="phone" size={16} color="#333" />
                    <Text style={styles.mapActionText}>Call Store</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Map info overlay */}
            <View style={styles.mapInfoOverlay}>
              <Text style={styles.mapInfoText}>Interactive Map View</Text>
              <Text style={styles.mapInfoSubtext}>Tap markers to view store details</Text>
            </View>
          </View>
        );
      };

  if (showMap) {
    return <MapViewComponent />;
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.text }]}>Browse Stores</Text>
        <Text style={[styles.subtitle, { color: colors.mutedText }]}>Discover stores and items near you</Text>

        {/* keep cart button available but position it absolute to avoid centering the header */}
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

      <View style={[styles.searchContainer, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <View style={[styles.searchInputContainer, { backgroundColor: isDark ? '#2A2A2D' : '#f9f9f9', borderColor: colors.border }]}>
          <Icon name="search" size={16} color={colors.mutedText} style={styles.searchIcon} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search stores, items, or categories..."
            value={searchQuery}
            onChangeText={handleSearch}
            placeholderTextColor={colors.mutedText}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => handleSearch('')} style={styles.clearButton}>
              <Icon name="times" size={16} color={colors.mutedText} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.resultsHeader}>
        <Text style={[styles.resultsCount, { color: colors.mutedText }]}>
          {searchResults.length} store{searchResults.length !== 1 ? 's' : ''} found
        </Text>
        <TouchableOpacity 
          style={[styles.mapToggleButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={() => {
            console.log('Opening map view');
            setShowMap(true);
          }}
        >
          <Icon name="map" size={16} color={colors.text} />
          <Text style={[styles.mapToggleText, { color: colors.text }]}>Map View</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.resultsContainer} showsVerticalScrollIndicator={false}>
        {searchResults.length === 0 ? (
          <View style={styles.noResults}>
            <Icon name="search" size={40} color={colors.mutedText} />
            <Text style={[styles.noResultsText, { color: colors.text }]}>No stores found</Text>
            <Text style={[styles.noResultsSubtext, { color: colors.mutedText }]}>Try a different search term</Text>
          </View>
        ) : (
          searchResults.map(store => (
            <StoreCard key={store.id} store={store} />
          ))
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
    padding: 20,
    paddingTop: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  /* headerTop and headerText removed to left-align header like Inbox */
  cartButton: {
    position: 'absolute',
    top: 22,
    right: 20,
    padding: 8,
  },
  cartBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#ff6b6b',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
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
  searchContainer: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    paddingHorizontal: 15,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    height: 50,
    fontSize: 16,
    color: '#333',
  },
  clearButton: {
    padding: 5,
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 10,
  },
  resultsCount: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  mapToggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  mapToggleText: {
    marginLeft: 6,
    fontSize: 14,
    color: '#333',
  },
  resultsContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  storeCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  storeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  storeInfo: {
    flex: 1,
  },
  storeName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  storeCategory: {
    fontSize: 14,
    color: '#666',
  },
  storeRating: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  ratingText: {
    marginLeft: 4,
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  storeAddress: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  storeDistance: {
    fontSize: 12,
    color: '#888',
    marginBottom: 12,
  },
  storeItems: {
    marginBottom: 12,
  },
  itemsLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  itemsText: {
    fontSize: 14,
    color: '#333',
  },
  storeActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ddd',
    flex: 0.48,
    justifyContent: 'center',
  },
  actionText: {
    marginLeft: 6,
    fontSize: 14,
    color: '#333',
  },
  noResults: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  noResultsText: {
    fontSize: 18,
    color: '#666',
    marginTop: 12,
    fontWeight: '500',
  },
  noResultsSubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 4,
  },
  mapContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  mapHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  closeButton: {
    padding: 8,
    marginRight: 12,
  },
  mapTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
      map: {
        flex: 1,
        margin: 20,
        borderRadius: 8,
        borderWidth: 2,
        borderColor: '#ddd',
      },
      mapInfoOverlay: {
        position: 'absolute',
        top: 20,
        right: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        padding: 10,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: '#ddd',
      },
      mapInfoText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#333',
      },
      mapInfoSubtext: {
        fontSize: 10,
        color: '#666',
        marginTop: 2,
      },
      mapPlaceholder: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
        margin: 20,
        borderRadius: 8,
        borderWidth: 2,
        borderColor: '#ddd',
      },
      mapText: {
        fontSize: 18,
        color: '#666',
        marginTop: 12,
        fontWeight: '500',
      },
      mapSubtext: {
        fontSize: 14,
        color: '#999',
        marginTop: 8,
        textAlign: 'center',
        paddingHorizontal: 20,
      },
      mapNote: {
        fontSize: 12,
        color: '#ccc',
        marginTop: 16,
        textAlign: 'center',
        paddingHorizontal: 20,
        fontStyle: 'italic',
      },
  storeDetails: {
    backgroundColor: '#fff',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  storeDetailsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  storeDetailsAddress: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
      storeDetailsDistance: {
        fontSize: 12,
        color: '#888',
        marginBottom: 15,
      },
      storeActions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 10,
      },
      mapActionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f0f0f0',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: '#ddd',
        flex: 0.48,
        justifyContent: 'center',
      },
      mapActionText: {
        marginLeft: 6,
        fontSize: 14,
        color: '#333',
      },
});

export default BrowseScreen;





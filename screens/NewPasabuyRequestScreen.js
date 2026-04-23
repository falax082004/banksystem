import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome5';
import { db, ref, get } from '../firebaseConfig';
import { FONT } from '../styles/typography';
import { orderActionsService } from '../services/orderActionsService';
import { useThemeMode } from '../theme/ThemeContext';

const sanitizeAmountInput = (raw = '') => raw.replace(/[^\d.]/g, '');

const getSafeCashReserve = (amount) => {
  const value = Number(amount);
  if (!Number.isFinite(value) || value <= 0) return 0;
  return Math.ceil((value * 1.2) / 10) * 10;
};

const NewPasabuyRequestScreen = ({ navigation, route }) => {
  const { isDark, colors } = useThemeMode();
  const { userId } = route.params || {};
  const [itemName, setItemName] = useState('');
  const [notes, setNotes] = useState('');
  const [budget, setBudget] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [paymentChannel, setPaymentChannel] = useState('');
  const [pasapayBalance, setPasapayBalance] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const loadUser = async () => {
      if (!userId) return;
      const snapshot = await get(ref(db, `users/${userId}`));
      if (snapshot.exists()) {
        const data = snapshot.val();
        setDeliveryAddress(
          data.address || (data.barangay && data.area ? `${data.barangay}, ${data.area}, Batangas` : '')
        );
        setPasapayBalance(Number(data.pasapayBalance || 0));
      }
    };
    loadUser();
  }, [userId]);

  const submitRequest = async () => {
    const amount = Number(budget);
    if (!deliveryAddress) {
      Alert.alert('Address Required', 'Please complete your area and barangay first.');
      return;
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      Alert.alert('Budget Required', 'Enter a valid budget for the requested item.');
      return;
    }
    if (paymentMethod === 'online' && !paymentChannel) {
      Alert.alert('Payment Channel Required', 'Choose an online payment channel.');
      return;
    }
    if (paymentMethod === 'pasapay' && pasapayBalance < amount) {
      Alert.alert('Insufficient Pasapay', 'Your Pasapay balance is not enough for this request.');
      return;
    }

    setSubmitting(true);
    try {
      await orderActionsService.createPasabuyRequest({
        userId,
        itemName,
        notes,
        budget: amount,
        paymentMethod,
        paymentChannel,
        deliveryAddress,
      });
      Alert.alert('Request Posted', 'Your pasabuy request is now visible to riders and pasabuyers.');
      navigation.navigate('Home', { userId, screen: 'Orders' });
    } catch (error) {
      Alert.alert('Request Failed', error.message || 'Unable to submit pasabuy request.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.topBar}>
          <TouchableOpacity style={[styles.backButton, { borderColor: colors.border, backgroundColor: colors.surface }]} onPress={() => navigation.goBack()}>
            <Icon name="arrow-left" size={14} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.topTitle, { color: colors.text }]}>New Pasabuy Request</Text>
        </View>
        <View style={[styles.panel, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.label, { color: colors.text }]}>Requested Item</Text>
          <TextInput
            style={[styles.input, { borderColor: colors.border, backgroundColor: colors.surface, color: colors.text }]}
            placeholder="Example: specific medicine, bakery item, school supply"
            placeholderTextColor={colors.mutedText}
            value={itemName}
            onChangeText={setItemName}
          />

          <Text style={[styles.label, { color: colors.text }]}>Notes</Text>
          <TextInput
            style={[styles.input, styles.textArea, { borderColor: colors.border, backgroundColor: colors.surface, color: colors.text }]}
            placeholder="Brand, size, color, or any buying instruction"
            placeholderTextColor={colors.mutedText}
            value={notes}
            onChangeText={setNotes}
            multiline
          />

          <Text style={[styles.label, { color: colors.text }]}>Budget</Text>
          <TextInput
            style={[styles.input, { borderColor: colors.border, backgroundColor: colors.surface, color: colors.text }]}
            placeholder="Enter estimated amount"
            placeholderTextColor={colors.mutedText}
            value={budget}
            onChangeText={(value) => setBudget(sanitizeAmountInput(value))}
            keyboardType="numeric"
          />

          <Text style={[styles.label, { color: colors.text }]}>Delivery Address</Text>
          <View style={[styles.addressBox, { borderColor: colors.border, backgroundColor: isDark ? '#2A2A2D' : '#f9f9f9' }]}>
            <Icon name="map-marker-alt" size={14} color={colors.mutedText} />
            <Text style={[styles.addressText, { color: colors.mutedText }]}>{deliveryAddress || 'No Batangas address saved yet.'}</Text>
          </View>

          <Text style={[styles.label, { color: colors.text }]}>Payment Method</Text>
          <View style={styles.chipRow}>
            {['cash', 'online', 'pasapay'].map((option) => {
              const active = option === paymentMethod;
              return (
                <TouchableOpacity
                  key={option}
                  style={[styles.chip, { borderColor: colors.border, backgroundColor: colors.surface }, active && styles.chipActive]}
                  onPress={() => {
                    setPaymentMethod(option);
                    if (option !== 'online') setPaymentChannel('');
                  }}
                >
                  <Text style={[styles.chipText, { color: active ? '#fff' : colors.text }, active && styles.chipTextActive]}>
                    {option === 'cash' ? 'Cash' : option === 'online' ? 'Online' : 'Pasapay'}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {paymentMethod === 'online' && (
            <>
              <Text style={[styles.label, { color: colors.text }]}>Online Channel</Text>
              <View style={styles.chipRow}>
                {['GCash', 'Maya', 'PayPal', 'Card'].map((channel) => {
                  const active = channel === paymentChannel;
                  return (
                    <TouchableOpacity
                      key={channel}
                      style={[styles.chip, { borderColor: colors.border, backgroundColor: colors.surface }, active && styles.chipActive]}
                      onPress={() => setPaymentChannel(channel)}
                    >
                      <Text style={[styles.chipText, { color: active ? '#fff' : colors.text }, active && styles.chipTextActive]}>{channel}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </>
          )}

          {paymentMethod === 'cash' && budget ? (
            <Text style={[styles.hintText, { color: colors.mutedText }]}>
              Cash requests require at least ₱{getSafeCashReserve(budget)} Pasapay balance before they can be accepted.
            </Text>
          ) : null}

          {paymentMethod === 'pasapay' && (
            <Text style={[styles.hintText, { color: colors.mutedText }]}>Pasapay balance: ₱{pasapayBalance.toFixed(2)}</Text>
          )}

          <TouchableOpacity style={[styles.submitButton, { backgroundColor: isDark ? '#2F2F35' : '#333' }]} onPress={submitRequest} disabled={submitting}>
            <Icon name="paper-plane" size={16} color="#fff" />
            <Text style={styles.submitButtonText}>{submitting ? 'Submitting...' : 'Post Pasabuy Request'}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 20,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  backButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    marginRight: 10,
  },
  topTitle: {
    fontSize: FONT.titleSize,
    fontWeight: FONT.weightBold,
    color: FONT.headerColor,
  },
  panel: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 16,
  },
  label: {
    fontSize: FONT.bodySize,
    fontWeight: '600',
    color: FONT.headerColor,
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: FONT.bodySize,
    backgroundColor: '#fff',
  },
  textArea: {
    minHeight: 90,
    textAlignVertical: 'top',
  },
  addressBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#f9f9f9',
  },
  addressText: {
    marginLeft: 8,
    color: FONT.mutedColor,
    flex: 1,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    marginRight: 8,
    marginBottom: 8,
    backgroundColor: '#fff',
  },
  chipActive: {
    backgroundColor: '#333',
    borderColor: '#333',
  },
  chipText: {
    color: '#333',
    fontWeight: '600',
  },
  chipTextActive: {
    color: '#fff',
  },
  hintText: {
    color: FONT.mutedColor,
    fontSize: FONT.smallSize,
    marginTop: 8,
  },
  submitButton: {
    marginTop: 20,
    backgroundColor: '#333',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  submitButtonText: {
    color: '#fff',
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default NewPasabuyRequestScreen;

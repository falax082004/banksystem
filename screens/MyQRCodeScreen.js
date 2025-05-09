import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Image, Modal, TextInput, ImageBackground } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { db, ref, get } from '../firebaseConfig';

const maskedName = (name) => {
  // Example: RICARLO L. C. => RI*****L C.
  if (!name) return '';
  const parts = name.split(' ');
  if (parts.length < 2) return name;
  const first = parts[0].slice(0, 2) + '*****';
  const last = parts.slice(1).map(p => p[0]).join(' ');
  return `${first}${last ? ' ' + last + '.' : ''}`;
};

const MyQRCodeScreen = ({ route }) => {
  const userId = (route?.params?.userId) || '';
  const [user, setUser] = useState({ name: '', mobile: '' });
  const [showQR, setShowQR] = useState(false);
  const [amountModal, setAmountModal] = useState(false);
  const [amount, setAmount] = useState('');
  const [qrValue, setQrValue] = useState('');

  // Fetch user data from Firebase
  useEffect(() => {
    const fetchUser = async () => {
      if (!userId) return;
      try {
        const snapshot = await get(ref(db, 'users/' + userId));
        if (snapshot.exists()) {
          const data = snapshot.val();
          setUser({
            name: data.name || '',
            mobile: data.mobile || data.phoneNumber || '',
          });
        }
      } catch (e) {
        // Optionally handle error
      }
    };
    fetchUser();
  }, [userId]);

  // Update QR value when userId or amount changes
  useEffect(() => {
    let value = `pantheon://pay/${userId}`;
    if (amount) value += `?amount=${amount}`;
    setQrValue(value);
  }, [userId, amount]);

  return (
    <ImageBackground source={require('../assets/bgapp3.jpg')} style={styles.background}>
      <View style={styles.overlay} />
      <SafeAreaView style={{ flex: 1, backgroundColor: 'transparent' }}>
        {/* Intro Card */}
        {!showQR && (
          <View style={styles.introCard}>
            <Text style={styles.introTitle}>
              Generate a <Text style={{ color: '#000000', fontWeight: 'bold' }}>QR Code</Text> to pay for a purchase or request money.
            </Text>
            <View style={styles.introOption}>
              <MaterialCommunityIcons name="qrcode-scan" size={32} color="#000000" />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.introOptTitle}>Pay Using QR Code</Text>
                <Text style={styles.introOptDesc}>Show any of these codes to the cashier to pay for your purchases.</Text>
              </View>
            </View>
            <View style={styles.introOption}>
              <MaterialCommunityIcons name="earth" size={32} color="#000000" />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.introOptTitle}>Pay Abroad with Alipay+</Text>
                <Text style={styles.introOptDesc}>Show this code to the cashier when paying abroad!</Text>
              </View>
            </View>
            <View style={styles.introOption}>
              <MaterialCommunityIcons name="qrcode-scan" size={32} color="#000000" />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.introOptTitle}>Receive Money via QR Code</Text>
                <Text style={styles.introOptDesc}>Share this code to anyone so they can send you money through Pantheon or bank transfer.</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.primaryBtn} onPress={() => setShowQR(true)}>
              <Text style={styles.primaryBtnText}>Show My QR Code</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* QR Code Card */}
        {showQR && (
          <View style={styles.qrCard}>
            <View style={styles.qrCodeBox}>
              <QRCode
                value={qrValue}
                size={160}
                backgroundColor="#fff"
              />
              <Image
                source={require('../assets/instapayy.png')}
                style={styles.qrLogo}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.qrNote}>Transfer fees may apply.</Text>
            <View style={styles.userInfoRow}>
              <Text style={styles.userName}>
                {maskedName(user.name)}
              </Text>
              <TouchableOpacity>
                <Ionicons name="pencil" size={18} color="#000000" />
              </TouchableOpacity>
            </View>
            <Text style={styles.userInfo}>Mobile No.: <Text style={{ color: '#222' }}>{user.mobile ? `091•••••${user.mobile.slice(-3)}` : ''}</Text></Text>
            <Text style={styles.userInfo}>User ID: <Text style={{ color: '#222' }}>{userId ? `••••••${userId.slice(-4)}` : ''}</Text></Text>
            {amount ? (
              <Text style={[styles.userInfo, { color: '#000000', fontWeight: 'bold', fontSize: 18 }]}>₱{amount}</Text>
            ) : null}
            <View style={{ marginTop: 24 }}>
              <Text style={styles.qrDesc}>Specify an amount upon scanning your QR code.</Text>
              <TouchableOpacity style={styles.addAmountBtn} onPress={() => setAmountModal(true)}>
                <Text style={styles.addAmountText}>Add amount</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Add Amount Modal */}
        <Modal visible={amountModal} transparent animationType="slide">
          <View style={{
            flex: 1, backgroundColor: 'rgba(0,0,0,0.2)', justifyContent: 'flex-end'
          }}>
            <View style={{
              backgroundColor: '#fff', borderTopLeftRadius: 18, borderTopRightRadius: 18, padding: 24
            }}>
              <Text style={{ fontWeight: 'bold', fontSize: 18, marginBottom: 12 }}>Enter Amount</Text>
              <TextInput
                style={{
                  borderWidth: 1, borderColor: '#eee', borderRadius: 8, padding: 12, fontSize: 18, marginBottom: 16, textAlign: 'center'
                }}
                keyboardType="numeric"
                placeholder="Enter amount"
                value={amount}
                onChangeText={setAmount}
              />
              <TouchableOpacity
                style={[styles.primaryBtn, { marginBottom: 0 }]}
                onPress={() => setAmountModal(false)}
                disabled={!amount}
              >
                <Text style={styles.primaryBtnText}>Set Amount</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{ alignItems: 'center', marginTop: 10 }}
                onPress={() => setAmountModal(false)}
              >
                <Text style={{ color: '#000000', fontWeight: 'bold' }}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  background: {
    flex: 1,
    resizeMode: 'cover',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  introCard: {
    backgroundColor: '#fff',
    margin: 18,
    borderRadius: 18,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.07,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  introTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 18,
    textAlign: 'center',
  },
  introOption: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 18,
  },
  introOptTitle: {
    fontWeight: 'bold',
    color: '#000000',
    fontSize: 15,
    marginBottom: 2,
  },
  introOptDesc: {
    color: '#666',
    fontSize: 13,
  },
  primaryBtn: {
    backgroundColor: '#000000',
    borderRadius: 25,
    paddingVertical: 13,
    alignItems: 'center',
    marginTop: 10,
  },
  primaryBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  qrCard: {
    backgroundColor: '#fff',
    margin: 18,
    borderRadius: 18,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.09,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  qrCodeBox: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    position: 'relative',
  },
  qrLogo: {
    position: 'absolute',
    width: 65,
    height: 130,
    top: 23,
    left: 59,
    zIndex: 2,
  },
  qrNote: {
    color: '#666',
    fontSize: 13,
    marginBottom: 8,
    textAlign: 'center',
  },
  userInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
    marginTop: 8,
  },
  userName: {
    color: '#000000',
    fontWeight: 'bold',
    fontSize: 18,
    marginRight: 6,
    letterSpacing: 1,
  },
  userInfo: {
    color: '#666',
    fontSize: 14,
    marginBottom: 2,
  },
  qrDesc: {
    color: '#666',
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 8,
  },
  addAmountBtn: {
    borderWidth: 2,
    borderColor: '#000000',
    borderRadius: 25,
    paddingVertical: 10,
    paddingHorizontal: 40,
    alignItems: 'center',
    marginTop: 2,
  },
  addAmountText: {
    color: '#000000',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default MyQRCodeScreen;

// screens/HelpCenterScreen.js
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Modal, FlatList, TextInput, SafeAreaView, Alert } from 'react-native';
import { Ionicons, MaterialIcons, FontAwesome } from '@expo/vector-icons';
import { db, ref, update, get } from '../firebaseConfig';

const QUESTIONS = [
  "What was your first pet?",
  "What is your mother's maiden name?",
  "What was your childhood nickname?",
  "Who was your childhood hero?",
  "Where did you travel for the first time?",
  "What is your favorite food?",
  "What is your favorite color?",
  "What is your dream job?",
];

const SettingsScreen = ({ route }) => {
  const { userId } = route.params;
  // Security Questions State
  const [showSecurityModal, setShowSecurityModal] = useState(false);
  const [selectedQuestions, setSelectedQuestions] = useState([null, null, null]);
  const [answers, setAnswers] = useState(['', '', '']);
  const [pickerIndex, setPickerIndex] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [alreadySet, setAlreadySet] = useState(false);

  // MPIN State
  const [showMpinModal, setShowMpinModal] = useState(false);
  const [mpin, setMpin] = useState('');
  const [mpinConfirm, setMpinConfirm] = useState('');
  const [mpinStep, setMpinStep] = useState(1); // 1: enter, 2: confirm

  useEffect(() => {
    const fetchSecurityQuestions = async () => {
      try {
        const userRef = ref(db, 'users/' + userId);
        const snapshot = await get(userRef);
        if (snapshot.exists()) {
          const data = snapshot.val();
          if (data.securityQuestions && Array.isArray(data.securityQuestions) && data.securityQuestions.length > 0) {
            setAlreadySet(true);
          }
        }
      } catch (error) {
        // Optionally handle error
      }
    };
    fetchSecurityQuestions();
  }, [userId]);

  const handleSelectQuestion = (index) => {
    setPickerIndex(index);
    setModalVisible(true);
  };

  const handleQuestionPick = (question) => {
    const updated = [...selectedQuestions];
    updated[pickerIndex] = question;
    setSelectedQuestions(updated);
    setModalVisible(false);
  };

  const handleAnswerChange = (text, idx) => {
    const updated = [...answers];
    updated[idx] = text;
    setAnswers(updated);
  };

  const isValid = selectedQuestions.every(q => q) && answers.every(a => a.length >= 3);

  const handleConfirm = async () => {
    try {
      await update(ref(db, 'users/' + userId), {
        securityQuestions: selectedQuestions,
        securityAnswers: answers,
      });
      setShowSecurityModal(false);
      setAlreadySet(true);
      Alert.alert('Success', 'Your security questions have been saved.');
    } catch (error) {
      Alert.alert('Error', 'Failed to save security questions. Please try again.');
    }
  };

  // MPIN Modal logic
  const resetMpinModal = () => {
    setShowMpinModal(false);
    setMpin('');
    setMpinConfirm('');
    setMpinStep(1);
  };

  return (
    <View style={styles.container}>
    

      {/* Security Section */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>SECURITY</Text>
        <TouchableOpacity style={styles.row} onPress={() => setShowMpinModal(true)}>
          <Ionicons name="key-outline" size={22} color="#FFFFFF" style={styles.icon} />
          <Text style={styles.rowText}>Change MPIN</Text>
          <Ionicons name="chevron-forward" size={20} color="#CCCCCC" style={styles.chevron} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.row, alreadySet && { opacity: 0.5 }]}
          onPress={() => {
            if (!alreadySet) setShowSecurityModal(true);
          }}
          disabled={alreadySet}
        >
          <MaterialIcons name="security" size={22} color="#FFFFFF" style={styles.icon} />
          <Text style={styles.rowText}>Account Recovery</Text>
          <Text style={styles.setNow}>{alreadySet ? 'Set' : 'Set Now'}</Text>
          <Ionicons name="chevron-forward" size={20} color="#CCCCCC" style={styles.chevron} />
        </TouchableOpacity>
        <View style={[styles.row, { opacity: 0.5 }]}> 
          <Ionicons name="finger-print-outline" size={22} color="#FFFFFF" style={styles.icon} />
          <Text style={styles.rowText}>Biometrics Login</Text>
          <Text style={styles.disabled}>Disabled</Text>
        </View>
        {alreadySet && (
          <Text style={{ color: '#CCCCCC', fontSize: 13, marginLeft: 32, marginTop: -8 }}>
            Security questions already set and cannot be changed.
          </Text>
        )}
      </View>

      {/* MPIN Modal */}
      <Modal visible={showMpinModal} animationType="slide" transparent={false}>
        <SafeAreaView style={{ flex: 1, backgroundColor: '#000000' }}>
          <View style={styles.sqHeader}>
            <TouchableOpacity onPress={resetMpinModal}>
              <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.sqTitle}>Set your MPIN</Text>
          </View>
          <View style={styles.sqBody}>
            {mpinStep === 1 ? (
              <>
                <Text style={styles.mpinLabel}>Enter new MPIN</Text>
                <TextInput
                  style={styles.input}
                  value={mpin}
                  onChangeText={text => setMpin(text.replace(/[^0-9]/g, ''))}
                  keyboardType="numeric"
                  maxLength={6}
                  secureTextEntry
                  placeholder="Enter 4 or 6 digit MPIN"
                  placeholderTextColor="#666666"
                />
                <TouchableOpacity
                  style={[styles.confirmBtn, (mpin.length !== 4 && mpin.length !== 6) && { backgroundColor: '#333333' }]}
                  disabled={mpin.length !== 4 && mpin.length !== 6}
                  onPress={() => setMpinStep(2)}
                >
                  <Text style={styles.confirmText}>NEXT</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text style={styles.mpinLabel}>Confirm new MPIN</Text>
                <TextInput
                  style={styles.input}
                  value={mpinConfirm}
                  onChangeText={text => setMpinConfirm(text.replace(/[^0-9]/g, ''))}
                  keyboardType="numeric"
                  maxLength={6}
                  secureTextEntry
                  placeholder="Re-enter MPIN"
                  placeholderTextColor="#666666"
                />
                {mpinConfirm.length > 0 && mpinConfirm !== mpin && (
                  <Text style={styles.error}>MPINs do not match</Text>
                )}
                <TouchableOpacity
                  style={[styles.confirmBtn, (mpinConfirm !== mpin || mpinConfirm.length !== mpin.length) && { backgroundColor: '#333333' }]}
                  disabled={mpinConfirm !== mpin || mpinConfirm.length !== mpin.length}
                  onPress={async () => {
                    try {
                      await update(ref(db, 'users/' + userId), { mpin });
                      resetMpinModal();
                      Alert.alert('Success', 'Your MPIN has been set.');
                    } catch (error) {
                      Alert.alert('Error', 'Failed to set MPIN. Please try again.');
                    }
                  }}
                >
                  <Text style={styles.confirmText}>CONFIRM</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </SafeAreaView>
      </Modal>

      {/* Security Questions Modal */}
      <Modal visible={showSecurityModal} animationType="slide">
        <SafeAreaView style={{ flex: 1, backgroundColor: '#000000' }}>
          <View style={styles.sqHeader}>
            <TouchableOpacity onPress={() => setShowSecurityModal(false)}>
              <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.sqTitle}>Set up your security questions</Text>
          </View>
          <View style={styles.sqBody}>
            {selectedQuestions.map((q, idx) => (
              <View key={idx} style={styles.qRow}>
                <TouchableOpacity style={styles.qSelect} onPress={() => handleSelectQuestion(idx)}>
                  <Text style={styles.qText}>{q ? q : `Choose Question ${idx + 1}`}</Text>
                  <Text style={styles.redDot}>•</Text>
                  <Ionicons name="chevron-forward" size={18} color="#FFFFFF" />
                </TouchableOpacity>
                {q && (
                  <>
                    <TextInput
                      style={styles.input}
                      placeholder="Enter the answer"
                      placeholderTextColor="#666666"
                      value={answers[idx]}
                      onChangeText={text => handleAnswerChange(text, idx)}
                    />
                    {answers[idx].length > 0 && answers[idx].length < 3 && (
                      <Text style={styles.error}>Minimum of 3 characters</Text>
                    )}
                  </>
                )}
              </View>
            ))}
            <Text style={styles.note}>
              Security questions cannot be reset once submitted
            </Text>
            <TouchableOpacity
              style={[styles.confirmBtn, !isValid && { backgroundColor: '#333333' }]}
              disabled={!isValid}
              onPress={handleConfirm}
            >
              <Text style={styles.confirmText}>CONFIRM</Text>
            </TouchableOpacity>
          </View>
          <Modal visible={modalVisible} transparent animationType="slide">
            <View style={styles.modalBg}>
              <View style={styles.modalContent}>
                <FlatList
                  data={QUESTIONS}
                  keyExtractor={item => item}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={styles.modalItem}
                      onPress={() => handleQuestionPick(item)}
                    >
                      <Text style={styles.modalText}>{item}</Text>
                    </TouchableOpacity>
                  )}
                />
                <View style={styles.modalActions}>
                  <TouchableOpacity onPress={() => setModalVisible(false)}>
                    <Text style={{ color: '#FFFFFF', fontWeight: 'bold' }}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
        </SafeAreaView>
      </Modal>

      {/* Footer Logo and Version */}
      <View style={styles.footer}>
        <Image source={require('../assets/pantheon.png')} style={styles.logo} resizeMode="contain" />
        <Text style={styles.version}>v1.0.0</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  
  section: {
    marginTop: 24,
    backgroundColor: '#1A1A1A',
    paddingHorizontal: 0,
    paddingVertical: 8,
    borderRadius: 8,
    marginHorizontal: 16,
    elevation: 1,
    shadowColor: '#FFFFFF',
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionLabel: {
    color: '#CCCCCC',
    fontSize: 13,
    fontWeight: 'bold',
    marginLeft: 16,
    marginBottom: 8,
    marginTop: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
    backgroundColor: '#1A1A1A',
  },
  icon: {
    marginRight: 16,
  },
  rowText: {
    flex: 1,
    fontSize: 16,
    color: '#FFFFFF',
  },
  setNow: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
    marginRight: 8,
  },
  disabled: {
    color: '#CCCCCC',
    fontSize: 14,
    fontWeight: 'bold',
    marginRight: 8,
  },
  chevron: {
    marginLeft: 8,
  },
  footer: {
    alignItems: 'center',
    marginTop: 'auto',
    marginBottom: 24,
  },
  logo: {
    width: 160,
    height: 80,
    marginBottom: 6,
  },
  version: {
    color: '#CCCCCC',
    fontSize: 13,
  },
  // Security Questions Styles
  sqHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  sqTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 16,
    color: '#FFFFFF',
  },
  sqBody: {
    flex: 1,
    padding: 16,
  },
  qRow: {
    marginBottom: 24,
  },
  qSelect: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  qText: {
    fontSize: 16,
    flex: 1,
    color: '#FFFFFF',
  },
  redDot: {
    color: '#FFFFFF',
    marginLeft: 6,
    marginRight: 6,
    fontSize: 18,
  },
  input: {
    borderWidth: 1,
    borderColor: '#333333',
    borderRadius: 8,
    padding: 10,
    marginBottom: 4,
    fontSize: 18,
    letterSpacing: 8,
    textAlign: 'center',
    backgroundColor: '#1A1A1A',
    color: '#FFFFFF',
  },
  error: {
    color: '#FFFFFF',
    fontSize: 12,
    marginBottom: 4,
    textAlign: 'center',
  },
  note: {
    color: '#CCCCCC',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 16,
  },
  confirmBtn: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  confirmText: {
    color: '#000000',
    fontWeight: 'bold',
    fontSize: 16,
  },
  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1A1A1A',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16,
    maxHeight: '60%',
  },
  modalItem: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  modalText: {
    fontSize: 16,
    color: '#FFFFFF',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
  },
  mpinLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
    color: '#FFFFFF',
  },
});

export default SettingsScreen;

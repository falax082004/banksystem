import React from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome5';
import { TouchableOpacity } from 'react-native';
import { FONT } from '../styles/typography';

const TermsScreen = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Icon name="arrow-left" size={14} color="#333" />
          </TouchableOpacity>
          <Text style={styles.title}>Pasabuy Terms and Conditions</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. Acceptance of Terms</Text>
          <Text style={styles.content}>
            By using the Pasabuy app, you agree to these Terms and Conditions. If you do not agree, do not use the app.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. Accounts</Text>
          <Text style={styles.content}>
            You are responsible for the accuracy of your information and for maintaining the confidentiality of your account. Activities under your account are your responsibility.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. Service Scope</Text>
          <Text style={styles.content}>
            Pasabuy connects shoppers/pasabuyers and riders to help purchase and deliver items from third-party stores. Pasabuy is not a seller of goods.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>4. Orders and Fees</Text>
          <Text style={styles.content}>
            Orders are subject to store availability and rider acceptance. Service fees may apply and are shown before checkout. Prices may change due to store updates or substitutions.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>5. Cancellations and Refunds</Text>
          <Text style={styles.content}>
            Cancellation rules vary by order status. Some fees may be non‑refundable once a rider has started shopping or is en route.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>6. User Conduct</Text>
          <Text style={styles.content}>
            Do not use the app for illegal activities, abuse other users, or attempt to interfere with the service. Accounts violating these rules may be suspended.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>7. Privacy</Text>
          <Text style={styles.content}>
            We process your data according to our Privacy Policy. Location data may be used to improve deliveries and tracking.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>8. Liability</Text>
          <Text style={styles.content}>
            The app is provided on an “as‑is” basis. Pasabuy is not liable for indirect or consequential damages. Third‑party store policies apply to items ordered.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>9. Changes</Text>
          <Text style={styles.content}>
            We may update these terms from time to time. Continued use of the app means you accept the updated terms.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>10. Contact</Text>
          <Text style={styles.content}>
            Support: support@pasabuy.app
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  scrollView: {
    flex: 1,
    padding: 20,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
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
  title: {
    fontSize: FONT.titleSize,
    fontWeight: FONT.weightBold,
    color: FONT.headerColor,
  },
  section: {
    marginBottom: 18,
  },
  sectionTitle: {
    fontSize: FONT.bodySize,
    fontWeight: FONT.weightBold,
    color: FONT.headerColor,
    marginBottom: 8,
  },
  content: {
    fontSize: FONT.smallSize,
    lineHeight: 20,
    color: FONT.mutedColor,
  },
});

export default TermsScreen;

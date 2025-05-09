import React from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, Image } from 'react-native';

const TermsScreen = () => {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Image 
            source={require('../assets/pantheon.png')} 
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.title}>Pantheon Bank Terms and Conditions</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. Acceptance of Terms</Text>
          <Text style={styles.content}>
            By accessing and using Pantheon Bank's services, you agree to be bound by these Terms and Conditions. If you do not agree to these terms, please do not use our services.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. Account Registration and Security</Text>
          <Text style={styles.content}>
            2.1. You must be at least 18 years old to register for a Pantheon Bank account.{'\n\n'}
            2.2. You are responsible for maintaining the confidentiality of your account credentials.{'\n\n'}
            2.3. You must provide accurate and complete information during registration.{'\n\n'}
            2.4. You are responsible for all activities that occur under your account.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. Services and Features</Text>
          <Text style={styles.content}>
            3.1. Pantheon Bank provides digital banking services including but not limited to:{'\n\n'}
            • Money transfers and remittances{'\n'}
            • Bill payments{'\n'}
            • Mobile top-up{'\n'}
            • QR code payments{'\n'}
            • Investment services{'\n'}
            • Charity and donations{'\n\n'}
            3.2. We reserve the right to modify, suspend, or discontinue any service at any time.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>4. Transaction Limits and Fees</Text>
          <Text style={styles.content}>
            4.1. Transaction limits may apply based on your account type and verification level.{'\n\n'}
            4.2. Fees may be charged for certain transactions and services.{'\n\n'}
            4.3. All fees are non-refundable unless required by law.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>5. Security and Privacy</Text>
          <Text style={styles.content}>
            5.1. We implement security measures to protect your information.{'\n\n'}
            5.2. Your personal data is collected and processed in accordance with our Privacy Policy.{'\n\n'}
            5.3. You must report any unauthorized transactions immediately.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>6. Prohibited Activities</Text>
          <Text style={styles.content}>
            You agree not to:{'\n\n'}
            • Use the service for illegal purposes{'\n'}
            • Engage in fraudulent activities{'\n'}
            • Violate any applicable laws or regulations{'\n'}
            • Attempt to gain unauthorized access{'\n'}
            • Interfere with the service's operation
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>7. Liability and Disclaimers</Text>
          <Text style={styles.content}>
            7.1. We are not liable for any indirect, incidental, or consequential damages.{'\n\n'}
            7.2. Our services are provided "as is" without warranties of any kind.{'\n\n'}
            7.3. We are not responsible for third-party services or content.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>8. Changes to Terms</Text>
          <Text style={styles.content}>
            8.1. We may modify these terms at any time.{'\n\n'}
            8.2. Continued use of our services after changes constitutes acceptance of the new terms.{'\n\n'}
            8.3. We will notify you of significant changes via email or in-app notification.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>9. Contact Information</Text>
          <Text style={styles.content}>
            For questions about these terms, please contact:{'\n\n'}
            Email: support@pantheonbank.com{'\n'}
            Phone: (02) 8-5612-8999{'\n'}
            Address: Pantheon Bank Headquarters, Manila, Philippines
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollView: {
    flex: 1,
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  content: {
    fontSize: 14,
    lineHeight: 20,
    color: '#444',
  },
});

export default TermsScreen;

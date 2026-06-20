import { Ionicons } from '@expo/vector-icons';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Brand } from '@/constants/brand';

export default function SupportScreen() {
  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.logoContainer}>
          <Image 
            source={{ uri: 'https://www.facultyplus.com/wp-content/uploads/2024/09/logo-4.png' }}
            style={styles.collegeLogo}
            resizeMode="contain"
          />
          <Image 
            source={require('@/assets/images/barani-logo.png')}
            style={styles.baraniLogo}
            resizeMode="contain"
          />
        </View>
        <Text style={styles.title}>How can we help you?</Text>
        <Text style={styles.subtitle}>
          If you're experiencing issues or need assistance, please reach out to our support team.
        </Text>

        {/* Project Guide Card */}
        <View style={[styles.card, styles.guideCard]}>
          <View style={styles.cardHeader}>
            <Ionicons name="ribbon" size={24} color={Brand.colors.primary} />
            <Text style={[styles.cardTitle, styles.guideTitle]}>GUIDE BY SUBBURAM</Text>
          </View>
          {/* <View style={styles.guideDetails}>
            <Text style={styles.guideName}>Dr. S. Subburam, M.E., Ph.D.</Text>
            <Text style={styles.guideRole}>Professor & Head</Text>
            <Text style={styles.guideDept}>Department of Information Technology</Text>
            <Text style={styles.guideCollege}>New Prince Shri Bhavani College of Engineering & Technology</Text>
          </View> */}
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="person" size={24} color={Brand.colors.primary} />
            <Text style={styles.cardTitle}>DHANUSH KUMAR R</Text>
          </View>
          <Text style={styles.cardText}>9597584613</Text>
          <Text style={styles.cardSubText}>Department: AI&DS</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="person" size={24} color={Brand.colors.primary} />
            <Text style={styles.cardTitle}>DINESH K</Text>
          </View>
          <Text style={styles.cardText}>8637652944</Text>
          <Text style={styles.cardSubText}>Department: CSE</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="person" size={24} color={Brand.colors.primary} />
            <Text style={styles.cardTitle}>SANTHOSH KUMAR K</Text>
          </View>
          <Text style={styles.cardText}>9361766562</Text>
          <Text style={styles.cardSubText}>Department: IT</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="person" size={24} color={Brand.colors.primary} />
            <Text style={styles.cardTitle}>SANJAY V</Text>
          </View>
          <Text style={styles.cardText}>7539922117</Text>
          <Text style={styles.cardSubText}>Department: IT</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Brand.colors.background,
  },
  content: {
    padding: 24,
    alignItems: 'center',
    maxWidth: 600,
    width: '100%',
    alignSelf: 'center',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
    marginBottom: 24,
    marginTop: 16,
    flexWrap: 'wrap',
    width: '100%',
  },
  baraniLogo: {
    width: 210,
    height: 90,
  },
  collegeLogo: {
    width: 270,
    height: 90,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: Brand.colors.text,
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: Brand.colors.textSecondary,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  card: {
    backgroundColor: Brand.colors.card,
    borderRadius: 12,
    padding: 24,
    width: '100%',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Brand.colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  guideCard: {
    borderColor: Brand.colors.primary,
    borderWidth: 2,
    backgroundColor: '#F0F5FF', // Sleek soft blue highlight
  },
  guideTitle: {
    color: Brand.colors.primary,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  guideDetails: {
    marginLeft: 36,
    gap: 4,
  },
  guideName: {
    fontSize: 16,
    fontWeight: '600',
    color: Brand.colors.text,
  },
  guideRole: {
    fontSize: 14,
    fontWeight: '500',
    color: Brand.colors.textSecondary,
  },
  guideDept: {
    fontSize: 13,
    color: Brand.colors.textSecondary,
  },
  guideCollege: {
    fontSize: 12,
    color: '#8B949E',
    marginTop: 4,
    fontStyle: 'italic',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Brand.colors.text,
  },
  cardText: {
    fontSize: 16,
    color: Brand.colors.textSecondary,
    marginLeft: 36,
  },
  cardSubText: {
    fontSize: 14,
    color: Brand.colors.textSecondary,
    marginLeft: 36,
    marginTop: 4,
  },
});

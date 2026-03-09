import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, Dimensions, StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';

const { width } = Dimensions.get('window');

const FEATURES = [
  { icon: 'camera', title: 'Report', desc: 'Snap a photo of the issue', bg: '#4cae4f' },
  { icon: 'location', title: 'Track', desc: 'Follow real-time updates', bg: '#3B82F6' },
  { icon: 'thumbs-up', title: 'Improve', desc: 'Watch your city transform', bg: '#F59E0B' },
];

export default function OnboardingScreen({ navigation }) {
  const { enterGuestMode } = useAuth();

  const handleGuestReport = () => {
    enterGuestMode();
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <StatusBar barStyle="dark-content" backgroundColor="#f6f7f6" />

      {/* Hero */}
      <View style={styles.hero}>
        <View style={styles.heroInner}>
          <Text style={styles.heroIcon}>🌳</Text>
          <Text style={styles.heroTitle}>CivicFix</Text>
        </View>
      </View>

      {/* Hero Illustration */}
      <View style={styles.illustrationContainer}>
        <View style={styles.illustration}>
          <Text style={styles.illustrationEmoji}>🏙️</Text>
          <View style={styles.illustrationOverlay}>
            <Text style={styles.illustrationText}>Building Better Communities</Text>
          </View>
        </View>
      </View>

      {/* Title */}
      <Text style={styles.title}>Make Your City{'\n'}Cleaner</Text>
      <Text style={styles.subtitle}>
        Report civic issues in seconds and help build a better community for everyone.
      </Text>

      {/* Feature Cards */}
      <View style={styles.featureRow}>
        {FEATURES.map((f, i) => (
          <View key={i} style={styles.featureCard}>
            <View style={[styles.featureIcon, { backgroundColor: f.bg + '20' }]}>
              <Ionicons name={f.icon} size={24} color={f.bg} />
            </View>
            <Text style={styles.featureTitle}>{f.title}</Text>
            <Text style={styles.featureDesc}>{f.desc}</Text>
          </View>
        ))}
      </View>

      {/* CTA */}
      <View style={styles.ctaSection}>
        <TouchableOpacity style={styles.ctaButton} onPress={handleGuestReport}>
          <Text style={styles.ctaText}>Start Reporting</Text>
          <Ionicons name="arrow-forward" size={20} color="#fff" />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.signInButton} 
          onPress={() => navigation.navigate('Login')}
        >
          <Text style={styles.signInText}>
            Already have an account? <Text style={styles.signInBold}>Sign In</Text>
          </Text>
        </TouchableOpacity>

        <Text style={styles.joinText}>
          Join 10,000+ citizens making a difference
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f6f7f6' },
  hero: {
    paddingTop: 56, paddingHorizontal: 20, paddingBottom: 8,
    borderBottomWidth: 1, borderBottomColor: '#4cae4f10',
    backgroundColor: '#f6f7f6',
  },
  heroInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  heroIcon: { fontSize: 28 },
  heroTitle: { fontSize: 20, fontWeight: '800', color: '#1e293b', letterSpacing: -0.5 },
  // Illustration
  illustrationContainer: { paddingHorizontal: 16, paddingTop: 16 },
  illustration: {
    height: 200, borderRadius: 16, backgroundColor: '#4cae4f15',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 3, borderColor: '#fff',
    overflow: 'hidden',
  },
  illustrationEmoji: { fontSize: 80 },
  illustrationOverlay: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    padding: 12, backgroundColor: '#4cae4f40',
  },
  illustrationText: { color: '#1e293b', fontWeight: '700', fontSize: 14, textAlign: 'center' },
  // Title
  title: {
    fontSize: 32, fontWeight: '800', color: '#1e293b',
    textAlign: 'center', paddingHorizontal: 24, paddingTop: 24, lineHeight: 38,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16, color: '#64748b', textAlign: 'center',
    paddingHorizontal: 32, paddingTop: 8, paddingBottom: 24, lineHeight: 24,
  },
  // Features
  featureRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 12 },
  featureCard: {
    flex: 1, backgroundColor: '#fff', padding: 16, borderRadius: 16,
    alignItems: 'center', borderWidth: 1, borderColor: '#4cae4f08',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  featureIcon: {
    width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center',
    marginBottom: 8,
  },
  featureTitle: { fontSize: 14, fontWeight: '700', color: '#1e293b' },
  featureDesc: { fontSize: 11, color: '#94a3b8', textAlign: 'center', marginTop: 4 },
  // CTA
  ctaSection: { padding: 24 },
  ctaButton: {
    backgroundColor: '#4cae4f', borderRadius: 14, paddingVertical: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    shadowColor: '#4cae4f', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25, shadowRadius: 8, elevation: 6,
  },
  ctaText: { color: '#fff', fontSize: 17, fontWeight: '700' },
  signInButton: { alignItems: 'center', marginTop: 20 },
  signInText: { color: '#64748b', fontSize: 14 },
  signInBold: { color: '#4cae4f', fontWeight: '700' },
  joinText: { color: '#94a3b8', fontSize: 12, textAlign: 'center', marginTop: 16 },
});

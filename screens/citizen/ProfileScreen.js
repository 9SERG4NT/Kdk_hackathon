import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Animated, StatusBar, Alert, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';

const BADGE_LEVELS = {
  newcomer: { label: 'Newcomer', emoji: '🌱', color: '#94a3b8', next: 50 },
  bronze: { label: 'Bronze', emoji: '🥉', color: '#CD7F32', next: 150 },
  silver: { label: 'Silver', emoji: '🥈', color: '#C0C0C0', next: 400 },
  gold: { label: 'Gold', emoji: '🥇', color: '#FFD700', next: 1000 },
  platinum: { label: 'Platinum', emoji: '💎', color: '#00CED1', next: 99999 },
};

const BADGES_COLLECTION = [
  { id: 'first_report', emoji: '📝', label: 'First Report', desc: 'Submit your first report' },
  { id: 'five_reports', emoji: '⭐', label: '5 Reports', desc: 'Submit 5 reports' },
  { id: 'community', emoji: '🤝', label: 'Community Hero', desc: 'Get 10 upvotes total' },
  { id: 'verified', emoji: '✅', label: 'Verified Fixer', desc: 'Have 3 issues resolved' },
  { id: 'streak', emoji: '🔥', label: '7-Day Streak', desc: 'Report 7 days in a row' },
  { id: 'explorer', emoji: '🗺️', label: 'Explorer', desc: 'Report in 3 different wards' },
];

export default function ProfileScreen({ navigation }) {
  const { profile, isGuest, signOut, exitGuestMode } = useAuth();
  const progressAnim = useRef(new Animated.Value(0)).current;

  const badge = BADGE_LEVELS[profile?.badge_level] || BADGE_LEVELS.newcomer;
  const karma = profile?.karma_points || 0;
  const progress = Math.min(karma / badge.next, 1);

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: progress,
      duration: 1200,
      useNativeDriver: false,
    }).start();
  }, [progress]);

  const handleSignOut = async () => {
    if (isGuest) {
      exitGuestMode();
    } else {
      Alert.alert(
        'Sign Out',
        'Are you sure you want to sign out?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Sign Out', style: 'destructive',
            onPress: async () => {
              const { error } = await signOut();
              if (error) Alert.alert('Error', error.message);
            }
          }
        ]
      );
    }
  };

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <StatusBar barStyle="dark-content" backgroundColor="#f6f7f6" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
        <TouchableOpacity style={styles.settingsBtn} onPress={handleSignOut}>
          <Ionicons name={isGuest ? 'log-in' : 'log-out'} size={20} color="#ef4444" />
        </TouchableOpacity>
      </View>

      {/* Profile Card */}
      <View style={styles.profileCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {(profile?.full_name || 'G').charAt(0).toUpperCase()}
          </Text>
        </View>
        <Text style={styles.name}>{profile?.full_name || 'Guest'}</Text>
        <Text style={styles.badgeLabel}>{badge.emoji} {badge.label}</Text>

        {isGuest && (
          <View style={styles.guestNotice}>
            <Ionicons name="information-circle" size={16} color="#4cae4f" />
            <Text style={styles.guestNoticeText}>Sign in to track your karma & badges</Text>
          </View>
        )}
      </View>

      {/* Karma Progress */}
      {!isGuest && (
        <View style={styles.karmaSection}>
          <View style={styles.karmaHeader}>
            <Text style={styles.karmaTitle}>Karma Progress</Text>
            <Text style={styles.karmaValue}>{karma} / {badge.next}</Text>
          </View>
          <View style={styles.progressBg}>
            <Animated.View style={[styles.progressFill, { width: progressWidth }]} />
          </View>
          <Text style={styles.nextBadge}>
            Next: {Object.values(BADGE_LEVELS).find(b => b.next > karma)?.label || 'Max'}
          </Text>
        </View>
      )}

      {/* Stats */}
      <View style={styles.statsRow}>
        <TouchableOpacity style={styles.statCard} onPress={() => navigation.navigate('Home')}>
          <Ionicons name="document-text" size={22} color="#4cae4f" />
          <Text style={styles.statValue}>{profile?.total_reports || 0}</Text>
          <Text style={styles.statLabel}>Reports</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.statCard} onPress={() => navigation.navigate('Home')}>
          <Ionicons name="checkmark-circle" size={22} color="#3b82f6" />
          <Text style={styles.statValue}>0</Text>
          <Text style={styles.statLabel}>Resolved</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.statCard} onPress={() => navigation.navigate('Ranking')}>
          <Ionicons name="arrow-up-circle" size={22} color="#f59e0b" />
          <Text style={styles.statValue}>{karma}</Text>
          <Text style={styles.statLabel}>Karma</Text>
        </TouchableOpacity>
      </View>

      {/* Badges */}
      {!isGuest && (
        <View style={styles.badgesSection}>
          <Text style={styles.sectionTitle}>Badge Collection</Text>
          <View style={styles.badgeGrid}>
            {BADGES_COLLECTION.map((b) => (
              <View key={b.id} style={styles.badgeItem}>
                <Text style={styles.badgeEmoji}>{b.emoji}</Text>
                <Text style={styles.badgeName}>{b.label}</Text>
                <Text style={styles.badgeDesc}>{b.desc}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Menu Items */}
      <View style={styles.menuSection}>
        <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('Report')}>
          <Ionicons name="add-circle-outline" size={22} color="#4cae4f" />
          <Text style={styles.menuText}>Report New Issue</Text>
          <Ionicons name="chevron-forward" size={18} color="#cbd5e1" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('Map')}>
          <Ionicons name="map-outline" size={22} color="#3b82f6" />
          <Text style={styles.menuText}>View Issue Map</Text>
          <Ionicons name="chevron-forward" size={18} color="#cbd5e1" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('Ranking')}>
          <Ionicons name="trophy-outline" size={22} color="#f59e0b" />
          <Text style={styles.menuText}>Leaderboard</Text>
          <Ionicons name="chevron-forward" size={18} color="#cbd5e1" />
        </TouchableOpacity>
      </View>

      {/* Sign Out Button */}
      <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut}>
        <Ionicons name={isGuest ? 'log-in' : 'log-out'} size={18} color="#ef4444" />
        <Text style={styles.signOutText}>{isGuest ? 'Sign In' : 'Sign Out'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f6f7f6' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingTop: 56, paddingBottom: 12,
    borderBottomWidth: 1, borderBottomColor: '#4cae4f10',
  },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#1e293b' },
  settingsBtn: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: '#fff',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: '#e2e8f0',
  },
  // Profile Card
  profileCard: {
    alignItems: 'center', paddingVertical: 24,
    marginHorizontal: 16, marginTop: 12,
    backgroundColor: '#fff', borderRadius: 20,
    borderWidth: 1, borderColor: '#4cae4f10',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  avatar: {
    width: 72, height: 72, borderRadius: 36, backgroundColor: '#4cae4f20',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 3, borderColor: '#4cae4f40',
  },
  avatarText: { fontSize: 28, fontWeight: '800', color: '#4cae4f' },
  name: { fontSize: 22, fontWeight: '800', color: '#1e293b', marginTop: 12 },
  badgeLabel: { fontSize: 14, color: '#64748b', marginTop: 4, fontWeight: '600' },
  guestNotice: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#4cae4f10', paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 10, marginTop: 12,
  },
  guestNoticeText: { color: '#4cae4f', fontSize: 12, fontWeight: '600' },
  // Karma
  karmaSection: {
    marginHorizontal: 16, marginTop: 16, backgroundColor: '#fff',
    borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: '#4cae4f10',
  },
  karmaHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  karmaTitle: { fontSize: 14, fontWeight: '700', color: '#1e293b' },
  karmaValue: { fontSize: 13, color: '#4cae4f', fontWeight: '700' },
  progressBg: {
    height: 10, backgroundColor: '#f1f5f9', borderRadius: 5, overflow: 'hidden',
  },
  progressFill: {
    height: '100%', backgroundColor: '#4cae4f', borderRadius: 5,
  },
  nextBadge: { fontSize: 11, color: '#94a3b8', marginTop: 6 },
  // Stats
  statsRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 10, marginTop: 16 },
  statCard: {
    flex: 1, backgroundColor: '#fff', padding: 16, borderRadius: 16,
    alignItems: 'center', borderWidth: 1, borderColor: '#4cae4f10',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03, shadowRadius: 4, elevation: 1,
  },
  statValue: { fontSize: 22, fontWeight: '800', color: '#1e293b', marginTop: 6 },
  statLabel: { fontSize: 10, fontWeight: '700', color: '#94a3b8', marginTop: 2, textTransform: 'uppercase' },
  // Badges
  badgesSection: { marginHorizontal: 16, marginTop: 20 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1e293b', marginBottom: 12 },
  badgeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  badgeItem: {
    width: '30%', backgroundColor: '#fff', borderRadius: 14, padding: 12,
    alignItems: 'center', borderWidth: 1, borderColor: '#e2e8f0',
  },
  badgeEmoji: { fontSize: 28 },
  badgeName: { fontSize: 11, fontWeight: '700', color: '#1e293b', marginTop: 4, textAlign: 'center' },
  badgeDesc: { fontSize: 9, color: '#94a3b8', textAlign: 'center', marginTop: 2 },
  // Menu
  menuSection: { marginHorizontal: 16, marginTop: 20 },
  menuItem: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 8,
    borderWidth: 1, borderColor: '#e2e8f0',
  },
  menuText: { flex: 1, fontSize: 15, fontWeight: '600', color: '#1e293b' },
  // Sign Out
  signOutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    marginHorizontal: 16, marginTop: 20, marginBottom: 40,
    paddingVertical: 14, borderRadius: 14,
    backgroundColor: '#fff', borderWidth: 1, borderColor: '#ef444430',
  },
  signOutText: { color: '#ef4444', fontWeight: '700', fontSize: 15 },
});

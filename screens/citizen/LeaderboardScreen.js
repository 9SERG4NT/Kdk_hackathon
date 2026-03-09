import React, { useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity, StatusBar,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';

const BADGE_LEVELS = {
  newcomer: { label: 'Newcomer', emoji: '🌱', color: '#94a3b8' },
  bronze: { label: 'Bronze', emoji: '🥉', color: '#CD7F32' },
  silver: { label: 'Silver', emoji: '🥈', color: '#C0C0C0' },
  gold: { label: 'Gold', emoji: '🥇', color: '#FFD700' },
  platinum: { label: 'Platinum', emoji: '💎', color: '#00CED1' },
};

// Hardcoded leaderboard data
const HARDCODED_LEADERS = [
  { id: '1', full_name: 'Aarav Sharma', karma_points: 2450, badge_level: 'platinum', total_reports: 89 },
  { id: '2', full_name: 'Priya Patel', karma_points: 1980, badge_level: 'gold', total_reports: 67 },
  { id: '3', full_name: 'Rahul Verma', karma_points: 1750, badge_level: 'gold', total_reports: 54 },
  { id: '4', full_name: 'Sneha Iyer', karma_points: 1320, badge_level: 'gold', total_reports: 43 },
  { id: '5', full_name: 'Vikram Singh', karma_points: 1100, badge_level: 'silver', total_reports: 38 },
  { id: '6', full_name: 'Ananya Reddy', karma_points: 980, badge_level: 'silver', total_reports: 31 },
  { id: '7', full_name: 'Karthik Nair', karma_points: 870, badge_level: 'silver', total_reports: 28 },
  { id: '8', full_name: 'Divya Gupta', karma_points: 720, badge_level: 'bronze', total_reports: 24 },
  { id: '9', full_name: 'Arjun Menon', karma_points: 650, badge_level: 'bronze', total_reports: 21 },
  { id: '10', full_name: 'Meera Joshi', karma_points: 540, badge_level: 'bronze', total_reports: 18 },
  { id: '11', full_name: 'Rohan Das', karma_points: 420, badge_level: 'bronze', total_reports: 14 },
  { id: '12', full_name: 'Ishita Kapoor', karma_points: 380, badge_level: 'bronze', total_reports: 12 },
  { id: '13', full_name: 'Aditya Prasad', karma_points: 290, badge_level: 'newcomer', total_reports: 9 },
  { id: '14', full_name: 'Neha Banerjee', karma_points: 210, badge_level: 'newcomer', total_reports: 7 },
  { id: '15', full_name: 'Siddharth Rao', karma_points: 150, badge_level: 'newcomer', total_reports: 5 },
];

export default function LeaderboardScreen() {
  const { profile } = useAuth();
  const [tab, setTab] = useState('all_time');

  const leaders = HARDCODED_LEADERS;
  const top3 = leaders.slice(0, 3);
  const rest = leaders.slice(3);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f6f7f6" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🏆 Leaderboard</Text>
        <Text style={styles.headerSub}>Top civic contributors in your city</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabRow}>
        {['all_time', 'this_week', 'this_month'].map((t) => (
          <TouchableOpacity
            key={t}
            style={[styles.tab, tab === t && styles.tabActive]}
            onPress={() => setTab(t)}
          >
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
              {t === 'all_time' ? 'All Time' : t === 'this_week' ? 'This Week' : 'Monthly'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Podium */}
      {top3.length >= 3 && (
        <View style={styles.podiumRow}>
          {/* 2nd Place */}
          <View style={styles.podiumItem}>
            <View style={[styles.podiumAvatar, { borderColor: '#C0C0C0' }]}>
              <Text style={styles.podiumAvatarText}>{top3[1]?.full_name?.charAt(0)}</Text>
            </View>
            <Text style={styles.podiumEmoji}>🥈</Text>
            <View style={[styles.podiumBar, { height: 80, backgroundColor: '#C0C0C0' }]}>
              <Text style={styles.podiumRank}>2</Text>
            </View>
            <Text style={styles.podiumName} numberOfLines={1}>{top3[1]?.full_name?.split(' ')[0]}</Text>
            <Text style={styles.podiumPts}>{top3[1]?.karma_points} pts</Text>
          </View>
          {/* 1st Place */}
          <View style={styles.podiumItem}>
            <View style={[styles.podiumAvatar, { borderColor: '#FFD700', width: 52, height: 52, borderRadius: 26 }]}>
              <Text style={[styles.podiumAvatarText, { fontSize: 22 }]}>{top3[0]?.full_name?.charAt(0)}</Text>
            </View>
            <Text style={[styles.podiumEmoji, { fontSize: 32 }]}>👑</Text>
            <View style={[styles.podiumBar, { height: 110, backgroundColor: '#FFD700' }]}>
              <Text style={styles.podiumRank}>1</Text>
            </View>
            <Text style={styles.podiumName} numberOfLines={1}>{top3[0]?.full_name?.split(' ')[0]}</Text>
            <Text style={[styles.podiumPts, { fontWeight: '800' }]}>{top3[0]?.karma_points} pts</Text>
          </View>
          {/* 3rd Place */}
          <View style={styles.podiumItem}>
            <View style={[styles.podiumAvatar, { borderColor: '#CD7F32' }]}>
              <Text style={styles.podiumAvatarText}>{top3[2]?.full_name?.charAt(0)}</Text>
            </View>
            <Text style={styles.podiumEmoji}>🥉</Text>
            <View style={[styles.podiumBar, { height: 60, backgroundColor: '#CD7F32' }]}>
              <Text style={styles.podiumRank}>3</Text>
            </View>
            <Text style={styles.podiumName} numberOfLines={1}>{top3[2]?.full_name?.split(' ')[0]}</Text>
            <Text style={styles.podiumPts}>{top3[2]?.karma_points} pts</Text>
          </View>
        </View>
      )}

      {/* List */}
      <FlatList
        data={rest}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 100, paddingHorizontal: 16 }}
        renderItem={({ item, index }) => {
          const badge = BADGE_LEVELS[item.badge_level] || BADGE_LEVELS.newcomer;
          const isMe = profile?.id === item.id || profile?.full_name === item.full_name;
          return (
            <View style={[styles.listItem, isMe && styles.listItemMe]}>
              <Text style={styles.rank}>#{index + 4}</Text>
              <View style={styles.avatarSmall}>
                <Text style={styles.avatarSmallText}>
                  {(item.full_name || '?').charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.listName}>
                  {item.full_name || 'Anonymous'} {isMe ? '(You)' : ''}
                </Text>
                <Text style={styles.listBadge}>{badge.emoji} {badge.label} • {item.total_reports} reports</Text>
              </View>
              <View style={styles.ptsBox}>
                <Text style={styles.ptsValue}>{item.karma_points}</Text>
                <Text style={styles.ptsLabel}>pts</Text>
              </View>
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f6f7f6' },
  header: {
    paddingHorizontal: 16, paddingTop: 56, paddingBottom: 8,
    borderBottomWidth: 1, borderBottomColor: '#4cae4f10',
  },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#1e293b', letterSpacing: -0.5 },
  headerSub: { fontSize: 13, color: '#94a3b8', marginTop: 4 },
  // Tabs
  tabRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 8, marginTop: 12, marginBottom: 8 },
  tab: {
    flex: 1, paddingVertical: 10, borderRadius: 12, alignItems: 'center',
    backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0',
  },
  tabActive: { backgroundColor: '#4cae4f', borderColor: '#4cae4f' },
  tabText: { color: '#64748b', fontWeight: '600', fontSize: 13 },
  tabTextActive: { color: '#fff' },
  // Podium
  podiumRow: {
    flexDirection: 'row', justifyContent: 'center', alignItems: 'flex-end',
    paddingVertical: 20, gap: 12,
  },
  podiumItem: { alignItems: 'center', width: 90 },
  podiumAvatar: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: '#4cae4f15',
    alignItems: 'center', justifyContent: 'center', borderWidth: 3, marginBottom: 4,
  },
  podiumAvatarText: { fontSize: 18, fontWeight: '800', color: '#4cae4f' },
  podiumEmoji: { fontSize: 24, marginBottom: 4 },
  podiumBar: {
    width: 60, borderRadius: 12, alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, shadowRadius: 4, elevation: 2,
  },
  podiumRank: { color: '#fff', fontSize: 20, fontWeight: '900' },
  podiumName: { fontSize: 13, fontWeight: '700', color: '#1e293b', marginTop: 6 },
  podiumPts: { fontSize: 12, color: '#4cae4f', fontWeight: '700' },
  // List
  listItem: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 8,
    borderWidth: 1, borderColor: '#e2e8f0',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03, shadowRadius: 4, elevation: 1,
  },
  listItemMe: { borderColor: '#4cae4f', backgroundColor: '#4cae4f08' },
  rank: { fontSize: 14, fontWeight: '800', color: '#94a3b8', width: 32 },
  avatarSmall: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: '#4cae4f15',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarSmallText: { fontSize: 15, fontWeight: '700', color: '#4cae4f' },
  listName: { fontSize: 14, fontWeight: '700', color: '#1e293b' },
  listBadge: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
  ptsBox: { alignItems: 'center' },
  ptsValue: { fontSize: 18, fontWeight: '800', color: '#4cae4f' },
  ptsLabel: { fontSize: 10, color: '#94a3b8', fontWeight: '600' },
});

import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, RefreshControl,
  TouchableOpacity, TextInput, StatusBar, Alert, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import IssueCard from '../../components/IssueCard';
import { STATUS_LABELS } from '../../constants/categories';

export default function HomeScreen({ navigation }) {
  const { profile, isGuest } = useAuth();
  const [issues, setIssues] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState(null);

  const fetchIssues = useCallback(async () => {
    let query = supabase
      .from('road_issues')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (filterStatus) query = query.eq('status', filterStatus);

    const { data, error } = await query;
    if (!error) setIssues(data || []);
  }, [filterStatus]);

  useEffect(() => {
    fetchIssues();
    const channel = supabase
      .channel('road_issues_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'road_issues' }, () => {
        fetchIssues();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchIssues]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchIssues();
    setRefreshing(false);
  };

  const filteredIssues = issues.filter((i) =>
    i.title?.toLowerCase().includes(search.toLowerCase()) ||
    i.description?.toLowerCase().includes(search.toLowerCase())
  );

  const statusFilters = [null, 'reported', 'in_review', 'resolved', 'rejected'];

  const handleNotifications = () => {
    Alert.alert('📢 Notifications', 'No new notifications. We\'ll alert you when issues near you get updated!');
  };

  const renderHeader = () => (
    <View>
      {/* Greeting */}
      <View style={styles.greetingSection}>
        <Text style={styles.greetingTitle}>
          Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 17 ? 'Afternoon' : 'Evening'}, {profile?.full_name?.split(' ')[0] || 'there'}
        </Text>
        <Text style={styles.greetingSubtitle}>Your neighborhood is looking better today.</Text>
      </View>

      {/* Stats Cards */}
      <View style={styles.statsRow}>
        <TouchableOpacity style={styles.statCard} onPress={() => navigation.navigate('Profile')}>
          <Ionicons name="document-text" size={20} color="#4cae4f" />
          <Text style={styles.statLabel}>Reported</Text>
          <Text style={styles.statValue}>{profile?.total_reports || 0}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.statCard} onPress={() => setFilterStatus('resolved')}>
          <Ionicons name="checkmark-circle" size={20} color="#4cae4f" />
          <Text style={styles.statLabel}>Resolved</Text>
          <Text style={styles.statValue}>{issues.filter(i => i.status === 'resolved').length}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.statCard, styles.statCardAccent]} onPress={() => navigation.navigate('Ranking')}>
          <Ionicons name="star" size={20} color="#fff" />
          <Text style={[styles.statLabel, { color: '#ffffffcc' }]}>Points</Text>
          <Text style={[styles.statValue, { color: '#fff' }]}>{profile?.karma_points || 0}</Text>
        </TouchableOpacity>
      </View>

      {/* Quick Actions */}
      <Text style={styles.sectionTitle}>Quick Actions</Text>
      <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('Report')}>
        <View style={[styles.actionIcon, { backgroundColor: '#4cae4f15' }]}>
          <Ionicons name="camera" size={24} color="#4cae4f" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.actionTitle}>Report an Issue</Text>
          <Text style={styles.actionDesc}>Snap a photo, AI does the rest</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#cbd5e1" />
      </TouchableOpacity>

      <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('Map')}>
        <View style={[styles.actionIcon, { backgroundColor: '#3b82f615' }]}>
          <Ionicons name="map" size={24} color="#3b82f6" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.actionTitle}>View Issue Map</Text>
          <Text style={styles.actionDesc}>See issues around your area</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#cbd5e1" />
      </TouchableOpacity>

      <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('Ranking')}>
        <View style={[styles.actionIcon, { backgroundColor: '#f59e0b15' }]}>
          <Ionicons name="trophy" size={24} color="#f59e0b" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.actionTitle}>Leaderboard</Text>
          <Text style={styles.actionDesc}>See top civic contributors</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#cbd5e1" />
      </TouchableOpacity>

      {/* Search */}
      <View style={styles.searchRow}>
        <Ionicons name="search" size={18} color="#94a3b8" style={{ marginRight: 8 }} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search issues..."
          placeholderTextColor="#94a3b8"
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={18} color="#94a3b8" />
          </TouchableOpacity>
        )}
      </View>

      {/* Status filters */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterRow}
        contentContainerStyle={{ paddingHorizontal: 16 }}
      >
        {statusFilters.map((item) => (
          <TouchableOpacity
            key={item || 'all'}
            style={[styles.filterChip, filterStatus === item && styles.filterChipActive]}
            onPress={() => setFilterStatus(item)}
          >
            <Text style={[styles.filterText, filterStatus === item && styles.filterTextActive]}>
              {item ? STATUS_LABELS[item] : 'All'}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <Text style={styles.sectionTitle}>Recent Issues</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f6f7f6" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity style={styles.avatar} onPress={() => navigation.navigate('Profile')}>
            <Text style={styles.avatarText}>
              {(profile?.full_name || 'G').charAt(0).toUpperCase()}
            </Text>
          </TouchableOpacity>
          <View>
            <Text style={styles.greeting}>
              {isGuest ? 'Civic Reporter' : `Hello, ${profile?.full_name || 'Citizen'}`}
            </Text>
            {!isGuest && (
              <Text style={styles.levelText}>⭐ {profile?.karma_points || 0} pts</Text>
            )}
            {isGuest && (
              <Text style={styles.levelText}>Guest Mode</Text>
            )}
          </View>
        </View>
        <TouchableOpacity style={styles.notifBtn} onPress={handleNotifications}>
          <Ionicons name="notifications-outline" size={22} color="#475569" />
        </TouchableOpacity>
      </View>

      {/* Issue List with header as ListHeader */}
      <FlatList
        data={filteredIssues}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
        renderItem={({ item }) => (
          <IssueCard
            issue={item}
            onPress={() => navigation.navigate('IssueDetail', { issue: item })}
          />
        )}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#4cae4f" />}
        contentContainerStyle={{ paddingBottom: 100 }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>📭</Text>
            <Text style={styles.emptyText}>No issues found</Text>
            <TouchableOpacity style={styles.emptyBtn} onPress={() => navigation.navigate('Report')}>
              <Text style={styles.emptyBtnText}>Report the first one!</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f6f7f6' },
  // Header
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingTop: 52, paddingBottom: 8,
    borderBottomWidth: 1, borderBottomColor: '#4cae4f10',
    backgroundColor: '#f6f7f6',
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: '#4cae4f20',
    alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#4cae4f30',
  },
  avatarText: { fontSize: 16, fontWeight: '700', color: '#4cae4f' },
  greeting: { fontSize: 14, fontWeight: '600', color: '#64748b' },
  levelText: { fontSize: 12, fontWeight: '700', color: '#4cae4f', textTransform: 'uppercase', letterSpacing: 0.5 },
  notifBtn: {
    width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0',
  },
  // Greeting
  greetingSection: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12 },
  greetingTitle: { fontSize: 24, fontWeight: '800', color: '#1e293b', letterSpacing: -0.5 },
  greetingSubtitle: { fontSize: 14, color: '#94a3b8', marginTop: 4 },
  // Stats
  statsRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 10, marginBottom: 16 },
  statCard: {
    flex: 1, backgroundColor: '#fff', padding: 14, borderRadius: 14,
    borderWidth: 1, borderColor: '#4cae4f08',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03, shadowRadius: 4, elevation: 1,
  },
  statCardAccent: { backgroundColor: '#4cae4f', borderColor: '#4cae4f' },
  statLabel: { fontSize: 10, fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 6 },
  statValue: { fontSize: 20, fontWeight: '800', color: '#1e293b', marginTop: 2 },
  // Actions
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#1e293b', marginLeft: 16, marginBottom: 10, marginTop: 4 },
  actionCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    marginHorizontal: 16, marginBottom: 10, padding: 14, borderRadius: 14,
    backgroundColor: '#fff', borderWidth: 1, borderColor: '#4cae4f10',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03, shadowRadius: 4, elevation: 1,
  },
  actionIcon: { width: 48, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  actionTitle: { fontSize: 15, fontWeight: '700', color: '#1e293b' },
  actionDesc: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
  // Search
  searchRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', marginHorizontal: 16, marginTop: 8,
    borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10,
    borderWidth: 1, borderColor: '#e2e8f0',
  },
  searchInput: { flex: 1, color: '#1e293b', fontSize: 14 },
  // Filters
  filterRow: { marginVertical: 10, maxHeight: 44 },
  filterChip: {
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
    backgroundColor: '#fff', marginRight: 8,
    borderWidth: 1, borderColor: '#e2e8f0',
  },
  filterChipActive: { backgroundColor: '#4cae4f', borderColor: '#4cae4f' },
  filterText: { color: '#64748b', fontSize: 13, fontWeight: '600' },
  filterTextActive: { color: '#fff' },
  // Empty
  empty: { alignItems: 'center', marginTop: 60 },
  emptyEmoji: { fontSize: 48 },
  emptyText: { color: '#94a3b8', fontSize: 16, marginTop: 12 },
  emptyBtn: {
    marginTop: 16, backgroundColor: '#4cae4f', paddingHorizontal: 20, paddingVertical: 10,
    borderRadius: 10,
  },
  emptyBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
});

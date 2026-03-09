import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  Alert, Modal, ScrollView, RefreshControl, StatusBar, Dimensions,
} from 'react-native';
import MapView, { Marker, Circle } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import StatusBadge from '../../components/StatusBadge';
import { CATEGORIES, STATUS_LABELS, SEVERITY_COLORS } from '../../constants/categories';

const { width } = Dimensions.get('window');

// Dummy data for demo
const DUMMY_ISSUES = [
  { id: 'd1', title: 'Large pothole on MG Road', description: 'Deep pothole near bus stop causing traffic issues', category: 'pothole', severity: 'high', status: 'reported', latitude: 12.9716, longitude: 77.5946, address: 'MG Road, Bengaluru', reporter_name: 'Aarav S.', created_at: '2026-03-09T06:30:00Z', vote_count: 12 },
  { id: 'd2', title: 'Garbage dump near park entrance', description: 'Overflowing garbage bin for 3 days', category: 'garbage', severity: 'medium', status: 'in_review', latitude: 12.9352, longitude: 77.6245, address: 'Koramangala, Bengaluru', reporter_name: 'Priya P.', created_at: '2026-03-08T14:20:00Z', vote_count: 8 },
  { id: 'd3', title: 'Street light not working', description: 'Entire block is dark at night, safety concern', category: 'streetlight', severity: 'high', status: 'reported', latitude: 12.9698, longitude: 77.7500, address: 'Whitefield, Bengaluru', reporter_name: 'Rahul V.', created_at: '2026-03-08T09:15:00Z', vote_count: 15 },
  { id: 'd4', title: 'Water pipe burst on main road', description: 'Water flowing on road for 2 hours', category: 'water_leakage', severity: 'critical', status: 'in_review', latitude: 12.9850, longitude: 77.5533, address: 'Malleshwaram, Bengaluru', reporter_name: 'Sneha I.', created_at: '2026-03-07T18:45:00Z', vote_count: 22 },
  { id: 'd5', title: 'Broken footpath tiles', description: 'Multiple broken tiles causing tripping hazard', category: 'road_damage', severity: 'medium', status: 'resolved', latitude: 12.9550, longitude: 77.5900, address: 'Jayanagar, Bengaluru', reporter_name: 'Vikram S.', created_at: '2026-03-07T11:00:00Z', vote_count: 6 },
  { id: 'd6', title: 'Open manhole on side road', description: 'Uncovered manhole near school zone', category: 'sewage', severity: 'critical', status: 'reported', latitude: 12.9400, longitude: 77.6150, address: 'HSR Layout, Bengaluru', reporter_name: 'Ananya R.', created_at: '2026-03-06T16:30:00Z', vote_count: 19 },
  { id: 'd7', title: 'Fallen tree blocking road', description: 'Tree fell after storm, one lane blocked', category: 'public_safety', severity: 'high', status: 'resolved', latitude: 12.9780, longitude: 77.6400, address: 'Indiranagar, Bengaluru', reporter_name: 'Karthik N.', created_at: '2026-03-06T08:00:00Z', vote_count: 28 },
  { id: 'd8', title: 'Illegal dumping near lake', description: 'Construction debris dumped near Bellandur lake', category: 'garbage', severity: 'high', status: 'reported', latitude: 12.9250, longitude: 77.6700, address: 'Bellandur, Bengaluru', reporter_name: 'Divya G.', created_at: '2026-03-05T13:20:00Z', vote_count: 35 },
];

const WEEKLY_DATA = [
  { day: 'Mon', count: 12 }, { day: 'Tue', count: 8 }, { day: 'Wed', count: 15 },
  { day: 'Thu', count: 22 }, { day: 'Fri', count: 18 }, { day: 'Sat', count: 9 }, { day: 'Sun', count: 5 },
];

const CATEGORY_STATS = [
  { name: 'Pothole', count: 34, color: '#E74C3C', percent: 28 },
  { name: 'Garbage', count: 28, color: '#F39C12', percent: 23 },
  { name: 'Street Light', count: 18, color: '#F1C40F', percent: 15 },
  { name: 'Water Leak', count: 15, color: '#3498DB', percent: 12 },
  { name: 'Road Damage', count: 12, color: '#E67E22', percent: 10 },
  { name: 'Sewage', count: 8, color: '#8E44AD', percent: 7 },
  { name: 'Other', count: 6, color: '#95A5A6', percent: 5 },
];

export default function AdminDashboard({ navigation }) {
  const { signOut } = useAuth();
  const [issues, setIssues] = useState(DUMMY_ISSUES);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  const fetchData = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('road_issues')
        .select('*')
        .order('created_at', { ascending: false });
      if (!error && data && data.length > 0) {
        const merged = [...data, ...DUMMY_ISSUES];
        setIssues(merged);
      }
    } catch (err) {
      console.warn('Admin fetch failed:', err);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const channel = supabase
      .channel('admin_issues')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'road_issues' }, fetchData)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const totalIssues = issues.length;
  const reported = issues.filter((i) => i.status === 'reported').length;
  const inReview = issues.filter((i) => i.status === 'in_review').length;
  const resolved = issues.filter((i) => i.status === 'resolved').length;
  const forwarded = issues.filter((i) => i.status === 'forwarded_nmc').length;
  const maxWeekly = Math.max(...WEEKLY_DATA.map(d => d.count));

  const updateStatus = async (issueId, newStatus) => {
    setIssues(prev => prev.map(i =>
      i.id === issueId ? { ...i, status: newStatus } : i
    ));
    if (!issueId.startsWith('d')) {
      try {
        await supabase.from('road_issues').update({ status: newStatus }).eq('id', issueId);
      } catch (e) { console.warn('DB update failed:', e); }
    }
  };

  const forwardToNMC = (issue) => {
    Alert.alert(
      '📤 Forward to NMC',
      `Forward "${issue.title}" to NMC Municipal Office for worker assignment?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Forward',
          onPress: () => {
            updateStatus(issue.id, 'forwarded_nmc');
            setModalVisible(false);
            Alert.alert('✅ Forwarded!', 'Issue has been forwarded to NMC for resolution.');
          },
        },
      ]
    );
  };

  // ===== OVERVIEW TAB =====
  const renderOverview = () => (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 100 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#4cae4f" />}
    >
      <View style={styles.statsGrid}>
        <View style={[styles.statCard, { borderLeftColor: '#6366F1' }]}>
          <Ionicons name="layers" size={20} color="#6366F1" />
          <Text style={styles.statNumber}>{totalIssues}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={[styles.statCard, { borderLeftColor: '#EF4444' }]}>
          <Ionicons name="alert-circle" size={20} color="#EF4444" />
          <Text style={styles.statNumber}>{reported}</Text>
          <Text style={styles.statLabel}>New</Text>
        </View>
        <View style={[styles.statCard, { borderLeftColor: '#F59E0B' }]}>
          <Ionicons name="time" size={20} color="#F59E0B" />
          <Text style={styles.statNumber}>{inReview}</Text>
          <Text style={styles.statLabel}>In Review</Text>
        </View>
        <View style={[styles.statCard, { borderLeftColor: '#10B981' }]}>
          <Ionicons name="checkmark-circle" size={20} color="#10B981" />
          <Text style={styles.statNumber}>{resolved}</Text>
          <Text style={styles.statLabel}>Resolved</Text>
        </View>
      </View>

      {/* Forwarded to NMC count */}
      <View style={styles.nmcBanner}>
        <Ionicons name="business" size={20} color="#6366F1" />
        <Text style={styles.nmcBannerText}>{forwarded} issues forwarded to NMC</Text>
      </View>

      {/* Weekly Chart */}
      <View style={styles.chartCard}>
        <Text style={styles.chartTitle}>📊 Weekly Reports</Text>
        <View style={styles.barChart}>
          {WEEKLY_DATA.map((d) => (
            <View key={d.day} style={styles.barCol}>
              <Text style={styles.barValue}>{d.count}</Text>
              <View style={[styles.bar, {
                height: Math.max(8, (d.count / maxWeekly) * 100),
                backgroundColor: d.count > 15 ? '#EF4444' : d.count > 10 ? '#F59E0B' : '#4cae4f',
              }]} />
              <Text style={styles.barLabel}>{d.day}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Category Breakdown */}
      <View style={styles.chartCard}>
        <Text style={styles.chartTitle}>📋 Category Breakdown</Text>
        {CATEGORY_STATS.map((cat) => (
          <View key={cat.name} style={styles.catRow}>
            <View style={[styles.catDot, { backgroundColor: cat.color }]} />
            <Text style={styles.catName}>{cat.name}</Text>
            <View style={styles.catBarBg}>
              <View style={[styles.catBarFill, { width: `${cat.percent}%`, backgroundColor: cat.color }]} />
            </View>
            <Text style={styles.catCount}>{cat.count}</Text>
          </View>
        ))}
      </View>

      {/* Metrics */}
      <View style={styles.chartCard}>
        <Text style={styles.chartTitle}>⚡ Metrics</Text>
        <View style={styles.metricsRow}>
          <View style={styles.metricItem}>
            <Text style={styles.metricValue}>{totalIssues > 0 ? Math.round((resolved / totalIssues) * 100) : 0}%</Text>
            <Text style={styles.metricLabel}>Resolution</Text>
          </View>
          <View style={styles.metricItem}>
            <Text style={styles.metricValue}>2.4d</Text>
            <Text style={styles.metricLabel}>Avg Time</Text>
          </View>
          <View style={styles.metricItem}>
            <Text style={styles.metricValue}>4.2★</Text>
            <Text style={styles.metricLabel}>Rating</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );

  // ===== ISSUES TAB =====
  const renderIssues = () => (
    <FlatList
      data={issues}
      keyExtractor={(item) => item.id}
      contentContainerStyle={{ paddingBottom: 100 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#4cae4f" />}
      renderItem={({ item }) => {
        const cat = CATEGORIES.find((c) => c.value === item.category) || CATEGORIES[7];
        const statusLabel = item.status === 'forwarded_nmc' ? '🏛️ NMC' : STATUS_LABELS[item.status] || item.status;
        return (
          <TouchableOpacity
            style={styles.issueRow}
            onPress={() => { setSelectedIssue(item); setModalVisible(true); }}
          >
            <View style={[styles.issueColorBar, { backgroundColor: cat.color }]} />
            <View style={styles.issueInfo}>
              <Text style={styles.issueTitle} numberOfLines={1}>{item.title}</Text>
              <View style={styles.issueMeta}>
                {item.status === 'forwarded_nmc' ? (
                  <View style={styles.nmcBadge}><Text style={styles.nmcBadgeText}>🏛️ NMC</Text></View>
                ) : (
                  <StatusBadge status={item.status} />
                )}
                <Text style={styles.reporterName}>{item.reporter_name || 'Citizen'}</Text>
              </View>
              <Text style={styles.issueAddr} numberOfLines={1}>📍 {item.address || 'Unknown'}</Text>
            </View>
            <View style={styles.issueRight}>
              <View style={[styles.sevDotSmall, { backgroundColor: SEVERITY_COLORS[item.severity] || '#EAB308' }]} />
              <Text style={styles.voteCount}>👍 {item.vote_count || 0}</Text>
            </View>
          </TouchableOpacity>
        );
      }}
    />
  );

  // ===== MAP TAB =====
  const renderMap = () => (
    <View style={{ flex: 1 }}>
      <MapView
        style={StyleSheet.absoluteFillObject}
        initialRegion={{
          latitude: 12.9550,
          longitude: 77.6200,
          latitudeDelta: 0.12,
          longitudeDelta: 0.12,
        }}
      >
        {issues.filter(i => i.latitude && i.longitude).map((issue) => (
          <React.Fragment key={issue.id}>
            <Marker
              coordinate={{ latitude: Number(issue.latitude), longitude: Number(issue.longitude) }}
              title={issue.title}
              description={`${issue.severity?.toUpperCase()} • ${issue.status}`}
              pinColor={
                issue.status === 'forwarded_nmc' ? '#6366F1' :
                issue.status === 'resolved' ? '#10B981' :
                SEVERITY_COLORS[issue.severity] || '#EAB308'
              }
            />
            <Circle
              center={{ latitude: Number(issue.latitude), longitude: Number(issue.longitude) }}
              radius={Math.max(40, (issue.vote_count || 1) * 12)}
              fillColor={(SEVERITY_COLORS[issue.severity] || '#EAB308') + '20'}
              strokeColor={(SEVERITY_COLORS[issue.severity] || '#EAB308') + '40'}
              strokeWidth={1}
            />
          </React.Fragment>
        ))}
      </MapView>

      {/* Map header overlay */}
      <View style={styles.mapHeader}>
        <Text style={styles.mapHeaderText}>🗺️ Admin Map View</Text>
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{issues.length} pins</Text>
        </View>
      </View>

      {/* Map legend */}
      <View style={styles.mapLegend}>
        <Text style={{ fontSize: 12, fontWeight: '700', color: '#1e293b', marginBottom: 6 }}>Pin Colors</Text>
        <View style={styles.legendRow}>
          <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: '#EF4444' }]} /><Text style={styles.legendLabel}>Critical</Text></View>
          <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: '#F97316' }]} /><Text style={styles.legendLabel}>High</Text></View>
          <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: '#6366F1' }]} /><Text style={styles.legendLabel}>NMC</Text></View>
          <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: '#10B981' }]} /><Text style={styles.legendLabel}>Resolved</Text></View>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f6f7f6" />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>🏛️ Admin Panel</Text>
          <Text style={styles.headerSubtitle}>CivicFix Municipal Dashboard</Text>
        </View>
        <TouchableOpacity onPress={signOut} style={styles.logoutBtn}>
          <Ionicons name="log-out-outline" size={20} color="#EF4444" />
        </TouchableOpacity>
      </View>

      {/* Tab Switcher */}
      <View style={styles.tabRow}>
        {[
          { key: 'overview', icon: 'bar-chart', label: 'Overview' },
          { key: 'issues', icon: 'list', label: `Issues (${totalIssues})` },
          { key: 'map', icon: 'map', label: 'Map' },
        ].map((t) => (
          <TouchableOpacity
            key={t.key}
            style={[styles.tab, activeTab === t.key && styles.tabActive]}
            onPress={() => setActiveTab(t.key)}
          >
            <Ionicons name={t.icon} size={15} color={activeTab === t.key ? '#fff' : '#64748b'} />
            <Text style={[styles.tabText, activeTab === t.key && styles.tabTextActive]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      {activeTab === 'overview' ? renderOverview() : activeTab === 'issues' ? renderIssues() : renderMap()}

      {/* Issue Detail Modal */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{selectedIssue?.title}</Text>
            <Text style={styles.modalDesc}>{selectedIssue?.description}</Text>

            <View style={styles.modalMetaRow}>
              <Text style={styles.modalMetaLabel}>Category</Text>
              <Text style={styles.modalMetaValue}>{CATEGORIES.find(c => c.value === selectedIssue?.category)?.label || 'Other'}</Text>
            </View>
            <View style={styles.modalMetaRow}>
              <Text style={styles.modalMetaLabel}>Severity</Text>
              <Text style={[styles.modalMetaValue, { color: SEVERITY_COLORS[selectedIssue?.severity] }]}>{selectedIssue?.severity?.toUpperCase()}</Text>
            </View>
            <View style={styles.modalMetaRow}>
              <Text style={styles.modalMetaLabel}>Location</Text>
              <Text style={styles.modalMetaValue}>{selectedIssue?.address || 'Not specified'}</Text>
            </View>

            {/* Status Buttons */}
            <Text style={styles.actionLabel}>Update Status:</Text>
            <View style={styles.actionRow}>
              {['reported', 'in_review', 'resolved', 'rejected'].map((s) => (
                <TouchableOpacity
                  key={s}
                  style={[styles.statusBtn, selectedIssue?.status === s && styles.statusBtnActive]}
                  onPress={() => { updateStatus(selectedIssue.id, s); setSelectedIssue({ ...selectedIssue, status: s }); }}
                >
                  <Text style={[styles.statusBtnText, selectedIssue?.status === s && { color: '#fff' }]}>{STATUS_LABELS[s]}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Forward to NMC Button */}
            {selectedIssue?.status !== 'forwarded_nmc' && selectedIssue?.status !== 'resolved' && (
              <TouchableOpacity
                style={styles.forwardNMCBtn}
                onPress={() => forwardToNMC(selectedIssue)}
              >
                <Ionicons name="business" size={18} color="#fff" />
                <Text style={styles.forwardNMCText}>Forward to NMC →</Text>
              </TouchableOpacity>
            )}

            {selectedIssue?.status === 'forwarded_nmc' && (
              <View style={styles.forwardedBanner}>
                <Ionicons name="checkmark-circle" size={18} color="#6366F1" />
                <Text style={styles.forwardedText}>Forwarded to NMC for worker assignment</Text>
              </View>
            )}

            <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setModalVisible(false)}>
              <Text style={styles.modalCloseText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f6f7f6' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingTop: 56, paddingBottom: 12,
    borderBottomWidth: 1, borderBottomColor: '#4cae4f10',
  },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#1e293b' },
  headerSubtitle: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
  logoutBtn: { padding: 10, backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#ef444430' },
  tabRow: { flexDirection: 'row', paddingHorizontal: 12, gap: 6, marginTop: 12, marginBottom: 12 },
  tab: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4,
    paddingVertical: 9, borderRadius: 12, backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0',
  },
  tabActive: { backgroundColor: '#4cae4f', borderColor: '#4cae4f' },
  tabText: { color: '#64748b', fontWeight: '600', fontSize: 11 },
  tabTextActive: { color: '#fff' },
  // Stats
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, gap: 10 },
  statCard: {
    width: (width - 42) / 2, backgroundColor: '#fff', borderRadius: 14, padding: 14,
    borderLeftWidth: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  statNumber: { fontSize: 26, fontWeight: '800', color: '#1e293b', marginTop: 4 },
  statLabel: { fontSize: 11, color: '#94a3b8', fontWeight: '600', marginTop: 2 },
  nmcBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#6366F110', marginHorizontal: 16, marginTop: 10,
    padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#6366F130',
  },
  nmcBannerText: { color: '#6366F1', fontWeight: '700', fontSize: 13 },
  // Charts
  chartCard: {
    backgroundColor: '#fff', borderRadius: 16, padding: 16, marginHorizontal: 16, marginTop: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  chartTitle: { fontSize: 15, fontWeight: '700', color: '#1e293b', marginBottom: 12 },
  barChart: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', height: 120 },
  barCol: { alignItems: 'center', flex: 1 },
  barValue: { fontSize: 10, color: '#94a3b8', fontWeight: '700', marginBottom: 4 },
  bar: { width: 22, borderRadius: 6 },
  barLabel: { fontSize: 10, color: '#64748b', fontWeight: '600', marginTop: 6 },
  catRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  catDot: { width: 10, height: 10, borderRadius: 5, marginRight: 8 },
  catName: { width: 80, fontSize: 12, color: '#475569', fontWeight: '600' },
  catBarBg: { flex: 1, height: 8, backgroundColor: '#f1f5f9', borderRadius: 4, marginHorizontal: 8, overflow: 'hidden' },
  catBarFill: { height: '100%', borderRadius: 4 },
  catCount: { fontSize: 12, color: '#1e293b', fontWeight: '700', width: 28, textAlign: 'right' },
  metricsRow: { flexDirection: 'row', gap: 10 },
  metricItem: { flex: 1, backgroundColor: '#f6f7f6', borderRadius: 12, padding: 12, alignItems: 'center' },
  metricValue: { fontSize: 20, fontWeight: '800', color: '#4cae4f' },
  metricLabel: { fontSize: 10, color: '#94a3b8', fontWeight: '600', marginTop: 4, textAlign: 'center' },
  // Issue list
  issueRow: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
    marginHorizontal: 16, marginVertical: 4, borderRadius: 14, padding: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 4, elevation: 1,
  },
  issueColorBar: { width: 4, height: 50, borderRadius: 2, marginRight: 12 },
  issueInfo: { flex: 1, gap: 4 },
  issueTitle: { color: '#1e293b', fontSize: 14, fontWeight: '700' },
  issueMeta: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  reporterName: { color: '#94a3b8', fontSize: 11 },
  issueAddr: { color: '#64748b', fontSize: 11 },
  issueRight: { alignItems: 'center', gap: 4 },
  sevDotSmall: { width: 8, height: 8, borderRadius: 4 },
  voteCount: { fontSize: 11, color: '#64748b', fontWeight: '600' },
  nmcBadge: { backgroundColor: '#6366F115', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  nmcBadgeText: { color: '#6366F1', fontSize: 11, fontWeight: '700' },
  // Map
  mapHeader: {
    position: 'absolute', top: 12, left: 16, right: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#ffffffee', borderRadius: 14, padding: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 4,
  },
  mapHeaderText: { fontSize: 16, fontWeight: '800', color: '#1e293b' },
  countBadge: { backgroundColor: '#4cae4f', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  countText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  mapLegend: {
    position: 'absolute', bottom: 12, left: 16, right: 16,
    backgroundColor: '#ffffffee', borderRadius: 14, padding: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 4,
  },
  legendRow: { flexDirection: 'row', justifyContent: 'space-around' },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendLabel: { fontSize: 10, color: '#64748b', fontWeight: '600' },
  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  modalTitle: { fontSize: 20, fontWeight: '800', color: '#1e293b', marginBottom: 8 },
  modalDesc: { color: '#64748b', fontSize: 14, lineHeight: 20, marginBottom: 16 },
  modalMetaRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  modalMetaLabel: { color: '#94a3b8', fontSize: 13, fontWeight: '600' },
  modalMetaValue: { color: '#1e293b', fontSize: 13, fontWeight: '700' },
  actionLabel: { color: '#1e293b', fontSize: 14, fontWeight: '700', marginTop: 12, marginBottom: 8 },
  actionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  statusBtn: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10,
    backgroundColor: '#f1f5f9', borderWidth: 1, borderColor: '#e2e8f0',
  },
  statusBtnActive: { backgroundColor: '#4cae4f', borderColor: '#4cae4f' },
  statusBtnText: { color: '#475569', fontWeight: '600', fontSize: 12 },
  forwardNMCBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#6366F1', borderRadius: 12, paddingVertical: 14, marginTop: 14,
    shadowColor: '#6366F1', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4,
  },
  forwardNMCText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  forwardedBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#6366F110', padding: 12, borderRadius: 12, marginTop: 14,
    borderWidth: 1, borderColor: '#6366F130',
  },
  forwardedText: { color: '#6366F1', fontWeight: '600', fontSize: 13 },
  modalCloseBtn: { marginTop: 14, paddingVertical: 14, borderRadius: 12, backgroundColor: '#f1f5f9', alignItems: 'center' },
  modalCloseText: { color: '#EF4444', fontWeight: '700', fontSize: 15 },
});

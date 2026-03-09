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
import { CATEGORIES, SEVERITY_COLORS } from '../../constants/categories';

const { width } = Dimensions.get('window');

// Dummy workers
const WORKERS = [
  { id: 'w1', name: 'Ramesh Kumar', zone: 'Zone A - Sitabuldi', available: true, tasksCompleted: 45 },
  { id: 'w2', name: 'Suresh Babu', zone: 'Zone B - Dharampeth', available: true, tasksCompleted: 38 },
  { id: 'w3', name: 'Venkatesh R.', zone: 'Zone C - Sadar', available: false, tasksCompleted: 52 },
  { id: 'w4', name: 'Prakash Rao', zone: 'Zone D - Civil Lines', available: true, tasksCompleted: 29 },
  { id: 'w5', name: 'Gopal Singh', zone: 'Zone E - Manewada', available: true, tasksCompleted: 41 },
  { id: 'w6', name: 'Dinesh M.', zone: 'Zone F - Hingna', available: false, tasksCompleted: 36 },
];

// Issues forwarded from Admin (some dummy + DB)
const DUMMY_FORWARDED = [
  { id: 'nf1', title: 'Large pothole on Wardha Road', description: 'Deep pothole near Ajni Square bus stop', category: 'pothole', severity: 'high', status: 'forwarded_nmc', latitude: 21.1250, longitude: 79.0750, address: 'Wardha Road, Nagpur', reporter_name: 'Aarav S.', vote_count: 12, assigned_worker: null },
  { id: 'nf2', title: 'Water pipe burst on Sitabuldi Road', description: 'Water flowing on road for 2 hours', category: 'water_leakage', severity: 'critical', status: 'forwarded_nmc', latitude: 21.1458, longitude: 79.0820, address: 'Sitabuldi, Nagpur', reporter_name: 'Sneha I.', vote_count: 22, assigned_worker: null },
  { id: 'nf3', title: 'Open manhole near Hislop College', description: 'Uncovered manhole near school zone', category: 'sewage', severity: 'critical', status: 'forwarded_nmc', latitude: 21.1400, longitude: 79.0850, address: 'Civil Lines, Nagpur', reporter_name: 'Ananya R.', vote_count: 19, assigned_worker: null },
  { id: 'nf4', title: 'Street light not working in Dharampeth', description: 'Entire block is dark at night', category: 'streetlight', severity: 'high', status: 'worker_assigned', latitude: 21.1500, longitude: 79.0700, address: 'Dharampeth, Nagpur', reporter_name: 'Rahul V.', vote_count: 15, assigned_worker: 'Venkatesh R.' },
  { id: 'nf5', title: 'Illegal dumping near Futala Lake', description: 'Construction debris near Futala Lake', category: 'garbage', severity: 'high', status: 'in_progress', latitude: 21.1580, longitude: 79.0480, address: 'Futala, Nagpur', reporter_name: 'Divya G.', vote_count: 35, assigned_worker: 'Gopal Singh' },
];

export default function NMCDashboard() {
  const { signOut } = useAuth();
  const [issues, setIssues] = useState(DUMMY_FORWARDED);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [workerModal, setWorkerModal] = useState(false);
  const [activeTab, setActiveTab] = useState('issues');

  const fetchData = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('road_issues')
        .select('*')
        .order('created_at', { ascending: false });
      if (!error && data && data.length > 0) {
        // Include forwarded + all DB issues
        const dbForwarded = data.filter(d => d.status === 'forwarded_nmc' || d.status === 'worker_assigned' || d.status === 'in_progress');
        const allIssues = [...dbForwarded, ...DUMMY_FORWARDED];
        const uniqueMap = new Map();
        allIssues.forEach(i => uniqueMap.set(i.id, i));
        setIssues(Array.from(uniqueMap.values()));
      }
    } catch (err) {
      console.warn('NMC fetch failed:', err);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const channel = supabase
      .channel('nmc_issues')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'road_issues' }, fetchData)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const pending = issues.filter(i => i.status === 'forwarded_nmc').length;
  const assigned = issues.filter(i => i.status === 'worker_assigned').length;
  const inProgress = issues.filter(i => i.status === 'in_progress').length;
  const resolved = issues.filter(i => i.status === 'resolved').length;

  const assignWorker = (worker) => {
    if (!selectedIssue) return;
    setIssues(prev => prev.map(i =>
      i.id === selectedIssue.id ? { ...i, status: 'worker_assigned', assigned_worker: worker.name } : i
    ));
    setWorkerModal(false);
    setModalVisible(false);
    Alert.alert(
      '✅ Worker Assigned',
      `${worker.name} has been assigned to "${selectedIssue.title}".\n\nThe worker will be dispatched to ${selectedIssue.address || 'the location'}.`
    );

    // Try DB update
    if (!selectedIssue.id.startsWith('nf')) {
      try {
        supabase.from('road_issues').update({ status: 'worker_assigned' }).eq('id', selectedIssue.id);
      } catch (e) {}
    }
  };

  const markInProgress = (issueId) => {
    setIssues(prev => prev.map(i =>
      i.id === issueId ? { ...i, status: 'in_progress' } : i
    ));
    Alert.alert('🔧 In Progress', 'Issue marked as work in progress.');
  };

  const markResolved = (issueId) => {
    Alert.alert('Resolve Issue', 'Mark this issue as resolved?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Resolve',
        onPress: () => {
          setIssues(prev => prev.map(i =>
            i.id === issueId ? { ...i, status: 'resolved' } : i
          ));
          Alert.alert('✅ Resolved!', 'Issue has been resolved successfully.');
          if (!issueId.startsWith('nf')) {
            try {
              supabase.from('road_issues').update({ status: 'resolved' }).eq('id', issueId);
            } catch (e) {}
          }
        },
      },
    ]);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'forwarded_nmc': return '#6366F1';
      case 'worker_assigned': return '#F59E0B';
      case 'in_progress': return '#3B82F6';
      case 'resolved': return '#10B981';
      default: return '#94a3b8';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'forwarded_nmc': return 'Pending Assignment';
      case 'worker_assigned': return 'Worker Assigned';
      case 'in_progress': return 'Work In Progress';
      case 'resolved': return 'Resolved';
      default: return status;
    }
  };

  // ===== ISSUES TAB =====
  const renderIssues = () => (
    <FlatList
      data={issues}
      keyExtractor={(item) => item.id}
      contentContainerStyle={{ paddingBottom: 100 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6366F1" />}
      ListHeaderComponent={
        <View style={styles.statsRow}>
          <View style={[styles.miniStat, { borderLeftColor: '#6366F1' }]}>
            <Text style={styles.miniStatNum}>{pending}</Text>
            <Text style={styles.miniStatLabel}>Pending</Text>
          </View>
          <View style={[styles.miniStat, { borderLeftColor: '#F59E0B' }]}>
            <Text style={styles.miniStatNum}>{assigned}</Text>
            <Text style={styles.miniStatLabel}>Assigned</Text>
          </View>
          <View style={[styles.miniStat, { borderLeftColor: '#3B82F6' }]}>
            <Text style={styles.miniStatNum}>{inProgress}</Text>
            <Text style={styles.miniStatLabel}>In Progress</Text>
          </View>
          <View style={[styles.miniStat, { borderLeftColor: '#10B981' }]}>
            <Text style={styles.miniStatNum}>{resolved}</Text>
            <Text style={styles.miniStatLabel}>Resolved</Text>
          </View>
        </View>
      }
      renderItem={({ item }) => {
        const cat = CATEGORIES.find((c) => c.value === item.category) || CATEGORIES[7];
        const statusColor = getStatusColor(item.status);
        return (
          <TouchableOpacity
            style={styles.issueRow}
            onPress={() => { setSelectedIssue(item); setModalVisible(true); }}
          >
            <View style={[styles.issueColorBar, { backgroundColor: cat.color }]} />
            <View style={styles.issueInfo}>
              <Text style={styles.issueTitle} numberOfLines={1}>{item.title}</Text>
              <View style={styles.issueMeta}>
                <View style={[styles.statusPill, { backgroundColor: statusColor + '15', borderColor: statusColor + '30' }]}>
                  <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
                  <Text style={[styles.statusText, { color: statusColor }]}>{getStatusLabel(item.status)}</Text>
                </View>
              </View>
              <Text style={styles.issueAddr} numberOfLines={1}>📍 {item.address || 'Unknown'}</Text>
              {item.assigned_worker && (
                <Text style={styles.workerAssigned}>👷 {item.assigned_worker}</Text>
              )}
            </View>
            <View style={[styles.sevBadge, { backgroundColor: SEVERITY_COLORS[item.severity] || '#EAB308' }]}>
              <Text style={styles.sevBadgeText}>{item.severity?.charAt(0).toUpperCase()}</Text>
            </View>
          </TouchableOpacity>
        );
      }}
    />
  );

  // ===== WORKERS TAB =====
  const renderWorkers = () => (
    <ScrollView contentContainerStyle={{ paddingBottom: 100, paddingHorizontal: 16 }}>
      <Text style={styles.sectionTitle}>👷 Field Workers</Text>
      {WORKERS.map((w) => (
        <View key={w.id} style={styles.workerCard}>
          <View style={styles.workerAvatar}>
            <Text style={styles.workerAvatarText}>{w.name.charAt(0)}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.workerName}>{w.name}</Text>
            <Text style={styles.workerZone}>{w.zone}</Text>
            <Text style={styles.workerTasks}>{w.tasksCompleted} tasks completed</Text>
          </View>
          <View style={[styles.availBadge, { backgroundColor: w.available ? '#10B98115' : '#EF444415' }]}>
            <View style={[styles.availDot, { backgroundColor: w.available ? '#10B981' : '#EF4444' }]} />
            <Text style={[styles.availText, { color: w.available ? '#10B981' : '#EF4444' }]}>
              {w.available ? 'Available' : 'Busy'}
            </Text>
          </View>
        </View>
      ))}
    </ScrollView>
  );

  // ===== MAP TAB =====
  const renderMap = () => (
    <View style={{ flex: 1 }}>
      <MapView
        style={StyleSheet.absoluteFillObject}
        initialRegion={{
          latitude: 21.1458, longitude: 79.0882,
          latitudeDelta: 0.12, longitudeDelta: 0.12,
        }}
      >
        {issues.filter(i => i.latitude && i.longitude).map((issue) => (
          <React.Fragment key={issue.id}>
            <Marker
              coordinate={{ latitude: Number(issue.latitude), longitude: Number(issue.longitude) }}
              title={issue.title}
              description={`${getStatusLabel(issue.status)}${issue.assigned_worker ? ' • 👷 ' + issue.assigned_worker : ''}`}
              pinColor={getStatusColor(issue.status)}
            />
            <Circle
              center={{ latitude: Number(issue.latitude), longitude: Number(issue.longitude) }}
              radius={Math.max(40, (issue.vote_count || 1) * 12)}
              fillColor={getStatusColor(issue.status) + '20'}
              strokeColor={getStatusColor(issue.status) + '40'}
              strokeWidth={1}
            />
          </React.Fragment>
        ))}
      </MapView>

      <View style={styles.mapHeader}>
        <Text style={{ fontSize: 15, fontWeight: '800', color: '#1e293b' }}>🗺️ NMC Map View</Text>
        <View style={[styles.countBadge, { backgroundColor: '#6366F1' }]}>
          <Text style={{ color: '#fff', fontSize: 11, fontWeight: '700' }}>{issues.length} sites</Text>
        </View>
      </View>

      <View style={styles.mapLegend}>
        <View style={styles.legendRow}>
          <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: '#6366F1' }]} /><Text style={styles.legendLabel}>Pending</Text></View>
          <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: '#F59E0B' }]} /><Text style={styles.legendLabel}>Assigned</Text></View>
          <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: '#3B82F6' }]} /><Text style={styles.legendLabel}>Working</Text></View>
          <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: '#10B981' }]} /><Text style={styles.legendLabel}>Done</Text></View>
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
          <Text style={styles.headerTitle}>🏛️ NMC Dashboard</Text>
          <Text style={styles.headerSubtitle}>Nagar Municipal Corporation</Text>
        </View>
        <TouchableOpacity onPress={signOut} style={styles.logoutBtn}>
          <Ionicons name="log-out-outline" size={20} color="#EF4444" />
        </TouchableOpacity>
      </View>

      {/* Tab Row */}
      <View style={styles.tabRow}>
        {[
          { key: 'issues', icon: 'list', label: `Issues (${issues.length})` },
          { key: 'workers', icon: 'people', label: `Workers (${WORKERS.length})` },
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
      {activeTab === 'issues' ? renderIssues() : activeTab === 'workers' ? renderWorkers() : renderMap()}

      {/* Issue Detail Modal */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={styles.modalTitle}>{selectedIssue?.title}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close-circle" size={28} color="#94a3b8" />
              </TouchableOpacity>
            </View>
            <Text style={styles.modalDesc}>{selectedIssue?.description}</Text>

            <View style={styles.modalMetaGrid}>
              <View style={styles.modalMetaItem}>
                <Text style={styles.metaLabel}>Category</Text>
                <Text style={styles.metaValue}>{CATEGORIES.find(c => c.value === selectedIssue?.category)?.label || 'Other'}</Text>
              </View>
              <View style={styles.modalMetaItem}>
                <Text style={styles.metaLabel}>Severity</Text>
                <Text style={[styles.metaValue, { color: SEVERITY_COLORS[selectedIssue?.severity] }]}>{selectedIssue?.severity?.toUpperCase()}</Text>
              </View>
              <View style={styles.modalMetaItem}>
                <Text style={styles.metaLabel}>Location</Text>
                <Text style={styles.metaValue}>{selectedIssue?.address || 'N/A'}</Text>
              </View>
              <View style={styles.modalMetaItem}>
                <Text style={styles.metaLabel}>Votes</Text>
                <Text style={styles.metaValue}>{selectedIssue?.vote_count || 0}</Text>
              </View>
            </View>

            {selectedIssue?.assigned_worker && (
              <View style={styles.assignedBanner}>
                <Ionicons name="person" size={18} color="#F59E0B" />
                <Text style={styles.assignedText}>Assigned: {selectedIssue.assigned_worker}</Text>
              </View>
            )}

            {/* Action Buttons */}
            <View style={styles.actionButtons}>
              {selectedIssue?.status === 'forwarded_nmc' && (
                <TouchableOpacity
                  style={[styles.actionBtn, { backgroundColor: '#6366F1' }]}
                  onPress={() => setWorkerModal(true)}
                >
                  <Ionicons name="person-add" size={18} color="#fff" />
                  <Text style={styles.actionBtnText}>Assign Worker</Text>
                </TouchableOpacity>
              )}

              {selectedIssue?.status === 'worker_assigned' && (
                <TouchableOpacity
                  style={[styles.actionBtn, { backgroundColor: '#3B82F6' }]}
                  onPress={() => {
                    markInProgress(selectedIssue.id);
                    setSelectedIssue({ ...selectedIssue, status: 'in_progress' });
                  }}
                >
                  <Ionicons name="hammer" size={18} color="#fff" />
                  <Text style={styles.actionBtnText}>Start Work</Text>
                </TouchableOpacity>
              )}

              {(selectedIssue?.status === 'in_progress' || selectedIssue?.status === 'worker_assigned') && (
                <TouchableOpacity
                  style={[styles.actionBtn, { backgroundColor: '#10B981' }]}
                  onPress={() => {
                    markResolved(selectedIssue.id);
                    setModalVisible(false);
                  }}
                >
                  <Ionicons name="checkmark-circle" size={18} color="#fff" />
                  <Text style={styles.actionBtnText}>Mark Resolved</Text>
                </TouchableOpacity>
              )}

              {selectedIssue?.status === 'resolved' && (
                <View style={styles.resolvedBanner}>
                  <Ionicons name="checkmark-done" size={22} color="#10B981" />
                  <Text style={{ color: '#10B981', fontWeight: '700', fontSize: 15 }}>Issue Resolved ✓</Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </Modal>

      {/* Worker Assignment Modal */}
      <Modal visible={workerModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Assign Field Worker</Text>
            <Text style={{ color: '#94a3b8', marginBottom: 16 }}>Select a worker to dispatch to this location</Text>

            {WORKERS.filter(w => w.available).map((w) => (
              <TouchableOpacity
                key={w.id}
                style={styles.workerSelectRow}
                onPress={() => assignWorker(w)}
              >
                <View style={styles.workerSelectAvatar}>
                  <Text style={{ color: '#6366F1', fontWeight: '800', fontSize: 16 }}>{w.name.charAt(0)}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: '#1e293b', fontWeight: '700', fontSize: 14 }}>{w.name}</Text>
                  <Text style={{ color: '#94a3b8', fontSize: 12 }}>{w.zone} • {w.tasksCompleted} tasks</Text>
                </View>
                <Ionicons name="arrow-forward-circle" size={24} color="#6366F1" />
              </TouchableOpacity>
            ))}

            <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setWorkerModal(false)}>
              <Text style={{ color: '#EF4444', fontWeight: '700', fontSize: 15 }}>Cancel</Text>
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
    borderBottomWidth: 1, borderBottomColor: '#6366F110',
    backgroundColor: '#f6f7f6',
  },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#1e293b' },
  headerSubtitle: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
  logoutBtn: { padding: 10, backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#ef444430' },
  // Tabs
  tabRow: { flexDirection: 'row', paddingHorizontal: 12, gap: 6, marginTop: 12, marginBottom: 12 },
  tab: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4,
    paddingVertical: 9, borderRadius: 12, backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0',
  },
  tabActive: { backgroundColor: '#6366F1', borderColor: '#6366F1' },
  tabText: { color: '#64748b', fontWeight: '600', fontSize: 11 },
  tabTextActive: { color: '#fff' },
  // Stats row
  statsRow: { flexDirection: 'row', paddingHorizontal: 12, gap: 6, marginBottom: 8 },
  miniStat: {
    flex: 1, backgroundColor: '#fff', borderRadius: 10, padding: 10,
    borderLeftWidth: 3, alignItems: 'center',
  },
  miniStatNum: { fontSize: 22, fontWeight: '800', color: '#1e293b' },
  miniStatLabel: { fontSize: 9, color: '#94a3b8', fontWeight: '600', marginTop: 2 },
  // Issues
  issueRow: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
    marginHorizontal: 16, marginVertical: 4, borderRadius: 14, padding: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 4, elevation: 1,
  },
  issueColorBar: { width: 4, height: 60, borderRadius: 2, marginRight: 12 },
  issueInfo: { flex: 1, gap: 3 },
  issueTitle: { color: '#1e293b', fontSize: 14, fontWeight: '700' },
  issueMeta: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  issueAddr: { color: '#64748b', fontSize: 11 },
  workerAssigned: { color: '#F59E0B', fontSize: 11, fontWeight: '600' },
  statusPill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, borderWidth: 1,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 10, fontWeight: '700' },
  sevBadge: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  sevBadgeText: { color: '#fff', fontWeight: '800', fontSize: 13 },
  // Workers
  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#1e293b', marginVertical: 12 },
  workerCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 8,
    borderWidth: 1, borderColor: '#e2e8f0',
  },
  workerAvatar: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: '#6366F115',
    alignItems: 'center', justifyContent: 'center',
  },
  workerAvatarText: { color: '#6366F1', fontWeight: '800', fontSize: 18 },
  workerName: { fontSize: 15, fontWeight: '700', color: '#1e293b' },
  workerZone: { fontSize: 12, color: '#64748b', marginTop: 2 },
  workerTasks: { fontSize: 11, color: '#94a3b8', marginTop: 1 },
  availBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8,
  },
  availDot: { width: 6, height: 6, borderRadius: 3 },
  availText: { fontSize: 10, fontWeight: '700' },
  // Map
  mapHeader: {
    position: 'absolute', top: 12, left: 16, right: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#ffffffee', borderRadius: 14, padding: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 4,
  },
  countBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
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
  modalTitle: { fontSize: 19, fontWeight: '800', color: '#1e293b', marginBottom: 6, flex: 1 },
  modalDesc: { color: '#64748b', fontSize: 14, lineHeight: 20, marginBottom: 14 },
  modalMetaGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 12 },
  modalMetaItem: {
    width: (width - 68) / 2, backgroundColor: '#f6f7f6', borderRadius: 10, padding: 10,
  },
  metaLabel: { fontSize: 10, color: '#94a3b8', fontWeight: '600' },
  metaValue: { fontSize: 14, color: '#1e293b', fontWeight: '700', marginTop: 2 },
  assignedBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#F59E0B15', padding: 12, borderRadius: 12, marginBottom: 12,
    borderWidth: 1, borderColor: '#F59E0B30',
  },
  assignedText: { color: '#F59E0B', fontWeight: '700', fontSize: 14 },
  actionButtons: { gap: 10 },
  actionBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: 14, borderRadius: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2,
  },
  actionBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  resolvedBanner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#10B98115', padding: 14, borderRadius: 12, borderWidth: 1, borderColor: '#10B98130',
  },
  workerSelectRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f1f5f9',
  },
  workerSelectAvatar: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: '#6366F115',
    alignItems: 'center', justifyContent: 'center',
  },
  modalCloseBtn: { marginTop: 16, alignItems: 'center', paddingVertical: 14, borderRadius: 12, backgroundColor: '#f1f5f9' },
});

import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  Alert, Modal, TextInput, ScrollView, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import StatusBadge from '../../components/StatusBadge';
import { CATEGORIES, STATUS_LABELS, SEVERITY_COLORS } from '../../constants/categories';

export default function AdminDashboard({ navigation }) {
  const { signOut } = useAuth();
  const [issues, setIssues] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  // Stats
  const totalIssues = issues.length;
  const reported = issues.filter((i) => i.status === 'reported').length;
  const inReview = issues.filter((i) => i.status === 'in_review').length;
  const resolved = issues.filter((i) => i.status === 'resolved').length;

  const fetchData = useCallback(async () => {
    const [issuesRes, workersRes] = await Promise.all([
      supabase.from('road_issues').select('*, profiles!road_issues_reporter_id_fkey(full_name)').order('created_at', { ascending: false }),
      supabase.from('profiles').select('id, full_name').eq('role', 'worker'),
    ]);
    setIssues(issuesRes.data || []);
    setWorkers(workersRes.data || []);
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

  const assignWorker = async (workerId) => {
    const { error } = await supabase
      .from('road_issues')
      .update({ assigned_to: workerId, status: 'in_review' })
      .eq('id', selectedIssue.id);
    if (error) Alert.alert('Error', error.message);
    else {
      setModalVisible(false);
      fetchData();
    }
  };

  const updateStatus = async (issueId, newStatus) => {
    const { error } = await supabase
      .from('road_issues')
      .update({ status: newStatus, ...(newStatus === 'resolved' ? { resolved_at: new Date().toISOString() } : {}) })
      .eq('id', issueId);
    if (error) Alert.alert('Error', error.message);
    else fetchData();
  };

  const renderIssue = ({ item }) => {
    const cat = CATEGORIES.find((c) => c.value === item.category) || CATEGORIES[7];
    return (
      <View style={styles.issueRow}>
        <View style={styles.issueInfo}>
          <Text style={styles.issueTitle} numberOfLines={1}>{item.title}</Text>
          <View style={styles.issueMeta}>
            <StatusBadge status={item.status} />
            <Text style={styles.reporterName}>by {item.profiles?.full_name || 'Unknown'}</Text>
          </View>
        </View>
        <View style={styles.issueActions}>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => { setSelectedIssue(item); setModalVisible(true); }}
          >
            <Ionicons name="person-add-outline" size={18} color="#6366F1" />
          </TouchableOpacity>
          {item.status === 'reported' && (
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => updateStatus(item.id, 'in_review')}
            >
              <Ionicons name="eye-outline" size={18} color="#F39C12" />
            </TouchableOpacity>
          )}
          {item.status !== 'resolved' && item.status !== 'rejected' && (
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => updateStatus(item.id, 'resolved')}
            >
              <Ionicons name="checkmark-circle-outline" size={18} color="#2ECC71" />
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Admin Dashboard</Text>
          <Text style={styles.headerSubtitle}>Manage civic issues</Text>
        </View>
        <TouchableOpacity onPress={signOut} style={styles.logoutBtn}>
          <Ionicons name="log-out-outline" size={22} color="#EF4444" />
        </TouchableOpacity>
      </View>

      {/* Stats */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.statsRow}>
        <View style={[styles.statCard, { borderLeftColor: '#6366F1' }]}>
          <Text style={styles.statNumber}>{totalIssues}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={[styles.statCard, { borderLeftColor: '#E74C3C' }]}>
          <Text style={styles.statNumber}>{reported}</Text>
          <Text style={styles.statLabel}>Reported</Text>
        </View>
        <View style={[styles.statCard, { borderLeftColor: '#F39C12' }]}>
          <Text style={styles.statNumber}>{inReview}</Text>
          <Text style={styles.statLabel}>In Review</Text>
        </View>
        <View style={[styles.statCard, { borderLeftColor: '#2ECC71' }]}>
          <Text style={styles.statNumber}>{resolved}</Text>
          <Text style={styles.statLabel}>Resolved</Text>
        </View>
      </ScrollView>

      {/* Issue List */}
      <FlatList
        data={issues}
        keyExtractor={(item) => item.id}
        renderItem={renderIssue}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6366F1" />}
        contentContainerStyle={{ paddingBottom: 30 }}
      />

      {/* Assign Worker Modal */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Assign Worker</Text>
            <Text style={styles.modalSubtitle}>
              {selectedIssue?.title}
            </Text>
            {workers.length === 0 ? (
              <Text style={styles.noWorkers}>No workers registered yet.</Text>
            ) : (
              workers.map((w) => (
                <TouchableOpacity
                  key={w.id}
                  style={styles.workerRow}
                  onPress={() => assignWorker(w.id)}
                >
                  <Ionicons name="person" size={18} color="#6366F1" />
                  <Text style={styles.workerName}>{w.full_name}</Text>
                  <Ionicons name="arrow-forward" size={16} color="#64748B" />
                </TouchableOpacity>
              ))
            )}
            <TouchableOpacity style={styles.modalClose} onPress={() => setModalVisible(false)}>
              <Text style={styles.modalCloseText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#94A3B8',
    marginTop: 2,
  },
  logoutBtn: {
    padding: 8,
    backgroundColor: '#1E293B',
    borderRadius: 10,
  },
  statsRow: {
    paddingHorizontal: 16,
    marginBottom: 16,
    maxHeight: 90,
  },
  statCard: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 14,
    marginRight: 10,
    minWidth: 90,
    borderLeftWidth: 3,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  statLabel: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
  issueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    marginHorizontal: 16,
    marginVertical: 4,
    borderRadius: 12,
    padding: 14,
  },
  issueInfo: {
    flex: 1,
    gap: 6,
  },
  issueTitle: {
    color: '#F8FAFC',
    fontSize: 15,
    fontWeight: '600',
  },
  issueMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  reporterName: {
    color: '#64748B',
    fontSize: 11,
  },
  issueActions: {
    flexDirection: 'row',
    gap: 6,
  },
  actionBtn: {
    padding: 8,
    backgroundColor: '#0F172A',
    borderRadius: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: '#00000099',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1E293B',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: 40,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#F8FAFC',
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 13,
    color: '#94A3B8',
    marginBottom: 16,
  },
  noWorkers: {
    color: '#64748B',
    textAlign: 'center',
    paddingVertical: 20,
  },
  workerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  workerName: {
    flex: 1,
    color: '#F8FAFC',
    fontSize: 15,
    fontWeight: '600',
  },
  modalClose: {
    marginTop: 16,
    alignItems: 'center',
  },
  modalCloseText: {
    color: '#EF4444',
    fontWeight: '700',
    fontSize: 15,
  },
});

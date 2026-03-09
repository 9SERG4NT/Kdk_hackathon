import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  Alert, Image, RefreshControl, Linking, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import StatusBadge from '../../components/StatusBadge';
import { CATEGORIES } from '../../constants/categories';
import { decode } from 'base64-arraybuffer';

export default function WorkerDashboard() {
  const { user, profile, signOut } = useAuth();
  const [issues, setIssues] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAssigned = useCallback(async () => {
    const { data } = await supabase
      .from('road_issues')
      .select('*')
      .eq('assigned_to', user.id)
      .order('created_at', { ascending: false });
    setIssues(data || []);
  }, [user.id]);

  useEffect(() => {
    fetchAssigned();
    const channel = supabase
      .channel('worker_issues')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'road_issues' }, fetchAssigned)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchAssigned]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAssigned();
    setRefreshing(false);
  };

  const updateStatus = async (issueId, newStatus) => {
    const { error } = await supabase
      .from('road_issues')
      .update({
        status: newStatus,
        ...(newStatus === 'resolved' ? { resolved_at: new Date().toISOString() } : {}),
      })
      .eq('id', issueId);
    if (error) Alert.alert('Error', error.message);
    else fetchAssigned();
  };

  const uploadProof = async (issueId) => {
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: 0.7,
      base64: true,
    });

    if (result.canceled) return;

    const fileName = `resolved/${issueId}_${Date.now()}.jpg`;
    const { error: uploadError } = await supabase.storage
      .from('road-issue-images')
      .upload(fileName, decode(result.assets[0].base64), {
        contentType: 'image/jpeg',
      });

    if (uploadError) {
      Alert.alert('Upload Error', uploadError.message);
      return;
    }

    // Add comment with proof
    await supabase.from('issue_updates').insert({
      issue_id: issueId,
      updated_by: user.id,
      new_status: 'resolved',
      comment: `Resolution proof uploaded: ${fileName}`,
    });

    Alert.alert('Success', 'Proof photo uploaded!');
  };

  const openMaps = (lat, lng) => {
    const url = Platform.select({
      ios: `maps://app?saddr=Current+Location&daddr=${lat},${lng}`,
      android: `google.navigation:q=${lat},${lng}`,
    });
    Linking.openURL(url).catch(() => {
      Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`);
    });
  };

  const pending = issues.filter((i) => i.status !== 'resolved' && i.status !== 'rejected');
  const completed = issues.filter((i) => i.status === 'resolved');

  const renderIssue = ({ item }) => {
    const cat = CATEGORIES.find((c) => c.value === item.category) || CATEGORIES[7];
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 6 }}>
              <StatusBadge status={item.status} />
              <View style={[styles.catTag, { backgroundColor: cat.color + '22' }]}>
                <Text style={[styles.catText, { color: cat.color }]}>{cat.label}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Location */}
        <TouchableOpacity
          style={styles.locationRow}
          onPress={() => openMaps(item.latitude, item.longitude)}
        >
          <Ionicons name="navigate" size={16} color="#6366F1" />
          <Text style={styles.locationText}>
            {item.address || `${Number(item.latitude).toFixed(4)}, ${Number(item.longitude).toFixed(4)}`}
          </Text>
          <Ionicons name="open-outline" size={14} color="#64748B" />
        </TouchableOpacity>

        {/* Actions */}
        {item.status !== 'resolved' && item.status !== 'rejected' && (
          <View style={styles.actions}>
            {item.status === 'in_review' && (
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: '#2ECC7122' }]}
                onPress={() => {
                  Alert.alert('Mark Resolved?', 'Are you sure this issue is resolved?', [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Resolve', onPress: () => updateStatus(item.id, 'resolved') },
                  ]);
                }}
              >
                <Ionicons name="checkmark-circle" size={18} color="#2ECC71" />
                <Text style={[styles.actionText, { color: '#2ECC71' }]}>Mark Resolved</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: '#6366F122' }]}
              onPress={() => uploadProof(item.id)}
            >
              <Ionicons name="camera" size={18} color="#6366F1" />
              <Text style={[styles.actionText, { color: '#6366F1' }]}>Upload Proof</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>My Assignments</Text>
          <Text style={styles.headerSubtitle}>
            {pending.length} pending · {completed.length} resolved
          </Text>
        </View>
        <TouchableOpacity onPress={signOut} style={styles.logoutBtn}>
          <Ionicons name="log-out-outline" size={22} color="#EF4444" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={issues}
        keyExtractor={(item) => item.id}
        renderItem={renderIssue}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6366F1" />}
        contentContainerStyle={{ paddingBottom: 30 }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={{ fontSize: 48 }}>✅</Text>
            <Text style={styles.emptyText}>No assigned issues</Text>
          </View>
        }
      />
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
  card: {
    backgroundColor: '#1E293B',
    marginHorizontal: 16,
    marginVertical: 6,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  cardHeader: {
    flexDirection: 'row',
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  catTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  catText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#0F172A',
    padding: 10,
    borderRadius: 10,
    marginTop: 12,
  },
  locationText: {
    flex: 1,
    color: '#CBD5E1',
    fontSize: 13,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
  },
  actionText: {
    fontWeight: '700',
    fontSize: 13,
  },
  empty: {
    alignItems: 'center',
    marginTop: 100,
  },
  emptyText: {
    color: '#64748B',
    fontSize: 16,
    marginTop: 12,
  },
});

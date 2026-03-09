import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, Dimensions, TouchableOpacity, StatusBar, Alert,
} from 'react-native';
import MapView, { Marker, Circle } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { SEVERITY_COLORS } from '../../constants/categories';

const { width } = Dimensions.get('window');

const SEVERITY_FILTERS = [
  { key: null, label: 'All', color: '#4cae4f' },
  { key: 'critical', label: 'Critical', color: '#EF4444' },
  { key: 'high', label: 'High', color: '#F97316' },
  { key: 'medium', label: 'Medium', color: '#EAB308' },
  { key: 'low', label: 'Low', color: '#22C55E' },
];

// Hardcoded issues for demo — Nagpur locations
const HARDCODED_ISSUES = [
  { id: 'h1', title: 'Large pothole on Wardha Road', category: 'pothole', severity: 'high', status: 'reported', latitude: 21.1250, longitude: 79.0750, vote_count: 12, description: 'Deep pothole near Ajni Square bus stop' },
  { id: 'h2', title: 'Garbage dump near Ambazari Garden', category: 'garbage', severity: 'medium', status: 'in_review', latitude: 21.1350, longitude: 79.0550, vote_count: 8, description: 'Overflowing garbage bin near park entrance' },
  { id: 'h3', title: 'Street light not working in Dharampeth', category: 'streetlight', severity: 'high', status: 'reported', latitude: 21.1500, longitude: 79.0700, vote_count: 15, description: 'Entire block dark at night' },
  { id: 'h4', title: 'Water pipe burst on Sitabuldi Main Road', category: 'water_leakage', severity: 'critical', status: 'in_review', latitude: 21.1458, longitude: 79.0820, vote_count: 22, description: 'Water flowing on road for 2 hours' },
  { id: 'h5', title: 'Broken footpath tiles at Sadar', category: 'road_damage', severity: 'medium', status: 'resolved', latitude: 21.1550, longitude: 79.0900, vote_count: 6, description: 'Tripping hazard on main footpath' },
  { id: 'h6', title: 'Open manhole near Hislop College', category: 'sewage', severity: 'critical', status: 'reported', latitude: 21.1400, longitude: 79.0850, vote_count: 19, description: 'Uncovered manhole near school zone' },
  { id: 'h7', title: 'Fallen tree blocking Hingna Road', category: 'public_safety', severity: 'high', status: 'resolved', latitude: 21.1200, longitude: 79.0400, vote_count: 28, description: 'One lane blocked after storm' },
  { id: 'h8', title: 'Illegal dumping near Futala Lake', category: 'garbage', severity: 'high', status: 'reported', latitude: 21.1580, longitude: 79.0480, vote_count: 35, description: 'Construction debris dumped near lake' },
  { id: 'h9', title: 'Cracked road surface at Manewada', category: 'road_damage', severity: 'medium', status: 'reported', latitude: 21.1100, longitude: 79.1100, vote_count: 4, description: 'Road surface crumbling' },
  { id: 'h10', title: 'Leaking fire hydrant at Civil Lines', category: 'water_leakage', severity: 'low', status: 'reported', latitude: 21.1600, longitude: 79.0750, vote_count: 3, description: 'Slow leak near main junction' },
];

export default function MapScreen({ navigation }) {
  const [issues, setIssues] = useState(HARDCODED_ISSUES);
  const [filterSeverity, setFilterSeverity] = useState(null);

  useEffect(() => {
    fetchIssues();
    // Real-time listener for new reports
    const channel = supabase
      .channel('map_issues')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'road_issues' }, () => {
        fetchIssues();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const fetchIssues = async () => {
    try {
      const { data, error } = await supabase.from('road_issues').select('*').limit(200);
      if (!error && data && data.length > 0) {
        // Merge DB issues with hardcoded, avoiding duplicates
        const existingIds = new Set(data.map(d => d.id));
        const hardcodedOnly = HARDCODED_ISSUES.filter(h => !existingIds.has(h.id));
        setIssues([...data, ...hardcodedOnly]);
      }
    } catch (err) {
      console.warn('Map fetch failed, using hardcoded:', err);
    }
  };

  const filtered = filterSeverity
    ? issues.filter((i) => i.severity === filterSeverity)
    : issues;

  const getMarkerColor = (severity) => SEVERITY_COLORS[severity] || '#EAB308';

  const getMarkerEmoji = (category) => {
    switch (category) {
      case 'pothole': return '🕳️';
      case 'garbage': return '🗑️';
      case 'water_leakage': return '💧';
      case 'streetlight': return '💡';
      case 'road_damage': return '🚧';
      case 'sewage': return '🚰';
      case 'public_safety': return '⚠️';
      default: return '📍';
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f6f7f6" />

      <MapView
        style={StyleSheet.absoluteFillObject}
        initialRegion={{
          latitude: 21.1458,
          longitude: 79.0882,
          latitudeDelta: 0.12,
          longitudeDelta: 0.12,
        }}
      >
        {filtered.map((issue) => {
          if (!issue.latitude || !issue.longitude) return null;
          return (
            <React.Fragment key={issue.id}>
              <Marker
                coordinate={{ latitude: Number(issue.latitude), longitude: Number(issue.longitude) }}
                title={`${getMarkerEmoji(issue.category)} ${issue.title}`}
                description={`${issue.severity?.toUpperCase()} • ${issue.vote_count || 0} votes • ${issue.status}`}
                pinColor={getMarkerColor(issue.severity)}
                onCalloutPress={() => {
                  if (navigation) {
                    try { navigation.navigate('IssueDetail', { issue }); } catch (e) {}
                  }
                }}
              />
              <Circle
                center={{ latitude: Number(issue.latitude), longitude: Number(issue.longitude) }}
                radius={Math.max(50, (issue.vote_count || 1) * 15)}
                fillColor={getMarkerColor(issue.severity) + '20'}
                strokeColor={getMarkerColor(issue.severity) + '40'}
                strokeWidth={1}
              />
            </React.Fragment>
          );
        })}
      </MapView>

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🗺️ Issue Map</Text>
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{filtered.length} issues</Text>
        </View>
      </View>

      {/* Severity Filter Chips */}
      <View style={styles.filterBar}>
        {SEVERITY_FILTERS.map((f) => (
          <TouchableOpacity
            key={f.key || 'all'}
            style={[styles.filterChip, filterSeverity === f.key && { backgroundColor: f.color, borderColor: f.color }]}
            onPress={() => setFilterSeverity(f.key)}
          >
            {f.key && <View style={[styles.chipDot, { backgroundColor: filterSeverity === f.key ? '#fff' : f.color }]} />}
            <Text style={[styles.filterText, filterSeverity === f.key && { color: '#fff' }]}>{f.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        <Text style={styles.legendTitle}>Severity Legend</Text>
        <View style={styles.legendRow}>
          {[
            { label: 'Critical', color: '#EF4444' },
            { label: 'High', color: '#F97316' },
            { label: 'Medium', color: '#EAB308' },
            { label: 'Low', color: '#22C55E' },
          ].map((l) => (
            <View key={l.label} style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: l.color }]} />
              <Text style={styles.legendLabel}>{l.label}</Text>
            </View>
          ))}
        </View>
        <Text style={styles.legendNote}>Tap a pin for details • Circle = impact radius</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f6f7f6' },
  header: {
    position: 'absolute', top: 52, left: 16, right: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#ffffffee', borderRadius: 14, padding: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, shadowRadius: 8, elevation: 4,
    borderWidth: 1, borderColor: '#4cae4f15',
  },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#1e293b' },
  countBadge: {
    backgroundColor: '#4cae4f', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 10,
  },
  countText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  filterBar: {
    position: 'absolute', top: 115, left: 0, right: 0,
    flexDirection: 'row', paddingHorizontal: 12, gap: 6,
  },
  filterChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20,
    backgroundColor: '#ffffffee', borderWidth: 1, borderColor: '#e2e8f0',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  chipDot: { width: 8, height: 8, borderRadius: 4 },
  filterText: { color: '#475569', fontSize: 12, fontWeight: '600' },
  legend: {
    position: 'absolute', bottom: 20, left: 16, right: 16,
    backgroundColor: '#ffffffee', borderRadius: 14, padding: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, shadowRadius: 8, elevation: 4,
    borderWidth: 1, borderColor: '#4cae4f15',
  },
  legendTitle: { fontSize: 13, fontWeight: '700', color: '#1e293b', marginBottom: 8 },
  legendRow: { flexDirection: 'row', justifyContent: 'space-around' },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendLabel: { fontSize: 11, color: '#64748b', fontWeight: '600' },
  legendNote: { fontSize: 10, color: '#94a3b8', marginTop: 8, textAlign: 'center' },
});

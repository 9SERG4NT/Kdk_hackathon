import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Dimensions } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { CATEGORIES, STATUS_COLORS } from '../../constants/categories';

const { width } = Dimensions.get('window');

export default function MapScreen({ navigation }) {
  const [issues, setIssues] = useState([]);
  const [region, setRegion] = useState(null);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({});
        setRegion({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
          latitudeDelta: 0.03,
          longitudeDelta: 0.03,
        });
      } else {
        // Default to Nagpur, India
        setRegion({
          latitude: 21.1458,
          longitude: 79.0882,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        });
      }
    })();

    fetchIssues();
  }, []);

  const fetchIssues = async () => {
    const { data } = await supabase
      .from('road_issues')
      .select('id, title, category, status, latitude, longitude, vote_count')
      .neq('status', 'resolved')
      .limit(200);
    setIssues(data || []);
  };

  const getMarkerColor = (status) => STATUS_COLORS[status] || '#E74C3C';

  if (!region) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading map...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView style={styles.map} region={region} showsUserLocation showsMyLocationButton>
        {issues.map((issue) => (
          <Marker
            key={issue.id}
            coordinate={{
              latitude: Number(issue.latitude),
              longitude: Number(issue.longitude),
            }}
            pinColor={getMarkerColor(issue.status)}
            title={issue.title}
            description={`Status: ${issue.status} | Votes: ${issue.vote_count || 0}`}
            onCalloutPress={() => navigation.navigate('IssueDetail', { issue })}
          />
        ))}
      </MapView>

      {/* Legend */}
      <View style={styles.legend}>
        <Text style={styles.legendTitle}>Legend</Text>
        <View style={styles.legendRow}>
          <View style={[styles.legendDot, { backgroundColor: STATUS_COLORS.reported }]} />
          <Text style={styles.legendText}>Reported</Text>
        </View>
        <View style={styles.legendRow}>
          <View style={[styles.legendDot, { backgroundColor: STATUS_COLORS.in_review }]} />
          <Text style={styles.legendText}>In Review</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: '#94A3B8',
    fontSize: 16,
  },
  legend: {
    position: 'absolute',
    bottom: 30,
    left: 16,
    backgroundColor: '#0F172AEE',
    borderRadius: 12,
    padding: 12,
    gap: 4,
  },
  legendTitle: {
    color: '#F8FAFC',
    fontWeight: '700',
    fontSize: 12,
    marginBottom: 4,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    color: '#CBD5E1',
    fontSize: 11,
  },
});

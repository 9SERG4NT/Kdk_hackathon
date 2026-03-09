import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import StatusBadge from './StatusBadge';
import { CATEGORIES, SEVERITY_COLORS } from '../constants/categories';

export default function IssueCard({ issue, onPress }) {
  const cat = CATEGORIES.find((c) => c.value === issue.category) || CATEGORIES[7];
  const sevColor = SEVERITY_COLORS[issue.severity] || '#F39C12';

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
      {issue.image_path ? (
        <Image
          source={{ uri: `https://xhiyabkazetvrnbxhxne.supabase.co/storage/v1/object/public/road-issue-images/${issue.image_path}` }}
          style={styles.image}
        />
      ) : (
        <View style={[styles.imagePlaceholder, { backgroundColor: cat.color + '22' }]}>
          <Text style={{ fontSize: 32 }}>📸</Text>
        </View>
      )}

      <View style={styles.body}>
        <View style={styles.topRow}>
          <View style={[styles.categoryTag, { backgroundColor: cat.color + '22' }]}>
            <Text style={[styles.categoryText, { color: cat.color }]}>{cat.label}</Text>
          </View>
          <View style={[styles.severityDot, { backgroundColor: sevColor }]} />
        </View>

        <Text style={styles.title} numberOfLines={2}>{issue.title}</Text>
        <Text style={styles.description} numberOfLines={2}>{issue.description}</Text>

        <View style={styles.footer}>
          <StatusBadge status={issue.status} />
          <View style={styles.voteSection}>
            <Ionicons name="chevron-up" size={16} color="#6366F1" />
            <Text style={styles.voteCount}>{issue.vote_count || 0}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    marginHorizontal: 16,
    marginVertical: 6,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#334155',
  },
  image: {
    width: '100%',
    height: 160,
    resizeMode: 'cover',
  },
  imagePlaceholder: {
    width: '100%',
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    padding: 14,
    gap: 8,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryTag: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  severityDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  description: {
    fontSize: 13,
    color: '#94A3B8',
    lineHeight: 18,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  voteSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  voteCount: {
    color: '#6366F1',
    fontWeight: '700',
    fontSize: 14,
  },
});

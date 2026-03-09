import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Image, TouchableOpacity,
  TextInput, Alert, FlatList, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import StatusBadge from '../../components/StatusBadge';
import { CATEGORIES, SEVERITY_COLORS } from '../../constants/categories';

export default function IssueDetailScreen({ route, navigation }) {
  const { issue: initialIssue } = route.params;
  const { user } = useAuth();
  const [issue, setIssue] = useState(initialIssue);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [hasVoted, setHasVoted] = useState(false);
  const [voteCount, setVoteCount] = useState(issue.vote_count || 0);

  const cat = CATEGORIES.find((c) => c.value === issue.category) || CATEGORIES[7];
  const imageUrl = issue.image_path
    ? `https://xhiyabkazetvrnbxhxne.supabase.co/storage/v1/object/public/road-issue-images/${issue.image_path}`
    : null;

  useEffect(() => {
    fetchComments();
    checkVote();

    // Realtime comment updates
    const channel = supabase
      .channel(`comments_${issue.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'comments',
        filter: `issue_id=eq.${issue.id}`,
      }, () => { fetchComments(); })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const fetchComments = async () => {
    const { data } = await supabase
      .from('comments')
      .select('*, profiles(full_name)')
      .eq('issue_id', issue.id)
      .order('created_at', { ascending: true });
    setComments(data || []);
  };

  const checkVote = async () => {
    const { data } = await supabase
      .from('votes')
      .select('id')
      .eq('issue_id', issue.id)
      .eq('user_id', user.id)
      .maybeSingle();
    setHasVoted(!!data);
  };

  const toggleVote = async () => {
    if (hasVoted) {
      await supabase.from('votes').delete().eq('issue_id', issue.id).eq('user_id', user.id);
      setHasVoted(false);
      setVoteCount((c) => c - 1);
    } else {
      await supabase.from('votes').insert({ issue_id: issue.id, user_id: user.id });
      setHasVoted(true);
      setVoteCount((c) => c + 1);
    }
  };

  const addComment = async () => {
    if (!newComment.trim()) return;
    const { error } = await supabase.from('comments').insert({
      issue_id: issue.id,
      user_id: user.id,
      comment: newComment.trim(),
    });
    if (error) Alert.alert('Error', error.message);
    else {
      setNewComment('');
      fetchComments();
    }
  };

  const timeSince = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#F8FAFC" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Issue Details</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Image */}
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} style={styles.image} />
        ) : (
          <View style={[styles.imagePlaceholder, { backgroundColor: cat.color + '15' }]}>
            <Text style={{ fontSize: 48 }}>📷</Text>
            <Text style={styles.noImageText}>No photo attached</Text>
          </View>
        )}

        {/* Title & Status */}
        <View style={styles.section}>
          <View style={styles.titleRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>{issue.title}</Text>
            </View>
            <TouchableOpacity style={styles.voteButton} onPress={toggleVote}>
              <Ionicons
                name={hasVoted ? 'arrow-up-circle' : 'arrow-up-circle-outline'}
                size={28}
                color={hasVoted ? '#6366F1' : '#64748B'}
              />
              <Text style={[styles.voteText, hasVoted && { color: '#6366F1' }]}>{voteCount}</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.metaRow}>
            <StatusBadge status={issue.status} />
            <View style={[styles.categoryTag, { backgroundColor: cat.color + '22' }]}>
              <Text style={[styles.categoryText, { color: cat.color }]}>{cat.label}</Text>
            </View>
            <View style={[styles.severityTag, { backgroundColor: (SEVERITY_COLORS[issue.severity] || '#F39C12') + '22' }]}>
              <Text style={{ color: SEVERITY_COLORS[issue.severity] || '#F39C12', fontSize: 11, fontWeight: '700' }}>
                {(issue.severity || 'medium').toUpperCase()}
              </Text>
            </View>
          </View>
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.description}>{issue.description}</Text>
        </View>

        {/* Location */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Location</Text>
          <View style={styles.locationBox}>
            <Ionicons name="location" size={18} color="#6366F1" />
            <Text style={styles.locationText}>
              {issue.address || `${Number(issue.latitude).toFixed(4)}, ${Number(issue.longitude).toFixed(4)}`}
            </Text>
          </View>
        </View>

        {/* Time */}
        <View style={styles.section}>
          <Text style={styles.timeText}>Reported {timeSince(issue.created_at)}</Text>
        </View>

        {/* Comments */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Comments ({comments.length})</Text>
          {comments.map((c) => (
            <View key={c.id} style={styles.commentItem}>
              <View style={styles.commentHeader}>
                <Text style={styles.commentAuthor}>{c.profiles?.full_name || 'User'}</Text>
                <Text style={styles.commentTime}>{timeSince(c.created_at)}</Text>
              </View>
              <Text style={styles.commentText}>{c.comment}</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Comment Input */}
      <View style={styles.commentInputRow}>
        <TextInput
          style={styles.commentInput}
          placeholder="Write a comment..."
          placeholderTextColor="#64748B"
          value={newComment}
          onChangeText={setNewComment}
          multiline
        />
        <TouchableOpacity style={styles.sendBtn} onPress={addComment}>
          <Ionicons name="send" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  image: {
    width: '100%',
    height: 220,
    resizeMode: 'cover',
  },
  imagePlaceholder: {
    width: '100%',
    height: 150,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noImageText: {
    color: '#64748B',
    marginTop: 8,
    fontSize: 13,
  },
  section: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#F8FAFC',
    lineHeight: 28,
  },
  voteButton: {
    alignItems: 'center',
    marginLeft: 12,
  },
  voteText: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 2,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
    flexWrap: 'wrap',
  },
  categoryTag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  severityTag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F8FAFC',
    marginBottom: 8,
  },
  description: {
    color: '#CBD5E1',
    fontSize: 15,
    lineHeight: 22,
  },
  locationBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#1E293B',
    padding: 12,
    borderRadius: 10,
  },
  locationText: {
    color: '#CBD5E1',
    fontSize: 14,
  },
  timeText: {
    color: '#64748B',
    fontSize: 12,
  },
  commentItem: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  commentAuthor: {
    color: '#6366F1',
    fontWeight: '700',
    fontSize: 13,
  },
  commentTime: {
    color: '#64748B',
    fontSize: 11,
  },
  commentText: {
    color: '#CBD5E1',
    fontSize: 14,
    lineHeight: 20,
  },
  commentInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    paddingBottom: 30,
    backgroundColor: '#1E293B',
    borderTopWidth: 1,
    borderTopColor: '#334155',
    gap: 8,
  },
  commentInput: {
    flex: 1,
    backgroundColor: '#0F172A',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: '#F8FAFC',
    fontSize: 14,
    maxHeight: 80,
  },
  sendBtn: {
    backgroundColor: '#6366F1',
    borderRadius: 12,
    padding: 10,
  },
});

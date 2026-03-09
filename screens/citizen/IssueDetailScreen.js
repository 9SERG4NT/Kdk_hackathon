import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Image, TouchableOpacity,
  TextInput, Alert, KeyboardAvoidingView, Platform, StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import StatusBadge from '../../components/StatusBadge';
import { CATEGORIES } from '../../constants/categories';
import { getSeverityColor, getSeverityEmoji } from '../../lib/aiAnalyzer';

// ===== STATUS TIMELINE COMPONENT =====
const STATUS_STEPS = [
  { key: 'reported', label: 'AI Verified', icon: '🤖', desc: 'Issue detected & reported' },
  { key: 'in_review', label: 'Assigned', icon: '👤', desc: 'Assigned to ward officer' },
  { key: 'in_progress', label: 'Dispatched', icon: '🚛', desc: 'Worker dispatched' },
  { key: 'resolved', label: 'Resolved', icon: '✅', desc: 'Issue fixed & verified' },
];

function StatusTimeline({ currentStatus }) {
  const statusOrder = ['reported', 'in_review', 'in_progress', 'resolved'];
  const currentIdx = statusOrder.indexOf(currentStatus);

  return (
    <View style={tlStyles.container}>
      {STATUS_STEPS.map((step, idx) => {
        const isCompleted = idx <= currentIdx;
        const isCurrent = idx === currentIdx;
        const isLast = idx === STATUS_STEPS.length - 1;

        return (
          <View key={step.key} style={tlStyles.stepRow}>
            <View style={tlStyles.dotColumn}>
              <View style={[
                tlStyles.dot,
                isCompleted && tlStyles.dotCompleted,
                isCurrent && tlStyles.dotCurrent,
              ]}>
                <Text style={tlStyles.dotIcon}>{isCompleted ? step.icon : '○'}</Text>
              </View>
              {!isLast && (
                <View style={[
                  tlStyles.line,
                  isCompleted && idx < currentIdx && tlStyles.lineCompleted,
                ]} />
              )}
            </View>
            <View style={[tlStyles.labelBox, isCurrent && tlStyles.labelBoxCurrent]}>
              <Text style={[tlStyles.label, isCompleted && tlStyles.labelCompleted]}>
                {step.label}
              </Text>
              <Text style={tlStyles.desc}>{step.desc}</Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

const tlStyles = StyleSheet.create({
  container: { marginTop: 4 },
  stepRow: { flexDirection: 'row', minHeight: 64 },
  dotColumn: { alignItems: 'center', width: 40 },
  dot: {
    width: 32, height: 32, borderRadius: 16, backgroundColor: '#e2e8f0',
    alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#cbd5e1',
  },
  dotCompleted: { backgroundColor: '#4cae4f', borderColor: '#66bb6a' },
  dotCurrent: { borderColor: '#4cae4f', borderWidth: 3, shadowColor: '#4cae4f', shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  dotIcon: { fontSize: 14 },
  line: { width: 2, flex: 1, backgroundColor: '#e2e8f0', marginVertical: 2 },
  lineCompleted: { backgroundColor: '#4cae4f' },
  labelBox: { flex: 1, marginLeft: 12, paddingBottom: 16 },
  labelBoxCurrent: { backgroundColor: '#4cae4f15', borderRadius: 10, padding: 10, marginBottom: 6 },
  label: { color: '#94a3b8', fontSize: 14, fontWeight: '700' },
  labelCompleted: { color: '#1e293b' },
  desc: { color: '#94a3b8', fontSize: 12, marginTop: 2 },
});

// ===== MAIN SCREEN =====
export default function IssueDetailScreen({ route, navigation }) {
  const { issue: initialIssue } = route.params;
  const { user, isGuest } = useAuth();
  const [issue, setIssue] = useState(initialIssue);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [hasVoted, setHasVoted] = useState(false);
  const [voteCount, setVoteCount] = useState(issue.vote_count || 0);

  const cat = CATEGORIES.find((c) => c.value === issue.category) || CATEGORIES[7];
  const imageUrl = issue.image_path
    ? `https://xhiyabkazetvrnbxhxne.supabase.co/storage/v1/object/public/road-issue-images/${issue.image_path}`
    : null;
  const resolutionImageUrl = issue.resolution_image_path
    ? `https://xhiyabkazetvrnbxhxne.supabase.co/storage/v1/object/public/road-issue-images/${issue.resolution_image_path}`
    : null;

  useEffect(() => {
    fetchComments();
    if (!isGuest && user) checkVote();
    const channel = supabase
      .channel(`comments_${issue.id}`)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'comments',
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
    if (!user) return;
    const { data } = await supabase.from('votes').select('id')
      .eq('issue_id', issue.id).eq('user_id', user.id).maybeSingle();
    setHasVoted(!!data);
  };

  const toggleVote = async () => {
    if (isGuest) {
      Alert.alert('Sign In Required', 'Please sign in to vote on issues.');
      return;
    }
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
    if (isGuest) {
      Alert.alert('Sign In Required', 'Please sign in to comment.');
      return;
    }
    const { error } = await supabase.from('comments').insert({
      issue_id: issue.id, user_id: user.id, comment: newComment.trim(),
    });
    if (error) Alert.alert('Error', error.message);
    else { setNewComment(''); fetchComments(); }
  };

  const timeSince = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <StatusBar barStyle="dark-content" backgroundColor="#f6f7f6" />
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#1e293b" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Issue Details</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Image */}
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} style={styles.image} />
        ) : (
          <View style={[styles.imagePlaceholder, { backgroundColor: cat.color + '10' }]}>
            <Text style={{ fontSize: 48 }}>📷</Text>
            <Text style={styles.noImageText}>No photo attached</Text>
          </View>
        )}

        {/* AI Badge */}
        {issue.ai_confidence && (
          <View style={styles.aiBanner}>
            <Text style={styles.aiBannerIcon}>🧠</Text>
            <Text style={styles.aiBannerText}>
              AI Detected: {(issue.ai_category || '').replace('_', ' ')}
            </Text>
            <View style={[styles.aiConfBadge, { backgroundColor: getSeverityColor(issue.ai_severity) + '20' }]}>
              <Text style={[styles.aiConfText, { color: getSeverityColor(issue.ai_severity) }]}>
                {Math.round((issue.ai_confidence || 0) * 100)}%
              </Text>
            </View>
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
                size={28} color={hasVoted ? '#4cae4f' : '#94a3b8'}
              />
              <Text style={[styles.voteText, hasVoted && { color: '#4cae4f' }]}>{voteCount}</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.metaRow}>
            <StatusBadge status={issue.status} />
            <View style={[styles.categoryTag, { backgroundColor: cat.color + '15' }]}>
              <Text style={[styles.categoryText, { color: cat.color }]}>{cat.label}</Text>
            </View>
            <View style={[styles.severityTag, { backgroundColor: getSeverityColor(issue.severity) + '15' }]}>
              <Text style={{ color: getSeverityColor(issue.severity), fontSize: 11, fontWeight: '700' }}>
                {getSeverityEmoji(issue.severity)} {(issue.severity || 'medium').toUpperCase()}
              </Text>
            </View>
          </View>
          {issue.karma_points_awarded > 0 && (
            <View style={styles.karmaTag}>
              <Text style={styles.karmaText}>⭐ +{issue.karma_points_awarded} karma</Text>
            </View>
          )}
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.description}>{issue.description}</Text>
        </View>

        {/* Status Timeline */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📋 Issue Progress</Text>
          <StatusTimeline currentStatus={issue.status} />
        </View>

        {/* Before / After */}
        {resolutionImageUrl && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📸 Before & After</Text>
            <View style={styles.beforeAfterRow}>
              <View style={styles.beforeAfterItem}>
                <Text style={styles.baLabel}>BEFORE</Text>
                {imageUrl ? (
                  <Image source={{ uri: imageUrl }} style={styles.baImage} />
                ) : (
                  <View style={[styles.baImage, styles.baPlaceholder]}>
                    <Text style={styles.baPlaceholderText}>No photo</Text>
                  </View>
                )}
              </View>
              <View style={styles.beforeAfterItem}>
                <Text style={[styles.baLabel, { color: '#4cae4f' }]}>AFTER ✅</Text>
                <Image source={{ uri: resolutionImageUrl }} style={styles.baImage} />
              </View>
            </View>
          </View>
        )}

        {/* Location */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Location</Text>
          <View style={styles.locationBox}>
            <Ionicons name="location" size={18} color="#4cae4f" />
            <Text style={styles.locationText}>
              {issue.address || `${Number(issue.latitude).toFixed(4)}, ${Number(issue.longitude).toFixed(4)}`}
            </Text>
          </View>
          {(issue.ward || issue.pincode) && (
            <Text style={styles.wardText}>
              {issue.ward ? `Ward: ${issue.ward}` : ''} {issue.pincode ? `| PIN: ${issue.pincode}` : ''}
            </Text>
          )}
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
          placeholder={isGuest ? "Sign in to comment..." : "Write a comment..."}
          placeholderTextColor="#94a3b8"
          value={newComment}
          onChangeText={setNewComment}
          multiline
          editable={!isGuest}
        />
        <TouchableOpacity style={styles.sendBtn} onPress={addComment}>
          <Ionicons name="send" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f6f7f6' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 52, paddingBottom: 12,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: '#fff',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#1e293b' },
  image: { width: '100%', height: 220, resizeMode: 'cover', borderRadius: 0 },
  imagePlaceholder: { width: '100%', height: 150, alignItems: 'center', justifyContent: 'center' },
  noImageText: { color: '#94a3b8', marginTop: 8, fontSize: 13 },
  // AI Banner
  aiBanner: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
    paddingHorizontal: 16, paddingVertical: 10, gap: 8,
    borderBottomWidth: 1, borderBottomColor: '#e2e8f0',
  },
  aiBannerIcon: { fontSize: 18 },
  aiBannerText: { color: '#475569', fontSize: 13, fontWeight: '600', flex: 1, textTransform: 'capitalize' },
  aiConfBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  aiConfText: { fontSize: 11, fontWeight: '800' },
  // Sections
  section: { paddingHorizontal: 20, paddingTop: 16 },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start' },
  title: { fontSize: 22, fontWeight: '800', color: '#1e293b', lineHeight: 28 },
  voteButton: { alignItems: 'center', marginLeft: 12 },
  voteText: { color: '#94a3b8', fontSize: 13, fontWeight: '700', marginTop: 2 },
  metaRow: { flexDirection: 'row', gap: 8, marginTop: 10, flexWrap: 'wrap' },
  categoryTag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  categoryText: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
  severityTag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  karmaTag: { marginTop: 8 },
  karmaText: { color: '#f59e0b', fontSize: 13, fontWeight: '700' },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1e293b', marginBottom: 8 },
  description: { color: '#475569', fontSize: 15, lineHeight: 22 },
  // Before/After
  beforeAfterRow: { flexDirection: 'row', gap: 10 },
  beforeAfterItem: { flex: 1 },
  baLabel: { color: '#ef4444', fontSize: 11, fontWeight: '800', marginBottom: 6, textAlign: 'center' },
  baImage: { width: '100%', height: 130, borderRadius: 10 },
  baPlaceholder: { backgroundColor: '#e2e8f0', alignItems: 'center', justifyContent: 'center' },
  baPlaceholderText: { color: '#94a3b8', fontSize: 12 },
  // Location
  locationBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#fff', padding: 12, borderRadius: 12,
    borderWidth: 1, borderColor: '#e2e8f0',
  },
  locationText: { color: '#475569', fontSize: 14 },
  wardText: { color: '#4cae4f', fontSize: 12, marginTop: 6, fontWeight: '600' },
  timeText: { color: '#94a3b8', fontSize: 12 },
  // Comments
  commentItem: {
    backgroundColor: '#fff', borderRadius: 12, padding: 12, marginBottom: 8,
    borderWidth: 1, borderColor: '#e2e8f0',
  },
  commentHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  commentAuthor: { color: '#4cae4f', fontWeight: '700', fontSize: 13 },
  commentTime: { color: '#94a3b8', fontSize: 11 },
  commentText: { color: '#475569', fontSize: 14, lineHeight: 20 },
  commentInputRow: {
    flexDirection: 'row', alignItems: 'center', padding: 12, paddingBottom: 30,
    backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#e2e8f0', gap: 8,
  },
  commentInput: {
    flex: 1, backgroundColor: '#f6f7f6', borderRadius: 12, paddingHorizontal: 14,
    paddingVertical: 10, color: '#1e293b', fontSize: 14, maxHeight: 80,
    borderWidth: 1, borderColor: '#e2e8f0',
  },
  sendBtn: { backgroundColor: '#4cae4f', borderRadius: 12, padding: 10 },
});

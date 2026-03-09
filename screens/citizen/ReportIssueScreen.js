import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Alert, Image, ActivityIndicator, Modal, Animated, StatusBar,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import CategoryPicker from '../../components/CategoryPicker';
import { decode } from 'base64-arraybuffer';
import { analyzeIssueImage, getSeverityColor, getSeverityEmoji } from '../../lib/aiAnalyzer';

export default function ReportIssueScreen({ navigation }) {
  const { user, isGuest } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('pothole');
  const [severity, setSeverity] = useState('medium');
  const [image, setImage] = useState(null);
  const [location, setLocation] = useState(null);
  const [address, setAddress] = useState('');
  const [ward, setWard] = useState('');
  const [pincode, setPincode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loadingLocation, setLoadingLocation] = useState(true);

  // AI State
  const [analyzing, setAnalyzing] = useState(false);
  const [aiResult, setAiResult] = useState(null);
  const [aiApplied, setAiApplied] = useState(false);

  // Duplicate State
  const [duplicateModal, setDuplicateModal] = useState(false);
  const [duplicates, setDuplicates] = useState([]);

  // Animation
  const pulseAnim = useState(new Animated.Value(1))[0];

  useEffect(() => {
    getLocation();
  }, []);

  const getLocation = async () => {
    setLoadingLocation(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Location permission is required to report issues.');
        setLoadingLocation(false);
        return;
      }

      // Try high accuracy first with a 5-second timeout, then fall back to balanced
      let loc = null;
      try {
        loc = await Promise.race([
          Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High }),
          new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 5000)),
        ]);
      } catch (e) {
        console.log('High accuracy timed out, trying balanced...');
        try {
          loc = await Promise.race([
            Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
            new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 5000)),
          ]);
        } catch (e2) {
          console.log('Balanced accuracy timed out, trying last known...');
          loc = await Location.getLastKnownPositionAsync();
        }
      }

      if (loc) {
        setLocation({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });

        try {
          const [addr] = await Location.reverseGeocodeAsync({
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
          });
          if (addr) {
            const parts = [addr.street, addr.city, addr.region].filter(Boolean);
            setAddress(parts.join(', '));
            setWard(addr.district || addr.subregion || '');
            setPincode(addr.postalCode || '');
          }
        } catch (geocodeErr) {
          console.warn('Reverse geocode failed:', geocodeErr);
          setAddress(`${loc.coords.latitude.toFixed(4)}, ${loc.coords.longitude.toFixed(4)}`);
        }
      } else {
        Alert.alert('Location Error', 'Could not detect your location. Please make sure GPS is enabled.');
      }
    } catch (err) {
      console.error('Location error:', err);
      Alert.alert('Location Error', 'Failed to get location. Please enable GPS and try again.');
    } finally {
      setLoadingLocation(false);
    }
  };

  // Pulse animation for AI badge
  useEffect(() => {
    if (aiResult) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.08, duration: 800, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
        ])
      ).start();
    }
  }, [aiResult]);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Camera permission is required.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: 0.7,
      base64: true,
    });
    if (!result.canceled) {
      setImage(result.assets[0]);
      runAiAnalysis(result.assets[0].base64);
    }
  };

  const pickFromGallery = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Gallery permission is required.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.7,
      base64: true,
    });
    if (!result.canceled) {
      setImage(result.assets[0]);
      runAiAnalysis(result.assets[0].base64);
    }
  };

  const runAiAnalysis = async (base64) => {
    setAnalyzing(true);
    setAiResult(null);
    setAiApplied(false);
    try {
      const result = await analyzeIssueImage(base64);
      setAiResult(result);
      setCategory(result.category);
      setSeverity(result.severity);
      setTitle(result.title);
      setDescription(result.description);
      setAiApplied(true);
    } catch (err) {
      console.warn('AI analysis failed:', err);
    } finally {
      setAnalyzing(false);
    }
  };

  const checkDuplicates = async () => {
    // Skip duplicate check — RPC may not exist yet
    return false;
  };

  const upvoteDuplicate = async (issueId) => {
    if (!isGuest && user) {
      try {
        await supabase.from('votes').upsert({ issue_id: issueId, user_id: user.id });
      } catch (e) {
        console.warn('Upvote failed:', e);
      }
    }
    Alert.alert('Upvoted! 👍', 'You upvoted the existing report. This raises its priority!', [
      { text: 'OK', onPress: () => navigation.goBack() },
    ]);
    setDuplicateModal(false);
  };

  const submitReport = async () => {
    try {
      let imagePath = null;
      const reporterId = isGuest ? null : user?.id;

      // Upload image (skip gracefully if bucket doesn't exist)
      if (image?.base64) {
        try {
          const folder = isGuest ? 'anonymous' : (user?.id || 'anonymous');
          const fileName = `${folder}/${Date.now()}.jpg`;
          const { error: uploadError } = await supabase.storage
            .from('road-issue-images')
            .upload(fileName, decode(image.base64), { contentType: 'image/jpeg' });
          if (uploadError) {
            console.warn('Image upload failed (continuing without image):', uploadError.message);
          } else {
            imagePath = fileName;
          }
        } catch (uploadErr) {
          console.warn('Image upload exception (continuing):', uploadErr.message);
        }
      }

      // Build insert data — only include columns that exist in the DB
      const insertData = {
        title: title.trim(),
        description: description.trim(),
        category,
        severity,
        status: 'reported',
      };

      // Add optional fields
      if (reporterId) insertData.reporter_id = reporterId;
      if (location) {
        insertData.latitude = location.latitude;
        insertData.longitude = location.longitude;
      }
      if (address) insertData.address = address;
      if (ward) insertData.ward = ward;
      if (pincode) insertData.pincode = pincode;
      if (imagePath) insertData.image_path = imagePath;

      console.log('Submitting issue:', JSON.stringify(insertData));

      const { data, error } = await supabase.from('road_issues').insert(insertData).select();

      if (error) {
        console.error('DB insert error:', error.code, error.message, error.details, error.hint);
        throw error;
      }

      console.log('Issue submitted successfully:', data);

      const msg = isGuest
        ? 'Your anonymous report has been submitted!'
        : 'You earned karma points for this report!';
      Alert.alert('🎉 Report Submitted!', msg, [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err) {
      console.error('Submit error:', err);
      Alert.alert('Submission Error', `${err.message}\n\nPlease check your connection and try again.`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async () => {
    if (!title || title.length < 3) {
      Alert.alert('Error', 'Title must be at least 3 characters');
      return;
    }
    if (!location) {
      Alert.alert('Error', 'Location is required. Please wait for GPS.');
      return;
    }

    setSubmitting(true);
    await submitReport();
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <StatusBar barStyle="dark-content" backgroundColor="#f6f7f6" />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#1e293b" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Report Issue</Text>
        <View style={{ width: 40 }} />
      </View>

      {isGuest && (
        <View style={styles.guestBanner}>
          <Ionicons name="information-circle" size={18} color="#4cae4f" />
          <Text style={styles.guestBannerText}>Reporting as Guest • No account needed</Text>
        </View>
      )}

      {/* ===== PHOTO SECTION WITH AI ===== */}
      <Text style={styles.label}>📸 Capture the Issue</Text>
      <View style={styles.photoRow}>
        <TouchableOpacity style={styles.photoButton} onPress={pickImage}>
          <Ionicons name="camera" size={24} color="#4cae4f" />
          <Text style={styles.photoText}>Camera</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.photoButton} onPress={pickFromGallery}>
          <Ionicons name="images" size={24} color="#4cae4f" />
          <Text style={styles.photoText}>Gallery</Text>
        </TouchableOpacity>
      </View>

      {image && (
        <View style={styles.imageWrapper}>
          <Image source={{ uri: image.uri }} style={styles.preview} />
          {analyzing && (
            <View style={styles.aiOverlay}>
              <ActivityIndicator size="large" color="#4cae4f" />
              <Text style={styles.aiOverlayText}>🧠 AI Analyzing...</Text>
              <Text style={styles.aiOverlaySubtext}>YOLOv8 detecting issue type & severity</Text>
            </View>
          )}
          {aiResult && !analyzing && (
            <View style={[styles.boundingBox, {
              left: `${aiResult.bounding_box.x * 100}%`,
              top: `${aiResult.bounding_box.y * 100}%`,
              width: `${aiResult.bounding_box.width * 100}%`,
              height: `${aiResult.bounding_box.height * 100}%`,
              borderColor: getSeverityColor(aiResult.severity),
            }]}>
              <View style={[styles.bbLabel, { backgroundColor: getSeverityColor(aiResult.severity) }]}>
                <Text style={styles.bbLabelText}>
                  {aiResult.category.replace('_', ' ').toUpperCase()} {Math.round(aiResult.confidence * 100)}%
                </Text>
              </View>
            </View>
          )}
        </View>
      )}

      {/* ===== AI RESULT BADGE ===== */}
      {aiResult && !analyzing && (
        <Animated.View style={[styles.aiResultBadge, { transform: [{ scale: pulseAnim }] }]}>
          <View style={styles.aiResultHeader}>
            <Text style={styles.aiResultIcon}>🧠</Text>
            <Text style={styles.aiResultTitle}>
              {aiResult.model === 'YOLOv8' ? 'YOLOv8 Detection' : 'AI Detection'}
            </Text>
            <View style={[styles.confidenceBadge, { backgroundColor: getSeverityColor(aiResult.severity) + '20' }]}>
              <Text style={[styles.confidenceText, { color: getSeverityColor(aiResult.severity) }]}>
                {Math.round(aiResult.confidence * 100)}% confident
              </Text>
            </View>
          </View>

          {/* YOLO raw detections */}
          {aiResult.raw_detections && aiResult.raw_detections.length > 0 && (
            <View style={styles.rawDetections}>
              <Text style={styles.rawDetLabel}>Objects detected:</Text>
              <View style={styles.rawDetRow}>
                {aiResult.raw_detections.map((d, i) => (
                  <View key={i} style={styles.rawDetChip}>
                    <Text style={styles.rawDetText}>{d.label} ({d.score}%)</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          <View style={styles.aiResultRow}>
            <View style={styles.aiResultItem}>
              <Text style={styles.aiResultLabel}>Category</Text>
              <Text style={styles.aiResultValue}>{aiResult.category.replace('_', ' ')}</Text>
            </View>
            <View style={styles.aiResultItem}>
              <Text style={styles.aiResultLabel}>Severity</Text>
              <Text style={styles.aiResultValue}>{getSeverityEmoji(aiResult.severity)} {aiResult.severity}</Text>
            </View>
          </View>
          {aiApplied && (
            <Text style={styles.aiAppliedText}>✅ Auto-filled! You can edit any field below.</Text>
          )}
        </Animated.View>
      )}

      {/* ===== CATEGORY ===== */}
      <Text style={styles.label}>Category</Text>
      <CategoryPicker selected={category} onSelect={setCategory} />

      {/* ===== SEVERITY ===== */}
      <Text style={styles.label}>Severity</Text>
      <View style={styles.severityRow}>
        {['low', 'medium', 'high', 'critical'].map((s) => (
          <TouchableOpacity
            key={s}
            style={[
              styles.severityChip,
              severity === s && { backgroundColor: getSeverityColor(s) + '20', borderColor: getSeverityColor(s) },
            ]}
            onPress={() => setSeverity(s)}
          >
            <Text style={[
              styles.severityChipText,
              severity === s && { color: getSeverityColor(s) },
            ]}>
              {getSeverityEmoji(s)} {s.charAt(0).toUpperCase() + s.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ===== TITLE ===== */}
      <Text style={styles.label}>Title</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g. Large pothole on Main Street"
        placeholderTextColor="#94a3b8"
        value={title}
        onChangeText={setTitle}
        maxLength={140}
      />

      {/* ===== DESCRIPTION ===== */}
      <Text style={styles.label}>Description</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="Provide details about the issue..."
        placeholderTextColor="#94a3b8"
        value={description}
        onChangeText={setDescription}
        multiline
        numberOfLines={4}
        maxLength={2000}
      />

      {/* ===== LOCATION ===== */}
      <Text style={styles.label}>📍 Location</Text>
      <View style={styles.locationBox}>
        {loadingLocation ? (
          <View style={styles.locationLoading}>
            <ActivityIndicator color="#4cae4f" size="small" />
            <Text style={styles.locationLoadingText}>Detecting your location via GPS...</Text>
          </View>
        ) : location ? (
          <View>
            <View style={styles.locationDetected}>
              <Ionicons name="checkmark-circle" size={18} color="#4cae4f" />
              <Text style={styles.locationText}>📍 {address || 'Location detected'}</Text>
            </View>
            <Text style={styles.locationCoords}>
              {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
            </Text>
            {(ward || pincode) && (
              <Text style={styles.locationMeta}>
                {ward ? `Ward: ${ward}` : ''} {pincode ? `| PIN: ${pincode}` : ''}
              </Text>
            )}
          </View>
        ) : (
          <View>
            <Text style={styles.locationErrorText}>❌ Unable to get location</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={getLocation}>
              <Ionicons name="refresh" size={16} color="#4cae4f" />
              <Text style={styles.retryText}>Retry GPS</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* ===== SUBMIT ===== */}
      <TouchableOpacity
        style={[styles.submitButton, submitting && { opacity: 0.6 }]}
        onPress={handleSubmit}
        disabled={submitting}
      >
        {submitting ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <View style={styles.submitInner}>
            <Ionicons name="send" size={20} color="#fff" />
            <Text style={styles.submitText}>Submit Report</Text>
          </View>
        )}
      </TouchableOpacity>

      {/* ===== DUPLICATE MODAL ===== */}
      <Modal visible={duplicateModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>⚠️ Similar Issue Found Nearby!</Text>
            <Text style={styles.modalSubtitle}>
              Someone already reported a similar issue within 15 meters. Would you like to upvote it instead?
            </Text>
            {duplicates.map((dup) => (
              <View key={dup.id} style={styles.duplicateCard}>
                <Text style={styles.dupTitle}>{dup.title}</Text>
                <Text style={styles.dupMeta}>
                  {Math.round(dup.distance_meters)}m away • {dup.vote_count || 0} votes
                </Text>
                <TouchableOpacity
                  style={styles.upvoteBtn}
                  onPress={() => upvoteDuplicate(dup.id)}
                >
                  <Ionicons name="arrow-up-circle" size={18} color="#fff" />
                  <Text style={styles.upvoteBtnText}>Upvote This</Text>
                </TouchableOpacity>
              </View>
            ))}
            <TouchableOpacity
              style={styles.reportAnywayBtn}
              onPress={() => {
                setDuplicateModal(false);
                setSubmitting(true);
                submitReport();
              }}
            >
              <Text style={styles.reportAnywayText}>Report Anyway</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setDuplicateModal(false)}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f6f7f6', paddingHorizontal: 20 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: 52, paddingBottom: 12,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: '#fff',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#1e293b' },
  guestBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#4cae4f15', borderRadius: 12, padding: 12, marginBottom: 8,
    borderWidth: 1, borderColor: '#4cae4f30',
  },
  guestBannerText: { color: '#4cae4f', fontSize: 13, fontWeight: '600' },
  label: { color: '#475569', fontSize: 14, fontWeight: '700', marginTop: 16, marginBottom: 6 },
  input: {
    backgroundColor: '#fff', borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14,
    fontSize: 15, color: '#1e293b', borderWidth: 1, borderColor: '#e2e8f0',
  },
  textArea: { height: 100, textAlignVertical: 'top' },
  photoRow: { flexDirection: 'row', gap: 12 },
  photoButton: {
    flex: 1, backgroundColor: '#fff', borderRadius: 14, paddingVertical: 18,
    alignItems: 'center', borderWidth: 2, borderColor: '#e2e8f0', borderStyle: 'dashed',
  },
  photoText: { color: '#64748b', fontSize: 12, marginTop: 4 },
  imageWrapper: { position: 'relative', marginTop: 12 },
  preview: { width: '100%', height: 220, borderRadius: 14 },
  aiOverlay: {
    ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(246,247,246,0.9)',
    borderRadius: 14, alignItems: 'center', justifyContent: 'center',
  },
  aiOverlayText: { color: '#1e293b', fontSize: 18, fontWeight: '700', marginTop: 12 },
  aiOverlaySubtext: { color: '#64748b', fontSize: 13, marginTop: 4 },
  boundingBox: {
    position: 'absolute', borderWidth: 2.5, borderRadius: 4, borderStyle: 'solid',
  },
  bbLabel: {
    position: 'absolute', top: -20, left: 0, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4,
  },
  bbLabelText: { color: '#fff', fontSize: 9, fontWeight: '800' },
  aiResultBadge: {
    backgroundColor: '#fff', borderRadius: 16, padding: 16, marginTop: 12,
    borderWidth: 1, borderColor: '#4cae4f',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  aiResultHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  aiResultIcon: { fontSize: 22 },
  aiResultTitle: { color: '#1e293b', fontSize: 16, fontWeight: '700', flex: 1 },
  confidenceBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  confidenceText: { fontSize: 12, fontWeight: '700' },
  rawDetections: { marginBottom: 12 },
  rawDetLabel: { color: '#94a3b8', fontSize: 11, fontWeight: '600', marginBottom: 6 },
  rawDetRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  rawDetChip: {
    backgroundColor: '#f6f7f6', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4,
    borderWidth: 1, borderColor: '#e2e8f0',
  },
  rawDetText: { color: '#475569', fontSize: 11, fontWeight: '600' },
  aiResultRow: { flexDirection: 'row', gap: 12 },
  aiResultItem: { flex: 1, backgroundColor: '#f6f7f6', borderRadius: 10, padding: 12 },
  aiResultLabel: { color: '#94a3b8', fontSize: 11, fontWeight: '600', marginBottom: 4 },
  aiResultValue: { color: '#1e293b', fontSize: 15, fontWeight: '700', textTransform: 'capitalize' },
  aiAppliedText: { color: '#4cae4f', fontSize: 12, fontWeight: '600', marginTop: 10 },
  severityRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  severityChip: {
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10,
    backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0',
  },
  severityChipText: { color: '#64748b', fontSize: 12, fontWeight: '700' },
  locationBox: {
    backgroundColor: '#fff', borderRadius: 14, padding: 16,
    borderWidth: 1, borderColor: '#e2e8f0',
  },
  locationLoading: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  locationLoadingText: { color: '#94a3b8', fontSize: 13 },
  locationDetected: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  locationText: { color: '#1e293b', fontSize: 14, flex: 1 },
  locationCoords: { color: '#94a3b8', fontSize: 12, marginTop: 4 },
  locationMeta: { color: '#4cae4f', fontSize: 12, marginTop: 4, fontWeight: '600' },
  locationErrorText: { color: '#ef4444', fontSize: 14, fontWeight: '600' },
  retryBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10,
    backgroundColor: '#4cae4f15', paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 10, alignSelf: 'flex-start',
  },
  retryText: { color: '#4cae4f', fontSize: 13, fontWeight: '600' },
  submitButton: {
    backgroundColor: '#4cae4f', borderRadius: 14, paddingVertical: 18,
    alignItems: 'center', marginTop: 28,
    shadowColor: '#4cae4f', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25, shadowRadius: 8, elevation: 6,
  },
  submitInner: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  submitText: { color: '#fff', fontSize: 17, fontWeight: '700' },
  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, paddingBottom: 40,
  },
  modalTitle: { color: '#1e293b', fontSize: 20, fontWeight: '800', marginBottom: 8 },
  modalSubtitle: { color: '#64748b', fontSize: 14, marginBottom: 16, lineHeight: 20 },
  duplicateCard: { backgroundColor: '#f6f7f6', borderRadius: 12, padding: 16, marginBottom: 10 },
  dupTitle: { color: '#1e293b', fontSize: 15, fontWeight: '700' },
  dupMeta: { color: '#94a3b8', fontSize: 12, marginTop: 4 },
  upvoteBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#4cae4f',
    borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8, marginTop: 10, alignSelf: 'flex-start',
  },
  upvoteBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  reportAnywayBtn: {
    backgroundColor: '#e2e8f0', borderRadius: 12, paddingVertical: 14,
    alignItems: 'center', marginTop: 8,
  },
  reportAnywayText: { color: '#475569', fontWeight: '600', fontSize: 15 },
  cancelText: { color: '#94a3b8', textAlign: 'center', marginTop: 12, fontSize: 14 },
});

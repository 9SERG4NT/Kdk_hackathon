import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Alert, Image, ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import CategoryPicker from '../../components/CategoryPicker';
import { decode } from 'base64-arraybuffer';

export default function ReportIssueScreen({ navigation }) {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('pothole');
  const [image, setImage] = useState(null);
  const [location, setLocation] = useState(null);
  const [address, setAddress] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loadingLocation, setLoadingLocation] = useState(true);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Location permission is required to report issues.');
        setLoadingLocation(false);
        return;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      setLocation({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });

      // Reverse geocode
      const [addr] = await Location.reverseGeocodeAsync({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });
      if (addr) {
        setAddress(`${addr.street || ''}, ${addr.city || ''}, ${addr.region || ''}`);
      }
      setLoadingLocation(false);
    })();
  }, []);

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
    }
  };

  const handleSubmit = async () => {
    if (!title || title.length < 5) {
      Alert.alert('Error', 'Title must be at least 5 characters');
      return;
    }
    if (!description || description.length < 10) {
      Alert.alert('Error', 'Description must be at least 10 characters');
      return;
    }
    if (!location) {
      Alert.alert('Error', 'Location is required. Please wait for GPS.');
      return;
    }

    setSubmitting(true);

    try {
      let imagePath = null;

      if (image?.base64) {
        const fileName = `${user.id}/${Date.now()}.jpg`;
        const { error: uploadError } = await supabase.storage
          .from('road-issue-images')
          .upload(fileName, decode(image.base64), {
            contentType: 'image/jpeg',
          });
        if (uploadError) throw uploadError;
        imagePath = fileName;
      }

      const { error } = await supabase.from('road_issues').insert({
        reporter_id: user.id,
        title: title.trim(),
        description: description.trim(),
        category,
        latitude: location.latitude,
        longitude: location.longitude,
        address: address || null,
        image_path: imagePath,
      });

      if (error) throw error;

      Alert.alert('Success! ✅', 'Your issue has been reported.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#F8FAFC" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Report Issue</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Category */}
      <Text style={styles.label}>Category</Text>
      <CategoryPicker selected={category} onSelect={setCategory} />

      {/* Title */}
      <Text style={styles.label}>Title</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g. Large pothole on Main Street"
        placeholderTextColor="#64748B"
        value={title}
        onChangeText={setTitle}
        maxLength={140}
      />

      {/* Description */}
      <Text style={styles.label}>Description</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="Provide details about the issue..."
        placeholderTextColor="#64748B"
        value={description}
        onChangeText={setDescription}
        multiline
        numberOfLines={4}
        maxLength={2000}
      />

      {/* Photo */}
      <Text style={styles.label}>Photo</Text>
      <View style={styles.photoRow}>
        <TouchableOpacity style={styles.photoButton} onPress={pickImage}>
          <Ionicons name="camera" size={24} color="#6366F1" />
          <Text style={styles.photoText}>Camera</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.photoButton} onPress={pickFromGallery}>
          <Ionicons name="images" size={24} color="#6366F1" />
          <Text style={styles.photoText}>Gallery</Text>
        </TouchableOpacity>
      </View>
      {image && (
        <Image source={{ uri: image.uri }} style={styles.preview} />
      )}

      {/* Location */}
      <Text style={styles.label}>Location</Text>
      <View style={styles.locationBox}>
        {loadingLocation ? (
          <ActivityIndicator color="#6366F1" />
        ) : location ? (
          <View>
            <Text style={styles.locationText}>📍 {address || 'Location detected'}</Text>
            <Text style={styles.locationCoords}>
              {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
            </Text>
          </View>
        ) : (
          <Text style={styles.locationText}>❌ Unable to get location</Text>
        )}
      </View>

      {/* Submit */}
      <TouchableOpacity
        style={[styles.submitButton, submitting && { opacity: 0.6 }]}
        onPress={handleSubmit}
        disabled={submitting}
      >
        {submitting ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.submitText}>Submit Report</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 56,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  label: {
    color: '#CBD5E1',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#334155',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  photoRow: {
    flexDirection: 'row',
    gap: 12,
  },
  photoButton: {
    flex: 1,
    backgroundColor: '#1E293B',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
    borderStyle: 'dashed',
  },
  photoText: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 4,
  },
  preview: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginTop: 12,
  },
  locationBox: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  locationText: {
    color: '#F8FAFC',
    fontSize: 14,
  },
  locationCoords: {
    color: '#64748B',
    fontSize: 12,
    marginTop: 4,
  },
  submitButton: {
    backgroundColor: '#6366F1',
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: 'center',
    marginTop: 28,
  },
  submitText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
  },
});

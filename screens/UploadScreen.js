import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, Image, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { getFirestore, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useNavigation } from '@react-navigation/native';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Video, ResizeMode } from 'expo-av';
import app from '../components/firebase';
import { useUser } from '../UserContext';

const UploadScreen = () => {
  const [postText, setPostText] = useState('');
  const [media, setMedia] = useState(null); // Lokale URI des ausgewählten Mediums
  const [mediaType, setMediaType] = useState(null); // 'image' oder 'video' (von ImagePicker) ODER abgeleitet
  const [originalFileName, setOriginalFileName] = useState(null); // Originaler Dateiname vom Picker
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [uploading, setUploading] = useState(false);

  const { user } = useUser();
  const navigation = useNavigation();

  useEffect(() => {
    navigation.setOptions({
      title: 'Upload',
      headerStyle: {
        backgroundColor: '#1c1c1c',
      },
      headerTintColor: '#FF1493',
      headerTitleStyle: {
        fontWeight: 'bold',
      },
    });
  }, [navigation]);

  const handlePost = async () => {
    if (!postText && !media) {
      Alert.alert('Fehler', 'Bitte fügen Sie Text oder ein Bild/Video hinzu.');
      return;
    }
    if (!user?.uid || !user?.email || !user?.username) {
      Alert.alert('Fehler', 'Benutzerinformationen sind nicht verfügbar. Bitte melden Sie sich erneut an.');
      return;
    }
    if (uploading) {
      return;
    }

    setUploading(true);

    const db = getFirestore(app);
    const storage = getStorage(app);

    let mediaUrl = null;
    if (media) {
      try {
        const response = await fetch(media);
        const blob = await response.blob();

        let safeExtension = '';
        let inferredExtension = '';

        // Priorisiere fileName für die Erweiterung, da URI manchmal keine hat
        if (originalFileName) {
            const dotIndex = originalFileName.lastIndexOf('.');
            if (dotIndex > -1) {
                inferredExtension = originalFileName.substring(dotIndex).toLowerCase();
            }
        } else { // Fallback auf URI, falls fileName nicht verfügbar
            const uriParts = media.split('.');
            if (uriParts.length > 1) {
                inferredExtension = `.${uriParts.pop().toLowerCase()}`;
            }
        }
        
        const actualMediaType = mediaType === ImagePicker.MediaTypeOptions.Video || 
                                inferredExtension.match(/\.(mp4|mov|webm|avi|mkv)$/i) ? 
                                ImagePicker.MediaTypeOptions.Video : 
                                ImagePicker.MediaTypeOptions.Image;

        if (actualMediaType === ImagePicker.MediaTypeOptions.Video) {
            if (['.mp4', '.mov', '.webm', '.avi', '.mkv'].includes(inferredExtension)) {
                safeExtension = inferredExtension;
            } else {
                safeExtension = '.mp4';
            }
        } else if (actualMediaType === ImagePicker.MediaTypeOptions.Image) {
            if (['.jpeg', '.jpg', '.png', '.gif', '.bmp', '.webp', '.heic'].includes(inferredExtension)) {
                safeExtension = inferredExtension;
            } else {
                safeExtension = '.jpeg';
            }
        } else {
            safeExtension = '.bin';
        }

        console.log("DEBUG: Final safeExtension used for upload:", safeExtension);
        
        // --- KRITISCHSTE KORREKTUR HIER: Sicherstellen, dass der Dateiname keine Pfade enthält ---
        // Generiere einen eindeutigen Dateinamen OHNE irgendwelche Pfadteile aus der Original-URI/Dateinamen
        const baseFileName = `${Date.now()}_${user.uid}`; // Nur Basisname
        const finalFileName = `${baseFileName}${safeExtension}`; // Basisname + bereinigte Erweiterung
        
        const uploadPath = `media/${finalFileName}`; // Endgültiger Pfad im Storage
        const mediaRef = ref(storage, uploadPath);

        const snapshot = await uploadBytes(mediaRef, blob);
        mediaUrl = await getDownloadURL(snapshot.ref);
        
      } catch (error) {
        console.error('Fehler beim Hochladen der Medien:', error);
        Alert.alert('Fehler', 'Medien-Upload fehlgeschlagen. Bitte versuchen Sie es erneut.');
        setUploading(false);
        return;
      }
    }

    const newPost = {
      text: postText,
      media: mediaUrl,
      createdAt: serverTimestamp(),
      user: {
        id: user.uid,
        email: user.email,
        username: user.username,
      },
      title,
      description,
      tags,
      likes: 0,
    };

    try {
      await addDoc(collection(db, 'posts'), newPost);
      setPostText('');
      setMedia(null);
      setMediaType(null);
      setOriginalFileName(null);
      setTitle('');
      setDescription('');
      setTags('');
      Alert.alert('Erfolg', 'Beitrag erfolgreich erstellt.');
      navigation.goBack();
    } catch (error) {
      Alert.alert('Fehler', 'Beitrag konnte nicht erstellt werden.');
      console.error('Fehler beim Hinzufügen des Dokuments: ', error);
    } finally {
      setUploading(false);
    }
  };

  const pickMedia = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: false,
      quality: 1,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const selectedAsset = result.assets[0];
      setMedia(selectedAsset.uri);
      setMediaType(selectedAsset.mediaType);
      setOriginalFileName(selectedAsset.fileName || null); 
      
      console.log("--- ImagePicker Result ---");
      console.log("selectedAsset.uri:", selectedAsset.uri);
      console.log("selectedAsset.mediaType (ImagePicker constant):", selectedAsset.mediaType);
      console.log("selectedAsset.fileName (if available):", selectedAsset.fileName);
      console.log("--------------------------");
    }
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="Titel"
        placeholderTextColor="#aaa"
        value={title}
        onChangeText={setTitle}
      />
      <TextInput
        style={styles.input}
        placeholder="Beschreibung"
        placeholderTextColor="#aaa"
        value={description}
        onChangeText={setDescription}
      />
      <TextInput
        style={styles.input}
        placeholder="Tags (z.B. #urlaub #sommer)"
        placeholderTextColor="#aaa"
        value={tags}
        onChangeText={setTags}
      />
      <TextInput
        style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
        placeholder="Was möchtest du posten?"
        placeholderTextColor="#aaa"
        value={postText}
        onChangeText={setPostText}
        multiline
      />
      <TouchableOpacity style={styles.mediaButton} onPress={pickMedia}>
        <Text style={styles.mediaButtonText}>Bild/Video auswählen</Text>
      </TouchableOpacity>
      {media && (
        mediaType === ImagePicker.MediaTypeOptions.Video || 
        (originalFileName && originalFileName.toLowerCase().endsWith('.mp4')) || 
        (media && media.toLowerCase().endsWith('.mp4')) ? (
          <Video
            source={{ uri: media }}
            style={styles.mediaPreview}
            useNativeControls
            resizeMode={ResizeMode.CONTAIN}
            isLooping={false}
            shouldPlay={false}
          />
        ) : (
          <Image source={{ uri: media }} style={styles.mediaPreview} />
        )
      )}
      <TouchableOpacity style={styles.postButton} onPress={handlePost} disabled={uploading}>
        {uploading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.postButtonText}>Posten</Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1c1c1c',
    padding: 16,
  },
  input: {
    height: 40,
    borderColor: '#444',
    borderWidth: 1,
    borderRadius: 10,
    marginBottom: 8,
    paddingHorizontal: 8,
    color: '#fff',
  },
  mediaButton: {
    backgroundColor: '#FF1493',
    padding: 10,
    borderRadius: 10,
    marginBottom: 8,
    alignItems: 'center',
  },
  mediaButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  mediaPreview: {
    width: '100%',
    height: 200,
    marginBottom: 8,
    borderRadius: 10,
  },
  postButton: {
    backgroundColor: '#FF1493',
    padding: 10,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  postButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default UploadScreen;

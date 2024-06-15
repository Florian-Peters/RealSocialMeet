import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, Image, TouchableOpacity, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { getFirestore, collection, addDoc } from 'firebase/firestore';
import { useNavigation } from '@react-navigation/native';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Video } from 'expo-av';
import app from '../components/firebase';
import { useUser } from '../UserContext';

const UploadScreen = () => {
  const [postText, setPostText] = useState('');
  const [media, setMedia] = useState(null);
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
      Alert.alert('Error', 'Please add some text or an image/video.');
      return;
    }

    const db = getFirestore(app);
    const storage = getStorage(app);

    let mediaUrl = null;
    if (media) {
      try {
        setUploading(true);
        const response = await fetch(media);
        const blob = await response.blob();
        const mediaRef = ref(storage, `media/${Date.now()}_${user.uid}`);
        const snapshot = await uploadBytes(mediaRef, blob);
        mediaUrl = await getDownloadURL(snapshot.ref);
        setUploading(false);
      } catch (error) {
        console.error('Error uploading media:', error);
        Alert.alert('Error', 'Failed to upload image/video.');
        setUploading(false);
        return;
      }
    }

    if (!user) {
      Alert.alert('Error', 'User information not available.');
      return;
    }

    const newPost = {
      text: postText,
      media: mediaUrl,
      createdAt: new Date(),
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
      setTitle('');
      setDescription('');
      setTags('');
      Alert.alert('Success', 'Post created successfully.');
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', 'Failed to create post.');
      console.error('Error adding document: ', error);
    }
  };

  const pickMedia = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setMedia(result.assets[0].uri);
    }
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="Title"
        placeholderTextColor="#aaa"
        value={title}
        onChangeText={setTitle}
      />
      <TextInput
        style={styles.input}
        placeholder="Description"
        placeholderTextColor="#aaa"
        value={description}
        onChangeText={setDescription}
      />
      <TextInput
        style={styles.input}
        placeholder="Tags (e.g. #vacation #summer)"
        placeholderTextColor="#aaa"
        value={tags}
        onChangeText={setTags}
      />
      <TextInput
        style={styles.input}
        placeholder="What would you like to post?"
        placeholderTextColor="#aaa"
        value={postText}
        onChangeText={setPostText}
      />
      <TouchableOpacity style={styles.mediaButton} onPress={pickMedia}>
        <Text style={styles.mediaButtonText}>Select Image/Video</Text>
      </TouchableOpacity>
      {media && (
        media.includes('video') ? (
          <Video source={{ uri: media }} style={styles.mediaPreview} useNativeControls />
        ) : (
          <Image source={{ uri: media }} style={styles.mediaPreview} />
        )
      )}
      <TouchableOpacity style={styles.postButton} onPress={handlePost} disabled={uploading}>
        <Text style={styles.postButtonText}>{uploading ? 'Uploading...' : 'Post'}</Text>
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
  },
  postButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default UploadScreen;

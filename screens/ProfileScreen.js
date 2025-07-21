import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, Button, TextInput } from 'react-native';
import { getFirestore, collection, query, where, onSnapshot, doc, getDoc, updateDoc } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import * as ImagePicker from 'expo-image-picker';
import app from '../components/firebase';
import { Video } from 'expo-av';

const ProfileScreen = ({ route }) => {
  const { userId } = route.params;
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [isEditMode, setIsEditMode] = useState(false);
  const db = getFirestore(app);

  useEffect(() => {
    const userRef = doc(db, 'users', userId);
    const unsubscribeUser = onSnapshot(userRef, (doc) => {
      setUser({ id: doc.id, ...doc.data() });
    });

    const postsQuery = query(collection(db, 'posts'), where('user.uid', '==', userId));
    const unsubscribePosts = onSnapshot(postsQuery, (querySnapshot) => {
      const userPosts = [];
      querySnapshot.forEach((doc) => {
        userPosts.push({ id: doc.id, ...doc.data() });
      });
      setPosts(userPosts);
    });

    return () => {
      unsubscribeUser();
      unsubscribePosts();
    };
  }, [userId]);

  const handleUpdate = async () => {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      username: user.username,
      bio: user.bio,
    });
    setIsEditMode(false);
  };

  const handleImagePick = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.cancelled) {
      const storage = getStorage(app);
      const response = await fetch(result.uri);
      const blob = await response.blob();
      const storageRef = ref(storage, `profile-pictures/${userId}`);
      await uploadBytes(storageRef, blob);
      const downloadURL = await getDownloadURL(storageRef);
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, { profilePicture: downloadURL });
    }
  };

  if (!user) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Image source={{ uri: user.profilePicture }} style={styles.profilePicture} />
      <Button title={isEditMode ? "Cancel" : "Edit"} onPress={() => setIsEditMode(!isEditMode)} />
      {isEditMode ? (
        <>
          <Button title="Change Profile Picture" onPress={handleImagePick} />
          <TextInput
            style={styles.input}
            value={user.username}
            onChangeText={(text) => setUser({ ...user, username: text })}
          />
          <TextInput
            style={styles.input}
            value={user.bio}
            onChangeText={(text) => setUser({ ...user, bio: text })}
          />
          <Button title="Save" onPress={handleUpdate} />
        </>
      ) : (
        <>
          <Text style={styles.username}>{user.username}</Text>
          <Text style={styles.bio}>{user.bio}</Text>
        </>
      )}
      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.post}>
            <Text style={styles.postTitle}>{item.title}</Text>
            <Text style={styles.postDescription}>{item.description}</Text>
            {item.media && (
              item.media.includes('video') ? (
                <Video source={{ uri: item.media }} style={styles.postMedia} useNativeControls />
              ) : (
                <Image source={{ uri: item.media }} style={styles.postMedia} />
              )
            )}
            <Text style={styles.postTags}>{item.tags}</Text>
            <Text style={styles.postText}>{item.text}</Text>
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1c1c1c',
    padding: 16,
  },
  loadingText: {
    color: '#fff',
    textAlign: 'center',
  },
  username: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FF1493',
  },
  bio: {
    fontSize: 16,
    color: '#fff',
    marginBottom: 20,
  },
  post: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#444',
    backgroundColor: '#1c1c1c',
  },
  postTitle: {
    color: '#FF1493',
    fontWeight: 'bold',
    fontSize: 18,
    marginTop: 8,
  },
  postDescription: {
    color: '#fff',
    fontSize: 14,
    marginTop: 8,
  },
  postTags: {
    color: '#FF1493',
    marginTop: 8,
  },
  postText: {
    color: '#fff',
    marginTop: 8,
  },
  postMedia: {
    width: '100%',
    height: 300,
    marginTop: 8,
    borderRadius: 10,
  },
  input: {
    backgroundColor: '#fff',
    padding: 10,
    marginVertical: 10,
    borderRadius: 5,
  },
  profilePicture: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignSelf: 'center',
    marginBottom: 20,
  },
});

export default ProfileScreen;

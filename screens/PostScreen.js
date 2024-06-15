import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, FlatList, TouchableOpacity, Alert } from 'react-native';
import { getAuth } from 'firebase/auth';
import { getFirestore, collection, query, orderBy, onSnapshot, doc, updateDoc, getDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { AntDesign, FontAwesome } from '@expo/vector-icons';
import app from '../components/firebase';
import { useNavigation } from '@react-navigation/native';
import { Video } from 'expo-av';
import { useUser } from '../UserContext';

const PostScreen = () => {
  const [posts, setPosts] = useState([]);
  const auth = getAuth(app);
  const user = auth.currentUser;
  const navigation = useNavigation();
  const { user: contextUser } = useUser();

  useEffect(() => {
    navigation.setOptions({
      title: 'Posts',
      headerStyle: {
        backgroundColor: '#1c1c1c',
      },
      headerTintColor: '#FF1493',
      headerTitleStyle: {
        fontWeight: 'bold',
      },
    });

    const db = getFirestore(app);
    const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const newPosts = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        newPosts.push({ id: doc.id, ...data });
      });
      setPosts(newPosts);
    });

    return () => unsubscribe();
  }, [navigation]);

  const handleLike = async (postId) => {
    const db = getFirestore(app);
    const postRef = doc(db, 'posts', postId);

    const postDoc = await getDoc(postRef);
    if (postDoc.exists()) {
      const postData = postDoc.data();
      const alreadyLiked = postData.likedBy?.includes(user.uid);

      if (alreadyLiked) {
        await updateDoc(postRef, {
          likedBy: arrayRemove(user.uid),
          likes: postData.likes - 1,
        });
      } else {
        await updateDoc(postRef, {
          likedBy: arrayUnion(user.uid),
          likes: postData.likes + 1,
        });
      }
    }
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.post}>
            <View style={styles.postHeader}>
              <Text style={styles.postUser}>{item.user.username}</Text>
            </View>
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
            <View style={styles.postActions}>
              <TouchableOpacity onPress={() => handleLike(item.id)}>
                <AntDesign name="like2" size={24} color={item.likedBy?.includes(user.uid) ? '#FF1493' : '#ccc'} />
              </TouchableOpacity>
              <Text style={styles.likeCount}>{item.likes}</Text>
              <TouchableOpacity onPress={() => Alert.alert('Comments', 'Comments will be displayed here.')}>
                <FontAwesome name="comment-o" size={24} color="#ccc" />
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
      <TouchableOpacity style={styles.floatingButton} onPress={() => navigation.navigate('Upload')}>
        <AntDesign name="pluscircle" size={60} color="#FF1493" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1c1c1c',
  },
  post: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#444',
    backgroundColor: '#1c1c1c',
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  postUser: {
    color: '#FF1493',
    fontWeight: 'bold',
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
  postActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  likeCount: {
    color: '#FF1493',
    marginLeft: 8,
    marginRight: 16,
  },
  floatingButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    zIndex: 1000,
  },
});

export default PostScreen;

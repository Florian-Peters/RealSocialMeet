import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Image, FlatList, TouchableOpacity, TextInput } from 'react-native';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, getDoc, arrayUnion, arrayRemove, addDoc, serverTimestamp } from 'firebase/firestore';
import { AntDesign, FontAwesome } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Video } from 'expo-av';
import { useUser } from '../UserContext';
import { auth, db } from '../components/firebase';
import Comment from '../components/Comment';

const PostScreen = () => {
  const [posts, setPosts] = useState([]);
  const [comments, setComments] = useState({});
  const [commentText, setCommentText] = useState('');
  const user = auth.currentUser;
  const navigation = useNavigation();
  const { user: contextUser } = useUser();
  const commentUnsubscribersRef = useRef({});

  useEffect(() => {
    navigation.setOptions({
      title: 'Posts',
      headerStyle: {
        backgroundColor: '#1c1c1c',
      },
      headerTintColor: '#FF5C93',
      headerTitleStyle: {
        fontWeight: 'bold',
      },
    });

    const postsQuery = query(collection(db, 'posts'), orderBy('createdAt', 'desc'));
    const unsubscribePosts = onSnapshot(postsQuery, (querySnapshot) => {
      const nextPosts = querySnapshot.docs.map((postDoc) => ({ id: postDoc.id, ...postDoc.data() }));
      setPosts(nextPosts);

      const activePostIds = new Set(querySnapshot.docs.map((docSnapshot) => docSnapshot.id));

      querySnapshot.docs.forEach((postDoc) => {
        if (!commentUnsubscribersRef.current[postDoc.id]) {
          const commentsQuery = query(
            collection(db, 'posts', postDoc.id, 'comments'),
            orderBy('createdAt', 'desc')
          );
          commentUnsubscribersRef.current[postDoc.id] = onSnapshot(commentsQuery, (commentsSnapshot) => {
            const postComments = commentsSnapshot.docs.map((commentDoc) => ({
              id: commentDoc.id,
              ...commentDoc.data(),
            }));
            setComments((prevComments) => ({ ...prevComments, [postDoc.id]: postComments }));
          });
        }
      });

      Object.keys(commentUnsubscribersRef.current).forEach((postId) => {
        if (!activePostIds.has(postId)) {
          commentUnsubscribersRef.current[postId]?.();
          delete commentUnsubscribersRef.current[postId];
          setComments((prevComments) => {
            const next = { ...prevComments };
            delete next[postId];
            return next;
          });
        }
      });
    });

    return () => {
      unsubscribePosts();
      Object.values(commentUnsubscribersRef.current).forEach((unsubscribe) => unsubscribe?.());
      commentUnsubscribersRef.current = {};
    };
  }, [navigation]);

  const handleLike = async (postId) => {
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

  const handleAddComment = async (postId) => {
    if (commentText.trim() === '') return;

    const commentData = {
      text: commentText,
      username: contextUser.username,
      createdAt: serverTimestamp(),
      userId: user.uid,
    };

    await addDoc(collection(db, 'posts', postId, 'comments'), commentData);
    setCommentText('');
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.post}>
            <View style={styles.postHeader}>
              <TouchableOpacity onPress={() => navigation.navigate('Profile', { userId: item.user.uid })}>
                <Text style={styles.postUser}>{item.user.username}</Text>
              </TouchableOpacity>
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
              <TouchableOpacity onPress={() => {}}>
                <FontAwesome name="comment-o" size={24} color="#ccc" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={comments[item.id] || []}
              keyExtractor={(comment) => comment.id}
              renderItem={({ item: comment }) => <Comment comment={comment} />}
            />
            <View style={styles.commentInputContainer}>
              <TextInput
                style={styles.commentInput}
                placeholder="Add a comment..."
                placeholderTextColor="#ccc"
                value={commentText}
                onChangeText={setCommentText}
              />
              <TouchableOpacity onPress={() => handleAddComment(item.id)}>
                <Text style={styles.postButton}>Post</Text>
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
  commentInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  commentInput: {
    flex: 1,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 5,
    padding: 8,
    color: '#fff',
  },
  postButton: {
    color: '#FF1493',
    marginLeft: 8,
  },
});

export default PostScreen;

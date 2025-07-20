import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Image, FlatList, TouchableOpacity, Alert, TextInput, ActivityIndicator } from 'react-native';
import { getAuth } from 'firebase/auth';
import { getFirestore, collection, query, orderBy, onSnapshot, doc, updateDoc, getDoc, arrayUnion, arrayRemove, addDoc, serverTimestamp, getDocs } from 'firebase/firestore';
import { AntDesign, FontAwesome } from '@expo/vector-icons';
import app from '../components/firebase';
import { useNavigation } from '@react-navigation/native';
import { Video, ResizeMode } from 'expo-av';
import { useUser } from '../UserContext';
import Comment from '../components/Comment';

const PostScreen = () => {
  const [posts, setPosts] = useState([]);
  const [comments, setComments] = useState({});
  const [commentText, setCommentText] = useState('');
  const [loadingComments, setLoadingComments] = useState({});
  const videoRefs = useRef({});

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
    const postsQuery = query(collection(db, 'posts'), orderBy('createdAt', 'desc'));

    const unsubscribePosts = onSnapshot(postsQuery, (querySnapshot) => {
      const newPosts = [];
      const newLoadingCommentsState = {};
      querySnapshot.forEach((postDoc) => {
        const data = postDoc.data();
        newPosts.push({ id: postDoc.id, ...data });

        newLoadingCommentsState[postDoc.id] = true;
        const commentsQuery = query(collection(db, 'posts', postDoc.id, 'comments'), orderBy('createdAt', 'desc'));
        getDocs(commentsQuery)
          .then(commentsSnapshot => {
            const postComments = [];
            commentsSnapshot.forEach((commentDoc) => {
              postComments.push({ id: commentDoc.id, ...commentDoc.data() });
            });
            setComments(prevComments => ({ ...prevComments, [postDoc.id]: postComments }));
            setLoadingComments(prev => ({ ...prev, [postDoc.id]: false }));
          })
          .catch(error => {
            console.error(`Fehler beim Laden der Kommentare für Post ${postDoc.id}:`, error);
            setLoadingComments(prev => ({ ...prev, [postDoc.id]: false }));
          });
      });
      setPosts(newPosts);
      setLoadingComments(newLoadingCommentsState);
    }, (error) => {
      console.error("Fehler beim Laden der Posts:", error);
      Alert.alert("Fehler", "Posts konnten nicht geladen werden.");
    });

    return () => {
      unsubscribePosts();
    };
  }, [navigation]);

  const handleLike = async (postId) => {
    if (!user?.uid) {
      Alert.alert("Anmeldung erforderlich", "Sie müssen angemeldet sein, um Beiträge zu liken.");
      return;
    }

    const db = getFirestore(app);
    const postRef = doc(db, 'posts', postId);

    try {
      const postDoc = await getDoc(postRef);
      if (postDoc.exists()) {
        const postData = postDoc.data();
        const alreadyLiked = postData.likedBy?.includes(user.uid);

        if (alreadyLiked) {
          await updateDoc(postRef, {
            likedBy: arrayRemove(user.uid),
            likes: (postData.likes || 0) - 1,
          });
        } else {
          await updateDoc(postRef, {
            likedBy: arrayUnion(user.uid),
            likes: (postData.likes || 0) + 1,
          });
        }
      }
    } catch (error) {
      console.error("Fehler beim Liken des Posts:", error);
      Alert.alert("Fehler", "Konnte den Beitrag nicht liken.");
    }
  };

  const handleAddComment = async (postId) => {
    if (!user?.uid || !contextUser?.username) {
      Alert.alert("Anmeldung erforderlich", "Sie müssen angemeldet sein, um Kommentare zu hinterlassen.");
      return;
    }
    if (commentText.trim() === '') {
      Alert.alert("Kommentar leer", "Bitte geben Sie einen Kommentar ein.");
      return;
    }

    const db = getFirestore(app);
    const commentData = {
      text: commentText,
      username: contextUser.username,
      createdAt: serverTimestamp(),
      userId: user.uid,
    };

    try {
      await addDoc(collection(db, 'posts', postId, 'comments'), commentData);
      setCommentText('');
    } catch (error) {
      console.error("Fehler beim Hinzufügen des Kommentars:", error);
      Alert.alert("Fehler", "Konnte Kommentar nicht hinzufügen.");
    }
  };

  const onVideoPlaybackStatusUpdate = (postId) => (status) => {
    console.log(`[Video Status Update] Post ${postId}:`, status);

    if (status.error) {
      console.error(`Video Playback ERROR for Post ${postId}:`, status.error);
      Alert.alert("Video Fehler", `Problem beim Abspielen des Videos für Post ${postId}: ${status.error}`);
    } else if (!status.isLoaded && !status.didJustFinish && !status.isBuffering && !status.isPlaying) {
        console.warn(`Video ${postId} konnte nicht geladen werden oder hat keinen spezifischen Status (noch kein Error gemeldet):`, status);
    }
  };

  const isVideoUrl = (url) => {
    if (!url || typeof url !== 'string') return false;
    const videoRegex = /\.(mp4|mov|webm|avi|mkv)(\?.*)?$/i;
    const isVideo = videoRegex.test(url);
    return isVideo;
  };

  return (
    <View style={styles.container}>
      {posts.length === 0 ? (
        <View style={styles.noPostsContainer}>
          <Text style={styles.noPostsText}>Noch keine Posts vorhanden. Sei der Erste!</Text>
        </View>
      ) : (
        <FlatList
          data={posts}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => {
            const isItemVideo = isVideoUrl(item.media);

            return (
              <View style={styles.post}>
                <View style={styles.postHeader}>
                  <TouchableOpacity onPress={() => navigation.navigate('Profile', { userId: item.user?.uid })}>
                    <Text style={styles.postUser}>{item.user?.username || 'Unbekannter Nutzer'}</Text>
                  </TouchableOpacity>
                </View>
                <Text style={styles.postTitle}>{item.title}</Text>
                <Text style={styles.postDescription}>{item.description}</Text>

                {item.media ? (
                  isItemVideo ? (
                    <Video
                      ref={el => videoRefs.current[item.id] = el}
                      source={{ uri: item.media }}
                      style={styles.postMedia}
                      useNativeControls
                      resizeMode={ResizeMode.CONTAIN}
                      isLooping={false}
                      shouldPlay={false}
                      onPlaybackStatusUpdate={onVideoPlaybackStatusUpdate(item.id)}
                    />
                  ) : (
                    <Image source={{ uri: item.media }} style={styles.postMedia} />
                  )
                ) : null}

                <Text style={styles.postTags}>{item.tags}</Text>
                <Text style={styles.postText}>{item.text}</Text>

                <View style={styles.postActions}>
                  <TouchableOpacity onPress={() => handleLike(item.id)}>
                    <AntDesign name="like2" size={24} color={item.likedBy?.includes(user?.uid) ? '#FF1493' : '#ccc'} />
                  </TouchableOpacity>
                  <Text style={styles.likeCount}>{item.likes || 0}</Text>
                  <TouchableOpacity onPress={() => { /* Hier könnte Logik für Kommentare-Modal etc. sein */ }}>
                    <FontAwesome name="comment-o" size={24} color="#ccc" />
                  </TouchableOpacity>
                </View>

                {/* Kommentare anzeigen */}
                {loadingComments[item.id] ? (
                  <ActivityIndicator size="small" color="#FF1493" style={{ marginTop: 10 }} />
                ) : (
                  <FlatList
                    data={comments[item.id] || []}
                    keyExtractor={(comment) => comment.id}
                    renderItem={({ item: comment }) => <Comment comment={comment} />}
                  />
                )}

                {/* Kommentareingabe */}
                <View style={styles.commentInputContainer}>
                  <TextInput
                    style={styles.commentInput}
                    placeholder="Kommentar hinzufügen..."
                    placeholderTextColor="#aaa"
                    value={commentText}
                    onChangeText={setCommentText}
                  />
                  <TouchableOpacity onPress={() => handleAddComment(item.id)}>
                    <Text style={styles.postButton}>Posten</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          }}
        />
      )}
      {/* Floating Button zum Posten HIER WIEDER HINZUGEFÜGT */}
      <TouchableOpacity style={styles.floatingButton} onPress={() => navigation.navigate('Upload')}>
        <AntDesign name="pluscircle" size={60} color="#FF1493" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1c1c1c', // Dunkler Hintergrund
  },
  noPostsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noPostsText: {
    color: '#fff', // Weißer Text
    fontSize: 18,
  },
  post: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#444', // Dunklere Trennlinie
    backgroundColor: '#1c1c1c',
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center', // Vertikal zentriert
    marginBottom: 8,
  },
  postUser: {
    color: '#FF1493', // Pink
    fontWeight: 'bold',
    fontSize: 16,
  },
  postTitle: {
    color: '#FF1493', // Pink
    fontWeight: 'bold',
    fontSize: 20, // Etwas größer
    marginBottom: 4,
  },
  postDescription: {
    color: '#fff', // Weiß
    fontSize: 15,
    marginBottom: 8,
  },
  postMedia: {
    width: '100%',
    height: 300,
    marginTop: 8,
    borderRadius: 10,
    backgroundColor: '#000', // Schwarzer Hintergrund für Medienbereich
  },
  postTags: {
    color: '#FF1493', // Pink
    fontSize: 13,
    marginTop: 8,
    fontStyle: 'italic',
  },
  postText: {
    color: '#fff', // Weiß
    fontSize: 15,
    marginTop: 8,
    lineHeight: 22, // Bessere Lesbarkeit
  },
  postActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12, // Mehr Abstand
    paddingBottom: 8, // Polsterung unten
    borderBottomWidth: 1,
    borderBottomColor: '#333', // Leichtere Trennlinie
  },
  likeCount: {
    color: '#FF1493', // Pink
    marginLeft: 8,
    marginRight: 20, // Mehr Abstand
    fontSize: 16,
  },
  // Floating Button Style HIER IST DIE WIEDERHERSTELLUNG
  floatingButton: {
    position: 'absolute',
    bottom: 30, // Etwas höher
    right: 30, // Etwas weiter links
    zIndex: 1000, // Stellt sicher, dass er über anderen Elementen liegt
  },
  commentInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12, // Mehr Abstand
    paddingTop: 8, // Polsterung oben
  },
  commentInput: {
    flex: 1,
    borderColor: '#666', // Dunklerer Rahmen
    borderWidth: 1,
    borderRadius: 20, // Abgerundete Ecken
    padding: 10,
    paddingHorizontal: 15,
    color: '#fff',
    backgroundColor: '#2c2c2c', // Dunklerer Hintergrund
    marginRight: 8,
  },
  postButton: {
    color: '#FF1493', // Pink
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default PostScreen;

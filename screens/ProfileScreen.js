import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, TextInput, ScrollView, Dimensions, ActivityIndicator, Alert, StatusBar } from 'react-native';
import { getFirestore, collection, query, where, onSnapshot, doc, updateDoc, orderBy } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import * as ImagePicker from 'expo-image-picker';
import app from '../components/firebase';
import { Video, ResizeMode } from 'expo-av';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { getAuth } from 'firebase/auth';
import { useNavigation } from '@react-navigation/native';

const { width } = Dimensions.get('window');

// Definiere Akzentfarbe basierend auf dem Login-Screen
// Definiere Akzentfarbe basierend auf dem Login-Screen
const ACCENT_COLOR = '#FF5C93';
const BACKGROUND_COLOR = '#1c1c1c';
const TEXT_INPUT_BACKGROUND = '#333';
const TEXT_COLOR_PRIMARY = '#fff';
const TEXT_COLOR_SECONDARY = '#888';

const ProfileScreen = ({ route }) => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { userId } = route.params;
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedTab, setSelectedTab] = useState('videos');
  const db = getFirestore(app);
  const auth = getAuth(app);
  const currentUser = auth.currentUser;

  useEffect(() => {
    navigation.setOptions({
      headerShown: false, // We will use a custom header
    });

    const userRef = doc(db, 'users', userId);
    const unsubscribeUser = onSnapshot(userRef, (doc) => {
      if (doc.exists()) {
        const userData = doc.data();
        setUser({
          id: doc.id,
          ...userData,
          followers: userData.followers || 0,
          following: userData.following || 0,
          likes: userData.likes || 0,
        });
      } else {
        // Handle user not found
      }
    });

    const postsQuery = query(
      collection(db, 'posts'),
      where('user.id', '==', userId),
      orderBy('createdAt', 'desc')
    );

    const unsubscribePosts = onSnapshot(postsQuery, (querySnapshot) => {
      const userPosts = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setPosts(userPosts);
    }, (error) => {
      console.error("Fehler beim Laden der Posts:", error);
    });

    return () => {
      unsubscribeUser();
      unsubscribePosts();
    };
  }, [userId, navigation]);

  const handleUpdate = async () => {
    if (!user) return;
    const userRef = doc(db, 'users', userId);
    try {
      await updateDoc(userRef, {
        username: user.username,
        bio: user.bio,
      });
      setIsEditMode(false);
      Alert.alert("Erfolg", "Profil aktualisiert!");
    } catch (error) {
      Alert.alert("Fehler", "Profil konnte nicht aktualisiert werden.");
    }
  };

  const handleImagePick = async () => {
    if (currentUser?.uid !== userId) return;

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      const storage = getStorage(app);
      const response = await fetch(result.assets[0].uri);
      const blob = await response.blob();
      const storageRef = ref(storage, `profile-pictures/${userId}`);
      try {
        await uploadBytes(storageRef, blob);
        const downloadURL = await getDownloadURL(storageRef);
        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, { profilePicture: downloadURL });
        setUser(prevUser => ({ ...prevUser, profilePicture: downloadURL }));
      } catch (error) {
        Alert.alert("Fehler", "Profilbild konnte nicht aktualisiert werden.");
      }
    }
  };

  const isVideoUrl = (url) => {
    if (!url || typeof url !== 'string') return false;
    const videoRegex = /\.(mp4|mov|webm|avi|mkv)(\?.*)?$/i;
    return videoRegex.test(url);
  };

  const renderPostItem = ({ item }) => {
    const isItemVideo = isVideoUrl(item.media);
    return (
      <TouchableOpacity style={styles.videoThumbnailContainer}>
        {item.media ? (
          isItemVideo ? (
            <Video
              source={{ uri: item.media }}
              style={styles.videoThumbnail}
              resizeMode={ResizeMode.COVER}
            />
          ) : (
            <Image source={{ uri: item.media }} style={styles.videoThumbnail} />
          )
        ) : (
          <View style={styles.videoThumbnailPlaceholder}>
            <Ionicons name="film-outline" size={40} color={TEXT_COLOR_SECONDARY} />
          </View>
        )}
        <View style={styles.viewsOverlay}>
          <Ionicons name="play" size={12} color="white" />
          <Text style={styles.viewsText}>{String(item.views || '0')}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (!user) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={ACCENT_COLOR} />
      </View>
    );
  }

  const isOwnProfile = currentUser?.uid === userId;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={BACKGROUND_COLOR} />
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerButton}>
          <Ionicons name="arrow-back" size={24} color={TEXT_COLOR_PRIMARY} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{user.username}</Text>
        <TouchableOpacity onPress={() => Alert.alert('Optionen')} style={styles.headerButton}>
          <Ionicons name="ellipsis-horizontal" size={24} color={TEXT_COLOR_PRIMARY} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollViewContent}>
        <View style={styles.profileInfoContainer}>
          <TouchableOpacity onPress={isOwnProfile ? handleImagePick : null}>
            <Image source={{ uri: user.profilePicture || 'https://via.placeholder.com/150/CCCCCC/FFFFFF?text=User' }} style={styles.profilePicture} />
          </TouchableOpacity>
          {isEditMode ? (
            <>
              <TextInput
                style={styles.input}
                value={user.username}
                onChangeText={(text) => setUser({ ...user, username: text })}
                placeholder="Benutzername"
                placeholderTextColor={TEXT_COLOR_SECONDARY}
              />
              <TextInput
                style={[styles.input, styles.bioInput]}
                value={user.bio}
                onChangeText={(text) => setUser({ ...user, bio: text })}
                multiline
                placeholder="Bio"
                placeholderTextColor={TEXT_COLOR_SECONDARY}
              />
              <TouchableOpacity style={styles.button} onPress={handleUpdate}>
                <Text style={styles.buttonText}>Speichern</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setIsEditMode(false)}>
                <Text style={styles.textLink}>Abbrechen</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={styles.username}>@{user.username}</Text>
              <View style={styles.statsContainer}>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>{user.following.toLocaleString()}</Text>
                  <Text style={styles.statLabel}>Following</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>{user.followers.toLocaleString()}</Text>
                  <Text style={styles.statLabel}>Follower</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>{user.likes.toLocaleString()}</Text>
                  <Text style={styles.statLabel}>Likes</Text>
                </View>
              </View>
              <View style={styles.actionButtonsContainer}>
                {isOwnProfile ? (
                  <TouchableOpacity style={styles.button} onPress={() => setIsEditMode(true)}>
                    <Text style={styles.buttonText}>Profil bearbeiten</Text>
                  </TouchableOpacity>
                ) : (
                  <>
                    <TouchableOpacity style={styles.button} onPress={() => Alert.alert('Folgen')}>
                      <Text style={styles.buttonText}>Folgen</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.secondaryButton} onPress={() => Alert.alert('Nachricht')}>
                      <Ionicons name="chatbubble-ellipses-outline" size={20} color={TEXT_COLOR_PRIMARY} />
                    </TouchableOpacity>
                  </>
                )}
              </View>
              <Text style={styles.bio}>{user.bio}</Text>
            </>
          )}
        </View>
        <View style={styles.videoTabNavigation}>
          <TouchableOpacity
            style={[styles.tabButton, selectedTab === 'videos' && styles.selectedTabButton]}
            onPress={() => setSelectedTab('videos')}
          >
            <Ionicons name="grid" size={24} color={selectedTab === 'videos' ? ACCENT_COLOR : TEXT_COLOR_SECONDARY} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabButton, selectedTab === 'liked' && styles.selectedTabButton]}
            onPress={() => setSelectedTab('liked')}
          >
            <Ionicons name="heart" size={24} color={selectedTab === 'liked' ? ACCENT_COLOR : TEXT_COLOR_SECONDARY} />
          </TouchableOpacity>
          {isOwnProfile && (
            <TouchableOpacity
              style={[styles.tabButton, selectedTab === 'saved' && styles.selectedTabButton]}
              onPress={() => setSelectedTab('saved')}
            >
              <Ionicons name="bookmark" size={24} color={selectedTab === 'saved' ? ACCENT_COLOR : TEXT_COLOR_SECONDARY} />
            </TouchableOpacity>
          )}
        </View>
        {selectedTab === 'videos' && (
          posts.length > 0 ? (
            <FlatList
              data={posts}
              keyExtractor={(item) => item.id}
              renderItem={renderPostItem}
              numColumns={3}
              scrollEnabled={false}
              columnWrapperStyle={styles.row}
            />
          ) : (
            <View style={styles.noContentContainer}>
              <Text style={styles.noContentText}>Noch keine Posts.</Text>
            </View>
          )
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BACKGROUND_COLOR,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    height: 60,
    backgroundColor: BACKGROUND_COLOR,
  },
  headerButton: {
    padding: 5,
  },
  headerTitle: {
    color: TEXT_COLOR_PRIMARY,
    fontSize: 18,
    fontWeight: 'bold',
  },
  scrollViewContent: {
    flexGrow: 1,
  },
  profileInfoContainer: {
    alignItems: 'center',
    paddingTop: 20,
    paddingHorizontal: 15,
  },
  profilePicture: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: ACCENT_COLOR,
    marginBottom: 15,
  },
  username: {
    color: TEXT_COLOR_PRIMARY,
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '90%',
    marginBottom: 20,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    color: TEXT_COLOR_PRIMARY,
    fontSize: 18,
    fontWeight: 'bold',
  },
  statLabel: {
    color: TEXT_COLOR_SECONDARY,
    fontSize: 14,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    justifyContent: 'center',
  },
  button: {
    flex: 1,
    height: 50,
    backgroundColor: ACCENT_COLOR,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 5,
  },
  buttonText: {
    color: TEXT_COLOR_PRIMARY,
    fontSize: 16,
    fontWeight: 'bold',
  },
  secondaryButton: {
    height: 50,
    width: 50,
    backgroundColor: TEXT_INPUT_BACKGROUND,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  bio: {
    color: TEXT_COLOR_PRIMARY,
    textAlign: 'center',
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  videoTabNavigation: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#333',
  },
  tabButton: {
    paddingVertical: 12,
    flex: 1,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  selectedTabButton: {
    borderBottomColor: ACCENT_COLOR,
  },
  row: {
    justifyContent: 'flex-start',
  },
  videoThumbnailContainer: {
    width: width / 3,
    height: width / 3 * 1.5,
    backgroundColor: '#222',
    borderWidth: 0.5,
    borderColor: BACKGROUND_COLOR,
  },
  videoThumbnail: {
    width: '100%',
    height: '100%',
  },
  videoThumbnailPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#2c2c2c',
  },
  viewsOverlay: {
    position: 'absolute',
    bottom: 5,
    left: 5,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 5,
  },
  viewsText: {
    color: 'white',
    fontSize: 12,
    marginLeft: 4,
    fontWeight: 'bold',
  },
  input: {
    width: '90%',
    height: 50,
    backgroundColor: TEXT_INPUT_BACKGROUND,
    borderRadius: 8,
    paddingHorizontal: 15,
    marginVertical: 10,
    color: TEXT_COLOR_PRIMARY,
  },
  bioInput: {
    height: 100,
    textAlignVertical: 'top',
    paddingTop: 15,
  },
  textLink: {
    color: ACCENT_COLOR,
    marginTop: 15,
    fontWeight: 'bold',
  },
  noContentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    minHeight: 200,
  },
  noContentText: {
    color: TEXT_COLOR_SECONDARY,
    fontSize: 16,
    textAlign: 'center',
  },
});

export default ProfileScreen;

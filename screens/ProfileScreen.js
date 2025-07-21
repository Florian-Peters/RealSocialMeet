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
const ACCENT_COLOR = '#FF5C93';
const TEXT_INPUT_BACKGROUND = '#333';
const TEXT_COLOR_PRIMARY = '#fff';
const TEXT_COLOR_SECONDARY = '#888'; // Für Placeholder und weniger wichtige Texte

const ProfileScreen = ({ route }) => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { userId } = route.params; // Der userId des Profils, das angezeigt wird
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedTab, setSelectedTab] = useState('videos'); // 'videos' or 'liked'
  const db = getFirestore(app);
  const auth = getAuth(app);
  const currentUser = auth.currentUser;

  // --- DEBUG-LOGS (Beibehalten für schnelle Fehlerbehebung) ---
  console.log('--- ProfileScreen Debugging Start ---');
  console.log('1. Route Params userId:', userId);
  console.log('2. Aktueller eingeloggter Nutzer (currentUser?.uid):', currentUser?.uid);
  console.log('-----------------------------------');
  // --- ENDE DEBUG-LOGS ---

  useEffect(() => {
    console.log('--- useEffect gestartet ---');
    console.log('3. userId in useEffect:', userId);
    console.log('4. currentUser in useEffect (uid):', currentUser?.uid);

    // Header-Optionen für React Navigation Stack
    navigation.setOptions({
      headerShown: true,
      headerTitle: 'Profile', // Kann hier den Usernamen anzeigen, wenn gewünscht
      headerStyle: {
        backgroundColor: 'black', // Schwarzer Header Hintergrund
      },
      headerTintColor: TEXT_COLOR_PRIMARY, // Weiße Icons/Zurück-Button
      headerTitleStyle: {
        fontWeight: 'bold',
        color: TEXT_COLOR_PRIMARY,
      },
      // Optional: Ein Icon für Optionen rechts im Header
      headerRight: () => (
        <TouchableOpacity onPress={() => Alert.alert('Optionen', 'Weitere Optionen hier...')}>
          <Ionicons name="ellipsis-vertical" size={24} color={TEXT_COLOR_PRIMARY} />
        </TouchableOpacity>
      ),
    });

    // Nutzerdaten abrufen
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
        console.log('5. Nutzerdaten geladen:', userData.username, 'UID:', doc.id);
      } else {
        setUser({
          id: userId,
          username: 'Unbekannt',
          profilePicture: 'https://via.placeholder.com/150/CCCCCC/FFFFFF?text=User',
          followers: 0,
          following: 0,
          likes: 0,
          bio: 'Keine Bio verfügbar.',
        });
        console.warn('6. Nutzerdokument nicht gefunden für userId:', userId);
      }
    });

    // Posts des *angezeigten* Nutzers abrufen
    const postsQuery = query(
      collection(db, 'posts'),
      where('user.id', '==', userId), // Korrigiertes Feld
      orderBy('createdAt', 'desc') // Neueste Posts zuerst
    );

    const unsubscribePosts = onSnapshot(postsQuery, (querySnapshot) => {
      const userPosts = [];
      querySnapshot.forEach((postDoc) => {
        userPosts.push({ id: postDoc.id, ...postDoc.data() });
      });
      setPosts(userPosts);
      console.log('7. Abfrage für Posts ausgeführt. Gefundene Posts:', userPosts.length, 'Posts:', userPosts);
      if (userPosts.length === 0) {
        console.log('8. KEINE POSTS FÜR DIESEN NUTZER GEFUNDEN.');
      }
    }, (error) => {
      console.error("Fehler beim Laden der Posts:", error);
      Alert.alert("Fehler", "Posts konnten nicht geladen werden.");
    });

    return () => {
      unsubscribeUser();
      unsubscribePosts();
      console.log('--- useEffect Cleanup ---');
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
      console.error("Fehler beim Aktualisieren des Profils:", error);
      Alert.alert("Fehler", "Profil konnte nicht aktualisiert werden.");
    }
  };

  const handleImagePick = async () => {
    if (currentUser?.uid !== userId) {
      Alert.alert("Berechtigung", "Sie können nur Ihr eigenes Profilbild ändern.");
      return;
    }

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
        Alert.alert("Erfolg", "Profilbild aktualisiert!");
      } catch (error) {
        console.error("Fehler beim Hochladen/Aktualisieren des Profilbildes:", error);
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
    console.log('9. renderPostItem aufgerufen für Post ID:', item.id);
    console.log('10. Post Media URL:', item.media);
    console.log('11. Ist Video URL:', isVideoUrl(item.media));
    const isItemVideo = isVideoUrl(item.media);

    return (
      <TouchableOpacity
        style={styles.videoThumbnailContainer}
        onPress={() => {
          if (isItemVideo && item.media) {
            navigation.navigate('VideoDetail', { videoUrl: item.media });
          } else if (item.media) {
            Alert.alert("Bild geklickt", "Dies ist ein Bild: " + item.media);
          } else {
            Alert.alert("Kein Medium", "Dieser Post hat kein Medium zum Anzeigen.");
          }
        }}
      >
        {item.media ? (
          isItemVideo ? (
            <Video
              source={{ uri: item.media }}
              style={styles.videoThumbnail}
              useNativeControls={false}
              resizeMode={ResizeMode.COVER}
              isLooping={true}
              shouldPlay={false}
            />
          ) : (
            <Image source={{ uri: item.media }} style={styles.videoThumbnail} />
          )
        ) : (
          <View style={styles.videoThumbnailPlaceholder}>
            <Text style={styles.videoThumbnailPlaceholderText}>Kein Medium</Text>
          </View>
        )}
        <View style={styles.viewsOverlay}>
          <Ionicons name="play" size={12} color="white" />
          {/* Ensure item.views is explicitly converted to String */}
          <Text style={styles.viewsText}>{String(item.views || '0')}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (!user) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={ACCENT_COLOR} />
        <Text style={styles.loadingText}>Profil wird geladen...</Text>
      </View>
    );
  }

  const isOwnProfile = currentUser?.uid === userId;
  console.log('12. isOwnProfile Status:', isOwnProfile);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="black" />
      
      {/* Das React Navigation Header wird oben automatisch angezeigt.
          Dieser custom View ist jetzt nur noch für den Inhalt unter dem Header relevant. */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <Text style={styles.headerTitle}>{user.username}</Text>
      </View>


      <ScrollView contentContainerStyle={styles.scrollViewContent}>
        {/* Profilinformationen */}
        <View style={styles.profileInfoContainer}>
          <TouchableOpacity onPress={isOwnProfile ? handleImagePick : null}>
            <Image source={{ uri: user.profilePicture }} style={styles.profilePicture} />
          </TouchableOpacity>

          {isEditMode && isOwnProfile ? (
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
                    <TouchableOpacity style={styles.button} onPress={() => Alert.alert('Folgen', 'Folgen Funktion')}>
                      <Text style={styles.buttonText}>Folgen</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.secondaryButton} onPress={() => Alert.alert('Nachricht', 'Nachricht senden')}>
                      <Ionicons name="chatbubble-ellipses-outline" size={20} color={TEXT_COLOR_PRIMARY} />
                    </TouchableOpacity>
                  </>
                )}
              </View>

              <Text style={styles.bio}>{user.bio}</Text>
            </>
          )}
        </View>

        {/* Video/Liked/Saved Tabs */}
        <View style={styles.videoTabNavigation}>
          <TouchableOpacity
            style={[styles.tabButton, selectedTab === 'videos' && styles.selectedTabButton]}
            onPress={() => setSelectedTab('videos')}
          >
            <Ionicons name="grid-outline" size={24} color={selectedTab === 'videos' ? ACCENT_COLOR : TEXT_COLOR_SECONDARY} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabButton, selectedTab === 'liked' && styles.selectedTabButton]}
            onPress={() => setSelectedTab('liked')}
          >
            <Ionicons name="heart-outline" size={24} color={selectedTab === 'liked' ? ACCENT_COLOR : TEXT_COLOR_SECONDARY} />
          </TouchableOpacity>
          {isOwnProfile && (
            <TouchableOpacity
              style={[styles.tabButton, selectedTab === 'saved' && styles.selectedTabButton]}
              onPress={() => setSelectedTab('saved')}
            >
              <Ionicons name="bookmark-outline" size={24} color={selectedTab === 'saved' ? ACCENT_COLOR : TEXT_COLOR_SECONDARY} />
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
              <Text style={styles.noContentText}>Dieser Nutzer hat noch keine Videos gepostet.</Text>
            </View>
          )
        )}
        {selectedTab === 'liked' && (
          <View style={styles.noContentContainer}>
            <Text style={styles.noContentText}>Noch keine gelikten Videos.</Text>
          </View>
        )}
        {selectedTab === 'saved' && isOwnProfile && (
          <View style={styles.noContentContainer}>
            <Text style={styles.noContentText}>Noch keine gespeicherten Videos.</Text>
          </View>
        )}
      </ScrollView>

      {/* Die untere Navigationsleiste (BottomTabNavigator) wird von React Navigation global verwaltet.
          Dieser Abschnitt ist KOMMENTIERT, um eine doppelte Leiste zu vermeiden.
          Stellen Sie sicher, dass Ihr Root-Navigator einen BottomTabNavigator verwendet und
          Ihr Profilscreen Teil davon ist. */}
      {/*
      <View style={[styles.bottomNavBar, { paddingBottom: insets.bottom }]}>
        <View style={styles.navBarItem} />
        <View style={styles.navBarItem} />
        <TouchableOpacity style={styles.navBarItem}>
          <View style={styles.addContentButton}>
            <Ionicons name="add-outline" size={30} color="black" />
          </View>
        </TouchableOpacity>
        <View style={styles.navBarItem} />
        <TouchableOpacity style={styles.navBarItem}>
          <Ionicons name="person" size={26} color="white" />
          <Text style={styles.navBarText}>Profil</Text>
        </TouchableOpacity>
      </View>
      */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black', // Hintergrund wie Login-Screen
  },
  loadingText: {
    color: TEXT_COLOR_PRIMARY,
    textAlign: 'center',
    marginTop: 20,
  },
  // Header-Styling: Hier nur für den Container unter der Statusleiste,
  // da der eigentliche Header vom React Navigation Stack kommt.
  header: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 15,
    // height wird vom Navigator gesetzt, hier evtl. paddingBottom für Inhalt
    backgroundColor: 'black',
    paddingTop: 0, // Insets werden direkt im Haupt-View angewendet
    paddingBottom: 10,
    // borderBottomWidth: 0.5, // Standard React Navigation Header hat keine sichtbare Border
    // borderBottomColor: '#333',
  },
  headerTitle: {
    color: TEXT_COLOR_PRIMARY,
    fontSize: 18,
    fontWeight: 'bold',
  },
  scrollViewContent: {
    flexGrow: 1,
    // Keine paddingBottom hier, da keine lokale Bottom-Nav-Bar mehr
  },
  profileInfoContainer: {
    alignItems: 'center',
    paddingTop: 20,
    paddingHorizontal: 15,
  },
  profilePicture: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: ACCENT_COLOR, // Akzentfarbe für den Rand
    marginBottom: 10,
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
    width: '80%',
    marginBottom: 20,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    color: TEXT_COLOR_PRIMARY, // Zahlen in Primärfarbe (Weiß)
    fontSize: 18,
    fontWeight: 'bold',
  },
  statLabel: {
    color: TEXT_COLOR_SECONDARY, // Labels in Sekundärfarbe (Grau)
    fontSize: 13,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    width: '100%', // Button-Container auf volle Breite
    justifyContent: 'center',
  },
  // Primärer Button-Stil (Login-Button)
  button: {
    width: '80%', // Etwas schmaler als 100% für Ästhetik
    height: 50,
    backgroundColor: ACCENT_COLOR,
    borderRadius: 8, // Abgerundete Ecken
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 10,
    paddingHorizontal: 20, // Mehr Polsterung
  },
  buttonText: {
    color: TEXT_COLOR_PRIMARY,
    fontSize: 18,
    fontWeight: 'bold',
  },
  // Sekundärer Button-Stil (z.B. für Nachrichten-Icon)
  secondaryButton: {
    height: 50,
    width: 50, // Quadratisch für Icon
    backgroundColor: TEXT_INPUT_BACKGROUND, // Dunkler Hintergrund wie Input
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 10,
    marginLeft: 10, // Abstand zum Haupt-Button
    borderWidth: 1, // Optional: Leichter Rand
    borderColor: '#444', // Dunklerer Rand
  },
  bio: {
    color: TEXT_COLOR_PRIMARY,
    textAlign: 'center',
    marginBottom: 15,
    fontSize: 14,
  },
  videoTabNavigation: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderBottomWidth: 0.5,
    borderBottomColor: '#333',
    marginBottom: 10,
  },
  tabButton: {
    paddingVertical: 10,
    flex: 1,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  selectedTabButton: {
    borderBottomColor: ACCENT_COLOR, // Akzentfarbe für aktiven Tab
  },
  row: {
    justifyContent: 'flex-start',
    paddingHorizontal: 2,
  },
  videoThumbnailContainer: {
    width: width / 3 - 4,
    height: width / 3 * 1.3,
    margin: 2,
    backgroundColor: '#222',
    justifyContent: 'flex-end',
    alignItems: 'flex-start',
  },
  videoThumbnail: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
    position: 'absolute',
  },
  videoThumbnailPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoThumbnailPlaceholderText: {
    color: TEXT_COLOR_SECONDARY,
    fontSize: 12,
  },
  viewsOverlay: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 3,
    position: 'absolute',
    bottom: 5,
    left: 5,
  },
  viewsText: {
    color: TEXT_COLOR_PRIMARY,
    fontSize: 10,
    marginLeft: 3,
  },
  // Input-Stil wie im Login-Screen
  input: {
    width: '90%', // Angepasst für Profil-Layout
    height: 50,
    backgroundColor: TEXT_INPUT_BACKGROUND,
    borderRadius: 8,
    paddingHorizontal: 15,
    marginVertical: 10,
    color: TEXT_COLOR_PRIMARY,
    textAlign: 'center', // Zentrierter Text
  },
  bioInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  saveButton: {
    backgroundColor: ACCENT_COLOR,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 10,
    width: '80%', // Match other buttons
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveButtonText: {
    color: TEXT_COLOR_PRIMARY,
    fontWeight: 'bold',
    fontSize: 18,
  },
  cancelButton: {
    backgroundColor: 'transparent', // Make it transparent like a link
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 10,
  },
  cancelButtonText: {
    color: ACCENT_COLOR, // Use accent color for cancel
    fontWeight: 'bold',
    fontSize: 16,
  },
  textLink: { // New style for text links
    color: ACCENT_COLOR,
    marginTop: 10,
    fontSize: 16,
    fontWeight: 'bold',
  },
  noContentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    minHeight: 150,
  },
  noContentText: {
    color: TEXT_COLOR_SECONDARY,
    fontSize: 16,
    textAlign: 'center',
  },
});

export default ProfileScreen;

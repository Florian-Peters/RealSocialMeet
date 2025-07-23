import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, ActivityIndicator, Image, Text, Switch } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import { getFirestore, query, where, getDocs, collection, doc, setDoc, onSnapshot, deleteDoc } from 'firebase/firestore';
import { app, db } from '../components/firebase';
import { useUser } from '../UserContext';

const MapViewScreen = ({ navigation }) => {
  const { user } = useUser();
  const username = user ? user.username : '';

  const [userLocations, setUserLocations] = useState([]);
  const [eventLocations, setEventLocations] = useState([]);
  const [myLocation, setMyLocation] = useState(null);
  const [mapReady, setMapReady] = useState(false);
  const [gpsEnabled, setGpsEnabled] = useState(true);
  const [initialRegionSet, setInitialRegionSet] = useState(false);
  const [region, setRegion] = useState(null);
  const [loading, setLoading] = useState(false);
  const locationSubscription = useRef(null);

  useEffect(() => {
    const locationsCollection = collection(db, 'locations');
    const unsubscribeLocations = onSnapshot(locationsCollection, (snapshot) => {
      const locations = snapshot.docs.map(doc => doc.data());
      setUserLocations(locations);
    });

    const eventsCollection = collection(db, 'events');
    const unsubscribeEvents = onSnapshot(eventsCollection, (snapshot) => {
      const events = snapshot.docs.map(doc => doc.data());
      setEventLocations(events);
    });

    return () => {
      unsubscribeLocations();
      unsubscribeEvents();
    };
  }, []);

  const watchLocation = async () => {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      return;
    }

    locationSubscription.current = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.High,
        timeInterval: 8000,
        distanceInterval: 10,
      },
      async (location) => {
        const { latitude, longitude } = location.coords;

        const userLocationData = {
          latitude,
          longitude,
          username,
          image: 'https://i.ibb.co/DzTJJDQ/Nadel-Geojam.png',
          gpsEnabled,
        };

        if (username) {
          const locationDocRef = doc(db, 'locations', username);
          await setDoc(locationDocRef, userLocationData);
        }

        setMyLocation(userLocationData);
      }
    );
  };

  const handleToggleGPS = async () => {
    if (gpsEnabled) {
      setGpsEnabled(false);
      if (locationSubscription.current) {
        locationSubscription.current.remove();
        locationSubscription.current = null;
      }
      if (username) {
        const locationDocRef = doc(db, 'locations', username);
        await deleteDoc(locationDocRef);
      }
      setMyLocation(null);
    } else {
      setGpsEnabled(true);
      await watchLocation();
    }
  };

  useEffect(() => {
    if (username && gpsEnabled) {
      watchLocation();
    }

    return () => {
      if (locationSubscription.current) {
        locationSubscription.current.remove();
      }
    };
  }, [username, gpsEnabled]);

  const handleMarkerPressEvent = (event) => {
    alert(event.eventDescription);
  };

  const handleMarkerPress = async (user) => {
    try {
      const userId = await getUserIdByUsername(user.username);
      if (userId) {
        const userWithUid = { ...user, uid: userId };
        console.log('Navigating with selectedUser:', userWithUid);
        navigation.navigate('Chat', { selectedUser: userWithUid });
      } else {
        console.warn('Benutzer nicht gefunden.');
      }
    } catch (error) {
      console.error('Fehler beim Abrufen der Benutzer-ID:', error);
    }
  };

  const getUserIdByUsername = async (username) => {
    const usersCollection = collection(getFirestore(app), 'users');
    const userQuery = query(usersCollection, where('username', '==', username));
    const userSnapshot = await getDocs(userQuery);
    return userSnapshot.docs.length > 0 ? userSnapshot.docs[0].data().uid : null;
  };

  useEffect(() => {
    if (!initialRegionSet && myLocation) {
      setRegion({
        latitude: myLocation.latitude,
        longitude: myLocation.longitude,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      });
      setMapReady(true);
      setInitialRegionSet(true);
    }
  }, [initialRegionSet, myLocation]);

  return (
    <View style={{ flex: 1 }}>
      {loading ? (
        <ActivityIndicator />
      ) : (
        <>
          <MapView
            style={{ flex: 1 }}
            initialRegion={region}
            onLayout={() => {
              setMapReady(true);
              if (myLocation) {
                setInitialRegionSet(true);
              }
            }}
          >
            {mapReady &&
              eventLocations.map((event, index) => (
                <Marker
                  key={index}
                  coordinate={{ latitude: event.latitude, longitude: event.longitude }}
                  onPress={() => handleMarkerPressEvent(event)}
                >
                  <View style={styles.markerContainer}>
                    <Text style={styles.markerText}>{event.eventname}</Text>
                    <Image source={{ uri: event.image }} style={styles.markerImage} />
                  </View>
                </Marker>
              ))}
            {mapReady &&
              userLocations.map((user, index) => (
                <Marker
                  key={index}
                  coordinate={{ latitude: user.latitude, longitude: user.longitude }}
                  title={user.username}
                  onPress={() => handleMarkerPress(user)}
                >
                  {user.image && <Image source={{ uri: user.image }} style={styles.userImage} />}
                </Marker>
              ))}
            {mapReady && myLocation && gpsEnabled && (
              <Marker
                coordinate={{ latitude: myLocation.latitude, longitude: myLocation.longitude }}
                title={`Mein Standort (${username})`}
              >
                <Image source={require('../assets/NadelGeojam.png')} style={styles.userImage} />
              </Marker>
            )}
          </MapView>
          <View style={styles.gpsToggleContainer}>
            <Text style={styles.gpsToggleText}>GPS {gpsEnabled ? 'EIN' : 'AUS'}</Text>
            <Switch value={gpsEnabled} onValueChange={handleToggleGPS} />
          </View>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  markerContainer: {
    alignItems: 'center',
  },
  markerText: {
    color: '#FF5C93',
    fontWeight: 'bold',
    backgroundColor: 'rgba(28, 28, 28, 0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    overflow: 'hidden',
  },
  markerImage: {
    width: 60,
    height: 60,
  },
  userImage: {
    width: 80,
    height: 80,
  },
  gpsToggleContainer: {
    position: 'absolute',
    top: 40,
    right: 10,
    alignItems: 'center',
    backgroundColor: '#1c1c1c',
    padding: 10,
    borderRadius: 20,
    borderColor: '#FF5C93',
    borderWidth: 1,
  },
  gpsToggleText: {
    fontSize: 16,
    marginBottom: 5,
    color: '#fff',
  },
});

export default MapViewScreen;

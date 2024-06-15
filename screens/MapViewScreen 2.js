import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, StyleSheet, Text, Image, Switch, ActivityIndicator } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import io from 'socket.io-client';
import * as Location from 'expo-location';
import { useGps } from '../GpsContext';
import { getFirestore, query, where, getDocs, collection } from 'firebase/firestore';
import app from '../components/firebase';
import Modal from 'react-native-modal';

const CustomAlert = ({ isVisible, eventDescription, onClose }) => {
  return (
    <Modal isVisible={isVisible} onBackdropPress={onClose}>
      <View style={{ backgroundColor: 'white', padding: 20, borderRadius: 10 }}>
        <Text style={{ fontSize: 18, fontWeight: 'bold' }}>Event Description</Text>
        <Text>{eventDescription}</Text>
        <Button title="Close" onPress={onClose} />
      </View>
    </Modal>
  );
};

const MapViewScreen = ({ navigation, route }) => {
  const { username } = route.params || {};

  if (!username) {
    console.error('username is undefined');
    return null;
  }

  const { gpsEnabled, setGpsEnabled } = useGps();
  const [userLocations, setUserLocations] = useState([]);
  const [eventLocations, setEventLocations] = useState([]);
  const [myLocation, setMyLocation] = useState(null);
  const [mapReady, setMapReady] = useState(false);
  const [initialRegionSet, setInitialRegionSet] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  const handleToggleGPS = () => {
    setGpsEnabled(!gpsEnabled);
  };

  const handleMarkerPressEvent = (event) => {
    alert(event.eventDescription);
  };

  const handleMarkerPress = async (user) => {
    try {
      const userId = await getUserIdByUsername(user.username);
      if (userId) {
        const user

import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, Image, Platform, ScrollView, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import io from 'socket.io-client';
import * as ImagePicker from 'expo-image-picker';
import MapView, { Marker } from 'react-native-maps';  
import uuid from 'react-native-uuid';

const ProductDetailsScreen = ({ route }) => {
  const navigation = useNavigation();
  const { product } = route.params;
  const { duration } = route.params;
  const [eventname, setEventname] = useState('');
  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);
  const [socket, setSocket] = useState(null);
  const [image, setImage] = useState(null);
  const [eventDescription, setEventDescription] = useState('');
  const maxCharacterCount = 600;

  useEffect(() => {
    const socketInstance = io(Platform.OS === 'android' ? 'http://10.0.2.2:3001' : 'http://192.168.178.55:3001');
    setSocket(socketInstance);

    socketInstance.on('connect', () => {
      console.log('Connected to server');
    });

    return () => {
      socketInstance.disconnect();
    };
  }, []);

  useEffect(() => {
    (async () => {
      if (Platform.OS !== 'web') {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          alert('Sorry, we need camera roll permissions to make this work!');
        }
      }
    })();
  }, []);

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      quality: 0.8,
    });
    
    if (!result.cancelled) {
      setImage(result.assets[0].uri);
      console.log('Selected image URI:', result.assets[0].uri);
    }
  };

  const handleMapPress = (event) => {
    const { coordinate } = event.nativeEvent;
    setLatitude(coordinate.latitude);
    setLongitude(coordinate.longitude);
  };

  const handleConfirmPurchase = async () => {
    console.log('handleConfirmPurchase called');

    try {
      if (image && latitude !== null && longitude !== null) {
        console.log('Image and location are set');

        let localUri = image;
        let filename = localUri.split('/').pop();

        let match = /\.(\w+)$/.exec(filename);
        let type = match ? `image/${match[1]}` : `image`;

        let formData = new FormData();
        formData.append('image', { uri: localUri, name: filename, type });
        formData.append('latitude', latitude.toString());
        formData.append('longitude', longitude.toString());
        formData.append('eventDescription', eventDescription);
        formData.append('eventname', eventname);
        formData.append('duration', duration);

        const eventId = uuid.v4();
        console.log(`Generated eventId: ${eventId}`);

        formData.append('eventId', eventId);

        const response = await fetch(Platform.OS === 'android' ? 'http://10.0.2.2:3001/upload' : 'http://192.168.178.55:3001/upload', {
          method: 'POST',
          body: formData,
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });

        const data = await response.text();
        console.log('Image upload response:', data);

        const jsonData = JSON.parse(data);
        console.log('Parsed JSON response:', jsonData);

        if (socket && socket.connected) {
          socket.emit('confirmPurchase', {
            latitude: parseFloat(latitude),
            longitude: parseFloat(longitude),
            duration,
            eventname,
            image: jsonData.imagePath,
            eventId,
            eventDescription,
          });
        }

        navigation.navigate('MapView');
      } else {
        console.log('Please select an image, choose a location on the map, and provide an event description');
      }
    } catch (error) {
      console.error('Image upload error:', error);
    }
  };

  const remainingCharacterCount = maxCharacterCount - eventDescription.length;

  return (
    <ScrollView contentContainerStyle={styles.scrollViewContent}>
      <View style={styles.container}>
        <Text style={styles.title}>Product Details</Text>

        <MapView
          style={styles.map}
          onPress={handleMapPress}
          initialRegion={{
            latitude: 37.78825,
            longitude: -122.4324,
            latitudeDelta: 0.0922,
            longitudeDelta: 0.0421,
          }}
        >
          {latitude !== null && longitude !== null && (
            <Marker coordinate={{ latitude, longitude }} />
          )}
        </MapView>

        <TouchableOpacity style={styles.imageButton} onPress={pickImage}>
          <Text style={styles.imageButtonText}>Select Image</Text>
        </TouchableOpacity>

        {image && <Image source={{ uri: image }} style={styles.imagePreview} />}

        <Text style={styles.productName}>{product.name}</Text>
        <Text style={styles.productDescription}>{product.description}</Text>

        <Text style={styles.inputLabel}>Event Name</Text>
        <TextInput
          style={styles.input}
          onChangeText={setEventname}
          value={eventname}
        />

        <Text style={styles.inputLabel}>Event Description ({remainingCharacterCount} characters remaining)</Text>
        <TextInput
          style={styles.eventDescriptionInput}
          onChangeText={(text) => {
            if (text.length <= maxCharacterCount) {
              setEventDescription(text);
            }
          }}
          value={eventDescription}
          multiline
        />

        <TouchableOpacity style={styles.confirmButton} onPress={handleConfirmPurchase}>
          <Text style={styles.confirmButtonText}>Confirm Purchase</Text>
        </TouchableOpacity>

        <Text style={styles.howToBuyText}>
          How to Buy:
          {'\n\n'}
          1. Select a location on the map.
          {'\n\n'}
          2. Choose an image.
          {'\n\n'}
          3. Enter your event name and description.
          {'\n\n'}
          4. Confirm the purchase.
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollViewContent: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#1c1c1c',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#FF1493',
  },
  map: {
    width: '100%',
    height: 300,
    marginBottom: 20,
  },
  imageButton: {
    backgroundColor: '#FF1493',
    padding: 10,
    borderRadius: 10,
    marginBottom: 20,
  },
  imageButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  imagePreview: {
    width: 200,
    height: 200,
    marginBottom: 20,
    borderRadius: 10,
  },
  productName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FF1493',
    marginBottom: 10,
  },
  productDescription: {
    fontSize: 16,
    color: '#fff',
    marginBottom: 20,
    textAlign: 'center',
  },
  inputLabel: {
    fontSize: 16,
    color: '#fff',
    marginBottom: 5,
  },
  input: {
    height: 40,
    width: '100%',
    borderColor: '#333',
    borderWidth: 1,
    marginBottom: 20,
    color: '#fff',
    paddingHorizontal: 10,
    borderRadius: 10,
  },
  eventDescriptionInput: {
    height: 100,
    width: '100%',
    borderColor: '#333',
    borderWidth: 1,
    marginBottom: 20,
    color: '#fff',
    paddingHorizontal: 10,
    borderRadius: 10,
    textAlignVertical: 'top',
  },
  confirmButton: {
    backgroundColor: '#FF1493',
    padding: 10,
    borderRadius: 10,
    marginBottom: 20,
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  howToBuyText: {
    fontSize: 14,
    color: '#FF1493',
    textAlign: 'center',
    marginTop: 20,
  },
});

export default ProductDetailsScreen;

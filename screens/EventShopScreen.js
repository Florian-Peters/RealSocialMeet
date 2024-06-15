import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Image, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';

const EventShopScreen = ({ navigation }) => {
  const [socket, setSocket] = useState(null);
  const [username, setUsername] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [userLocations, setUserLocations] = useState([]);
  const eventUsernameRef = useRef('');

  useEffect(() => {
    navigation.setOptions({
      title: 'Event Shop',
      headerStyle: {
        backgroundColor: '#000',
      },
      headerTintColor: '#FF1493',
      headerTitleStyle: {
        fontWeight: 'bold',
      },
    });
  }, [navigation]);

  const products = [
    { 
      id: '1', 
      name: '24H Marker!', 
      price: 20000, 
      duration: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
      image: require('../assets/24h.jpeg'), 
      priceImage: require('../assets/Bubble.png'), 
      description: 'With this purchase, the event will be marked on the map for 24 hours. Consider carefully when the right time frame is!',  
    },
    { 
      id: '2', 
      name: '48H Marker!', 
      price: 20000, 
      duration: 2 * 24 * 60 * 60 * 1000, // 48 hours in milliseconds
      image: require('../assets/48h.jpeg'), 
      priceImage: require('../assets/Bubble.png'), 
      description: 'With this purchase, the event will be marked on the map for 48 hours. Consider carefully when the right time frame is!',  
    },
    { 
      id: '3', 
      name: '7Day Marker!', 
      price: 20000, 
      duration: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
      image: require('../assets/7days.jpeg'), 
      priceImage: require('../assets/Bubble.png'), 
      description: 'With this purchase, the event will be marked on the map for 7 days. Consider carefully when the right time frame is!',  
    },
    { 
      id: '4', 
      name: '14Day Marker!', 
      price: 20000, 
      duration: 14 * 24 * 60 * 60 * 1000, // 14 days in milliseconds
      image: require('../assets/14days.jpeg'), 
      priceImage: require('../assets/Bubble.png'), 
      description: 'With this purchase, the event will be marked on the map for 14 days. Consider carefully when the right time frame is!',  
    },
  ];

  const handleProductPress = (product) => {
    navigation.navigate('ProductDetails', { product, duration: product.duration });
  };

  return (
    <View style={styles.container}>


      <FlatList
        data={products}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => handleProductPress(item)}>
            <View style={styles.itemContainer}>
              <View style={styles.imageContainer}>
                <Image source={item.image} style={styles.itemImage} />
              </View>
              <Text style={styles.itemName}>{item.name}</Text>
              <View style={styles.priceContainer}>
                <Text style={styles.itemPrice}>{item.price}</Text>
                <Image source={item.priceImage} style={styles.priceImage} />
              </View>
              <View style={styles.descriptionContainer}>
                <Text style={styles.itemDescription}>{item.description}</Text>
              </View>
              <TouchableOpacity style={styles.buyButton} onPress={() => handleProductPress(item)}>
                <Text style={styles.buyButtonText}>BUY</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1c1c1c',
  },
  logo: {
    width: 200,
    height: 200,
    resizeMode: 'contain',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 20,
    color: '#FF1493',
  },
  itemContainer: {
    padding: 20,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: '#FF1493',
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: '#333',
  },
  imageContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 10,
  },
  itemImage: {
    width: '70%',
    height: 180,
    borderRadius: 10,
  },
  itemName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FF1493',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  itemPrice: {
    fontSize: 16,
    color: '#FF1493',
  },
  priceImage: {
    width: 20,
    height: 20,
    marginLeft: 5,
  },
  descriptionContainer: {
    marginTop: 15,
    width: '100%',
    alignItems: 'center',
  },
  itemDescription: {
    fontSize: 14,
    color: '#fff',
    textAlign: 'center',
  },
  buyButton: {
    marginTop: 10,
    backgroundColor: '#FF1493',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  buyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default EventShopScreen;

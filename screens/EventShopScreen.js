import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Image, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDoc, updateDoc, collection, query, onSnapshot } from 'firebase/firestore';
import { useUser } from '../UserContext';
import app from '../components/firebase';

const EventShopScreen = ({ navigation }) => {
  const [socket, setSocket] = useState(null);
  const [username, setUsername] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [userLocations, setUserLocations] = useState([]);
  const [balance, setBalance] = useState(0);
  const [products, setProducts] = useState([]);
  const eventUsernameRef = useRef('');
  const { user: contextUser } = useUser();
  const auth = getAuth(app);
  const db = getFirestore(app);
  const user = auth.currentUser;

  useEffect(() => {
    const fetchBalance = async () => {
      if (user) {
        const userRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userRef);
        if (userDoc.exists()) {
          setBalance(userDoc.data().balance);
        }
      }
    };

    const fetchProducts = () => {
      const q = query(collection(db, 'products'));
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const productsData = [];
        querySnapshot.forEach((doc) => {
          productsData.push({ id: doc.id, ...doc.data() });
        });
        console.log('Products data:', productsData);
        setProducts(productsData);
      });
      return unsubscribe;
    };

    fetchBalance();
    const unsubscribeProducts = fetchProducts();

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

    return () => {
      unsubscribeProducts();
    };
  }, [navigation, user]);

  const handleProductPress = async (product) => {
    if (!user) {
      Alert.alert('Error', 'You must be logged in to make a purchase.');
      return;
    }

    const userRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userRef);

    if (userDoc.exists()) {
      const userData = userDoc.data();
      if (userData.balance >= product.price) {
        const newBalance = userData.balance - product.price;
        await updateDoc(userRef, { balance: newBalance });
        Alert.alert('Success', `You have successfully purchased ${product.name}.`);
        // Here you would typically add the purchased item to the user's inventory
      } else {
        Alert.alert('Error', 'You do not have enough balance to make this purchase.');
      }
    } else {
      Alert.alert('Error', 'Could not find user data.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.balanceText}>Balance: {balance}</Text>
      <FlatList
        data={products}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.itemContainer}>
            <View style={styles.imageContainer}>
              <Image source={{ uri: item.image }} style={styles.itemImage} />
            </View>
            <Text style={styles.itemName}>{item.name}</Text>
            <View style={styles.priceContainer}>
              <Text style={styles.itemPrice}>{item.price}</Text>
            </View>
            <View style={styles.descriptionContainer}>
              <Text style={styles.itemDescription}>{item.description}</Text>
            </View>
            <TouchableOpacity style={styles.buyButton} onPress={() => handleProductPress(item)}>
              <Text style={styles.buyButtonText}>BUY</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.detailsButton} onPress={() => navigation.navigate('ProductDetails', { product: item })}>
              <Text style={styles.detailsButtonText}>View Details</Text>
            </TouchableOpacity>
          </View>
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
  balanceText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FF1493',
    marginBottom: 20,
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
  detailsButton: {
    marginTop: 10,
    backgroundColor: '#333',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderColor: '#FF1493',
    borderWidth: 1,
  },
  detailsButtonText: {
    color: '#FF1493',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default EventShopScreen;

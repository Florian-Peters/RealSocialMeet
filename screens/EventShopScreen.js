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
    backgroundColor: '#1c1c1c',
    padding: 10,
  },
  balanceText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FF5C93',
    textAlign: 'center',
    marginBottom: 20,
  },
  itemContainer: {
    padding: 20,
    marginVertical: 10,
    borderRadius: 10,
    backgroundColor: '#333',
  },
  itemImage: {
    width: '100%',
    height: 180,
    borderRadius: 10,
    marginBottom: 15,
  },
  itemName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
  },
  itemPrice: {
    fontSize: 18,
    color: '#FF5C93',
    marginVertical: 10,
  },
  itemDescription: {
    fontSize: 14,
    color: '#aaa',
    marginBottom: 15,
  },
  buyButton: {
    backgroundColor: '#FF5C93',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  buyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  detailsButton: {
    marginTop: 10,
    backgroundColor: 'transparent',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    borderColor: '#FF5C93',
    borderWidth: 1,
  },
  detailsButtonText: {
    color: '#FF5C93',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default EventShopScreen;

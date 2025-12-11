import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, StyleSheet, Text, View } from 'react-native';
import { doc, getDoc, onSnapshot, updateDoc } from 'firebase/firestore';
import ProductCard from '../components/ProductCard';
import { auth, db } from '../components/firebase';
import { useFirestoreCollection } from '../hooks/useFirestoreCollection';

const EventShopScreen = ({ navigation }) => {
  const [balance, setBalance] = useState(0);
  const [processingProductId, setProcessingProductId] = useState(null);
  const user = auth.currentUser;

  const { data: products, loading: loadingProducts } = useFirestoreCollection('products');

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

  useEffect(() => {
    if (!user?.uid) {
      setBalance(0);
      return undefined;
    }

    const unsubscribe = onSnapshot(doc(db, 'users', user.uid), (snapshot) => {
      setBalance(snapshot.exists() ? snapshot.data().balance ?? 0 : 0);
    });

    return () => unsubscribe();
  }, [user?.uid]);

  const sortedProducts = useMemo(
    () => [...products].sort((a, b) => (a.price ?? 0) - (b.price ?? 0)),
    [products]
  );

  const handleProductPress = async (product) => {
    if (!user?.uid) {
      Alert.alert('Fehler', 'Bitte melde dich an, um Produkte zu kaufen.');
      return;
    }

    setProcessingProductId(product.id);
    try {
      const userRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userRef);

      if (!userDoc.exists()) {
        Alert.alert('Fehler', 'Benutzerkonto nicht gefunden.');
        return;
      }

      const currentBalance = userDoc.data().balance ?? 0;
      if (currentBalance < (product.price ?? 0)) {
        Alert.alert('Fehler', 'Dein Kontostand reicht nicht aus.');
        return;
      }

      const newBalance = currentBalance - (product.price ?? 0);
      await updateDoc(userRef, { balance: newBalance });
      Alert.alert('Erfolg', `Du hast ${product.name} gekauft.`);
    } catch (error) {
      console.error('Purchase failed:', error);
      Alert.alert('Fehler', 'Beim Kauf ist etwas schiefgelaufen.');
    } finally {
      setProcessingProductId(null);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.balanceText}>Kontostand: {balance}</Text>
      {loadingProducts ? (
        <ActivityIndicator style={styles.loader} color="#FF5C93" />
      ) : (
        <FlatList
          data={sortedProducts}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ProductCard
              product={item}
              onBuyPress={handleProductPress}
              onDetailsPress={(product) => navigation.navigate('ProductDetails', { product })}
              disabled={processingProductId === item.id}
            />
          )}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateTitle}>Noch keine Produkte</Text>
              <Text style={styles.emptyStateDescription}>
                Schau später wieder vorbei oder füge neue Produkte im Admin-Bereich hinzu.
              </Text>
            </View>
          }
        />
      )}
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
    marginBottom: 12,
  },
  listContent: {
    paddingBottom: 24,
  },
  loader: {
    marginTop: 40,
  },
  emptyState: {
    marginTop: 80,
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  emptyStateTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  emptyStateDescription: {
    color: '#aaa',
    marginTop: 8,
    textAlign: 'center',
  },
});

export default EventShopScreen;

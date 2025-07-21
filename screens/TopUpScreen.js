import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, updateDoc, increment } from 'firebase/firestore';
import app from '../components/firebase';

const TopUpScreen = ({ navigation }) => {
  const [amount, setAmount] = useState('');
  const auth = getAuth(app);
  const db = getFirestore(app);
  const user = auth.currentUser;

  const handleTopUp = async () => {
    if (!user) {
      Alert.alert('Error', 'You must be logged in to top up your balance.');
      return;
    }

    const topUpAmount = parseInt(amount, 10);
    if (isNaN(topUpAmount) || topUpAmount <= 0) {
      Alert.alert('Error', 'Please enter a valid amount.');
      return;
    }

    const userRef = doc(db, 'users', user.uid);

    try {
      await updateDoc(userRef, {
        balance: increment(topUpAmount)
      });
      Alert.alert('Success', `Successfully topped up your balance by ${topUpAmount}.`);
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', 'Failed to top up your balance. Please try again.');
      console.error('Error topping up balance:', error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Top Up Your Balance</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter amount"
        placeholderTextColor="#FF1493"
        keyboardType="numeric"
        value={amount}
        onChangeText={setAmount}
      />
      <TouchableOpacity style={styles.button} onPress={handleTopUp}>
        <Text style={styles.buttonText}>Top Up</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1c1c1c',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FF1493',
    marginBottom: 20,
  },
  input: {
    width: '100%',
    height: 50,
    backgroundColor: '#333',
    borderRadius: 10,
    paddingHorizontal: 15,
    fontSize: 16,
    color: '#FF1493',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#FF1493',
    borderRadius: 10,
    paddingVertical: 15,
    paddingHorizontal: 30,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default TopUpScreen;

import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDoc, updateDoc } from 'firebase/firestore';
import app from '../components/firebase';

const EditProfileScreen = ({ navigation }) => {
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const auth = getAuth(app);
  const db = getFirestore(app);
  const user = auth.currentUser;

  useEffect(() => {
    const fetchUserData = async () => {
      if (user) {
        const userRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userRef);
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setUsername(userData.username);
          setBio(userData.bio);
        }
      }
    };
    fetchUserData();
  }, [user]);

  const handleSaveChanges = async () => {
    if (!user) {
      Alert.alert('Error', 'You must be logged in to edit your profile.');
      return;
    }

    const userRef = doc(db, 'users', user.uid);

    try {
      await updateDoc(userRef, {
        username,
        bio,
      });
      Alert.alert('Success', 'Your profile has been updated successfully.');
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', 'Failed to update your profile. Please try again.');
      console.error('Error updating profile:', error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Edit Your Profile</Text>
      <TextInput
        style={styles.input}
        placeholder="Username"
        placeholderTextColor="#FF1493"
        value={username}
        onChangeText={setUsername}
      />
      <TextInput
        style={styles.input}
        placeholder="Bio"
        placeholderTextColor="#FF1493"
        value={bio}
        onChangeText={setBio}
        multiline
      />
      <TouchableOpacity style={styles.button} onPress={handleSaveChanges}>
        <Text style={styles.buttonText}>Save Changes</Text>
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

export default EditProfileScreen;

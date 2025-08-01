import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../components/firebase';
import { useNavigation } from '@react-navigation/native';

const RegisterScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const navigation = useNavigation();

  const handleRegister = () => {
    if (email && password && password === confirmPassword) {
      createUserWithEmailAndPassword(auth, email, password)
        .then(async (userCredential) => {
          const user = userCredential.user;
          await setDoc(doc(db, "users", user.uid), {
            username: username,
            bio: bio,
            uid: user.uid,
            balance: 0,
          });
          alert('Registrierung erfolgreich!');
          navigation.navigate('MainApp', { screen: 'MapView', params: { username } });
        })
        .catch((error) => {
          alert('Fehler bei der Registrierung: ' + error.message);
        });
    } else {
      alert('Bitte geben Sie eine gültige E-Mail, ein Passwort und eine Biografie ein. Stellen Sie sicher, dass die Passwörter übereinstimmen.');
    }
  };

  const handleBack = () => {
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={handleBack} style={styles.backButton}>
        <Text style={styles.backButtonText}>← Zurück</Text>
      </TouchableOpacity>
      <Text style={styles.title}>Registrieren</Text>
      <TextInput
        style={styles.input}
        placeholder="E-Mail"
        placeholderTextColor="#aaaaaa"
        onChangeText={setEmail}
        value={email}
      />
      <TextInput
        style={styles.input}
        placeholder="Passwort"
        placeholderTextColor="#aaaaaa"
        secureTextEntry
        onChangeText={setPassword}
        value={password}
      />
      <TextInput
        style={styles.input}
        placeholder="Passwort bestätigen"
        placeholderTextColor="#aaaaaa"
        secureTextEntry
        onChangeText={setConfirmPassword}
        value={confirmPassword}
      />
      <TextInput
        style={styles.input}
        placeholder="Benutzername"
        placeholderTextColor="#aaaaaa"
        onChangeText={setUsername}
        value={username}
      />
      <TextInput
        style={styles.input}
        placeholder="Biografie"
        placeholderTextColor="#aaaaaa"
        onChangeText={setBio}
        value={bio}
      />
      <TouchableOpacity style={styles.button} onPress={handleRegister}>
        <Text style={styles.buttonText}>Registrieren</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1c1c1c',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  backButton: {
    position: 'absolute',
    top: 40,
    left: 20,
  },
  backButtonText: {
    fontSize: 18,
    color: '#FF5C93',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 20,
  },
  input: {
    width: '100%',
    height: 50,
    backgroundColor: '#333',
    borderRadius: 8,
    paddingHorizontal: 15,
    marginVertical: 10,
    color: '#fff',
  },
  button: {
    width: '100%',
    height: 50,
    backgroundColor: '#FF5C93',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default RegisterScreen;

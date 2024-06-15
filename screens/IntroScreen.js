// IntroScreen.js
import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';

const IntroScreen = ({ navigation }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      navigation.replace('Login'); // Verwenden Sie 'Login' statt 'MainApp'
    }, 3000); // 3 Sekunden Verzögerung

    return () => clearTimeout(timer);
  }, [navigation]);

  return (
    <View style={styles.container}>
      <Image source={require('../assets/Geomeet.png')} style={styles.logo} />
      <Text style={styles.text}>Willkommen bei GeoMeet!</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  logo: {
    width: 200,
    height: 200,
    marginBottom: 20,
  },
  text: {
    color: '#fff',
    fontSize: 24,
    textAlign: 'center',
  },
});

export default IntroScreen;

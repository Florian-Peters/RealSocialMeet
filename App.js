import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { app, auth, db } from './components/firebase';
import LoginScreen from './screens/Login';
import RegisterScreen from './screens/RegisterScreen';
import IntroScreen from './screens/IntroScreen';
import { GpsProvider } from './Context/GpsContext';
import TabNavigator from './navigation/TabNavigator';
import { UserProvider } from './UserContext';
import ProductDetailsScreen from './screens/ProductDetailsScreen';
import UploadScreen from './screens/UploadScreen';
import ChatComponent from './screens/ChatComponent';
import ProfileScreen from './screens/ProfileScreen';
import TopUpScreen from './screens/TopUpScreen';
import EditProfileScreen from './screens/EditProfileScreen';

const Stack = createNativeStackNavigator();

const App = () => {
  const [initializing, setInitializing] = useState(true);
  const [user, setUser] = useState();
  const [showIntro, setShowIntro] = useState(true);

  function onAuthStateChanged(user) {
    setUser(user);
    if (initializing) setInitializing(false);
  }

  useEffect(() => {
    const subscriber = onAuthStateChanged(auth, onAuthStateChanged);
    return subscriber; // unsubscribe on unmount
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowIntro(false);
    }, 3000); // Set the duration of the intro screen

    return () => clearTimeout(timer);
  }, []);

  if (initializing) return null;

  return (
    <UserProvider>
      <GpsProvider>
        <NavigationContainer>
          <Stack.Navigator initialRouteName="Intro">
            {showIntro ? (
              <Stack.Screen name="Intro" component={IntroScreen} options={{ headerShown: false }} />
            ) : (
              <>
                <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
                <Stack.Screen name="Register" component={RegisterScreen} options={{ headerShown: false }} />
                <Stack.Screen name="MainApp" component={TabNavigator} options={{ headerShown: false }} />
                <Stack.Screen name="ProductDetails" component={ProductDetailsScreen} />
                <Stack.Screen name="Upload" component={UploadScreen} />
                <Stack.Screen name="Chat" component={ChatComponent} />
                <Stack.Screen name="Profile" component={ProfileScreen} />
                <Stack.Screen name="TopUp" component={TopUpScreen} />
                <Stack.Screen name="EditProfile" component={EditProfileScreen} />
              </>
            )}
          </Stack.Navigator>
        </NavigationContainer>
      </GpsProvider>
    </UserProvider>
  );
};

export default App;

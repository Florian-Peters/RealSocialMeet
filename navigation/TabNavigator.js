import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/Ionicons';
import MapViewScreen from '../screens/MapViewScreen';
import ChatListScreen from '../screens/ChatListScreen';
import EventShopScreen from '../screens/EventShopScreen';
import PostScreen from '../screens/PostScreen';
import ChatComponent from '../screens/ChatComponent'; // assuming it is a screen

const Tab = createBottomTabNavigator();

const TabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          switch (route.name) {
            case 'MapView':
              iconName = focused ? 'map' : 'map-outline';
              break;
            case 'ChatList':
              iconName = focused ? 'chatbubbles' : 'chatbubbles-outline';
              break;
            case 'EventShop':
              iconName = focused ? 'cart' : 'cart-outline';
              break;
            case 'Post':
              iconName = focused ? 'add-circle' : 'add-circle-outline';
              break;
            case 'Chat':
              iconName = focused ? 'chatbox' : 'chatbox-outline';
              break;
          }

          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#FF1493',
        tabBarInactiveTintColor: 'gray',
        tabBarStyle: { backgroundColor: '#1c1c1c' },
      })}
    >
      <Tab.Screen name="MapView" component={MapViewScreen} options={{ headerShown: false }} />
      <Tab.Screen name="ChatList" component={ChatListScreen} />
      <Tab.Screen name="EventShop" component={EventShopScreen} />
      <Tab.Screen name="Post" component={PostScreen} />
    </Tab.Navigator>
  );
};

export default TabNavigator;

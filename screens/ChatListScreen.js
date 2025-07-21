import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { getFirestore, collection, query, onSnapshot, where, orderBy, getDocs } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import app from '../components/firebase';
import { useNavigation } from '@react-navigation/native';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1c1c1c',
    padding: 10,
  },
  chatItem: {
    backgroundColor: '#333',
    padding: 15,
    borderRadius: 10,
    marginVertical: 5,
  },
  chatName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FF5C93',
  },
  chatMessage: {
    fontSize: 14,
    color: '#fff',
    marginVertical: 5,
  },
  chatDate: {
    fontSize: 12,
    color: '#aaa',
  },
  noChatsText: {
    color: '#fff',
    textAlign: 'center',
    marginTop: 20,
  },
});

const ChatListScreen = ({ navigation }) => {
  const [chats, setChats] = useState([]);
  const auth = getAuth(app);
  const user = auth.currentUser;

  useEffect(() => {
    navigation.setOptions({
      title: 'Chat List',
      headerStyle: {
        backgroundColor: '#000',
      },
      headerTintColor: '#FF1493',
      headerBackTitleVisible: false,
    });

    if (user) {
      const db = getFirestore(app);
      const q = query(
        collection(db, 'messages'),
        where('user._id', '==', user.uid),
        orderBy('createdAt', 'desc')
      );

      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const chatMap = new Map();
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          const otherUser = data.user._id === user.uid ? data.receiver : data.user;
          if (!chatMap.has(otherUser._id)) {
            chatMap.set(otherUser._id, {
              _id: otherUser._id,
              name: otherUser.name,
              lastMessage: data.text,
              createdAt: data.createdAt?.toDate().toISOString() || new Date().toISOString(),
            });
          } else {
            const existingChat = chatMap.get(otherUser._id);
            if (existingChat.createdAt < data.createdAt?.toDate()) {
              existingChat.lastMessage = data.text;
              existingChat.createdAt = data.createdAt?.toDate().toISOString() || new Date().toISOString();
            }
          }
        });
        const chatList = Array.from(chatMap.values()).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setChats(chatList);
      });

      return () => unsubscribe();
    }
  }, [user, navigation]);

  const handleChatPress = async (chat) => {
    try {
      const userId = await getUserIdByUsername(chat.name);
      if (userId) {
        const selectedUser = {
          uid: userId,
          username: chat.name,
          gpsEnabled: false,
          image: '',
          latitude: 0,
          longitude: 0,
        };
        navigation.navigate('Chat', { selectedUser });
      } else {
        console.warn('Benutzer nicht gefunden.');
      }
    } catch (error) {
      console.error('Fehler beim Abrufen der Benutzer-ID:', error);
    }
  };

  const getUserIdByUsername = async (username) => {
    const usersCollection = collection(getFirestore(app), 'users');
    const userQuery = query(usersCollection, where('username', '==', username));
    const userSnapshot = await getDocs(userQuery);
    return userSnapshot.docs.length > 0 ? userSnapshot.docs[0].data().uid : null;
  };

  return (
    <View style={styles.container}>
      {chats.length === 0 ? (
        <Text style={styles.noChatsText}>Keine Chats vorhanden</Text>
      ) : (
        chats.map((chat) => (
          <TouchableOpacity
            key={chat._id}
            style={styles.chatItem}
            onPress={() => handleChatPress(chat)}
          >
            <Text style={styles.chatName}>{chat.name}</Text>
            <Text style={styles.chatMessage}>{chat.lastMessage}</Text>
            <Text style={styles.chatDate}>{chat.createdAt}</Text>
          </TouchableOpacity>
        ))
      )}
    </View>
  );
};

export default ChatListScreen;

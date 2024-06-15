import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Platform, KeyboardAvoidingView, Keyboard } from 'react-native';
import { GiftedChat, Bubble, InputToolbar, Composer, Send } from 'react-native-gifted-chat';
import { getFirestore, collection, addDoc, query, onSnapshot, orderBy, where, doc, getDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import app from '../components/firebase';
import { useNavigation, useRoute } from '@react-navigation/native';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    paddingTop: 20,
  },
  inputToolbar: {
    backgroundColor: '#1c1c1c',
    borderTopColor: '#333',
    borderTopWidth: 1,
  },
  composer: {
    backgroundColor: '#333',
    color: '#fff',
    borderRadius: 20,
    paddingHorizontal: 10,
  },
  sendButton: {
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 10,
  },
});

const ChatComponent = () => {
  const [messages, setMessages] = useState([]);
  const [username, setUsername] = useState('');
  const auth = getAuth(app);
  const user = auth.currentUser;
  const navigation = useNavigation();
  const route = useRoute();
  const { selectedUser } = route.params || {};

  useEffect(() => {
    navigation.setOptions({
      title: selectedUser ? `Chat with ${selectedUser.username}` : 'Chat',
      headerStyle: {
        backgroundColor: '#000',
      },
      headerTintColor: '#FF1493',
      headerBackTitleVisible: false,
    });

    if (selectedUser) {
      setUsername(selectedUser.username);
      const fetchMessages = async () => {
        if (user && selectedUser) {
          const q = query(
            collection(getFirestore(app), 'messages'),
            orderBy('createdAt', 'desc'),
            where('user._id', 'in', [user.uid, selectedUser.uid]),
            where('receiver._id', 'in', [user.uid, selectedUser.uid])
          );

          const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const newMessages = querySnapshot.docs.map((doc) => {
              const data = doc.data();
              return {
                _id: doc.id,
                text: data.text,
                createdAt: data.createdAt?.toDate() || new Date(),
                user: {
                  _id: data.user?._id || '',
                  name: data.user?.name || '',
                },
                receiver: {
                  _id: data.receiver?._id || '',
                  name: data.receiver?.name || '',
                },
              };
            });
            setMessages(newMessages);
          });

          return () => unsubscribe();
        }
      };

      fetchMessages();
    }
  }, [user, selectedUser, navigation]);

  const handleSend = async (newMessages = []) => {
    if (user && selectedUser) {
      const text = newMessages[0].text;
      const db = getFirestore(app);
      const docRef = doc(db, 'users', user.uid);
      getDoc(docRef)
        .then((docSnap) => {
          if (docSnap.exists()) {
            const username = docSnap.data().username;
            const receiverData = {
              _id: selectedUser.uid,
              name: selectedUser.username,
            };

            const messageToSend = {
              text,
              createdAt: new Date(),
              user: {
                _id: user.uid,
                name: username,
              },
              receiver: receiverData,
            };
            addDoc(collection(db, 'messages'), messageToSend);
            Keyboard.dismiss();
          } else {
            console.log('No such document!');
          }
        })
        .catch((error) => {
          console.log('Error getting document:', error);
        });
    }
  };

  const renderBubble = (props) => (
    <Bubble
      {...props}
      wrapperStyle={{
        right: {
          backgroundColor: '#FF1493',
        },
        left: {
          backgroundColor: '#007aff',
        },
      }}
      textStyle={{
        right: {
          color: '#fff',
        },
        left: {
          color: '#fff',
        },
      }}
    />
  );

  const renderInputToolbar = (props) => (
    <InputToolbar
      {...props}
      containerStyle={styles.inputToolbar}
    />
  );

  const renderComposer = (props) => (
    <Composer
      {...props}
      textInputStyle={styles.composer}
    />
  );

  const renderSend = (props) => (
    <Send {...props}>
      <View style={styles.sendButton}>
        <Text style={{ color: '#FF1493', fontWeight: 'bold' }}>Send</Text>
      </View>
    </Send>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
    >
      <GiftedChat
        messages={messages}
        onSend={(newMessages) => handleSend(newMessages)}
        user={{
          _id: user ? user.uid : 1,
        }}
        renderBubble={renderBubble}
        renderInputToolbar={renderInputToolbar}
        renderComposer={renderComposer}
        renderSend={renderSend}
      />
    </KeyboardAvoidingView>
  );
};

export default ChatComponent;

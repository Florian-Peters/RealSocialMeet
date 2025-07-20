import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const Comment = ({ comment }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.username}>{comment.username}</Text>
      <Text style={styles.text}>{comment.text}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  username: {
    fontWeight: 'bold',
    color: '#FF1493',
  },
  text: {
    color: '#fff',
  },
});

export default Comment;

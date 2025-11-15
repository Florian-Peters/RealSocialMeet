import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const EventCard = ({ event, onPress }) => {
  if (!event) {
    return null;
  }

  const title = event.eventname || event.title || 'Unnamed event';
  const description = event.eventDescription || event.description || '';
  const category = event.category || event.eventType || null;
  const date = event.date || event.startDate || null;

  return (
    <TouchableOpacity style={styles.card} onPress={() => onPress?.(event)}>
      {event.image ? (
        <Image source={{ uri: event.image }} style={styles.image} />
      ) : (
        <View style={[styles.image, styles.placeholder]}>
          <Text style={styles.placeholderText}>No image</Text>
        </View>
      )}
      <View style={styles.textContainer}>
        <Text style={styles.title}>{title}</Text>
        {category ? <Text style={styles.category}>{category}</Text> : null}
        {date ? <Text style={styles.date}>{String(date)}</Text> : null}
        {description ? <Text style={styles.description} numberOfLines={2}>{description}</Text> : null}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#2a2a2a',
    borderRadius: 14,
    overflow: 'hidden',
    marginVertical: 8,
  },
  image: {
    width: '100%',
    height: 180,
    backgroundColor: '#1c1c1c',
  },
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    color: '#777',
    fontSize: 12,
  },
  textContainer: {
    padding: 16,
  },
  title: {
    fontSize: 18,
    color: '#fff',
    fontWeight: 'bold',
  },
  category: {
    marginTop: 4,
    color: '#FF5C93',
    textTransform: 'uppercase',
    fontSize: 12,
    letterSpacing: 1,
  },
  date: {
    marginTop: 4,
    color: '#ccc',
    fontSize: 12,
  },
  description: {
    marginTop: 8,
    color: '#ddd',
    fontSize: 14,
  },
});

export default EventCard;

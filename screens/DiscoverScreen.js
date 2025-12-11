import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import EventCard from '../components/EventCard';
import { useFirestoreCollection } from '../hooks/useFirestoreCollection';

const ACCENT = '#FF5C93';
const BACKGROUND = '#1c1c1c';

const DiscoverScreen = () => {
  const navigation = useNavigation();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const { data: events, loading: eventsLoading } = useFirestoreCollection('events', {
    orderBy: { field: 'createdAt', direction: 'desc' },
  });
  const { data: posts, loading: postsLoading } = useFirestoreCollection('posts', {
    orderBy: { field: 'createdAt', direction: 'desc' },
  });

  const categories = useMemo(() => {
    const unique = new Set();
    events.forEach((event) => {
      if (event?.category) {
        unique.add(event.category);
      } else if (event?.eventType) {
        unique.add(event.eventType);
      }
    });
    return ['all', ...Array.from(unique)];
  }, [events]);

  const filteredEvents = useMemo(() => {
    const queryLower = searchQuery.trim().toLowerCase();

    return events.filter((event) => {
      const category = (event.category || event.eventType || '').toLowerCase();
      const matchesCategory = selectedCategory === 'all' || category === selectedCategory.toLowerCase();

      if (!matchesCategory) {
        return false;
      }

      if (!queryLower) {
        return true;
      }

      const target = [
        event.eventname,
        event.title,
        event.eventDescription,
        event.description,
      ]
        .filter(Boolean)
        .join(' ') // combine text fields
        .toLowerCase();

      return target.includes(queryLower);
    });
  }, [events, searchQuery, selectedCategory]);

  const trendingPosts = useMemo(() => {
    return [...posts]
      .sort((a, b) => (b.likes ?? 0) - (a.likes ?? 0))
      .slice(0, 3);
  }, [posts]);

  const handleEventPress = (event) => {
    navigation.navigate('MapView', { highlightEventId: event.id });
  };

  const renderCategory = (category) => {
    const isActive = selectedCategory === category;
    return (
      <TouchableOpacity
        key={category}
        style={[styles.categoryChip, isActive && styles.categoryChipActive]}
        onPress={() => setSelectedCategory(category)}
      >
        <Text style={[styles.categoryChipText, isActive && styles.categoryChipTextActive]}>
          {category.toUpperCase()}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>Entdecke neue Events</Text>
      <Text style={styles.subheading}>
        Finde angesagte Veranstaltungen und sieh, was deine Community teilt.
      </Text>

      <TextInput
        placeholder="Suche nach Events oder Schlagwörtern"
        placeholderTextColor="#888"
        style={styles.searchInput}
        value={searchQuery}
        onChangeText={setSearchQuery}
      />

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoryContainer}
        contentContainerStyle={styles.categoryContent}
      >
        {categories.map(renderCategory)}
      </ScrollView>

      {eventsLoading ? (
        <ActivityIndicator style={styles.loader} color={ACCENT} />
      ) : (
        <FlatList
          data={filteredEvents}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <EventCard event={item} onPress={handleEventPress} />}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateTitle}>Keine passenden Events gefunden</Text>
              <Text style={styles.emptyStateDescription}>
                Passe deine Filter an oder lade neue Erlebnisse hoch!
              </Text>
            </View>
          }
          scrollEnabled={false}
        />
      )}

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Trending Posts</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Post')}>
          <Text style={styles.sectionLink}>Alle anzeigen</Text>
        </TouchableOpacity>
      </View>

      {postsLoading ? (
        <ActivityIndicator style={styles.loader} color={ACCENT} />
      ) : (
        <View style={styles.trendingList}>
          {trendingPosts.map((post) => (
            <TouchableOpacity
              key={post.id}
              style={styles.trendingCard}
              onPress={() => navigation.navigate('Post')}
            >
              <Text style={styles.trendingTitle}>{post.title || 'Untitled Post'}</Text>
              <Text style={styles.trendingMeta} numberOfLines={1}>
                {post.user?.username ? `von ${post.user.username}` : 'Unbekannt'}
              </Text>
              <Text style={styles.trendingDescription} numberOfLines={2}>
                {post.description || post.text || 'Keine Beschreibung vorhanden.'}
              </Text>
              <Text style={styles.trendingLikes}>{`${post.likes ?? 0} Likes`}</Text>
            </TouchableOpacity>
          ))}
          {trendingPosts.length === 0 ? (
            <Text style={styles.emptyStateDescription}>
              Es gibt noch keine Beiträge. Teile als Erste*r deine Highlights!
            </Text>
          ) : null}
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BACKGROUND,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  heading: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  subheading: {
    color: '#ccc',
    marginTop: 4,
  },
  searchInput: {
    marginTop: 20,
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: '#fff',
  },
  categoryContainer: {
    marginTop: 16,
  },
  categoryContent: {
    paddingVertical: 4,
  },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#2a2a2a',
    marginRight: 10,
  },
  categoryChipActive: {
    backgroundColor: ACCENT,
  },
  categoryChipText: {
    color: '#bbb',
    fontWeight: '500',
    fontSize: 12,
  },
  categoryChipTextActive: {
    color: '#fff',
  },
  loader: {
    marginVertical: 20,
  },
  emptyState: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyStateTitle: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
  },
  emptyStateDescription: {
    color: '#aaa',
    marginTop: 8,
    textAlign: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 32,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  sectionLink: {
    color: ACCENT,
    fontWeight: '600',
  },
  trendingList: {
    marginTop: 16,
  },
  trendingCard: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  trendingTitle: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  trendingMeta: {
    color: '#ccc',
    marginTop: 4,
  },
  trendingDescription: {
    color: '#ddd',
    marginTop: 8,
    fontSize: 14,
  },
  trendingLikes: {
    marginTop: 12,
    color: ACCENT,
    fontWeight: '600',
  },
});

export default DiscoverScreen;

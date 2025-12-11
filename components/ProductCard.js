import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const ProductCard = ({
  product,
  onBuyPress,
  onDetailsPress,
  disabled = false,
}) => {
  if (!product) {
    return null;
  }

  return (
    <View style={styles.card}>
      {product.image ? (
        <Image source={{ uri: product.image }} style={styles.image} />
      ) : (
        <View style={[styles.image, styles.placeholder]}>
          <Text style={styles.placeholderText}>No image</Text>
        </View>
      )}
      <Text style={styles.title}>{product.name}</Text>
      <Text style={styles.price}>{product.price ?? 0}</Text>
      {product.description ? (
        <Text style={styles.description}>{product.description}</Text>
      ) : null}
      <TouchableOpacity
        style={[styles.actionButton, disabled && styles.actionButtonDisabled]}
        onPress={() => onBuyPress?.(product)}
        disabled={disabled}
      >
        <Text style={styles.actionButtonText}>
          {disabled ? 'Processing…' : 'Buy'}
        </Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.secondaryButton} onPress={() => onDetailsPress?.(product)}>
        <Text style={styles.secondaryButtonText}>View details</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: 20,
    marginVertical: 10,
    borderRadius: 12,
    backgroundColor: '#333',
  },
  image: {
    width: '100%',
    height: 180,
    borderRadius: 10,
    marginBottom: 15,
    backgroundColor: '#222',
  },
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    color: '#777',
    fontSize: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
  },
  price: {
    fontSize: 18,
    color: '#FF5C93',
    marginVertical: 10,
  },
  description: {
    fontSize: 14,
    color: '#aaa',
    marginBottom: 15,
  },
  actionButton: {
    backgroundColor: '#FF5C93',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  actionButtonDisabled: {
    opacity: 0.6,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  secondaryButton: {
    marginTop: 10,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    borderColor: '#FF5C93',
    borderWidth: 1,
  },
  secondaryButtonText: {
    color: '#FF5C93',
    fontSize: 16,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
});

export default ProductCard;

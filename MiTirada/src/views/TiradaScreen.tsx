import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function TiradaScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Mi Tirada</Text>
      <Text style={styles.subtitle}>Pantalla inicial de prueba</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f2f2f2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
});

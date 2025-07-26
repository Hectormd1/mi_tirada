// src/views/InicioScreen.tsx

import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import db from '../config/db';
import { PlatoResumen } from '../types/types';

type InicioNavProp = NativeStackNavigationProp<RootStackParamList, 'Inicio'>;

export default function InicioScreen() {
  const navigation = useNavigation<InicioNavProp>();
  const [ultimaTirada, setUltimaTirada] = useState<{
    tirador: string;
    resultados: PlatoResumen[];
  } | null>(null);

  useEffect(() => {
    db.transaction(tx => {
      tx.executeSql(
        `SELECT nombre, resultados
           FROM tiradas
           ORDER BY id DESC
           LIMIT 1;`,
        [],
        (_, { rows }) => {
          if (rows.length > 0) {
            const { nombre, resultados: json } = rows.item(0);
            let parsed: PlatoResumen[] = [];
            try {
              parsed = JSON.parse(json);
            } catch {}
            setUltimaTirada({ tirador: nombre, resultados: parsed });
          } else {
            setUltimaTirada(null);
          }
        },
      );
    });
  }, []);

  const irATirada = () => navigation.navigate('Tirada');
  const irAHistorial = () => navigation.navigate('Historial');
  const irAResumen = () => {
    if (!ultimaTirada) {
      Alert.alert('No hay tiradas completadas aún');
      return;
    }
    navigation.navigate('Resumen', ultimaTirada);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Mi Tirada</Text>

      <TouchableOpacity style={styles.button} onPress={irATirada}>
        <Text style={styles.buttonText}>EMPEZAR TIRADA</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={irAResumen}>
        <Text style={styles.buttonText}>RESUMEN ULTIMA TIRADA</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.button} onPress={irAHistorial}>
        <Text style={styles.buttonText}>HISTORIAL DE TIRADAS</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  button: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 5,
    marginVertical: 5,
  },
  buttonText: { color: '#fff', fontWeight: 'bold', textAlign: 'center' },
});

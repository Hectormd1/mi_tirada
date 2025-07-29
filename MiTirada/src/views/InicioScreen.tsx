import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/types';
import db from '../config/db';
import { PlatoResumen } from '../types/types';
import { useAppColors } from '../DisplayMode/colors';

type InicioNavProp = NativeStackNavigationProp<RootStackParamList, 'Inicio'>;

export default function InicioScreen() {
  const navigation = useNavigation<InicioNavProp>();
  const colors = useAppColors();
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
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Image
        source={require('../assets/logo.png')}
        style={{ width: 200, height: 200, resizeMode: 'contain', marginTop: -30 }}
      />

      <View style={styles.buttonRow}>
        <TouchableOpacity style={[styles.button, { backgroundColor: colors.primaryBtn }]} onPress={irATirada}>
          <Text style={[styles.buttonText, { color: colors.headerText }]}>EMPEZAR TIRADA</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.button, { backgroundColor: colors.primaryBtn }]} onPress={irAResumen}>
          <Text style={[styles.buttonText, { color: colors.headerText }]}>ULTIMA TIRADA</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.button, { backgroundColor: colors.primaryBtn }]} onPress={irAHistorial}>
          <Text style={[styles.buttonText, { color: colors.headerText }]}>HISTORIAL</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', },
  buttonRow: {
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 5,
    marginHorizontal: 5,
    width: 160,
  },
  buttonText: { fontWeight: 'bold', textAlign: 'center' },
});

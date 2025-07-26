import React, { useState, useEffect, useLayoutEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  BackHandler,
} from 'react-native';
import {
  useFocusEffect,
  useNavigation,
  useRoute
} from '@react-navigation/native';
import { HeaderBackButton } from '@react-navigation/elements';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/AppNavigator';
import db from '../config/db';
import { PlatoResumen } from '../types/types';



type ResumenRouteProp = RouteProp<RootStackParamList, 'ResumenTirada'>;
type ResumenNavProp = NativeStackNavigationProp<
  RootStackParamList,
  'ResumenTirada'
>;

export default function ResumenTiradaScreen() {
  const navigation = useNavigation<ResumenNavProp>();
  const route = useRoute<ResumenRouteProp>();

  // Estado local: tirador + resultados
  const [tirador, setTirador] = useState<string | null>(null);
  const [resultados, setResultados] = useState<PlatoResumen[]>([]);

  // Función para cargar última tirada de la BBDD
  const cargarUltimaTirada = () => {
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
            setTirador(nombre);
            try {
              const parsed: PlatoResumen[] = JSON.parse(json);
              setResultados(parsed);
            } catch {
              setResultados([]);
            }
          } else {
            setTirador('—');
            setResultados([]);
          }
        }
      );
    });
  };

  // Si llegan params (desde TiradaScreen), úsalos; si no, carga última
  useEffect(() => {
    if (route.params?.tirador && route.params?.resultados) {
      setTirador(route.params.tirador);
      setResultados(route.params.resultados);
    } else {
      cargarUltimaTirada();
    }
  }, [route.params]);

  // Conteo de aciertos
  const total = resultados.filter(r => r.resultado !== 'fallo').length;

  // Botón físico atrás
  useFocusEffect(
    useCallback(() => {
      const sub = BackHandler.addEventListener('hardwareBackPress', () => {
        navigation.navigate('Inicio');
        return true;
      });
      return () => sub.remove();
    }, [navigation])
  );

  // Flecha de header
  useLayoutEffect(() => {
    navigation.setOptions({
      headerLeft: props => (
        <HeaderBackButton
          {...props}
          onPress={() => navigation.navigate('Inicio')}
        />
      ),
    });
  }, [navigation]);

  // Renderizado de iconos y estilos
  const renderIcon = (r: PlatoResumen) =>
    r.resultado === 'acierto1' ? '✅'
      : r.resultado === 'acierto2' ? '2️⃣'
      : '❌';

  const cellStyle = (r: PlatoResumen) =>
    r.resultado === 'acierto1' || 
    r.resultado === 'acierto2' ? styles.acierto1
    : styles.fallo;

  return (
    <View style={styles.flex}>
      <ScrollView horizontal contentContainerStyle={styles.container}>
        <View style={styles.table}>
          {/* Cabecera */}
          <View style={styles.row}>
            <Text style={[styles.cell, styles.header, styles.nameCell]}>
              Tirador
            </Text>
            {Array.from({ length: resultados.length }, (_, i) => (
              <Text key={`h-${i}`} style={[styles.cell, styles.header]}>
                {resultados[i].numero}
              </Text>
            ))}
            <Text style={[styles.cell, styles.header, styles.totalCell]}>
              Total
            </Text>
          </View>
          {/* Datos */}
          <View style={styles.row}>
            <Text style={[styles.cell, styles.nameCell]}>
              {tirador ?? '—'}
            </Text>
            {resultados.map(r => (
              <Text key={`r-${r.numero}`} style={[styles.cell, cellStyle(r)]}>
                {renderIcon(r)}
              </Text>
            ))}
            <Text style={[styles.cell, styles.totalCell]}>{total}</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { paddingHorizontal: 10, alignItems: 'center' },
  table: { marginVertical: 20 },
  row: { flexDirection: 'row' },
  cell: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 8,
    minWidth: 50,
    textAlign: 'center',
  },
  header: { fontWeight: 'bold', backgroundColor: '#eee' },
  nameCell: { minWidth: 100, backgroundColor: '#fafafa' },
  totalCell: { minWidth: 100, backgroundColor: '#fafafa' },
  acierto1: { backgroundColor: '#c8e6c9' },
  acierto2: { backgroundColor: '#90caf9' },
  fallo: { backgroundColor: '#ffcdd2' },
});

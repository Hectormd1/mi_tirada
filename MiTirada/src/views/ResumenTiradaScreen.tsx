import React, { useState, useEffect, useCallback } from 'react';
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
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../types/types';
import db from '../config/db';
import { PlatoResumen } from '../types/types';
import FontAwesome6 from 'react-native-vector-icons/FontAwesome6';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import { useAppColors } from '../DisplayMode/colors';

type ResumenRouteProp = RouteProp<RootStackParamList, 'Resumen'>;
type ResumenNavProp = NativeStackNavigationProp<RootStackParamList, 'Resumen'>;

// Parámetros de diseño
const NAME_COL_WIDTH = 100;
const TOTAL_COL_WIDTH = 100;
const ROW_HEIGHT = 40;
const NUM_ROWS = 2; // cabecera + datos
const TABLE_HEIGHT = ROW_HEIGHT * NUM_ROWS;

// Ajuste de separación superior
const EXTRA_TOP = 75;

export default function ResumenTiradaScreen() {
  const colors = useAppColors();
  const navigation = useNavigation<ResumenNavProp>();
  const route = useRoute<ResumenRouteProp>();
  const [tirador, setTirador] = useState<string>('—');
  const [resultados, setResultados] = useState<PlatoResumen[]>([]);

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
            try { setResultados(JSON.parse(json)); } catch { setResultados([]); }
          }
        }
      );
    });
  };

  useEffect(() => {
    if (route.params?.tirador && route.params?.resultados) {
      setTirador(route.params.tirador);
      setResultados(route.params.resultados);
    } else {
      cargarUltimaTirada();
    }
  }, [route.params]);

  const total = resultados.filter(r => r.resultado !== 'fallo').length;

  useFocusEffect(useCallback(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      navigation.navigate('Inicio');
      return true;
    });
    return () => sub.remove();
  }, [navigation]));

  // Icono según resultado
  const renderIcon = (r: PlatoResumen) =>
    r.resultado === 'acierto1' ? (
      <FontAwesome5 name="check" size={20} color="green" />
    ) : r.resultado === 'acierto2' ? (
      <FontAwesome6 name="check-double" size={20} color="green" />
    ) : (
      <FontAwesome6 name="xmark" size={20} color={colors.trash} />
    );

  const cellBg = (r: PlatoResumen) =>
    r.resultado === 'fallo'
      ? { backgroundColor: colors.fallo }
      : { backgroundColor: colors.acierto };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Separación superior con fondo */}
      <View style={{ backgroundColor: colors.background, paddingTop: EXTRA_TOP }}>
        {/* Tabla de resumen */}
        <View style={styles.tableWrapper}>
          {/* Columna fija Tirador */}
          <View style={[styles.leftSticky, { backgroundColor: colors.nameCell }]}>
            <View style={[
              styles.row,
              styles.headerRow,
              { backgroundColor: colors.headerBg }
            ]}>
              <Text style={[
                styles.cell,
                styles.header,
                { width: NAME_COL_WIDTH, borderColor: colors.cellBorder, color: colors.headerText }
              ]}>
                Tirador
              </Text>
            </View>
            <View style={[styles.row, { height: ROW_HEIGHT }]}>
              <Text style={[
                styles.cell,
                { width: NAME_COL_WIDTH, backgroundColor: colors.nameCell, borderColor: colors.cellBorder, color: colors.text }
              ]}>
                <Text style={[styles.boldText, { color: colors.text }]}>{tirador}</Text>
              </Text>
            </View>
          </View>

          {/* Scroll central */}
          <View style={[styles.scrollWrapper]}>
            <ScrollView
              horizontal
              bounces={false}
              overScrollMode="never"
              alwaysBounceHorizontal={false}
              showsHorizontalScrollIndicator={false}
            >
              <View>
                <View style={[styles.row, styles.headerRow]}>
                  {resultados.map((r, i) => (
                    <Text
                      key={i}
                      style={[
                        styles.cell,
                        styles.header,
                        {
                          backgroundColor: colors.headerBg,
                          color: colors.headerText,
                          borderColor: colors.cellBorder,
                        }
                      ]}
                    >
                      {r.numero}
                    </Text>
                  ))}
                </View>
                <View style={[styles.row, { height: ROW_HEIGHT }]}>
                  {resultados.map((r, i) => (
                    <Text
                      key={i}
                      style={[
                        styles.cell,
                        cellBg(r),
                        { borderColor: colors.cellBorder, color: colors.text }
                      ]}
                    >
                      {renderIcon(r)}
                    </Text>
                  ))}
                </View>
              </View>
            </ScrollView>
          </View>

          {/* Columna fija Total */}
          <View style={[styles.rightSticky, { backgroundColor: colors.totalCell }]}>
            <View style={[
              styles.row,
              styles.headerRow,
              { backgroundColor: colors.headerBg }
            ]}>
              <Text style={[
                styles.cell,
                styles.header,
                { width: TOTAL_COL_WIDTH, borderColor: colors.cellBorder, color: colors.headerText }
              ]}>
                Total
              </Text>
            </View>
            <View style={[styles.row, { height: ROW_HEIGHT }]}>
              <Text style={[
                styles.cell,
                { width: TOTAL_COL_WIDTH, backgroundColor: colors.totalCell, borderColor: colors.cellBorder, color: colors.text }
              ]}>
                <Text style={[styles.boldText, { color: colors.text }]}>{total}</Text>
              </Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  tableWrapper: {
    flexDirection: 'row',
    height: TABLE_HEIGHT,
    width: '100%',
    position: 'relative',
  },
  headerRow: {
    height: ROW_HEIGHT,
  },
  row: {
    flexDirection: 'row',
  },
  cell: {
    borderWidth: 1,
    borderColor: '#ccc', // Será sobrescrito por el inline style
    textAlign: 'center',
    padding: 8,
    minWidth: 50,
    height: ROW_HEIGHT,
    textAlignVertical: 'center',
  },
  header: {
    fontWeight: 'bold',
  },
  boldText: {
    fontWeight: 'bold',
  },
  scrollWrapper: {
    flex: 1,
    marginLeft: NAME_COL_WIDTH,
    marginRight: TOTAL_COL_WIDTH,
    overflow: 'hidden',
  },
  leftSticky: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: NAME_COL_WIDTH,
    zIndex: 2,
  },
  rightSticky: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    right: 0,
    width: TOTAL_COL_WIDTH,
    zIndex: 2,
  },
});

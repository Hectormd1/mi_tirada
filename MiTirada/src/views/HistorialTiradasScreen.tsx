import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Modal,
  Pressable,
  TouchableWithoutFeedback,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/types';
import db from '../config/db';
import { PlatoResumen, PlatoHistorial } from '../types/types';
import dayjs from 'dayjs';
import Ionicons from 'react-native-vector-icons/Ionicons';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import FontAwesome6 from 'react-native-vector-icons/FontAwesome6';
import { useAppColors } from '../DisplayMode/colors';

type HistorialNavProp = NativeStackNavigationProp<
  RootStackParamList,
  'Historial'
>;

const NAME_COL_WIDTH = 120;
const TOTAL_COL_WIDTH = 60;
const ROW_HEIGHT = 40;
const EXTRA_TOP = 60;

export default function HistorialTiradasScreen() {
  const colors = useAppColors();
  const navigation = useNavigation<HistorialNavProp>();
  const [registros, setRegistros] = useState<PlatoHistorial[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [toDeleteId, setToDeleteId] = useState<number | null>(null);
  const [toDeleteFecha, setToDeleteFecha] = useState<string>('');

  const fetchRegistros = () => {
    setLoading(true);
    db.transaction(tx => {
      tx.executeSql(
        `SELECT id, nombre, resultados, fecha
           FROM tiradas
           ORDER BY datetime(fecha) DESC;`,
        [],
        (_, { rows }) => {
          const arr: PlatoHistorial[] = [];
          for (let i = 0; i < rows.length; i++) {
            const { id, nombre, resultados: json, fecha } = rows.item(i);
            let parsed: PlatoResumen[] = [];
            try {
              parsed = JSON.parse(json);
            } catch {}
            arr.push({ id, nombre, resultados: parsed, fecha });
          }
          setRegistros(arr);
          setLoading(false);
        },
      );
    });
  };

  useEffect(fetchRegistros, []);

  const confirmDelete = (id: number, fecha: string) => {
    setToDeleteId(id);
    setToDeleteFecha(fecha);
    setModalVisible(true);
  };

  const deleteRegistro = () => {
    if (toDeleteId === null) return;
    db.transaction(tx => {
      tx.executeSql(
        `DELETE FROM tiradas WHERE id = ?;`,
        [toDeleteId],
        () => {
          setModalVisible(false);
          setToDeleteId(null);
          fetchRegistros();
        },
        (_, err) => console.error('Error deleting', err),
      );
    });
  };

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Separación superior oscura */}
      <View
        style={{ backgroundColor: colors.background, paddingTop: EXTRA_TOP }}
      >
        {/* Tabla principal */}
        <View style={styles.tableWrapper}>
          {/* Columna Tirador fija */}
          <View
            style={[styles.leftSticky, { backgroundColor: colors.nameCell }]}
          >
            <View
              style={[
                styles.row,
                styles.headerRow,
                { backgroundColor: colors.headerBg },
              ]}
            >
              <View
                style={[
                  styles.cell,
                  { width: NAME_COL_WIDTH, borderColor: colors.cellBorder },
                ]}
              >
                <Text style={[styles.headerText, { color: colors.headerText }]}>
                  Tirador
                </Text>
              </View>
            </View>
            {registros.map((reg, idx) => (
              <View
                key={reg.id}
                style={[
                  styles.row,
                  { height: ROW_HEIGHT },
                  idx % 2 === 0
                    ? { backgroundColor: colors.evenRow }
                    : { backgroundColor: colors.oddRow },
                ]}
              >
                <View
                  style={[
                    styles.cell,
                    {
                      width: NAME_COL_WIDTH,
                      backgroundColor: colors.nameCell,
                      borderColor: colors.cellBorder,
                      flexDirection: 'row',
                      alignItems: 'center',
                    },
                  ]}
                >
                  <TouchableOpacity
                    onPress={() => confirmDelete(reg.id, reg.fecha)}
                    style={styles.trashBtn}
                  >
                    <Ionicons name="trash" size={20} color={colors.trash} />
                  </TouchableOpacity>
                  <Text style={[styles.nameText, { color: colors.text }]}>
                    {reg.nombre.charAt(0).toUpperCase() + reg.nombre.slice(1)}
                  </Text>
                </View>
              </View>
            ))}
          </View>

          {/* ScrollView central */}
          <View
            style={[
              styles.scrollWrapper,
              { backgroundColor: colors.background },
            ]}
          >
            <ScrollView
              horizontal
              bounces={false}
              overScrollMode="never"
              alwaysBounceHorizontal={false}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingLeft: 0, paddingRight: 0 }}
            >
              <View>
                {/* Header */}
                <View style={[styles.row, styles.headerRow]}>
                  <View
                    style={[
                      styles.cell,
                      {
                        width: 140,
                        backgroundColor: colors.headerBg,
                        borderColor: colors.cellBorder,
                      },
                    ]}
                  >
                    <Text
                      style={[styles.headerText, { color: colors.headerText }]}
                    >
                      Fecha
                    </Text>
                  </View>
                  {Array.from({ length: 25 }, (_, i) => (
                    <View
                      key={i}
                      style={[
                        styles.cell,
                        {
                          backgroundColor: colors.headerBg,
                          borderColor: colors.cellBorder,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.headerText,
                          { color: colors.headerText },
                        ]}
                      >
                        {i + 1}
                      </Text>
                    </View>
                  ))}
                </View>
                {/* Filas de partidas */}
                {registros.map((reg, idx) => (
                  <View
                    key={reg.id}
                    style={[
                      styles.row,
                      { height: ROW_HEIGHT },
                      idx % 2 === 0
                        ? { backgroundColor: colors.evenRow }
                        : { backgroundColor: colors.oddRow },
                    ]}
                  >
                    <View
                      style={[
                        styles.cell,
                        {
                          width: 140,
                          borderColor: colors.cellBorder,
                          backgroundColor: 'transparent',
                        },
                      ]}
                    >
                      <Text style={{ color: colors.text }}>
                        {dayjs(reg.fecha).format('DD-MM-YY HH:mm')}
                      </Text>
                    </View>
                    {reg.resultados.map(r => (
                      <View
                        key={`${reg.id}-${r.numero}`}
                        style={[
                          styles.cell,
                          {
                            borderColor: colors.cellBorder,
                            backgroundColor:
                              r.resultado === 'fallo'
                                ? colors.fallo
                                : colors.acierto,
                          },
                        ]}
                      >
                        {r.resultado === 'acierto1' ? (
                          <FontAwesome5 name="check" size={20} color="green" />
                        ) : r.resultado === 'acierto2' ? (
                          <FontAwesome6
                            name="check-double"
                            size={20}
                            color="green"
                          />
                        ) : (
                          <FontAwesome6
                            name="xmark"
                            size={20}
                            color={colors.trash}
                          />
                        )}
                      </View>
                    ))}
                    {reg.resultados.length < 25 &&
                      Array.from({ length: 25 - reg.resultados.length }).map(
                        (_, i) => (
                          <View
                            key={i}
                            style={[
                              styles.cell,
                              {
                                borderColor: colors.cellBorder,
                                backgroundColor: colors.pendingCell,
                              },
                            ]}
                          >
                            <Text style={{ color: colors.text }}>–</Text>
                          </View>
                        ),
                      )}
                  </View>
                ))}
              </View>
            </ScrollView>
          </View>

          {/* Columna Total fija */}
          <View
            style={[styles.rightSticky, { backgroundColor: colors.totalCell }]}
          >
            <View
              style={[
                styles.row,
                styles.headerRow,
                { backgroundColor: colors.headerBg },
              ]}
            >
              <View
                style={[
                  styles.cell,
                  { width: TOTAL_COL_WIDTH, borderColor: colors.cellBorder },
                ]}
              >
                <Text style={[styles.headerText, { color: colors.headerText }]}>
                  Total
                </Text>
              </View>
            </View>
            {registros.map((reg, idx) => (
              <View
                key={reg.id}
                style={[
                  styles.row,
                  { height: ROW_HEIGHT },
                  idx % 2 === 0
                    ? { backgroundColor: colors.evenRow }
                    : { backgroundColor: colors.oddRow },
                ]}
              >
                <View
                  style={[
                    styles.cell,
                    {
                      width: TOTAL_COL_WIDTH,
                      backgroundColor: colors.totalCell,
                      borderColor: colors.cellBorder,
                    },
                  ]}
                >
                  <Text style={[styles.valueTotalText, { color: colors.text }]}>
                    {reg.resultados.filter(r => r.resultado !== 'fallo').length}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      </View>

      {/* Modal de confirmación */}
      <Modal
        transparent
        visible={modalVisible}
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
          <View style={styles.modalOverlay} />
        </TouchableWithoutFeedback>
        <View style={styles.modalContainer}>
          <View style={[styles.modalBox, { backgroundColor: colors.modalBg }]}>
            <Text style={[styles.modalText, { color: colors.text }]}>
              ¿Seguro que quieres eliminar la partida del{'\n'}
              <Text style={styles.boldText}>
                {dayjs(toDeleteFecha).format('DD-MM-YY HH:mm')}
              </Text>
              ?
            </Text>
            <View style={styles.modalButtons}>
              <Pressable
                onPress={deleteRegistro}
                style={[styles.modalBtn, { backgroundColor: colors.trash }]}
              >
                <Text style={styles.modalBtnText}>Sí</Text>
              </Pressable>
              <Pressable
                onPress={() => setModalVisible(false)}
                style={[styles.modalBtn, { backgroundColor: colors.primary }]}
              >
                <Text style={styles.modalBtnText}>No</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  tableWrapper: {
    flexDirection: 'row',
    width: '100%',
    position: 'relative',
  },
  headerRow: { height: ROW_HEIGHT },
  row: { flexDirection: 'row' },
  cell: {
    width: 60,
    height: ROW_HEIGHT,
    borderWidth: 1,
    borderColor: '#ccc', // Será sobrescrito por inline
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerText: { fontWeight: 'bold' },
  nameCell: { flexDirection: 'row', alignItems: 'center' },
  nameText: { marginLeft: 6, fontWeight: 'bold' },
  trashBtn: { position: 'absolute', left: 4, top: 10, zIndex: 3 },
  valueTotalText: { fontWeight: 'bold', fontSize: 16 },
  leftSticky: {
    position: 'absolute',
    left: 0,
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
  scrollWrapper: {
    flex: 1,
    marginLeft: 0 + NAME_COL_WIDTH,
    marginRight: TOTAL_COL_WIDTH,
    overflow: 'hidden',
  },

  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  modalContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  modalBox: { width: 280, padding: 20, borderRadius: 8, elevation: 5 },
  modalText: { marginBottom: 20, textAlign: 'center', fontSize: 16 },
  boldText: { fontWeight: 'bold' },
  modalButtons: { flexDirection: 'row', justifyContent: 'space-between' },
  modalBtn: {
    flex: 1,
    paddingVertical: 10,
    marginHorizontal: 8,
    borderRadius: 4,
    alignItems: 'center',
  },
  modalBtnText: { color: '#fff', fontWeight: 'bold' },
});

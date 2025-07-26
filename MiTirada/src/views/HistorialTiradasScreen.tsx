// src/views/HistorialTiradasScreen.tsx

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
import { RootStackParamList } from '../navigation/AppNavigator';
import db from '../config/db';
import { PlatoResumen, PlatoHistorial } from '../types/types';
import dayjs from 'dayjs';
import Ionicons from 'react-native-vector-icons/Ionicons';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import FontAwesome6 from 'react-native-vector-icons/FontAwesome6';

type HistorialNavProp = NativeStackNavigationProp<
  RootStackParamList,
  'Historial'
>;

export default function HistorialTiradasScreen() {
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
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#4FC3F7" />
      </View>
    );
  }

  return (
    <View style={styles.outer}>
      <ScrollView horizontal contentContainerStyle={styles.container}>
        <View style={styles.row}>
          {/* Sticky Tirador */}
          <View style={styles.stickyColumn}>
            <View style={[styles.cell, styles.header, styles.nameCell]}>
              <Text style={styles.headerText}>Tirador</Text>
            </View>
            {registros.map((reg, idx) => (
              <View
                key={reg.id}
                style={[
                  styles.cell,
                  styles.nameCell,
                  idx % 2 === 0 ? styles.evenRow : styles.oddRow,
                  styles.nameRow,
                ]}
              >
                <TouchableOpacity
                  onPress={() => confirmDelete(reg.id, reg.fecha)}
                  style={styles.trashBtn}
                >
                  <Ionicons name="trash" size={20} color="red" />
                </TouchableOpacity>
                <Text style={styles.nameText}>
                  {reg.nombre.charAt(0).toUpperCase() + reg.nombre.slice(1)}
                </Text>
              </View>
            ))}
          </View>

          {/* Scroll central */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View>
              {/* Header */}
              <View style={[styles.row, styles.headerRow]}>
                <View style={[styles.cell, styles.header, styles.dateCell]}>
                  <Text style={styles.headerText}>Fecha</Text>
                </View>
                {Array.from({ length: 25 }, (_, i) => (
                  <View key={i} style={[styles.cell, styles.header]}>
                    <Text style={styles.headerText}>{i + 1}</Text>
                  </View>
                ))}
              </View>
              {/* Rows */}
              {registros.map((reg, idx) => (
                <View
                  key={reg.id}
                  style={[
                    styles.row,
                    idx % 2 === 0 ? styles.evenRow : styles.oddRow,
                  ]}
                >
                  <View style={[styles.cell, styles.dateCell]}>
                    <Text>
                      {dayjs(reg.fecha).isValid()
                        ? dayjs(reg.fecha).format('DD-MM-YY HH:mm')
                        : '—'}
                    </Text>
                  </View>
                  {reg.resultados.map(r => (
                    <View key={`${reg.id}-${r.numero}`} style={styles.cell}>
                      {r.resultado === 'acierto1' ? (
                        <FontAwesome5 name="check" size={20} color="green" />
                      ) : r.resultado === 'acierto2' ? (
                        <FontAwesome6
                          name="check-double"
                          size={20}
                          color="green"
                        />
                      ) : (
                        <FontAwesome6 name="xmark" size={20} color="red" />
                      )}
                    </View>
                  ))}
                  {reg.resultados.length < 25 &&
                    Array.from({ length: 25 - reg.resultados.length }).map(
                      (_, i) => (
                        <View key={i} style={styles.cell}>
                          <Text>–</Text>
                        </View>
                      ),
                    )}
                </View>
              ))}
            </View>
          </ScrollView>

          {/* Sticky Total */}
          <View style={styles.stickyColumn}>
            <View style={[styles.cell, styles.header, styles.totalCell]}>
              <Text style={styles.headerText}>Total</Text>
            </View>
            {registros.map((reg, idx) => (
              <View
                key={reg.id}
                style={[
                  styles.cell,
                  styles.totalCell,
                  idx % 2 === 0 ? styles.evenRow : styles.oddRow,
                ]}
              >
                <Text>
                  {reg.resultados.filter(r => r.resultado !== 'fallo').length}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Confirm Modal */}
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
          <View style={styles.modalBox}>
            <Text style={styles.modalText}>
              ¿Seguro que quieres eliminar la partida del{'\n'}
              <Text style={styles.boldText}>
                {dayjs(toDeleteFecha).format('DD-MM-YY HH:mm')}
              </Text>
              ?
            </Text>
            <View style={styles.modalButtons}>
              <Pressable
                onPress={deleteRegistro}
                style={[styles.modalBtn, styles.modalBtnYes]}
              >
                <Text style={styles.modalBtnText}>Sí</Text>
              </Pressable>
              <Pressable
                onPress={() => setModalVisible(false)}
                style={[styles.modalBtn, styles.modalBtnNo]}
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
  outer: {
    flex: 1,
    backgroundColor: '#fff',
    paddingLeft: 30, // desplaza todo hacia la derecha
  },
  container: {
    paddingVertical: 10,
  },
  row: {
    flexDirection: 'row',
  },
  headerRow: {
    // si quieres un color distinto para toda la fila, puedes dejarlo aquí
    // pero cada celda usará `header` para su fondo
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  cell: {
    width: 60,
    height: 40,
    borderWidth: 1,
    borderColor: '#ccc',
    justifyContent: 'center',
    alignItems: 'center',
  },
  // ** ESTO ES LO QUE FALTABA **
  header: {
    backgroundColor: '#0277BD',
  },
  headerText: {
    fontWeight: 'bold',
    color: '#fff',
  },
  evenRow: {
    backgroundColor: '#E1F5FE',
  },
  oddRow: {
    backgroundColor: '#FFEBEE',
  },

  stickyColumn: {
    backgroundColor: '#fff',
    zIndex: 1,
  },
  nameCell: {
    width: 120,
    backgroundColor: '#0277BD', // si quieres mantener el pendiente
  },
  dateCell: {
    width: 140,
  },
  totalCell: {
    width: 60,
    backgroundColor: '#0277BD', // mismo color que cabecera
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  nameText: {
    marginLeft: 6,
    fontWeight: 'bold',
  },
  trashBtn: {
    position: 'absolute',
    left: 4, // separación del borde izquierdo de la celda
    top: 10, // centrado vertical aproximado dentro de 40px de alto
    zIndex: 2, // para que quede siempre encima
  },

  /* Modal */
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBox: {
    width: 280,
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 8,
    elevation: 5,
  },
  modalText: {
    marginBottom: 20,
    textAlign: 'center',
    fontSize: 16,
  },
  boldText: {
    fontWeight: 'bold',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalBtn: {
    flex: 1,
    paddingVertical: 10,
    marginHorizontal: 8,
    borderRadius: 4,
    alignItems: 'center',
  },
  modalBtnYes: {
    backgroundColor: '#E57373',
  },
  modalBtnNo: {
    backgroundColor: '#4FC3F7',
  },
  modalBtnText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

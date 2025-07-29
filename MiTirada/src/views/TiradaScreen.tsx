import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/types';
import db from '../config/db';
import FontAwesome6 from 'react-native-vector-icons/FontAwesome6';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import { PlatoResultado } from '../types/types';
import { useDisparoDetector } from '../hooks/useDisparoDetector';
import { useAppColors } from '../DisplayMode/colors';
import KeepAwake from 'react-native-keep-awake';

type Props = NativeStackNavigationProp<RootStackParamList, 'Tirada'>;

const TOTAL_PLATOS = 25;
const NAME_CELL_WIDTH = 100;
const CELL_WIDTH = 60;
const CELL_HEIGHT = 40;
const EXTRA_TOP = 55;

export default function TiradaScreen() {
  const colors = useAppColors();
  const navigation = useNavigation<Props>();
  const [tirador, setTirador] = useState('');
  const [nombreConfirmado, setNombreConfirmado] = useState(false);
  const [platoActual, setPlatoActual] = useState(1);
  const [resultados, setResultados] = useState<PlatoResultado[]>([]);
  const [estadoTirada, setEstadoTirada] = useState<'no-iniciada' | 'activa' | 'pausada'>('no-iniciada');
  const scrollRef = useRef<ScrollView>(null);

  // Estado para umbrales ajustables
  const [umbralSonido, setUmbralSonido] = useState(-10);
  const [umbralVibracion, setUmbralVibracion] = useState(10);

  useEffect(() => {
    AsyncStorage.getItem('tirador')
      .then(v => v && setTirador(v))
      .catch(console.error);
    db.transaction(tx => {
      tx.executeSql(
        `CREATE TABLE IF NOT EXISTS tiradas (
           id         INTEGER PRIMARY KEY AUTOINCREMENT,
           nombre     TEXT,
           resultados TEXT,
           fecha      TEXT DEFAULT CURRENT_TIMESTAMP
         );`
      );
    });
  }, []);

  const guardarTiradaEnBD = (nombre: string, res: PlatoResultado[]) => {
    const json = JSON.stringify(res);
    const ahoraISO = new Date().toISOString();
    db.transaction(tx => {
      tx.executeSql(
        `INSERT INTO tiradas (nombre, resultados, fecha) VALUES (?, ?, ?);`,
        [nombre, json, ahoraISO]
      );
    });
    AsyncStorage.setItem('tirador', nombre).catch(console.error);
  };

  const renderPlato = (plato: PlatoResultado) =>
    plato.resultado === 'acierto1' ? (
      <FontAwesome5 name="check" size={20} color="green" />
    ) : plato.resultado === 'acierto2' ? (
      <FontAwesome5 name="check-double" size={20} color="green" />
    ) : plato.resultado === 'fallo' ? (
      <FontAwesome6 name="xmark" size={20} color={colors.trash} />
    ) : (
      <Text style={[styles.placeholder, { color: colors.textSoft }]}>–</Text>
    );

  const registrarResultado = useCallback((resultado: 'acierto1' | 'acierto2' | 'fallo') => {
    if (estadoTirada !== 'activa') return;
    const nuevo: PlatoResultado = {
      numero: platoActual,
      disparo1: true,
      disparo2: resultado !== 'acierto1',
      resultado,
    };
    const nuevos = [...resultados, nuevo];
    setResultados(nuevos);
    const offsetX = (platoActual - 1) * CELL_WIDTH;
    scrollRef.current?.scrollTo({ x: offsetX, animated: true });
    if (platoActual >= TOTAL_PLATOS) {
      guardarTiradaEnBD(tirador, nuevos);
      navigation.replace('Resumen', { tirador, resultados: nuevos });
    } else {
      setPlatoActual(platoActual + 1);
    }
  }, [estadoTirada, platoActual, resultados, tirador, navigation]);

  const handlePlatoDetectado = useCallback((resultado: 'acierto1' | 'acierto2' | 'fallo') => {
    registrarResultado(resultado);
  }, [registrarResultado]);

  useDisparoDetector(
    estadoTirada === 'activa',
    handlePlatoDetectado,
    () => setEstadoTirada('activa'), // inicio por golpecitos
    umbralSonido,
    umbralVibracion
  );

  // --- FORMULARIO DE NOMBRE (centrado en pantalla) ---
  if (!nombreConfirmado) {
    const habilitado = !!tirador.trim();
    return (
      <View style={{
        flex: 1,
        backgroundColor: colors.background,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}>
        <Text style={{ color: colors.text, marginBottom: 10 }}>Introduce tu nombre:</Text>
        <TextInput
          style={[
            styles.input,
            { backgroundColor: colors.inputBg, color: colors.inputText, borderColor: colors.cellBorder }
          ]}
          placeholder="Tirador"
          placeholderTextColor={colors.textSoft}
          value={tirador}
          onChangeText={setTirador}
        />
        <TouchableOpacity
          disabled={!habilitado}
          onPress={() => setNombreConfirmado(true)}
          style={[
            styles.btn,
            { backgroundColor: habilitado ? colors.primaryBtn : colors.cellBorder, marginTop: 14 }
          ]}
        >
          <Text style={{ color: habilitado ? colors.headerText : colors.textSoft, fontWeight: 'bold' }}>
            CONFIRMAR
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  const aciertos = resultados.filter(r => r.resultado !== 'fallo').length;

  // --- PANTALLA PRINCIPAL DE TIRADA ---
  return (
    <View style={{ flex: 1, backgroundColor: colors.background, paddingTop: EXTRA_TOP  }}>
      {/* Mantener pantalla encendida durante la tirada */}
      {estadoTirada === 'activa' && <KeepAwake />}
      {/* Tabla de resultados siempre arriba */}
      <View style={styles.tableWrap}>
        {/* Sticky columna izquierda */}
        <View style={[styles.stickyLeft, { backgroundColor: colors.nameCell }]}>
          <View style={[styles.cell, { borderColor: colors.cellBorder, width: NAME_CELL_WIDTH, height: CELL_HEIGHT, borderRightWidth: 0, backgroundColor: colors.headerBg }]}>
            <Text style={[styles.headerText, { color: colors.headerText }]}>Tirador</Text>
          </View>
          <View style={[styles.cell, styles.nameCell, {borderColor: colors.cellBorder, width: NAME_CELL_WIDTH, height: CELL_HEIGHT, borderRightWidth: 0, backgroundColor: colors.nameCell }]}>
            <Text style={[styles.nameText, { color: colors.text }]}>{tirador}</Text>
          </View>
        </View>

        {/* Scroll central SOLO horizontal */}
        <ScrollView
          ref={scrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          bounces={false}
          overScrollMode="never"
        >
          <View>
            {/* Header */}
            <View style={styles.row}>
              {Array.from({ length: TOTAL_PLATOS }, (_, i) => (
                <View key={`h-${i}`} style={[styles.cell, {borderColor: colors.cellBorder, width: CELL_WIDTH, height: CELL_HEIGHT, backgroundColor: colors.headerBg }]}>
                  <Text style={[styles.headerText, { color: colors.headerText }]}>{i + 1}</Text>
                </View>
              ))}
            </View>
            {/* Fila de resultados */}
            <View style={styles.row}>
              {Array.from({ length: TOTAL_PLATOS }, (_, i) => {
                const plato = resultados[i];
                const bg = !plato
                  ? { backgroundColor: colors.pending }
                  : plato.resultado === 'fallo'
                  ? { backgroundColor: colors.fallo }
                  : { backgroundColor: colors.acierto };
                return (
                  <View key={`r-${i}`} style={[styles.cell, bg, { width: CELL_WIDTH, height: CELL_HEIGHT, borderColor: colors.cellBorder }]}>
                    {plato ? renderPlato(plato) : <Text style={[styles.placeholder, { color: colors.textSoft }]}>–</Text>}
                  </View>
                );
              })}
            </View>
          </View>
        </ScrollView>

        {/* Sticky columna derecha */}
        <View style={[styles.stickyRight, { backgroundColor: colors.totalCell }]}>
          <View style={[styles.cell, {borderColor: colors.cellBorder, width: NAME_CELL_WIDTH, height: CELL_HEIGHT, borderLeftWidth: 0, backgroundColor: colors.headerBg }]}>
            <Text style={[styles.headerText, { color: colors.headerText }]}>Total</Text>
          </View>
          <View style={[styles.cell, styles.totalCell, {borderColor: colors.cellBorder, width: NAME_CELL_WIDTH, height: CELL_HEIGHT, borderLeftWidth: 0, backgroundColor: colors.totalCell }]}>
            <Text style={[styles.totalText, { color: colors.text }]}>{aciertos}</Text>
          </View>
        </View>
      </View>

      {/* El resto del contenido debajo, alineado al centro y con fondo oscuro */}
      <View style={{ flex: 1, alignItems: 'center', width: '100%' }}>
        <Text style={[styles.statusText, { color: colors.textSoft }]}>
          Quedan {TOTAL_PLATOS - resultados.length} platos
        </Text>

        {estadoTirada === 'activa' && (
          <>
            {/* Controles umbrales */}
            <View style={styles.umbralRow}>
              {/* SONIDO */}
              <Text style={[styles.umbralLabel, { color: colors.textSoft }]}>Sonido</Text>
              <TouchableOpacity
                style={[styles.umbralBtn, { borderColor: colors.cellBorder, backgroundColor: colors.cell }]}
                onPress={() => setUmbralSonido(prev => Math.max(prev - 1, -100))}
                disabled={umbralSonido <= -100}
              >
                <Text style={[styles.umbralBtnText, { color: colors.headerBg }]}>+</Text>
              </TouchableOpacity>
              <Text style={[styles.umbralValue, { color: colors.text }]}>{umbralSonido}</Text>
              <TouchableOpacity
                style={[styles.umbralBtn, { borderColor: colors.cellBorder, backgroundColor: colors.cell }]}
                onPress={() => setUmbralSonido(prev => Math.min(prev + 1, -1))}
                disabled={umbralSonido >= -1}
              >
                <Text style={[styles.umbralBtnText, { color: colors.headerBg }]}>–</Text>
              </TouchableOpacity>
              {/* VIBRACIÓN */}
              <TouchableOpacity
                style={[styles.umbralBtn, { marginLeft: 16, borderColor: colors.cellBorder, backgroundColor: colors.cell }]}
                onPress={() => setUmbralVibracion(prev => Math.max(prev - 1, 0))}
                disabled={umbralVibracion <= 0}
              >
                <Text style={[styles.umbralBtnText, { color: colors.headerBg }]}>–</Text>
              </TouchableOpacity>
              <Text style={[styles.umbralValue, { color: colors.text }]}>{umbralVibracion}</Text>
              <TouchableOpacity
                style={[styles.umbralBtn, { borderColor: colors.cellBorder, backgroundColor: colors.cell }]}
                onPress={() => setUmbralVibracion(prev => prev + 1)}
              >
                <Text style={[styles.umbralBtnText, { color: colors.headerBg }]}>+</Text>
              </TouchableOpacity>
              <Text style={[styles.umbralLabel, { color: colors.textSoft }]}>Vibración</Text>
            </View>
            <View style={styles.buttonRow}>
              <TouchableOpacity onPress={() => registrarResultado('acierto1')} style={[styles.btn, { backgroundColor: colors.hitBtn }]}>
                <Text style={[styles.btnText, { color: colors.headerText }]}>1º DISPARO</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => registrarResultado('acierto2')} style={[styles.btn, { backgroundColor: colors.hit2Btn }]}>
                <Text style={[styles.btnText, { color: colors.headerText }]}>2º DISPARO</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => registrarResultado('fallo')} style={[styles.btn, { backgroundColor: colors.missBtn }]}>
                <Text style={[styles.btnText, { color: colors.headerText }]}>FALLO</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity onPress={() => setEstadoTirada('pausada')} style={[styles.btn, { backgroundColor: colors.secondaryBtn }]}>
              <Text style={[styles.btnText, { color: colors.headerText }]}>PAUSAR</Text>
            </TouchableOpacity>
          </>
        )}

        {estadoTirada === 'no-iniciada' && (
          <TouchableOpacity onPress={() => setEstadoTirada('activa')} style={[styles.btn, { backgroundColor: colors.primaryBtn }]}>
            <Text style={[styles.btnText, { color: colors.headerText }]}>COMENZAR PLATO</Text>
          </TouchableOpacity>
        )}

        {estadoTirada === 'pausada' && (
          <TouchableOpacity onPress={() => setEstadoTirada('activa')} style={[styles.btn, { backgroundColor: colors.primaryBtn }]}>
            <Text style={[styles.btnText, { color: colors.headerText }]}>RETOMAR</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  tableWrap: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    width: '100%',
    position: 'relative',
    marginBottom: 10,
  },
  stickyLeft: {
    zIndex: 10,
    elevation: 10,
    alignItems: 'stretch',
  },
  stickyRight: {
    zIndex: 10,
    elevation: 10,
    alignItems: 'stretch',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cell: {
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerText: {
    fontWeight: 'bold',
    textAlign: 'center',
    fontSize: 16,
  },
  nameCell: {
    fontWeight: 'bold',
    justifyContent: 'center',
  },
  totalCell: {
    fontWeight: 'bold',
    justifyContent: 'center',
  },
  nameText: {
    fontWeight: 'bold',
    textAlign: 'center',
  },
  totalText: {
    fontWeight: 'bold',
    textAlign: 'center',
  },
  placeholder: {
    textAlign: 'center',
  },
  statusText: {
    marginVertical: 12,
    fontSize: 16,
  },
  btn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginTop: 10,
    marginLeft: 4,
    width: 120,
  },
  btnText: {
    fontWeight: 'bold',
    textAlign: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 2,
  },
  input: {
    borderWidth: 1,
    padding: 8,
    width: 200,
    marginVertical: 10,
    borderRadius: 5,
  },
  umbralRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 8,
  },
  umbralBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 2,
    borderWidth: 1,
  },
  umbralBtnText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  umbralValue: {
    width: 36,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: 'bold',
  },
  umbralLabel: {
    marginHorizontal: 6,
    fontSize: 13,
  },
});

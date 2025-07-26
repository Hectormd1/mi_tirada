import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  Vibration,
  TouchableOpacity,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import db from '../config/db';

type PlatoResultado = {
  numero: number;
  disparo1: boolean;
  disparo2: boolean;
  resultado: 'acierto1' | 'acierto2' | 'fallo';
};

type Props = NativeStackNavigationProp<RootStackParamList, 'Tirada'>;

const TOTAL_PLATOS = 25;

// **ANCHO DE CELDAS**
const CELL_WIDTH = 60;
const NAME_CELL_WIDTH = 100;

export default function TiradaScreen() {
  const navigation = useNavigation<Props>();
  const [tirador, setTirador] = useState('');
  const [nombreConfirmado, setNombreConfirmado] = useState(false);
  const [platoActual, setPlatoActual] = useState(1);
  const [resultados, setResultados] = useState<PlatoResultado[]>([]);
  const [estado, setEstado] = useState<'esperando' | 'disparo1'>('esperando');
  const [estadoTirada, setEstadoTirada] = useState<
    'no-iniciada' | 'activa' | 'pausada'
  >('no-iniciada');

  // **REF para controlar el ScrollView horizontal**
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    AsyncStorage.getItem('tirador')
      .then(v => v && setTirador(v))
      .catch(console.error);
    db.transaction(tx => {
      tx.executeSql(
        `CREATE TABLE IF NOT EXISTS tiradas (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          nombre TEXT,
          resultados TEXT
        );`,
      );
    });
  }, []);

  const guardarTiradaEnBD = (nombre: string, res: PlatoResultado[]) => {
    const json = JSON.stringify(res);
    db.transaction(tx => {
      tx.executeSql('INSERT INTO tiradas (nombre, resultados) VALUES (?, ?)', [
        nombre,
        json,
      ]);
    });
    AsyncStorage.setItem('tirador', nombre).catch(console.error);
  };

  const renderPlato = (plato: PlatoResultado) =>
    plato.resultado === 'acierto1'
      ? '✅'
      : plato.resultado === 'acierto2'
      ? '2️⃣'
      : '❌';

  const registrarResultado = (resultado: 'acierto1' | 'acierto2' | 'fallo') => {
    if (estadoTirada !== 'activa') return;
    const nuevo: PlatoResultado = {
      numero: platoActual,
      disparo1: true,
      disparo2: resultado !== 'acierto1',
      resultado,
    };
    const nuevos = [...resultados, nuevo];
    setResultados(nuevos);
    Vibration.vibrate(resultado === 'acierto1' ? 100 : [100, 100]);

    // **SCROLL AUTOMÁTICO**: calcula offset y desplaza
    const i = platoActual - 1;
    const offsetX = i * CELL_WIDTH;
    scrollRef.current?.scrollTo({ x: offsetX, animated: true });
    scrollRef.current?.scrollTo({ x: offsetX, animated: true });

    if (platoActual >= TOTAL_PLATOS) {
      Vibration.vibrate([400, 200, 400]);
      guardarTiradaEnBD(tirador, nuevos);
      navigation.navigate('ResumenTirada', { tirador, resultados: nuevos });
    } else {
      setPlatoActual(platoActual + 1);
      setEstado('esperando');
    }
  };

  if (!nombreConfirmado) {
    const habilitado = !!tirador.trim();
    return (
      <View style={styles.container}>
        <Text>Introduce tu nombre:</Text>
        <TextInput
          style={styles.input}
          placeholder="Tirador"
          value={tirador}
          onChangeText={setTirador}
        />
        <TouchableOpacity
          disabled={!habilitado}
          onPress={() => {
            AsyncStorage.setItem('tirador', tirador).catch(console.error);
            setNombreConfirmado(true);
          }}
          style={[
            styles.btn,
            { backgroundColor: habilitado ? '#007AFF' : '#ccc' },
          ]}
        >
          <Text
            style={{ color: habilitado ? '#fff' : '#888', fontWeight: 'bold' }}
          >
            CONFIRMAR
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  const aciertos = resultados.filter(r => r.resultado !== 'fallo').length;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={{ flexDirection: 'row' }}>
        <View style={styles.stickyColumn}>
          <Text style={[styles.cell, styles.header, styles.nameCell]}>
            Tirador
          </Text>
          <Text style={[styles.cell, styles.nameCell]}>{tirador}</Text>
        </View>

        {/* ScrollView HORIZONTAL con ref */}
        <ScrollView
          ref={scrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
        >
          <View>
            <View style={styles.row}>
              {Array.from({ length: TOTAL_PLATOS }, (_, i) => (
                <Text key={`h-${i}`} style={[styles.cell, styles.header]}>
                  {i + 1}
                </Text>
              ))}
            </View>
            <View style={styles.row}>
              {resultados.map((plato, i) => (
                <Text
                  key={`r-${i}`}
                  style={[
                    styles.cell,
                    plato.resultado === 'fallo' ? styles.fallo : styles.acierto,
                  ]}
                >
                  {renderPlato(plato)}
                </Text>
              ))}
              {Array.from({ length: TOTAL_PLATOS - resultados.length }).map(
                (_, i) => (
                  <Text key={`e-${i}`} style={styles.cell}>
                    -
                  </Text>
                ),
              )}
            </View>
          </View>
        </ScrollView>

        <View style={styles.stickyColumn}>
          <Text style={[styles.cell, styles.header, styles.totalCell]}>
            Total
          </Text>
          <Text style={[styles.cell, styles.totalCell]}>{aciertos}</Text>
        </View>
      </View>

      <Text style={{ marginTop: 20 }}>
        Plato {platoActual} / {TOTAL_PLATOS}
      </Text>
      <Text>Estado: {estado}</Text>

      {estadoTirada === 'no-iniciada' && (
        <TouchableOpacity
          onPress={() => {
            setEstadoTirada('activa');
            setEstado('disparo1');
          }}
          style={[styles.btn, styles.btnPrimary]}
        >
          <Text style={styles.btnText}>COMENZAR PLATO</Text>
        </TouchableOpacity>
      )}

      {estadoTirada === 'activa' && (
        <>
          <TouchableOpacity
            onPress={() => setEstadoTirada('pausada')}
            style={[styles.btn, styles.btnPrimary, { alignSelf: 'center' }]}
          >
            <Text style={styles.btnText}>PAUSAR TIRADA</Text>
          </TouchableOpacity>

          <View style={styles.buttonRow}>
            <TouchableOpacity
              onPress={() => registrarResultado('acierto1')}
              style={[styles.btn, styles.btnPrimary, styles.sideBtn]}
            >
              <Text style={styles.btnText}>1ER DISPARO</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => registrarResultado('acierto2')}
              style={[styles.btn, styles.btnPrimary, styles.sideBtn]}
            >
              <Text style={styles.btnText}>2º DISPARO</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => registrarResultado('fallo')}
              style={[styles.btn, styles.btnPrimary, styles.sideBtn]}
            >
              <Text style={styles.btnText}>FALLO</Text>
            </TouchableOpacity>
          </View>
        </>
      )}

      {estadoTirada === 'pausada' && (
        <TouchableOpacity
          onPress={() => setEstadoTirada('activa')}
          style={[styles.btn, styles.btnPrimary]}
        >
          <Text style={styles.btnText}>RETOMAR TIRADA</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row', alignItems: 'center' },
  cell: {
    width: CELL_WIDTH,
    height: 40,
    textAlign: 'center',
    textAlignVertical: 'center',
    borderWidth: 1,
    borderColor: '#ccc',
  },
  header: { fontWeight: 'bold', backgroundColor: '#eee' },
  acierto: { backgroundColor: '#c8e6c9' },
  fallo: { backgroundColor: '#ffcdd2' },
  stickyColumn: { justifyContent: 'center', alignItems: 'center' },
  nameCell: { minWidth: NAME_CELL_WIDTH, backgroundColor: '#fafafa' },
  totalCell: { minWidth: NAME_CELL_WIDTH, backgroundColor: '#fafafa' },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 8,
    width: 200,
    marginVertical: 10,
    borderRadius: 5,
    backgroundColor: '#fff',
  },
  btn: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    marginTop: 10,
  },
  btnPrimary: { backgroundColor: '#007AFF' },
  btnText: { color: '#fff', fontWeight: 'bold', textAlign: 'center' },
  buttonRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 12 },
  sideBtn: { marginHorizontal: 6, width: 120, paddingHorizontal: 12 },
});

import { useEffect, useRef } from 'react';
import { Platform, PermissionsAndroid, Vibration } from 'react-native';
import SoundLevel from 'react-native-sound-level';
import { accelerometer } from 'react-native-sensors';
import Toast from 'react-native-toast-message';

const VENTANA_DISPARO_MS = 200;
const GOLPES_PARA_FALLO = 2;
const GOLPES_PARA_INICIO = 3;
const ANTIREBOTE_DISPARO_MS = 500;

type PlatoDetectado = 'acierto1' | 'acierto2' | 'fallo';

export function useDisparoDetector(
  activo: boolean,
  onPlatoDetectado: (resultado: PlatoDetectado) => void,
  onComenzar?: () => void,
  UMBRAL_SONIDO = -10,
  UMBRAL_VIBRACION = 10,
  UMBRAL_VIBRACION_GOLPECITO = 15
) {
  // Control de arranque por golpecitos
  const golpeCounter = useRef(0);
  const golpeTimer = useRef<NodeJS.Timeout | null>(null);
  const inicioPorGolpesHabilitado = useRef(true);

  // Control de disparos y fallos
  const lastSound = useRef(0);
  const shotTimes = useRef<number[]>([]);
  const failTimeout = useRef<NodeJS.Timeout | null>(null);
  const shotTimeout = useRef<NodeJS.Timeout | null>(null);
  const accelHits = useRef<number>(0);
  const lastDisparoTimestamp = useRef(0);
  const enEsperaGolpecitos = useRef(false);
  const delayFalloTimeout = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (Platform.OS === 'android') {
      PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        PermissionsAndroid.PERMISSIONS.BODY_SENSORS,
      ]);
    }

    const accelSub = accelerometer.subscribe(({ x, y, z }) => {
      const force = Math.sqrt(x * x + y * y + z * z);
      const now = Date.now();

      // ---- INICIO DE PARTIDA POR GOLPECITOS ----
      if (!activo && onComenzar && inicioPorGolpesHabilitado.current) {
        if (force > UMBRAL_VIBRACION) {
          golpeCounter.current++;
          if (golpeCounter.current === 1) {
            if (golpeTimer.current) clearTimeout(golpeTimer.current);
            golpeTimer.current = setTimeout(() => { golpeCounter.current = 0; }, 1000);
          }
          if (golpeCounter.current === GOLPES_PARA_INICIO) {
            golpeCounter.current = 0;
            if (golpeTimer.current) clearTimeout(golpeTimer.current);
            inicioPorGolpesHabilitado.current = false;
            Vibration.vibrate([600, 300, 600, 300, 600, 300]);
            Toast.show({
              type: 'success',
              text1: '¡Tirada iniciada!',
              text2: 'Has activado la tirada por golpecitos.'
            });
            onComenzar();
          }
        }
        return;
      }

      // ---- FUNCIONAMIENTO NORMAL DE PARTIDA ACTIVA ----
      if (activo) {
        // 1. Proceso normal: coincidencia sonido + vibración
        if (force > UMBRAL_VIBRACION && Math.abs(now - lastSound.current) < VENTANA_DISPARO_MS) {
          // Antirebote: si hace muy poco que registramos un disparo, ignoramos
          if (now - lastDisparoTimestamp.current < ANTIREBOTE_DISPARO_MS) return;

          lastDisparoTimestamp.current = now;
          shotTimes.current.push(now);

          if (shotTimes.current.length === 1) {
            Toast.show({
              type: 'success',
              text1: '¡Disparo detectado!',
              text2: 'Primer disparo registrado.'
            });

            // Primer disparo: esperar por el segundo durante 3 segundos
            if (shotTimeout.current) clearTimeout(shotTimeout.current);
            shotTimeout.current = setTimeout(() => {
              // Solo hubo 1 disparo
              shotTimes.current = [];
              accelHits.current = 0;
              enEsperaGolpecitos.current = false;
              Vibration.vibrate([400, 300, 400, 300]);
              onPlatoDetectado('acierto1');
            }, 3000);
          } else if (shotTimes.current.length === 2) {
            Toast.show({
              type: 'info',
              text1: '¡Segundo disparo!',
              text2: 'Ahora puedes golpear para indicar fallo.'
            });

            // Segundo disparo: espera 2s y luego abre ventana de 5s para detectar golpecitos
            if (shotTimeout.current) clearTimeout(shotTimeout.current);
            accelHits.current = 0;
            enEsperaGolpecitos.current = false;
            if (failTimeout.current) clearTimeout(failTimeout.current);
            if (delayFalloTimeout.current) clearTimeout(delayFalloTimeout.current);

            // Espera 1 segundo ANTES de permitir golpecitos
            delayFalloTimeout.current = setTimeout(() => {
              enEsperaGolpecitos.current = true;
              failTimeout.current = setTimeout(() => {
                // No hubo golpecitos suficientes: acierto al segundo tiro
                shotTimes.current = [];
                accelHits.current = 0;
                enEsperaGolpecitos.current = false;
                Vibration.vibrate([400, 300, 400, 300, 400, 300, 400, 300]);
                onPlatoDetectado('acierto2');
                Toast.show({
                  type: 'success',
                  text1: 'Acierto en el segundo disparo',
                  text2: 'No se detectaron golpes para fallo.'
                });
              }, 5000);
            }, 2000);
          }
        }
        // 2. Golpecitos SOLO tras delay + durante ventana de fallo
        else if (enEsperaGolpecitos.current && force > UMBRAL_VIBRACION_GOLPECITO) {
          accelHits.current++;
          Toast.show({
            type: 'error',
            text1: `Golpecito ${accelHits.current}`,
            text2: 'Golpe detectado tras el segundo disparo.'
          });
          if (accelHits.current >= GOLPES_PARA_FALLO && failTimeout.current) {
            clearTimeout(failTimeout.current);
            shotTimes.current = [];
            accelHits.current = 0;
            enEsperaGolpecitos.current = false;
            Vibration.vibrate([80, 80, 80, 80, 80, 80, 80, 80]);
            onPlatoDetectado('fallo');
            Toast.show({
              type: 'error',
              text1: '¡Fallo!',
              text2: 'Has indicado fallo tras el segundo disparo.'
            });
          }
        }
      }
    });

    SoundLevel.start();
    SoundLevel.onNewFrame = (data) => {
      if (data.value > UMBRAL_SONIDO) {
        lastSound.current = Date.now();
      }
    };

    return () => {
      SoundLevel.stop();
      accelSub.unsubscribe();
      if (shotTimeout.current) clearTimeout(shotTimeout.current);
      if (failTimeout.current) clearTimeout(failTimeout.current);
      if (delayFalloTimeout.current) clearTimeout(delayFalloTimeout.current);
      if (golpeTimer.current) clearTimeout(golpeTimer.current);
      shotTimes.current = [];
      accelHits.current = 0;
      lastDisparoTimestamp.current = 0;
      enEsperaGolpecitos.current = false;
      golpeCounter.current = 0;
      inicioPorGolpesHabilitado.current = true;
    };
  }, [activo, onPlatoDetectado, onComenzar, UMBRAL_SONIDO, UMBRAL_VIBRACION]);
}

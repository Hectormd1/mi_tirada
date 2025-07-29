export type PlatoResultado = {
  numero: number;
  disparo1: boolean;
  disparo2: boolean;
  resultado: "acierto1" | "acierto2" | "fallo";
};

export type PlatoResumen = {
  numero: number;
  resultado: 'acierto1' | 'acierto2' | 'fallo';
};

export type PlatoHistorial = {
  id: number;
  nombre: string;
  resultados: PlatoResumen[];
  fecha: string;
};

export type RootStackParamList = {
  Inicio: undefined;
  Tirada: undefined;
  Resumen: {
    tirador: string;
    resultados: { numero: number; resultado: 'acierto1' | 'acierto2' | 'fallo' }[];
  };
  Historial: undefined;
};
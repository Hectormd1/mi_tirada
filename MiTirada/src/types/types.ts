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
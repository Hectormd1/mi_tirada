// src/navigation/AppNavigator.tsx
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationContainer } from '@react-navigation/native';

import TiradaScreen from '../views/TiradaScreen';
import InicioScreen from '../views/InicioScreen';
import ResumenTiradaScreen from '../views/ResumenTiradaScreen';

export type RootStackParamList = {
  Inicio: undefined;
  Tirada: undefined;
  ResumenTirada: {
    tirador: string;
    resultados: { numero: number; resultado: 'acierto1' | 'acierto2' | 'fallo' }[];
  };
  Historial: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Inicio">
        <Stack.Screen name="Inicio" component={InicioScreen} />
        <Stack.Screen name="Tirada" component={TiradaScreen} />
        <Stack.Screen name="ResumenTirada" component={ResumenTiradaScreen} />

      </Stack.Navigator>
    </NavigationContainer>
  );
}

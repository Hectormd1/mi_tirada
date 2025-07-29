// src/navigation/AppNavigator.tsx
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationContainer } from '@react-navigation/native';

import TiradaScreen from '../views/TiradaScreen';
import InicioScreen from '../views/InicioScreen';
import ResumenTiradaScreen from '../views/ResumenTiradaScreen';
import HistorialTiradasScreen from '../views/HistorialTiradasScreen';
import { RootStackParamList } from '../types/types';



const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Inicio">
        <Stack.Screen name="Inicio" component={InicioScreen} options={{ headerShown: false }}/>
        <Stack.Screen name="Tirada" component={TiradaScreen} options={{ headerShown: false }}/>
        <Stack.Screen name="Resumen" component={ResumenTiradaScreen} options={{ headerShown: false }}/>
        <Stack.Screen name="Historial" component={HistorialTiradasScreen} options={{ headerShown: false }}/>

      </Stack.Navigator>
    </NavigationContainer>
  );
}

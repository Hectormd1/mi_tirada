import React, { useEffect } from 'react';
import { useColorScheme } from 'react-native';
import AppNavigator from './navigation/AppNavigator';
import Toast from 'react-native-toast-message';
import ImmersiveMode from 'react-native-immersive';

function App() {
  const isDarkMode = useColorScheme() === 'dark';

  useEffect(() => {
    // Activa el modo inmersivo al iniciar la app (Android solo)
    ImmersiveMode.on();
    ImmersiveMode.setImmersive(true);

    // Si quieres quitar el modo al desmontar (no es obligatorio)
    return () => {
      ImmersiveMode.off();
    };
  }, []);

  return (
    <>
      <AppNavigator />
      <Toast position="bottom" />
    </>
  );
}

export default App;

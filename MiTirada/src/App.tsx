import React from 'react';
import { useColorScheme} from 'react-native';
import AppNavigator from './navigation/AppNavigator';
import FlashMessage from 'react-native-flash-message';

function App() {
  const isDarkMode = useColorScheme() === 'dark';

  return (
      <>
        <AppNavigator />
        <FlashMessage position="top" />
      </>
  );
}


export default App;

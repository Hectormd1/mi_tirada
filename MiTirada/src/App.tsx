import React from 'react';
import { useColorScheme} from 'react-native';
import AppNavigator from './navigation/AppNavigator';

function App() {
  const isDarkMode = useColorScheme() === 'dark';

  return (
      <AppNavigator />
  );
}


export default App;

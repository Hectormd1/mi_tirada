import { useColorScheme } from 'react-native';
import LightMode from './LightMode';
import DarkMode from './DarkMode';

export function useAppColors() {
  const scheme = useColorScheme();
  return scheme === 'dark' ? DarkMode : LightMode;
}

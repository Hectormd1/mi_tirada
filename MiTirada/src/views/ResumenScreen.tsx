// src/views/ResumenScreen.tsx
import { View, Text, StyleSheet } from 'react-native';

export default function ResumenScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Resumen de la tirada</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 22 },
});

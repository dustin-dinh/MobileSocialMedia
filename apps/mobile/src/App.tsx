import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';

export default function App() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Mobile Social Network MVP</Text>
      <Text style={styles.subtitle}>Week 1 - Foundation</Text>
      <Text style={styles.message}>No Authentication UI yet.</Text>
      <StatusBar style="dark" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    color: '#111827',
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
  },
  subtitle: {
    color: '#4B5563',
    fontSize: 16,
    marginTop: 8,
    textAlign: 'center',
  },
  message: {
    color: '#6B7280',
    fontSize: 14,
    marginTop: 20,
    textAlign: 'center',
  },
});

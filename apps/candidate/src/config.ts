import { Platform } from 'react-native';
import Constants from 'expo-constants';

const API_PORT = 3000;

function resolveApiUrl(): string {
  // 1) configuração explícita sempre vence
  if (process.env.EXPO_PUBLIC_API_URL) return process.env.EXPO_PUBLIC_API_URL;

  // 2) em desenvolvimento, a API roda na mesma máquina do Metro: reaproveita o IP dele.
  //    Funciona em celular físico (Expo Go) e emulador sem configurar nada.
  const hostUri = Constants.expoConfig?.hostUri; // ex.: "192.168.0.190:8081"
  const host = hostUri?.split(':')[0];
  if (host) return `http://${host}:${API_PORT}`;

  // 3) fallback: emulador Android enxerga a máquina host em 10.0.2.2
  return Platform.OS === 'android' ? `http://10.0.2.2:${API_PORT}` : `http://localhost:${API_PORT}`;
}

export const API_URL = resolveApiUrl().replace(/\/$/, '');

/** Tempo máximo de espera por resposta; sem isso um servidor inalcançável deixa o app girando para sempre. */
export const REQUEST_TIMEOUT_MS = 12_000;

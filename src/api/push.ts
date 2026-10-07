import { api } from './client';

export type PermissionState = 'granted' | 'denied' | 'undetermined';

/** Fronteira com o aparelho (expo-notifications/expo-device), injetada para o fluxo ser testável. */
export type PushDevice = {
  isPhysicalDevice: boolean;
  projectId: string | undefined;
  getPermission(): Promise<PermissionState>;
  requestPermission(): Promise<PermissionState>;
  getToken(projectId: string): Promise<string>;
};

let currentToken: string | null = null;
export const getRegisteredPushToken = () => currentToken;

/** Pede permissão, pega o token do aparelho e registra no backend. Best-effort: nunca lança. */
export async function registerPush(device: PushDevice): Promise<string | null> {
  try {
    if (!device.isPhysicalDevice || !device.projectId) return null;

    let permission = await device.getPermission();
    if (permission === 'undetermined') permission = await device.requestPermission();
    if (permission !== 'granted') return null;

    const token = await device.getToken(device.projectId);
    await api('/push-tokens', { method: 'PUT', body: { token } });
    currentToken = token;
    return token;
  } catch {
    return null;
  }
}

/** No logout: este aparelho para de receber avisos da conta. Precisa rodar antes de limpar a sessão. */
export async function unregisterPush(token: string | null = currentToken): Promise<void> {
  if (!token) return;
  try {
    await api('/push-tokens', { method: 'DELETE', body: { token } });
  } catch {
    // o backend também descarta tokens mortos sozinho
  } finally {
    if (token === currentToken) currentToken = null;
  }
}

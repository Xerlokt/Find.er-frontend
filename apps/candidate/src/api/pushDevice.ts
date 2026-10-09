import { Platform } from 'react-native';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import type { PushDevice } from './push';

// com o app aberto, mostra o aviso mesmo assim (o selo da aba já atualiza sozinho)
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

const projectId: string | undefined =
  (Constants.expoConfig?.extra as { eas?: { projectId?: string } } | undefined)?.eas?.projectId ??
  Constants.easConfig?.projectId;

export const realPushDevice: PushDevice = {
  isPhysicalDevice: Device.isDevice,
  projectId,
  getPermission: async () => (await Notifications.getPermissionsAsync()).status,
  requestPermission: async () => {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'mensagens',
        importance: Notifications.AndroidImportance.HIGH,
      });
    }
    return (await Notifications.requestPermissionsAsync()).status;
  },
  getToken: async (id) => (await Notifications.getExpoPushTokenAsync({ projectId: id })).data,
};

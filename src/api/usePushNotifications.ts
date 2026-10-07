import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import Constants from 'expo-constants';
import { useQueryClient } from '@tanstack/react-query';
import { registerPush } from './push';
import { chatIdFromNotificationData } from '../lib/push';

// No Expo Go o push remoto não existe (Android) e importar expo-notifications gera erro: só carrega em build próprio.
const pushSupported = Constants.executionEnvironment !== 'storeClient';

/** Logado: registra o aparelho no backend, atualiza o chat quando chega aviso e abre a conversa ao tocar nele. */
export function usePushNotifications(signedIn: boolean) {
  const router = useRouter();
  const qc = useQueryClient();

  useEffect(() => {
    if (!signedIn || !pushSupported) return;
    const { realPushDevice } = require('./pushDevice') as typeof import('./pushDevice');
    registerPush(realPushDevice);
  }, [signedIn]);

  useEffect(() => {
    if (!signedIn || !pushSupported) return;
    const Notifications = require('expo-notifications') as typeof import('expo-notifications');
    const received = Notifications.addNotificationReceivedListener(() => {
      qc.invalidateQueries({ queryKey: ['chats'] });
      qc.invalidateQueries({ queryKey: ['chat-preview'] });
    });
    const tapped = Notifications.addNotificationResponseReceivedListener((r) => {
      const chatId = chatIdFromNotificationData(r.notification.request.content.data);
      if (chatId) router.push(`/conversa/${chatId}`);
    });
    return () => {
      received.remove();
      tapped.remove();
    };
  }, [signedIn, qc, router]);
}

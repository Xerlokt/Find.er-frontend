import { FlatList, Pressable, RefreshControl, Text, View } from 'react-native';
import { Loading } from '../../src/components/Loading';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { friendlyMessage } from '../../src/api/errors';
import { useChatInbox } from '../../src/api/chatHooks';
import { useJob } from '../../src/api/feedHooks';
import type { InboxItem } from '../../src/lib/chatInbox';
import { previewText } from '../../src/lib/chatInbox';
import { badgeLabel, isUnread, unreadMessageCount } from '../../src/lib/unread';
import { useChatSeen } from '../../src/store/chatSeen';
import { Button } from '../../src/components/Button';
import { ScreenTitle } from '../../src/components/ScreenTitle';
import { otherParticipantName } from '../../src/lib/chat';
import { brandColor, initialOf, timeAgo } from '../../src/lib/format';
import { useSession } from '../../src/store/session';
import { colors, fonts, ink, layout, radius } from '../../src/theme';

function ChatRow({ item, userId, onPress }: { item: InboxItem; userId: string | null; onPress: () => void }) {
  const { chat, lastMessage } = item;
  const seen = useChatSeen((s) => s.seen);
  const unread = isUnread(item, userId, seen);
  const unreadMessages = unread ? unreadMessageCount(item, userId, seen) : 0;
  const name = otherParticipantName(chat, userId);
  const { job } = useJob(chat.jobId);
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        backgroundColor: pressed ? ink(0.04) : colors.white,
        borderRadius: radius.panel,
        padding: 14,
      })}
    >
      <View
        style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: brandColor(name), alignItems: 'center', justifyContent: 'center' }}
      >
        <Text style={{ fontFamily: fonts.display, fontSize: 20, color: colors.white }}>{initialOf(name)}</Text>
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <Text numberOfLines={1} style={{ fontFamily: fonts.bodyBold, fontSize: 15, color: colors.ink }}>
          {name}
        </Text>
        <Text numberOfLines={1} style={{ fontFamily: fonts.monoMedium, fontSize: 11, color: colors.primary }}>
          {job?.title ?? 'vaga'}
        </Text>
        <Text
          numberOfLines={1}
          style={{ fontFamily: unread ? fonts.bodyBold : fonts.body, fontSize: 13, color: unread ? colors.ink : ink(0.7) }}
        >
          {previewText(lastMessage, userId)}
        </Text>
      </View>
      <View style={{ alignItems: 'flex-end', gap: 6 }}>
        <Text style={{ fontFamily: fonts.mono, fontSize: 11, color: ink(0.45) }}>{timeAgo(lastMessage.createdAt)}</Text>
        {unread ? (
          <View
            accessibilityLabel={`${unreadMessages} ${unreadMessages === 1 ? 'mensagem nova' : 'mensagens novas'}`}
            style={{ minWidth: 20, height: 20, borderRadius: 10, paddingHorizontal: 6, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' }}
          >
            <Text style={{ fontFamily: fonts.monoBold, fontSize: 11, color: colors.white }}>{badgeLabel(unreadMessages) ?? '1'}</Text>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

export default function ChatScreen() {
  const router = useRouter();
  const userId = useSession((s) => s.userId);
  const chats = useChatInbox();
  const [pulling, setPulling] = useState(false); // spinner só no gesto manual, não nas atualizações automáticas

  // tempo real vem dos WebSockets (useLiveInbox); puxar a lista para baixo força a atualização

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: colors.bg, paddingHorizontal: layout.gutter }}>
      <View style={{ paddingTop: 12, paddingBottom: 14 }}>
        <ScreenTitle>chat</ScreenTitle>
      </View>

      {chats.isPending ? (
        <Loading logo={false} />
      ) : chats.isError ? (
        <View style={{ flex: 1, justifyContent: 'center', gap: 16 }}>
          <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 15, color: colors.ink, textAlign: 'center' }}>
            {friendlyMessage(chats.error)}
          </Text>
          <Button label="tentar de novo" onPress={() => chats.refetch()} />
        </View>
      ) : (
        <FlatList
          data={chats.items}
          keyExtractor={(i) => i.chat.id}
          contentContainerStyle={{ gap: 10, paddingBottom: 24, flexGrow: 1 }}
          refreshControl={<RefreshControl
              refreshing={pulling}
              onRefresh={async () => {
                setPulling(true);
                try {
                  await chats.refetch();
                } finally {
                  setPulling(false);
                }
              }}
              tintColor={colors.primary}
            />}
          renderItem={({ item }) => (
            <ChatRow item={item} userId={userId} onPress={() => router.push({ pathname: '/conversa/[id]', params: { id: item.chat.id } })} />
          )}
          ListEmptyComponent={
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 }}>
              <Text style={{ fontFamily: fonts.display, fontSize: 26, color: colors.ink, textAlign: 'center' }}>nada por aqui ainda 💬</Text>
              <Text style={{ fontFamily: fonts.body, fontSize: 14, color: ink(0.6), textAlign: 'center', maxWidth: 280 }}>
                quando uma empresa se interessar pelo seu perfil e te chamar, a conversa aparece aqui.
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

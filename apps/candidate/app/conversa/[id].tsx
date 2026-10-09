import { useEffect, useState } from 'react';
import { FlatList, KeyboardAvoidingView, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Loading } from '../../src/components/Loading';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useChats, useConversation } from '../../src/api/chatHooks';
import { useCompany, useJob } from '../../src/api/feedHooks';
import { CompanyLogo } from '../../src/components/JobCard';
import type { ChatMessage } from '../../src/api/chat';
import { friendlyMessage } from '../../src/api/errors';
import { Button } from '../../src/components/Button';
import { CHAT_MAX_LENGTH, canCandidateSend, otherParticipantName } from '../../src/lib/chat';
import { receiptStatus } from '../../src/lib/receipt';
import { useSession } from '../../src/store/session';
import { useChatSeen } from '../../src/store/chatSeen';
import { useNotice } from '../../src/store/notice';
import { colors, fonts, ink, layout, radius } from '../../src/theme';

function Bubble({ message, mine, userId }: { message: ChatMessage; mine: boolean; userId: string | null }) {
  const receipt = receiptStatus(message, userId);
  const time = new Date(message.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  return (
    <View style={{ alignItems: mine ? 'flex-end' : 'flex-start' }}>
      <View
        style={{
          maxWidth: '80%',
          backgroundColor: mine ? colors.primary : colors.white,
          borderRadius: 18,
          borderBottomRightRadius: mine ? 4 : 18,
          borderBottomLeftRadius: mine ? 18 : 4,
          paddingHorizontal: 14,
          paddingVertical: 10,
          gap: 4,
        }}
      >
        <Text style={{ fontFamily: fonts.body, fontSize: 15, color: mine ? colors.white : colors.ink }}>{message.content}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-end' }}>
          <Text style={{ fontFamily: fonts.mono, fontSize: 10, color: mine ? 'rgba(255,255,255,0.7)' : ink(0.4) }}>{time}</Text>
          {receipt ? (
            <Text
              accessibilityLabel={receipt === 'read' ? 'visualizada pela empresa' : 'enviada'}
              style={{ fontFamily: fonts.monoBold, fontSize: 11, color: receipt === 'read' ? colors.lime : 'rgba(255,255,255,0.6)' }}
            >
              {receipt === 'read' ? '✓✓' : '✓'}
            </Text>
          ) : null}
        </View>
      </View>
    </View>
  );
}

export default function ConversationScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const userId = useSession((s) => s.userId);
  const chats = useChats();
  const chat = chats.data?.find((c) => c.id === id);
  const { job } = useJob(chat?.jobId ?? '');
  const { data: company } = useCompany(job?.companyId);
  const { messages, history, status, error, send } = useConversation(id);
  const [text, setText] = useState('');
  // o KeyboardAvoidingView mede a própria posição relativa ao pai; tudo que fica acima dele (cabeçalho) precisa entrar como offset
  const [headerHeight, setHeaderHeight] = useState(0);
  const markSeen = useChatSeen((s) => s.markSeen);

  // enquanto a conversa está aberta, tudo que chega já é "visto"
  const newest = messages[0]?.createdAt;
  useEffect(() => {
    if (newest) markSeen(id, newest);
  }, [id, newest, markSeen]);

  // enquanto a conversa está aberta não há aviso in-app das mensagens dela
  useEffect(() => {
    useNotice.getState().setOpenChat(id);
    return () => useNotice.getState().clearOpenChat(id);
  }, [id]);

  const back = () => (router.canGoBack() ? router.back() : router.replace('/chat'));
  const name = chat ? otherParticipantName(chat, userId) : 'conversa';

  // o candidato só pode escrever depois da 1ª mensagem do recrutador (RECRUITER_MUST_INITIATE) e em chat ativo
  const waitingRecruiter = !!chat && !history.isPending && !canCandidateSend(messages, chat.recruiterUserId);
  const closed = !!chat && !chat.isActive;
  const composerDisabled = !chat || waitingRecruiter || closed;

  function submit() {
    if (composerDisabled) return;
    if (send(text)) setText('');
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <View
        onLayout={(e) => setHeaderHeight(e.nativeEvent.layout.height)}
        style={{
          paddingTop: insets.top,
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: colors.white,
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: ink(0.12),
          paddingRight: layout.gutter,
        }}
      >
        <Pressable onPress={back} hitSlop={8} accessibilityRole="button" accessibilityLabel="voltar" style={{ paddingLeft: 14, paddingRight: 6, paddingVertical: 10 }}>
          <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 30, lineHeight: 32, color: colors.ink }}>‹</Text>
        </Pressable>
        <Pressable
          onPress={() => router.push({ pathname: '/empresa/[chatId]', params: { chatId: id } })}
          disabled={!chat}
          accessibilityRole="button"
          accessibilityLabel={`ver perfil de ${name} e a vaga`}
          style={({ pressed }) => ({
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
            paddingVertical: 10,
            backgroundColor: pressed ? ink(0.04) : 'transparent',
          })}
        >
          <CompanyLogo companyId={job?.companyId ?? id} name={name} logoUrl={company?.logoUrl} size={40} />
          <View style={{ flex: 1 }}>
            <Text numberOfLines={1} style={{ fontFamily: fonts.bodyBold, fontSize: 16, color: colors.ink }}>
              {name}
            </Text>
            <Text numberOfLines={1} style={{ fontFamily: fonts.body, fontSize: 12.5, color: ink(0.55) }}>
              {job?.title ?? 'toque para ver o perfil'}
            </Text>
          </View>
        </Pressable>
      </View>

      <SafeAreaView edges={['bottom']} style={{ flex: 1 }}>
      {status === 'reconnecting' || status === 'connecting' ? (
        <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 12, color: ink(0.6), textAlign: 'center', paddingBottom: 6 }}>
          {status === 'connecting' ? 'conectando…' : 'reconectando…'}
        </Text>
      ) : null}

      <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding" keyboardVerticalOffset={headerHeight}>
        {history.isPending ? (
          <Loading logo={false} />
        ) : history.isError && messages.length === 0 ? (
          <View style={{ flex: 1, justifyContent: 'center', gap: 16, padding: 32 }}>
            <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 15, color: colors.ink, textAlign: 'center' }}>
              {friendlyMessage(history.error)}
            </Text>
            <Button label="tentar de novo" onPress={() => history.refetch()} />
          </View>
        ) : (
          <FlatList
            inverted
            data={messages}
            keyExtractor={(m) => m.id}
            contentContainerStyle={{ gap: 8, paddingHorizontal: layout.gutter, paddingVertical: 12, flexGrow: 1 }}
            renderItem={({ item }) => <Bubble message={item} mine={item.senderId === userId} userId={userId} />}
            onEndReached={() => history.hasNextPage && !history.isFetchingNextPage && history.fetchNextPage()}
            onEndReachedThreshold={0.4}
            ListEmptyComponent={
              <Text style={{ fontFamily: fonts.body, fontSize: 14, color: ink(0.5), textAlign: 'center', transform: [{ scaleY: -1 }] }}>
                nenhuma mensagem ainda
              </Text>
            }
          />
        )}

        {error ? (
          <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 12, color: colors.danger, paddingHorizontal: layout.gutter, paddingBottom: 6 }}>
            {error}
          </Text>
        ) : null}

        {waitingRecruiter || closed ? (
          <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 13, color: ink(0.6), textAlign: 'center', padding: 14 }}>
            {closed ? 'essa conversa foi encerrada' : 'aguarde o recrutador iniciar a conversa 💜'}
          </Text>
        ) : null}

        <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 10, paddingHorizontal: layout.gutter, paddingBottom: 12, opacity: composerDisabled ? 0.45 : 1 }}>
          <TextInput
            value={text}
            onChangeText={setText}
            editable={!composerDisabled}
            multiline
            maxLength={CHAT_MAX_LENGTH}
            placeholder="escreve uma mensagem"
            placeholderTextColor={ink(0.4)}
            style={{
              flex: 1,
              maxHeight: 120,
              backgroundColor: colors.white,
              borderRadius: radius.panel - 4,
              paddingHorizontal: 16,
              paddingVertical: 12,
              fontFamily: fonts.body,
              fontSize: 15,
              color: colors.ink,
            }}
          />
          <Pressable
            onPress={submit}
            disabled={composerDisabled || !text.trim()}
            style={{ backgroundColor: colors.primary, borderRadius: radius.pill, paddingHorizontal: 18, paddingVertical: 14, opacity: text.trim() ? 1 : 0.5 }}
          >
            <Text style={{ fontFamily: fonts.bodyBold, fontSize: 14, color: colors.white }}>enviar</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

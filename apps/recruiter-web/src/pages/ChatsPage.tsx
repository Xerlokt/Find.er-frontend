import { Link, useParams } from 'react-router-dom';
import { useChats, useMessages } from '../api/hooks';
import { useSession } from '../store/session';
import { ErrorBox, PageHeader } from '../components/ui';
import { timeAgo } from '../lib/format';

function Thread({ chatId }: { chatId: string }) {
  const userId = useSession((s) => s.userId);
  const messages = useMessages(chatId);
  // a API devolve mais recentes primeiro
  const list = [...(messages.data?.data ?? [])].reverse();
  return (
    <section className="card thread">
      {messages.isLoading && <p className="muted">carregando…</p>}
      <ErrorBox error={messages.error} />
      {list.length === 0 && messages.isSuccess && <p className="muted">sem mensagens ainda.</p>}
      {list.map((m) => (
        <div key={m.id} className={m.senderId === userId ? 'msg mine' : 'msg'}>
          <p>{m.content}</p>
          <small>{timeAgo(m.createdAt)}</small>
        </div>
      ))}
      <p className="notice">
        envio de mensagens indisponível no site por enquanto: o WebSocket da API ainda não aceita o token via URL.
      </p>
    </section>
  );
}

export function ChatsPage() {
  const { chatId } = useParams();
  const chats = useChats();
  return (
    <>
      <PageHeader title="conversas" />
      <div className="chat-layout">
        <aside>
          {chats.isLoading && <p className="muted">carregando…</p>}
          <ErrorBox error={chats.error} />
          {chats.data?.length === 0 && <p className="muted">nenhuma conversa. chats abrem quando um candidato curte a vaga ou você desbloqueia.</p>}
          {chats.data?.map((c) => (
            <Link key={c.id} to={`/conversas/${c.id}`} className={c.id === chatId ? 'chat-item active' : 'chat-item'}>
              <b>{c.candidateName}</b>
              <small>
                {c.initiatedBy === 'MATCH' ? 'match' : 'desbloqueio'} · {timeAgo(c.createdAt)}
              </small>
            </Link>
          ))}
        </aside>
        <div>{chatId ? <Thread chatId={chatId} /> : <p className="muted">escolha uma conversa.</p>}</div>
      </div>
    </>
  );
}

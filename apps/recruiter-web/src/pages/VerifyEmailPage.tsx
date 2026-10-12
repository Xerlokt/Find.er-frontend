import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { z } from 'zod';
import { changeEmail, logout, sendEmailCode, verifyEmail } from '../api/endpoints';
import { ErrorBox, Field, Wordmark } from '../components/ui';
import { isCodeComplete, resendWait, RESEND_SECONDS, sanitizeCode } from '../lib/emailCode';
import { useSession } from '../store/session';

const emailSchema = z.string().trim().email('email inválido');

export function VerifyEmailPage() {
  const email = useSession((s) => s.email);
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [sentAt, setSentAt] = useState(() => Date.now());
  const [wait, setWait] = useState(RESEND_SECONDS);
  const [editing, setEditing] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);
  const requested = useRef(false);

  useEffect(() => {
    const t = setInterval(() => setWait(resendWait(sentAt, Date.now())), 500);
    return () => clearInterval(t);
  }, [sentAt]);

  const restartCountdown = () => {
    setSentAt(Date.now());
    setWait(RESEND_SECONDS);
  };

  const send = useCallback(async (quiet: boolean) => {
    setError(null);
    try {
      await sendEmailCode();
      restartCountdown();
      if (!quiet) setInfo('mandamos um código novo pro seu email');
    } catch (e) {
      // RESEND_TOO_SOON no 1º envio = o código do cadastro acabou de sair; não é erro pro usuário
      if (!quiet) setError(e);
    }
  }, []);

  // contas antigas (sem código pendente) recebem um código ao abrir a página
  useEffect(() => {
    if (requested.current) return;
    requested.current = true;
    void send(true);
  }, [send]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!isCodeComplete(code)) return;
    setBusy(true);
    setError(null);
    setInfo(null);
    try {
      await verifyEmail(code); // tokens novos → o guard de rotas libera o acesso
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  };

  const onChangeEmail = async (e: FormEvent) => {
    e.preventDefault();
    const parsed = emailSchema.safeParse(newEmail);
    if (!parsed.success) {
      setEmailError(parsed.error.issues[0].message);
      return;
    }
    setBusy(true);
    setEmailError(null);
    setError(null);
    setInfo(null);
    try {
      await changeEmail(parsed.data);
      restartCountdown();
      setCode('');
      setEditing(false);
      setNewEmail('');
      setInfo('email atualizado! mandamos um código novo pra ele');
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="center-screen">
      <Wordmark />
      <form className="card auth-card" onSubmit={editing ? onChangeEmail : onSubmit} noValidate>
        <h2>
          confirma teu email<i>.</i>
        </h2>
        <p className="muted">
          mandamos um código de 6 dígitos pra <strong>{email ?? 'o email da empresa'}</strong>. ele vale por 10 minutos.
        </p>

        {editing ? (
          <>
            <Field label="email correto" error={emailError ?? undefined}>
              <input
                type="email"
                autoComplete="email"
                autoFocus
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
              />
            </Field>
            <ErrorBox error={error} />
            <button className="btn primary" disabled={busy}>
              {busy ? 'salvando…' : 'salvar e reenviar código'}
            </button>
            <button
              type="button"
              className="btn ghost"
              onClick={() => {
                setEditing(false);
                setEmailError(null);
                setError(null);
              }}
            >
              cancelar
            </button>
          </>
        ) : (
          <>
            <Field label="código">
              <input
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                placeholder="000000"
                value={code}
                onChange={(e) => setCode(sanitizeCode(e.target.value))}
                style={{ fontSize: 24, letterSpacing: 8, textAlign: 'center' }}
              />
            </Field>
            <ErrorBox error={error} />
            {info && <p className="muted">{info}</p>}
            <button className="btn primary" disabled={busy || !isCodeComplete(code)}>
              {busy ? 'confirmando…' : 'confirmar'}
            </button>
            <button type="button" className="btn ghost" disabled={wait > 0} onClick={() => void send(false)}>
              {wait > 0 ? `reenviar código em ${wait}s` : 'reenviar código'}
            </button>
            <button
              type="button"
              className="btn ghost"
              onClick={() => {
                setEditing(true);
                setNewEmail(email ?? '');
                setError(null);
                setInfo(null);
              }}
            >
              email errado? trocar
            </button>
            <button type="button" className="btn ghost" onClick={() => void logout()}>
              sair
            </button>
          </>
        )}
      </form>
    </div>
  );
}

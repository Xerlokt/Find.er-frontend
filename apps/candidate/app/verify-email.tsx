import { useCallback, useEffect, useRef, useState } from 'react';
import { Text, View } from 'react-native';
import { z } from 'zod';
import { AuthLayout } from '../src/components/AuthLayout';
import { Button } from '../src/components/Button';
import { TextField } from '../src/components/TextField';
import { changeEmail, logout, sendEmailCode, verifyEmail } from '../src/api/auth';
import { friendlyMessage } from '../src/api/errors';
import { isCodeComplete, resendWait, RESEND_SECONDS, sanitizeCode } from '../src/lib/emailCode';
import { useSession } from '../src/store/session';
import { colors, fonts } from '../src/theme';

const emailSchema = z.string().trim().pipe(z.email('email inválido'));

export default function VerifyEmailScreen() {
  const email = useSession((s) => s.email);
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [sentAt, setSentAt] = useState(() => Date.now());
  const [wait, setWait] = useState(RESEND_SECONDS);
  const [editing, setEditing] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [emailError, setEmailError] = useState<string | undefined>();
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
      if (!quiet) setError(friendlyMessage(e));
    }
  }, []);

  // contas antigas (sem código pendente) recebem um código ao abrir a tela
  useEffect(() => {
    if (requested.current) return;
    requested.current = true;
    send(true);
  }, [send]);

  const confirm = async () => {
    if (!isCodeComplete(code)) return;
    setBusy(true);
    setError(null);
    setInfo(null);
    try {
      await verifyEmail(code); // novos tokens → o layout troca de rota sozinho
    } catch (e) {
      setError(friendlyMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const saveEmail = async () => {
    const parsed = emailSchema.safeParse(newEmail);
    if (!parsed.success) {
      setEmailError(parsed.error.issues[0].message);
      return;
    }
    setBusy(true);
    setEmailError(undefined);
    setError(null);
    setInfo(null);
    try {
      await changeEmail(parsed.data.toLowerCase());
      restartCountdown();
      setCode('');
      setEditing(false);
      setNewEmail('');
      setInfo('email atualizado! mandamos um código novo pra ele');
    } catch (e) {
      setError(friendlyMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const subtitle = `mandamos um código de 6 dígitos pra ${email ?? 'seu email'}. ele vale por 10 minutos 💜`;

  return (
    <AuthLayout title="confirma teu email" subtitle={subtitle}>
      <View style={{ gap: 16 }}>
        {editing ? (
          <>
            <TextField
              label="email correto"
              placeholder="voce@email.com"
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              autoFocus
              value={newEmail}
              onChangeText={setNewEmail}
              onSubmitEditing={saveEmail}
              error={emailError}
            />
            {error ? <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.danger }}>{error}</Text> : null}
            <Button label="salvar e reenviar código" variant="accent" onPress={saveEmail} loading={busy} />
            <Button
              label="cancelar"
              variant="ghost"
              onPress={() => {
                setEditing(false);
                setEmailError(undefined);
                setError(null);
              }}
            />
          </>
        ) : (
          <>
            <TextField
              label="código"
              placeholder="000000"
              keyboardType="number-pad"
              autoComplete="one-time-code"
              textContentType="oneTimeCode"
              maxLength={6}
              value={code}
              onChangeText={(t) => setCode(sanitizeCode(t))}
              onSubmitEditing={confirm}
              style={{ fontSize: 24, letterSpacing: 8, textAlign: 'center' }}
            />
            {error ? <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.danger }}>{error}</Text> : null}
            {info ? <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.primary }}>{info}</Text> : null}
            <Button label="confirmar" variant="accent" onPress={confirm} loading={busy} disabled={!isCodeComplete(code)} />
            <Button
              label={wait > 0 ? `reenviar código em ${wait}s` : 'reenviar código'}
              variant="ghost"
              onPress={() => send(false)}
              disabled={wait > 0}
            />
            <Button
              label="email errado? trocar"
              variant="ghost"
              onPress={() => {
                setEditing(true);
                setNewEmail(email ?? '');
                setError(null);
                setInfo(null);
              }}
            />
            <Button label="sair" variant="ghost" onPress={logout} />
          </>
        )}
      </View>
    </AuthLayout>
  );
}

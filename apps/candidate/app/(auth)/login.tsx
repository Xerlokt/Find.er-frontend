import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Link } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AuthLayout } from '../../src/components/AuthLayout';
import { Button } from '../../src/components/Button';
import { TextField } from '../../src/components/TextField';
import { login } from '../../src/api/auth';
import { friendlyMessage } from '../../src/api/errors';
import { colors, fonts, ink } from '../../src/theme';

const schema = z.object({
  email: z.string().trim().pipe(z.email('email inválido')),
  password: z.string().min(1, 'digita sua senha'),
});
type Form = z.infer<typeof schema>;

export default function LoginScreen() {
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Form>({ resolver: zodResolver(schema), defaultValues: { email: '', password: '' } });

  // O redirecionamento após o login é feito pelo guard em app/_layout.tsx
  const onSubmit = handleSubmit(async ({ email, password }) => {
    setServerError(null);
    try {
      await login(email, password);
    } catch (e) {
      setServerError(friendlyMessage(e));
    }
  });

  return (
    <AuthLayout title="bora lá" subtitle="entra pra continuar swipando vagas ✨">
      <View style={{ gap: 16 }}>
        <Controller
          control={control}
          name="email"
          render={({ field }) => (
            <TextField
              label="email"
              placeholder="voce@email.com"
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              error={errors.email?.message}
            />
          )}
        />
        <Controller
          control={control}
          name="password"
          render={({ field }) => (
            <TextField
              label="senha"
              placeholder="••••••••"
              secureTextEntry
              autoComplete="password"
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              onSubmitEditing={onSubmit}
              error={errors.password?.message}
            />
          )}
        />
        {serverError ? (
          <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.danger }}>{serverError}</Text>
        ) : null}
        <Button label="entrar" onPress={onSubmit} loading={isSubmitting} />
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 6 }}>
        <Text style={{ fontFamily: fonts.body, fontSize: 14, color: ink(0.6) }}>ainda não tem conta?</Text>
        <Link href="/register" asChild>
          <Pressable>
            <Text style={{ fontFamily: fonts.bodyBold, fontSize: 14, color: colors.primary }}>cria aqui</Text>
          </Pressable>
        </Link>
      </View>
    </AuthLayout>
  );
}

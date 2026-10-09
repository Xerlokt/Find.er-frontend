import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';
import { login, previewCnpj, registerCompany } from '../api/endpoints';
import { friendlyMessage } from '../api/errors';
import { ErrorBox, Field, Wordmark } from '../components/ui';
import { formatCnpj, isValidCnpj, onlyDigits } from '../lib/cnpj';

const loginSchema = z.object({
  email: z.string().email('email inválido'),
  password: z.string().min(1, 'informe a senha'),
});

type LoginValues = { email: string; password: string };

export function LoginPage() {
  const navigate = useNavigate();
  const [error, setError] = useState<unknown>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (v: LoginValues) => {
    setError(null);
    try {
      await login(v.email, v.password);
      navigate('/vagas');
    } catch (e) {
      setError(e);
    }
  };

  return (
    <div className="center-screen">
      <Wordmark />
      <form className="card auth-card" onSubmit={handleSubmit(onSubmit)} noValidate>
        <h2>
          entra aí<i>.</i>
        </h2>
        <Field label="email da empresa" error={errors.email?.message}>
          <input type="email" autoComplete="email" {...register('email')} />
        </Field>
        <Field label="senha" error={errors.password?.message}>
          <input type="password" autoComplete="current-password" {...register('password')} />
        </Field>
        <ErrorBox error={error} />
        <button className="btn primary" disabled={isSubmitting}>
          {isSubmitting ? 'aguarda…' : 'entrar'}
        </button>
        <p className="muted">
          ainda não tem conta? <Link to="/cadastro">cadastre sua empresa</Link>
        </p>
      </form>
      <p className="muted small-text">candidato? use o app mobile do find.er.</p>
    </div>
  );
}

const registerSchema = z.object({
  cnpj: z.string().refine(isValidCnpj, 'CNPJ inválido'),
  email: z.string().email('email inválido'),
  password: z.string().min(8, 'mínimo de 8 caracteres'),
  description: z.string().max(1000, 'máximo de 1000 caracteres').optional(),
  terms: z.literal(true, { error: 'aceite os termos pra continuar' }),
});
type RegisterValues = { cnpj: string; email: string; password: string; description?: string; terms: boolean };

export function RegisterPage() {
  const navigate = useNavigate();
  const [error, setError] = useState<unknown>(null);
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<RegisterValues>({ resolver: zodResolver(registerSchema) as unknown as Resolver<RegisterValues>, defaultValues: { cnpj: '', terms: false } });

  const cnpj = onlyDigits(watch('cnpj') ?? '');
  const valid = isValidCnpj(cnpj);
  // consulta na Receita (via backend) assim que o CNPJ tem dígitos verificadores corretos
  const info = useQuery({ queryKey: ['cnpj', cnpj], queryFn: () => previewCnpj(cnpj), enabled: valid, retry: false });
  const blocked = info.data ? !info.data.active || info.data.alreadyRegistered : false;

  const onSubmit = async (v: RegisterValues) => {
    setError(null);
    try {
      await registerCompany({ cnpj, email: v.email, password: v.password, description: v.description?.trim() || undefined });
      navigate('/vagas');
    } catch (e) {
      setError(e);
    }
  };

  return (
    <div className="center-screen">
      <Wordmark />
      <form className="card auth-card" onSubmit={handleSubmit(onSubmit)} noValidate>
        <h2>
          cadastre sua empresa<i>.</i>
        </h2>
        <p className="muted">A conta é da empresa (um login por CNPJ). Os dados vêm direto da Receita Federal.</p>

        <Field label="CNPJ" error={errors.cnpj?.message}>
          <input
            inputMode="numeric"
            placeholder="00.000.000/0000-00"
            {...register('cnpj', { onChange: (e) => setValue('cnpj', formatCnpj(e.target.value)) })}
          />
        </Field>

        {valid && info.isLoading && <p className="muted">consultando a Receita…</p>}
        {info.error && <p className="error-box">{friendlyMessage(info.error)}</p>}
        {info.data && (
          <div className={blocked ? 'company-preview bad' : 'company-preview'}>
            <b>{info.data.tradeName ?? info.data.legalName}</b>
            <span>{info.data.legalName}</span>
            <span>
              {[info.data.city, info.data.state].filter(Boolean).join(' / ')} · situação: {info.data.status || '—'}
            </span>
            {info.data.alreadyRegistered && <strong>já existe uma conta para este CNPJ</strong>}
            {!info.data.active && <strong>só empresas com situação ATIVA podem se cadastrar</strong>}
          </div>
        )}

        <Field label="email de acesso" error={errors.email?.message}>
          <input type="email" autoComplete="email" {...register('email')} />
        </Field>
        <Field label="senha" error={errors.password?.message}>
          <input type="password" autoComplete="new-password" {...register('password')} />
        </Field>
        <Field label="sobre a empresa (opcional, aparece pro candidato)" error={errors.description?.message}>
          <textarea rows={3} {...register('description')} />
        </Field>

        <label className="check">
          <input type="checkbox" {...register('terms')} />
          <span>
            Declaro ser responsável por esta empresa e aceito os termos de uso e a política de privacidade (LGPD).
          </span>
        </label>
        {errors.terms && <small className="field-error">{errors.terms.message}</small>}

        <ErrorBox error={error} />
        <button className="btn primary" disabled={isSubmitting || blocked || info.isLoading || !valid}>
          {isSubmitting ? 'criando…' : 'criar conta da empresa'}
        </button>
        <p className="muted">
          já tem conta? <Link to="/login">entrar</Link>
        </p>
      </form>
    </div>
  );
}

import { useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateCompany, uploadCompanyLogo, type Company } from '../../api/endpoints';
import { keys } from '../../api/hooks';
import { ErrorBox, Field } from '../../components/ui';
import { photoProblem } from '../../lib/photo';

const BIO_MAX = 1000;

export function ProfileTab({ company }: { company: Company }) {
  const qc = useQueryClient();
  const [tradeName, setTradeName] = useState(company.tradeName ?? '');
  const [description, setDescription] = useState(company.description ?? '');
  const [logoProblem, setLogoProblem] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const refresh = () => qc.invalidateQueries({ queryKey: keys.company(company.id) });

  const save = useMutation({
    mutationFn: () => updateCompany(company.id, { tradeName: tradeName.trim(), description: description.trim() }),
    onSuccess: refresh,
  });
  const logo = useMutation({
    mutationFn: (file: File) => uploadCompanyLogo(company.id, file),
    onSuccess: refresh,
  });

  const dirty = tradeName.trim() !== (company.tradeName ?? '') || description.trim() !== (company.description ?? '');

  const onLogo = (file?: File) => {
    if (!file) return;
    const problem = photoProblem(file);
    setLogoProblem(problem);
    if (!problem) logo.mutate(file);
    if (fileRef.current) fileRef.current.value = '';
  };

  return (
    <section className="card">
      <h2>perfil da empresa</h2>

      <div className="logo-row">
        {company.logoUrl ? (
          <img className="company-logo" src={company.logoUrl} alt="logo da empresa" />
        ) : (
          <div className="company-logo empty" aria-hidden="true">
            {(company.tradeName ?? company.name).slice(0, 1).toUpperCase()}
          </div>
        )}
        <div>
          <button type="button" className="btn" disabled={logo.isPending} onClick={() => fileRef.current?.click()}>
            {logo.isPending ? 'enviando…' : company.logoUrl ? 'trocar logo' : 'enviar logo'}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            hidden
            onChange={(e) => onLogo(e.target.files?.[0])}
          />
          <p className="muted small">JPEG, PNG ou WebP, até 5 MB.</p>
          {logoProblem && <p className="field-error">{logoProblem}</p>}
          <ErrorBox error={logo.error} />
        </div>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          save.mutate();
        }}
      >
        <Field label="nome fantasia">
          <input value={tradeName} maxLength={150} onChange={(e) => setTradeName(e.target.value)} />
        </Field>
        <Field label="sobre a empresa (bio)">
          <textarea rows={6} value={description} maxLength={BIO_MAX} onChange={(e) => setDescription(e.target.value)} />
        </Field>
        <p className="muted small">
          {description.length}/{BIO_MAX} · razão social e CNPJ vêm da Receita e não podem ser alterados.
        </p>
        <ErrorBox error={save.error} />
        {save.isSuccess && !dirty && <p className="notice ok">perfil salvo.</p>}
        <button className="btn primary" disabled={!dirty || save.isPending}>
          {save.isPending ? 'salvando…' : 'salvar perfil'}
        </button>
      </form>
    </section>
  );
}

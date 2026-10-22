import { useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteCompanyPhoto, uploadCompanyPhoto, type Company } from '../../api/endpoints';
import { keys } from '../../api/hooks';
import { ErrorBox } from '../../components/ui';
import { MAX_PHOTOS, photoProblem } from '../../lib/photo';

export function PhotosTab({ company }: { company: Company }) {
  const qc = useQueryClient();
  const photos = company.photos ?? [];
  const [problem, setProblem] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const refresh = () => qc.invalidateQueries({ queryKey: keys.company(company.id) });

  const add = useMutation({ mutationFn: (file: File) => uploadCompanyPhoto(company.id, file), onSuccess: refresh });
  const remove = useMutation({ mutationFn: (photoId: string) => deleteCompanyPhoto(company.id, photoId), onSuccess: refresh });

  const onPick = (file?: File) => {
    if (!file) return;
    const p = photoProblem(file);
    setProblem(p);
    if (!p) add.mutate(file);
    if (fileRef.current) fileRef.current.value = '';
  };

  const full = photos.length >= MAX_PHOTOS;

  return (
    <section className="card">
      <h2>
        fotos da empresa{' '}
        <span className="muted small">
          {photos.length}/{MAX_PHOTOS}
        </span>
      </h2>
      <p className="muted small">Ambiente, equipe, escritório: mostre como é trabalhar com vocês.</p>

      <div className="photo-grid">
        {photos.map((p) => (
          <figure key={p.id} className="photo">
            <img src={p.url} alt="foto da empresa" loading="lazy" />
            <button
              type="button"
              className="btn photo-remove"
              disabled={remove.isPending}
              onClick={() => window.confirm('Remover esta foto?') && remove.mutate(p.id)}
            >
              remover
            </button>
          </figure>
        ))}
        {!full && (
          <button type="button" className="photo add" disabled={add.isPending} onClick={() => fileRef.current?.click()}>
            {add.isPending ? 'enviando…' : '+ adicionar foto'}
          </button>
        )}
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        hidden
        onChange={(e) => onPick(e.target.files?.[0])}
      />
      {full && <p className="muted small">limite de {MAX_PHOTOS} fotos atingido: remova uma para enviar outra.</p>}
      {problem && <p className="field-error">{problem}</p>}
      <ErrorBox error={add.error ?? remove.error} />
    </section>
  );
}

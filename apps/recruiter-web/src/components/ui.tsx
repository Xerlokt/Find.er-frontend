import type { ReactNode } from 'react';
import { friendlyMessage } from '../api/errors';

export function Wordmark({ small }: { small?: boolean }) {
  return (
    <span className={small ? 'wordmark small' : 'wordmark'}>
      find.er<i>.</i>
      <span className="tag">recrutador</span>
    </span>
  );
}

export function Splash({
  title,
  text,
  action,
}: {
  title: string;
  text?: string;
  action?: { label: string; onClick: () => void };
}) {
  return (
    <div className="center-screen">
      <Wordmark />
      <h2>{title}</h2>
      {text && <p className="muted">{text}</p>}
      {action && (
        <button className="btn" onClick={action.onClick}>
          {action.label}
        </button>
      )}
    </div>
  );
}

export function ErrorBox({ error }: { error: unknown }) {
  if (!error) return null;
  return <p className="error-box">{friendlyMessage(error)}</p>;
}

export function Field({ label, error, children }: { label: string; error?: string; children: ReactNode }) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
      {error && <small className="field-error">{error}</small>}
    </label>
  );
}

export function PageHeader({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="page-header">
      <h1>
        {title}
        <i>.</i>
      </h1>
      <div className="row">{children}</div>
    </div>
  );
}

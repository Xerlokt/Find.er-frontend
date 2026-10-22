import { describe, expect, it } from 'vitest';
import { MAX_PHOTO_BYTES, photoProblem } from './photo';

describe('photoProblem', () => {
  it('aceita JPEG, PNG e WebP dentro do limite', () => {
    for (const type of ['image/jpeg', 'image/png', 'image/webp']) expect(photoProblem({ type, size: 1000 })).toBeNull();
  });
  it('recusa outros formatos', () => {
    expect(photoProblem({ type: 'image/gif', size: 1000 })).toMatch(/JPEG/);
    expect(photoProblem({ type: 'application/pdf', size: 1000 })).not.toBeNull();
  });
  it('recusa arquivo acima de 5 MB', () => {
    expect(photoProblem({ type: 'image/png', size: MAX_PHOTO_BYTES + 1 })).toMatch(/5 MB/);
    expect(photoProblem({ type: 'image/png', size: MAX_PHOTO_BYTES })).toBeNull();
  });
});

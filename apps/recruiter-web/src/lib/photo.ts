export const MAX_PHOTOS = 8;
export const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
const TYPES = ['image/jpeg', 'image/png', 'image/webp'];

/** Mensagem de erro (pt-BR) ou null se o arquivo pode ser enviado. O backend confere de novo pelos bytes. */
export const photoProblem = (file: { type: string; size: number }): string | null => {
  if (!TYPES.includes(file.type)) return 'use uma imagem JPEG, PNG ou WebP';
  if (file.size > MAX_PHOTO_BYTES) return 'a imagem passa de 5 MB';
  return null;
};

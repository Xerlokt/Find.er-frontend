/** Remove tudo que não é dígito (máx. 14). */
export const onlyDigits = (raw: string) => raw.replace(/\D/g, '').slice(0, 14);

/** "11222333000181" -> "11.222.333/0001-81" (aceita entrada parcial enquanto digita). */
export function formatCnpj(raw: string): string {
  const d = onlyDigits(raw);
  return d
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2');
}

function checkDigit(base: string): number {
  const weights = base.length === 12 ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2] : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const sum = base.split('').reduce((acc, ch, i) => acc + Number(ch) * weights[i], 0);
  const rest = sum % 11;
  return rest < 2 ? 0 : 11 - rest;
}

/** Valida tamanho, sequências repetidas e os dois dígitos verificadores (mesma regra do backend). */
export function isValidCnpj(raw: string): boolean {
  const cnpj = raw.replace(/\D/g, '');
  if (cnpj.length !== 14 || /^(\d)\1{13}$/.test(cnpj)) return false;
  const d1 = checkDigit(cnpj.slice(0, 12));
  const d2 = checkDigit(cnpj.slice(0, 12) + d1);
  return cnpj.endsWith(`${d1}${d2}`);
}

import { ActivityIndicator, View } from 'react-native';
import { colors } from '../theme';
import { Wordmark } from './Wordmark';

type Props = {
  /** Mostra a logo acima do spinner. Desligar em telas que já têm cabeçalho próprio. */
  logo?: boolean;
  /** Dentro de uma tela/rolagem: só um bloco centrado, sem ocupar a tela inteira. */
  inline?: boolean;
};

export function Loading({ logo = true, inline = false }: Props) {
  return (
    <View
      style={{
        alignItems: 'center',
        justifyContent: 'center',
        gap: 20,
        ...(inline ? { paddingVertical: 32 } : { flex: 1 }),
      }}
    >
      {logo ? <Wordmark size={40} /> : null}
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );
}

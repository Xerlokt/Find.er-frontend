import { create } from 'zustand';

// Fluxo: perfil (se ainda não existe) -> teste DISC opcional -> app.
// O DISC só é oferecido logo após criar o perfil; depois fica disponível no Perfil.
type OnboardingState = {
  pendingDisc: boolean;
  setPendingDisc: (v: boolean) => void;
};

export const useOnboarding = create<OnboardingState>((set) => ({
  pendingDisc: false,
  setPendingDisc: (pendingDisc) => set({ pendingDisc }),
}));

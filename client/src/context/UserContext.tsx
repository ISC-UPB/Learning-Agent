import { useUserStore } from '../store/userStore';

// Hook específico para obtener solo el id del usuario usando Zustand
export const useUser = () => {
    const user = useUserStore((state) => state.user);
    return { id: user?.id || null };
};

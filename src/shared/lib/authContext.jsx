// Auth provider holding the current session, login and logout.
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { bffGet, bffPost, bffDelete } from './bffClient';
import { AuthContext } from './useAuth';

const ME_QUERY_KEY = ['auth', 'me'];

export function AuthProvider({ children }) {
  const queryClient = useQueryClient();

  const meQuery = useQuery({
    queryKey: ME_QUERY_KEY,
    queryFn: () => bffGet('/auth/me'),
    retry: false,
  });

  const loginMutation = useMutation({
    mutationFn: ({ username, password }) => bffPost('/auth/login', { username, password }),
  });

  const logoutMutation = useMutation({
    mutationFn: () => bffDelete('/auth/logout'),
    onSuccess: () => queryClient.setQueryData(ME_QUERY_KEY, null),
  });

  const login = async (credentials) => {
    const result = await loginMutation.mutateAsync(credentials);
    await queryClient.invalidateQueries({ queryKey: ME_QUERY_KEY });
    return result;
  };

  const value = {
    user: meQuery.data ?? null,
    isAuthenticated: Boolean(meQuery.data),
    isLoading: meQuery.isLoading,
    login,
    logout: logoutMutation.mutateAsync,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

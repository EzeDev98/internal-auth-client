import { createContext, useContext } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { bffGet, bffPost, bffDelete } from './bffClient';

// Step 4F - session-cookie based; no token or secret is ever held here or
// anywhere else in the browser (no localStorage/sessionStorage). "Is the
// user logged in" is answered by asking the BFF (GET /bff/auth/me), which
// only succeeds if the httpOnly session cookie is present and still valid
// server-side - there is nothing client-side to inspect.
const AuthContext = createContext(null);

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

  const verifyOtpMutation = useMutation({
    mutationFn: ({ phoneNumber, otp }) => bffPost('/auth/login/verify-otp', { phoneNumber, otp }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ME_QUERY_KEY }),
  });

  const logoutMutation = useMutation({
    mutationFn: () => bffDelete('/auth/logout'),
    onSuccess: () => queryClient.setQueryData(ME_QUERY_KEY, null),
  });

  const login = async (credentials) => {
    const result = await loginMutation.mutateAsync(credentials);
    if (!result.mfaRequired) {
      await queryClient.invalidateQueries({ queryKey: ME_QUERY_KEY });
    }
    return result;
  };

  const value = {
    user: meQuery.data ?? null,
    isAuthenticated: Boolean(meQuery.data),
    isLoading: meQuery.isLoading,
    login,
    verifyOtp: verifyOtpMutation.mutateAsync,
    logout: logoutMutation.mutateAsync,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}

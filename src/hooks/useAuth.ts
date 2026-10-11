import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { authService } from '../services/auth.service';
import { supabase, isSupabaseConfigured } from '../services/supabase';
import { queryKeys } from '../constants/queryKeys';
import { AuthSession } from '../types/user';

function getCachedSession(): AuthSession {
  try {
    const raw = localStorage.getItem('cleartasks_auth_user');
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore
  }
  return { user: null, accessToken: null };
}

export function useAuth() {
  const queryClient = useQueryClient();

  const sessionQuery = useQuery({
    queryKey: ['auth-session'],
    queryFn: async () => {
      const session = await authService.getSession();
      if (session.user) {
        try {
          localStorage.setItem('cleartasks_auth_user', JSON.stringify(session));
        } catch {
          // ignore
        }
      }
      return session;
    },
    initialData: getCachedSession(),
    staleTime: 1000 * 60 * 15,
  });

  const user = sessionQuery.data?.user || null;
  const userId = user?.id || '';

  // Listen to Supabase auth state changes in real time
  useEffect(() => {
    if (isSupabaseConfigured() && supabase) {
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((_event, session) => {
        const authSession: AuthSession = {
          user: session?.user || null,
          accessToken: session?.access_token || null,
        };
        if (session?.user) {
          try {
            localStorage.setItem('cleartasks_auth_user', JSON.stringify(authSession));
          } catch {
            // ignore
          }
        } else {
          localStorage.removeItem('cleartasks_auth_user');
        }
        queryClient.setQueryData(['auth-session'], authSession);
        queryClient.invalidateQueries({ queryKey: queryKeys.profile });
        queryClient.invalidateQueries({ queryKey: ['tasks'] });
        queryClient.invalidateQueries({ queryKey: ['task-lists'] });
      });

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [queryClient]);

  const profileQuery = useQuery({
    queryKey: [...queryKeys.profile, userId],
    queryFn: () => authService.getProfile(userId),
    enabled: Boolean(userId),
  });

  const signInGoogleMutation = useMutation({
    mutationFn: async () => {
      const result = await authService.signInWithGoogle();
      if (result.error) {
        throw result.error;
      }
      return result;
    },
    onSuccess: (result) => {
      if (result?.url) {
        window.location.href = result.url;
      } else {
        queryClient.invalidateQueries({ queryKey: ['auth-session'] });
        queryClient.invalidateQueries({ queryKey: queryKeys.profile });
      }
    },
  });

  const signInEmailMutation = useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      authService.signInWithEmail(email, password),
    onSuccess: (result) => {
      if (!result.error) {
        queryClient.invalidateQueries({ queryKey: ['auth-session'] });
        queryClient.invalidateQueries({ queryKey: queryKeys.profile });
      }
    },
  });

  const signUpEmailMutation = useMutation({
    mutationFn: ({
      email,
      password,
      displayName,
    }: {
      email: string;
      password: string;
      displayName?: string;
    }) => authService.signUpWithEmail(email, password, displayName),
    onSuccess: (result) => {
      if (!result.error) {
        queryClient.invalidateQueries({ queryKey: ['auth-session'] });
        queryClient.invalidateQueries({ queryKey: queryKeys.profile });
      }
    },
  });

  const signOutMutation = useMutation({
    mutationFn: () => authService.signOut(),
    onSuccess: () => {
      localStorage.removeItem('cleartasks_auth_user');
      queryClient.clear();
      queryClient.setQueryData(['auth-session'], { user: null, accessToken: null });
      queryClient.invalidateQueries({ queryKey: ['auth-session'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.profile });
    },
  });

  return {
    session: sessionQuery.data,
    user,
    userId,
    profile: profileQuery.data || null,
    isLoading: sessionQuery.isLoading || (Boolean(userId) && profileQuery.isLoading),
    signInWithGoogle: signInGoogleMutation.mutateAsync,
    isSigningInWithGoogle: signInGoogleMutation.isPending,
    signInWithEmail: signInEmailMutation.mutateAsync,
    isSigningInWithEmail: signInEmailMutation.isPending,
    signUpWithEmail: signUpEmailMutation.mutateAsync,
    isSigningUpWithEmail: signUpEmailMutation.isPending,
    signOut: signOutMutation.mutate,
    isSigningOut: signOutMutation.isPending,
  };
}

import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useQueryClient } from '@tanstack/react-query';
import {
  useGetCurrentUser,
  useLogin,
  useRegister,
  useLogout,
  LoginRequest,
  RegisterRequest,
  User
} from '@workspace/api-client-react';
import { toast } from '@/hooks/use-toast';

export function useAuth() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  
  // Rely on the hook for current user, but manually manage loading state until initial fetch
  const { data: user, isLoading: isUserLoading, error, refetch } = useGetCurrentUser({
    query: {
      retry: false,
      staleTime: Infinity,
    }
  });

  const loginMutation = useLogin({
    mutation: {
      onSuccess: (data) => {
        localStorage.setItem('layer_token', data.token);
        toast({ title: 'Welcome back!', description: 'Successfully logged in.' });
        queryClient.setQueryData(['/api/auth/me'], data.user);
        setLocation(data.user.role === 'creator' ? '/dashboard/creator' : '/dashboard/editor');
      },
      onError: (err: any) => {
        toast({ 
          title: 'Login failed', 
          description: err?.data?.error || err?.message || 'Invalid credentials', 
          variant: 'destructive' 
        });
      }
    }
  });

  const registerMutation = useRegister({
    mutation: {
      onSuccess: (data: any) => {
        // New flow: no token returned, just a message to check email
        toast({
          title: 'Check your email!',
          description: 'We sent a verification link to your email. Click it to activate your account.',
        });
        setLocation('/login');
      },
      onError: (err: any) => {
        toast({ 
          title: 'Registration failed', 
          description: err?.data?.error || err?.message || 'Please check your inputs', 
          variant: 'destructive' 
        });
      }
    }
  });

  const logoutMutation = useLogout({
    mutation: {
      onSettled: () => {
        localStorage.removeItem('layer_token');
        queryClient.clear();
        setLocation('/login');
        toast({ title: 'Logged out', description: 'You have been successfully logged out.' });
      }
    }
  });

  return {
    user: user as User | undefined,
    isLoading: isUserLoading,
    isAuthenticated: !!user,
    login: loginMutation.mutateAsync,
    isLoggingIn: loginMutation.isPending,
    register: registerMutation.mutateAsync,
    isRegistering: registerMutation.isPending,
    logout: logoutMutation.mutateAsync,
    refetchUser: refetch
  };
}

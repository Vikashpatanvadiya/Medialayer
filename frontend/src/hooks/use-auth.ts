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
import { apiUrl } from '@/lib/api';

const PENDING_PAYMENT_KEY = "layer_pending_payment";

async function activatePendingPayment(token: string, queryClient: ReturnType<typeof useQueryClient>) {
  const pending = localStorage.getItem(PENDING_PAYMENT_KEY);
  if (!pending) return;
  try {
    const { txSignature, plan, walletAddress } = JSON.parse(pending);
    if (!txSignature || !plan) return;
    localStorage.removeItem(PENDING_PAYMENT_KEY);
    const res = await fetch(apiUrl("/api/payments/verify-plan"), {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ txSignature, plan, walletAddress }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok && data.success) {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      toast({ title: `${plan.charAt(0).toUpperCase() + plan.slice(1)} plan activated!`, description: "Your Solana payment has been verified." });
    } else {
      toast({ title: "Plan activation failed", description: data?.error || "Contact support with your tx signature.", variant: "destructive" });
    }
  } catch {}
}

export function useAuth() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  
  const { data: user, isLoading: isUserLoading, error, refetch } = useGetCurrentUser({
    query: {
      retry: false,
      staleTime: Infinity,
    }
  });

  const loginMutation = useLogin({
    mutation: {
      onSuccess: async (data) => {
        localStorage.setItem('layer_token', data.token);
        toast({ title: 'Welcome back!', description: 'Successfully logged in.' });
        queryClient.setQueryData(['/api/auth/me'], data.user);
        // Activate any pending Solana payment
        await activatePendingPayment(data.token, queryClient);
        // Honour ?redirect= param if present (e.g. from pricing page)
        const params = new URLSearchParams(window.location.search);
        const redirect = params.get('redirect');
        if (redirect) {
          setLocation(redirect);
        } else {
          setLocation(data.user.role === 'creator' ? '/dashboard/creator' : '/dashboard/editor');
        }
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
        // Check if there's a redirect param — tell user to verify then they'll be redirected
        const params = new URLSearchParams(window.location.search);
        const redirect = params.get('redirect');
        if (redirect) {
          // Store redirect so login page can pick it up after email verification
          localStorage.setItem('layer_post_verify_redirect', redirect);
        }
        toast({
          title: 'Check your email!',
          description: 'We sent a verification link to your email. Click it to activate your account.',
        });
        setLocation(redirect ? `/login?redirect=${encodeURIComponent(redirect)}` : '/login');
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

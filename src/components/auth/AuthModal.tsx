import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { useAuth } from '../../hooks/useAuth';
import { LogIn, UserPlus, AlertCircle, CheckCircle2 } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { signInWithEmail, signUpWithEmail, signInWithGoogle, isSigningInWithGoogle } = useAuth();

  const handleReset = () => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setEmail('');
    setPassword('');
    setDisplayName('');
  };

  const handleSwitchMode = (newMode: 'signin' | 'signup') => {
    setMode(newMode);
    setErrorMsg(null);
    setSuccessMsg(null);
  };

  const handleGoogleSignIn = async () => {
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      await signInWithGoogle();
    } catch (err: any) {
      const msg = err?.message || 'Google sign-in failed.';
      if (
        msg.toLowerCase().includes('provider is not enabled') ||
        msg.toLowerCase().includes('unsupported provider')
      ) {
        setErrorMsg(
          'Google Sign-In is not enabled in your Supabase project yet. You can sign in right now using Email & Password above, or enable the Google provider in your Supabase Dashboard (Authentication → Providers).'
        );
      } else {
        setErrorMsg(msg);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!email || !password) {
      setErrorMsg('Please enter both email and password.');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      if (mode === 'signin') {
        const result = await signInWithEmail({ email, password });
        if (result?.error) {
          setErrorMsg(result.error.message);
        } else {
          onClose();
          handleReset();
        }
      } else {
        const result = await signUpWithEmail({
          email,
          password,
          displayName: displayName.trim() || undefined,
        });

        if (result?.error) {
          setErrorMsg(result.error.message);
        } else if (result?.requiresEmailConfirmation) {
          setSuccessMsg('Verification link sent! Please check your email to confirm your account.');
        } else {
          onClose();
          handleReset();
        }
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        onClose();
        handleReset();
      }}
      title={mode === 'signin' ? 'Sign In to ClearTasks' : 'Create an Account'}
      maxWidth="sm"
    >
      <div className="flex flex-col gap-4 text-sm text-[#202124] dark:text-[#E8EAED]">
        {/* Mode Toggle Tabs */}
        <div className="flex p-1 bg-[#F1F3F4] dark:bg-[#292A2D] rounded-lg">
          <button
            type="button"
            onClick={() => handleSwitchMode('signin')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
              mode === 'signin'
                ? 'bg-white dark:bg-[#3C4043] text-[#1A73E8] dark:text-white shadow-xs'
                : 'text-[#5F6368] dark:text-[#9AA0A6] hover:text-[#202124] dark:hover:text-white'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => handleSwitchMode('signup')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
              mode === 'signup'
                ? 'bg-white dark:bg-[#3C4043] text-[#1A73E8] dark:text-white shadow-xs'
                : 'text-[#5F6368] dark:text-[#9AA0A6] hover:text-[#202124] dark:hover:text-white'
            }`}
          >
            Sign Up
          </button>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-2 text-xs text-red-600 dark:text-red-400">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Success Alert */}
        {successMsg && (
          <div className="p-3 bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-800 rounded-lg flex items-start gap-2 text-xs text-green-700 dark:text-green-300">
            <CheckCircle2 size={16} className="shrink-0 mt-0.5" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Auth Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          {mode === 'signup' && (
            <div>
              <label className="block text-xs font-medium text-[#5F6368] dark:text-[#9AA0A6] mb-1">
                Display Name (Optional)
              </label>
              <Input
                type="text"
                placeholder="Your Name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-[#5F6368] dark:text-[#9AA0A6] mb-1">
              Email
            </label>
            <Input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#5F6368] dark:text-[#9AA0A6] mb-1">
              Password
            </label>
            <Input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div className="pt-2">
            <Button
              type="submit"
              variant="primary"
              className="w-full justify-center"
              isLoading={loading}
              icon={mode === 'signin' ? <LogIn size={16} /> : <UserPlus size={16} />}
            >
              {mode === 'signin' ? 'Sign In' : 'Create Account'}
            </Button>
          </div>
        </form>

        {/* Divider */}
        <div className="flex items-center my-1">
          <div className="flex-1 border-t border-[#DADCE0] dark:border-[#3C4043]" />
          <span className="px-3 text-xs text-[#80868B] dark:text-[#9AA0A6] uppercase">or</span>
          <div className="flex-1 border-t border-[#DADCE0] dark:border-[#3C4043]" />
        </div>

        {/* Google OAuth Option */}
        <Button
          type="button"
          variant="secondary"
          onClick={handleGoogleSignIn}
          isLoading={isSigningInWithGoogle}
          icon={
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
          }
          className="w-full justify-center"
        >
          Continue with Google
        </Button>
      </div>
    </Modal>
  );
};

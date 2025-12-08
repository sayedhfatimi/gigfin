'use client';

import { useMutation } from '@tanstack/react-query';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import type { ChangeEvent, FormEvent } from 'react';
import { useState } from 'react';

import ReactQueryProvider from '@/components/providers/ReactQueryProvider';
import { authClient, signIn, signUp } from '@/lib/auth-client';

type LoginForm = {
  email: string;
  password: string;
};

type SignupForm = {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
};

const loginInitial: LoginForm = {
  email: '',
  password: '',
};

const signupInitial: SignupForm = {
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
};

const featureHighlights = [
  'Log payouts, tips, and invoices per platform with the quick add form',
  'Filter history by month and platform while aggregated summaries update instantly',
  'Dashboard charts surface totals, daily averages, and platform mix for the year',
];

const describeError = (value: unknown) => {
  if (!value) {
    return 'Something went wrong. Please try again.';
  }
  if (typeof value === 'string') {
    return value;
  }
  if (value instanceof Error) {
    return value.message;
  }
  const errorLike = value as Record<string, unknown>;
  if (typeof errorLike.message === 'string') {
    return errorLike.message;
  }
  if (typeof errorLike.error === 'object' && errorLike.error) {
    const nested = errorLike.error as Record<string, unknown>;
    if (typeof nested.message === 'string') {
      return nested.message;
    }
  }
  if (typeof errorLike.statusText === 'string') {
    return errorLike.statusText;
  }
  return 'Something went wrong. Please try again.';
};

function HomeContent() {
  const [loginForm, setLoginForm] = useState<LoginForm>(loginInitial);
  const [signupForm, setSignupForm] = useState<SignupForm>(signupInitial);
  const [signupValidationError, setSignupValidationError] = useState('');
  const [signupSuccessMessage, setSignupSuccessMessage] = useState('');
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login');
  const [twoFactorPrompt, setTwoFactorPrompt] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [trustDevice, setTrustDevice] = useState(false);
  const router = useRouter();

  const verifyTwoFactorMutation = useMutation({
    mutationFn: async (payload: { code: string; trustDevice: boolean }) => {
      const response = await authClient.twoFactor.verifyTotp({
        code: payload.code,
        trustDevice: payload.trustDevice,
      });
      if (response.error) {
        throw response.error;
      }
      return response.data;
    },
    onSuccess: () => {
      router.push('/dashboard');
    },
  });

  const clearTwoFactorInputs = () => {
    setTwoFactorCode('');
    setTrustDevice(false);
    verifyTwoFactorMutation.reset();
  };

  const resetTwoFactorPrompt = () => {
    setTwoFactorPrompt(false);
    clearTwoFactorInputs();
  };

  const loginMutation = useMutation({
    mutationFn: async (form: LoginForm) => {
      const response = await signIn.email({
        email: form.email,
        password: form.password,
      });
      if (response.error) {
        throw response.error;
      }
      return response.data;
    },
    onSuccess: (data) => {
      const loginData = data as Record<string, unknown> | undefined;
      if (loginData?.twoFactorRedirect) {
        clearTwoFactorInputs();
        setTwoFactorPrompt(true);
        return;
      }
      resetTwoFactorPrompt();
      setLoginForm(loginInitial);
      router.push('/dashboard');
    },
    onError: () => {
      resetTwoFactorPrompt();
    },
  });

  const signupMutation = useMutation({
    mutationFn: async (form: SignupForm) => {
      const response = await signUp.email({
        name: form.name,
        email: form.email,
        password: form.password,
      });
      if (response.error) {
        throw response.error;
      }
      return response.data;
    },
    onSuccess: (data) => {
      const signupData = data as Record<string, unknown> | undefined;
      const user = signupData?.user as
        | { name?: string; email?: string }
        | undefined;
      const displayName = user?.name ?? user?.email ?? 'new user';
      setSignupSuccessMessage(
        `Welcome aboard, ${displayName}! Please verify your email if prompted.`,
      );
      setSignupValidationError('');
      setSignupForm(signupInitial);
    },
    onError: () => {
      setSignupSuccessMessage('');
    },
  });

  const handleTabChange = (tab: 'login' | 'signup') => {
    setActiveTab(tab);
    resetTwoFactorPrompt();
    loginMutation.reset();
    signupMutation.reset();
    setSignupValidationError('');
    setSignupSuccessMessage('');
  };

  const handleLoginChange =
    (field: keyof LoginForm) => (event: ChangeEvent<HTMLInputElement>) => {
      setLoginForm((state) => ({ ...state, [field]: event.target.value }));
    };

  const handleSignupChange =
    (field: keyof SignupForm) => (event: ChangeEvent<HTMLInputElement>) => {
      setSignupForm((state) => ({ ...state, [field]: event.target.value }));
    };

  const handleLogin = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    resetTwoFactorPrompt();
    loginMutation.reset();
    loginMutation.mutate(loginForm);
  };

  const handleSignup = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (signupForm.password !== signupForm.confirmPassword) {
      setSignupValidationError('Passwords must match.');
      return;
    }
    setSignupValidationError('');
    setSignupSuccessMessage('');
    signupMutation.reset();
    signupMutation.mutate(signupForm);
  };

  const handleVerifyTwoFactor = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    verifyTwoFactorMutation.mutate({
      code: twoFactorCode.trim(),
      trustDevice,
    });
  };

  const handleTwoFactorCancel = () => {
    loginMutation.reset();
    resetTwoFactorPrompt();
  };

  const loginErrorMessage = loginMutation.error
    ? describeError(loginMutation.error)
    : '';
  const twoFactorErrorMessage = verifyTwoFactorMutation.error
    ? describeError(verifyTwoFactorMutation.error)
    : '';
  const signupErrorMessage =
    signupValidationError ||
    (signupMutation.error ? describeError(signupMutation.error) : '');
  const isLoginPending = loginMutation.isPending;
  const isVerifyPending = verifyTwoFactorMutation.isPending;
  const isSignupPending = signupMutation.isPending;

  return (
    <main className='min-h-screen bg-base-200'>
      <div className='mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 py-16 lg:px-8'>
        <div className='relative overflow-hidden  border border-base-content/10 bg-white/70 p-8 shadow-xl shadow-primary/10 backdrop-blur dark:bg-base-300/80 dark:border-base-300/50 dark:shadow-black/20'>
          <div
            aria-hidden='true'
            className='pointer-events-none absolute inset-0 bg-linear-to-br from-primary/10 via-transparent to-accent/10 opacity-30 dark:opacity-40'
          />
          <div className='relative z-10 grid gap-10 lg:grid-cols-[1.2fr_0.9fr]'>
            <section className='space-y-6'>
              <div className='flex flex-col gap-3'>
                <div className='flex items-center gap-3'>
                  <div className='relative h-14 w-14 rounded-2xl border border-base-content/10 bg-base-100/80 p-2 shadow-sm dark:border-base-300/40 dark:bg-base-200/60'>
                    <Image
                      src='/logo.png'
                      alt='GigFin logo'
                      fill
                      className='object-contain'
                      priority
                    />
                  </div>
                  <p className='text-xs font-semibold uppercase tracking-[0.4em] text-primary'>
                    GigFin invite
                  </p>
                </div>
                <h1 className='text-4xl font-semibold leading-tight text-slate-900 dark:text-white lg:text-5xl'>
                  A secure ledger for every gig payout
                </h1>
                <p className='text-lg text-base-content/80'>
                  Log earnings across delivery and rideshare platforms, then let
                  the dashboard break totals, averages, and platform mixes back
                  down—sign in or create an account right from this hero screen.
                </p>
              </div>
              <ul className='grid gap-3'>
                {featureHighlights.map((highlight) => (
                  <li
                    key={highlight}
                    className='rounded-2xl border border-base-content/10 bg-base-100/70 px-4 py-3 text-sm text-base-content/80 shadow-sm dark:border-base-300/50 dark:bg-base-200/60'
                  >
                    {highlight}
                  </li>
                ))}
              </ul>
              <div className='grid gap-4 sm:grid-cols-2'>
                <div className='rounded-2xl bg-primary/10 px-4 py-3 text-sm font-semibold text-primary'>
                  Two-factor verification keeps sessions locked down
                </div>
                <div className='rounded-2xl bg-base-100 px-4 py-3 text-sm font-semibold text-base-content/70'>
                  Filters for months and platforms make it easy to compare runs
                </div>
              </div>
            </section>
            <section className='space-y-4  border border-base-content/10 bg-base-100/70 p-6 shadow-sm shadow-base-content/5 backdrop-blur dark:border-base-300/60 dark:bg-base-200/60'>
              <div className='tabs tabs-box w-full gap-2'>
                <button
                  type='button'
                  className={`tab tab-lg flex-1 text-sm font-semibold ${
                    activeTab === 'login' ? 'tab-active' : 'bg-transparent'
                  }`}
                  onClick={() => handleTabChange('login')}
                >
                  Login
                </button>
                <button
                  type='button'
                  className={`tab tab-lg flex-1 text-sm font-semibold ${
                    activeTab === 'signup' ? 'tab-active' : 'bg-transparent'
                  }`}
                  onClick={() => handleTabChange('signup')}
                >
                  Sign up
                </button>
              </div>
              <div
                className={activeTab === 'login' ? 'space-y-4 pt-4' : 'hidden'}
              >
                <div className='flex items-center justify-between text-xs text-base-content/60'>
                  <span>Existing account</span>
                  <span className='text-primary'>Credential login</span>
                </div>
                <form onSubmit={handleLogin} className='grid gap-4'>
                  <div className='form-control w-full'>
                    <label htmlFor='login-email' className='label'>
                      <span className='label-text text-sm'>Email</span>
                    </label>
                    <input
                      id='login-email'
                      type='email'
                      required
                      value={loginForm.email}
                      onChange={handleLoginChange('email')}
                      placeholder='you@example.com'
                      aria-invalid={Boolean(loginErrorMessage)}
                      className={`input input-bordered input-sm w-full bg-transparent ${
                        loginErrorMessage ? 'validator' : ''
                      }`}
                    />
                  </div>
                  <div className='form-control w-full'>
                    <label htmlFor='login-password' className='label'>
                      <span className='label-text text-sm'>Password</span>
                    </label>
                    <input
                      id='login-password'
                      type='password'
                      required
                      value={loginForm.password}
                      onChange={handleLoginChange('password')}
                      placeholder='••••••••'
                      aria-invalid={Boolean(loginErrorMessage)}
                      className={`input input-bordered input-sm w-full bg-transparent ${
                        loginErrorMessage ? 'validator' : ''
                      }`}
                    />
                  </div>
                  {loginErrorMessage && (
                    <output
                      aria-live='polite'
                      className='validator-hint text-sm text-error'
                    >
                      {loginErrorMessage}
                    </output>
                  )}
                  <button
                    type='submit'
                    className='btn btn-primary w-full'
                    disabled={isLoginPending}
                  >
                    {isLoginPending ? 'Signing in…' : 'Sign in'}
                  </button>
                </form>
                {twoFactorPrompt && (
                  <div className='space-y-3 rounded-2xl border border-base-content/20 bg-base-100/70 p-4 text-sm text-base-content/80'>
                    <div className='flex items-center justify-between gap-4'>
                      <div>
                        <p className='text-xs uppercase tracking-[0.4em] text-warning'>
                          Two-factor verification
                        </p>
                        <p className='text-sm text-base-content/70'>
                          Enter the code from your authenticator app to continue
                          signing in.
                        </p>
                      </div>
                      <button
                        type='button'
                        className='text-xs font-semibold text-base-content/70 underline-offset-4 hover:underline'
                        onClick={handleTwoFactorCancel}
                      >
                        Use a different account
                      </button>
                    </div>
                    <form
                      className='grid gap-3'
                      onSubmit={handleVerifyTwoFactor}
                    >
                      <div className='form-control w-full'>
                        <label htmlFor='twofactor-code' className='label'>
                          <span className='label-text text-sm'>
                            Authenticator code
                          </span>
                        </label>
                        <input
                          id='twofactor-code'
                          type='text'
                          inputMode='numeric'
                          pattern='[0-9]*'
                          minLength={6}
                          maxLength={10}
                          autoComplete='one-time-code'
                          required
                          value={twoFactorCode}
                          onChange={(event) =>
                            setTwoFactorCode(event.target.value)
                          }
                          className='input input-bordered input-sm w-full bg-transparent'
                        />
                      </div>
                      <label
                        htmlFor='twofactor-trust'
                        className='flex items-center gap-2 text-xs text-base-content/60'
                      >
                        <input
                          id='twofactor-trust'
                          type='checkbox'
                          checked={trustDevice}
                          onChange={(event) =>
                            setTrustDevice(event.target.checked)
                          }
                          className='checkbox checkbox-xs'
                        />
                        Trust this device for 30 days
                      </label>
                      {twoFactorErrorMessage && (
                        <output
                          aria-live='polite'
                          className='validator-hint text-sm text-error'
                        >
                          {twoFactorErrorMessage}
                        </output>
                      )}
                      <button
                        type='submit'
                        className='btn btn-secondary w-full text-sm font-semibold'
                        disabled={isVerifyPending}
                      >
                        {isVerifyPending ? 'Verifying…' : 'Verify code'}
                      </button>
                    </form>
                  </div>
                )}
              </div>
              <div
                className={activeTab === 'signup' ? 'space-y-4 pt-4' : 'hidden'}
              >
                <div className='flex items-center justify-between text-xs text-base-content/60'>
                  <span>New to GigFin?</span>
                  <span className='text-success'>Password + email</span>
                </div>
                <form onSubmit={handleSignup} className='grid gap-4'>
                  <div className='form-control w-full'>
                    <label htmlFor='signup-name' className='label'>
                      <span className='label-text text-sm'>Full name</span>
                    </label>
                    <input
                      id='signup-name'
                      type='text'
                      required
                      placeholder='Ava Rider'
                      value={signupForm.name}
                      onChange={handleSignupChange('name')}
                      aria-invalid={Boolean(signupErrorMessage)}
                      className={`input input-bordered input-sm w-full bg-transparent ${
                        signupErrorMessage ? 'validator' : ''
                      }`}
                    />
                  </div>
                  <div className='form-control w-full'>
                    <label htmlFor='signup-email' className='label'>
                      <span className='label-text text-sm'>Email</span>
                    </label>
                    <input
                      id='signup-email'
                      type='email'
                      required
                      placeholder='you@example.com'
                      value={signupForm.email}
                      onChange={handleSignupChange('email')}
                      aria-invalid={Boolean(signupErrorMessage)}
                      className={`input input-bordered input-sm w-full bg-transparent ${
                        signupErrorMessage ? 'validator' : ''
                      }`}
                    />
                  </div>
                  <div className='form-control w-full'>
                    <label htmlFor='signup-password' className='label'>
                      <span className='label-text text-sm'>Password</span>
                    </label>
                    <input
                      id='signup-password'
                      type='password'
                      required
                      placeholder='Create a password'
                      value={signupForm.password}
                      onChange={handleSignupChange('password')}
                      aria-invalid={Boolean(signupErrorMessage)}
                      className={`input input-bordered input-sm w-full bg-transparent ${
                        signupErrorMessage ? 'validator' : ''
                      }`}
                    />
                  </div>
                  <div className='form-control w-full'>
                    <label htmlFor='signup-confirm' className='label'>
                      <span className='label-text text-sm'>
                        Confirm password
                      </span>
                    </label>
                    <input
                      id='signup-confirm'
                      type='password'
                      required
                      placeholder='Repeat password'
                      value={signupForm.confirmPassword}
                      onChange={handleSignupChange('confirmPassword')}
                      aria-invalid={Boolean(signupErrorMessage)}
                      className={`input input-bordered input-sm w-full bg-transparent ${
                        signupErrorMessage ? 'validator' : ''
                      }`}
                    />
                  </div>
                  {signupErrorMessage && (
                    <output
                      aria-live='polite'
                      className='validator-hint text-sm text-error'
                    >
                      {signupErrorMessage}
                    </output>
                  )}
                  {signupSuccessMessage && (
                    <output aria-live='polite' className='text-sm text-success'>
                      {signupSuccessMessage}
                    </output>
                  )}
                  <button
                    type='submit'
                    className='btn btn-ghost w-full'
                    disabled={isSignupPending}
                  >
                    {isSignupPending ? 'Creating account…' : 'Create account'}
                  </button>
                </form>
              </div>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function Home() {
  return (
    <ReactQueryProvider>
      <HomeContent />
    </ReactQueryProvider>
  );
}

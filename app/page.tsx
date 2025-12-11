'use client';

import { useMutation } from '@tanstack/react-query';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import type { ChangeEvent, ClipboardEvent, FormEvent } from 'react';
import { useEffect, useRef, useState } from 'react';

import ReactQueryProvider from '@/components/providers/ReactQueryProvider';
import { authClient, signIn, signUp, useSession } from '@/lib/auth-client';
import { getSessionUser } from '@/lib/session';

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
  {
    icon: '🧾',
    title: 'Ledger that knows your platforms',
    description:
      'Log Uber Eats, Deliveroo, Just Eat, Amazon Flex, and other gigs without juggling spreadsheets.',
  },
  {
    icon: '📊',
    title: 'Instant summaries',
    description:
      'Filter by month or platform and let charts aggregate tips, bonuses, and invoices in seconds.',
  },
  {
    icon: '🔒',
    title: 'Secure sessions everywhere',
    description:
      'Two-factor verification, secure cookies, and session locking keep your records private.',
  },
];

const passwordRequirements = [
  'At least 8 characters long',
  'Include at least one number or symbol',
  'Avoid passwords you reuse elsewhere',
];

const twoFactorGuidance =
  'Codes refresh every 30 seconds—paste or type the 6-digit value from your authenticator app.';
const githubUrl = 'https://github.com/sayedhfatimi/gigfin';
const githubIssuesUrl = `${githubUrl}/issues`;
const loginErrorId = 'login-error';
const signupErrorId = 'signup-error';
const signupSuccessId = 'signup-success';
const twoFactorErrorId = 'twofactor-error';
const twoFactorGuidanceId = 'twofactor-guidance';
const twoFactorModalTitle = 'twofactor-title';

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
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('signup');
  const [twoFactorPrompt, setTwoFactorPrompt] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [trustDevice, setTrustDevice] = useState(false);
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [showSignupConfirm, setShowSignupConfirm] = useState(false);
  const router = useRouter();
  const { data: sessionData, isPending: sessionPending } = useSession();
  const sessionUser = getSessionUser(sessionData);
  const twoFactorInputRef = useRef<HTMLInputElement>(null);
  const signupRedirectTimeout = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    const lastTab = window.localStorage.getItem('gigfin-returning-tab');
    if (lastTab === 'login') {
      setActiveTab('login');
    }
  }, []);

  useEffect(() => {
    if (!sessionPending && sessionUser) {
      router.replace('/dashboard');
    }
  }, [router, sessionPending, sessionUser]);

  useEffect(() => {
    if (twoFactorPrompt) {
      twoFactorInputRef.current?.focus();
    }
  }, [twoFactorPrompt]);

  useEffect(() => {
    return () => {
      if (signupRedirectTimeout.current) {
        clearTimeout(signupRedirectTimeout.current);
      }
    };
  }, []);

  const rememberReturningUser = () => {
    if (typeof window === 'undefined') {
      return;
    }
    window.localStorage.setItem('gigfin-returning-tab', 'login');
  };

  const clearSignupRedirect = () => {
    if (signupRedirectTimeout.current) {
      clearTimeout(signupRedirectTimeout.current);
      signupRedirectTimeout.current = null;
    }
  };

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
      rememberReturningUser();
      router.push('/dashboard');
    },
  });

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
        setTwoFactorPrompt(true);
        setTwoFactorCode('');
        return;
      }
      rememberReturningUser();
      setLoginForm(loginInitial);
      setTwoFactorPrompt(false);
      router.push('/dashboard');
    },
    onError: () => {
      setTwoFactorPrompt(false);
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
      const displayName = user?.name ?? user?.email ?? 'friend';
      setSignupSuccessMessage(
        `Welcome aboard, ${displayName}! Redirecting you to the dashboard.`,
      );
      setSignupValidationError('');
      setSignupForm(signupInitial);
      rememberReturningUser();
      clearSignupRedirect();
      signupRedirectTimeout.current = setTimeout(() => {
        router.push('/dashboard');
      }, 600);
    },
    onError: () => {
      setSignupSuccessMessage('');
      clearSignupRedirect();
    },
  });

  const handleTabChange = (tab: 'login' | 'signup') => {
    setActiveTab(tab);
    setTwoFactorPrompt(false);
    setTwoFactorCode('');
    setTrustDevice(false);
    loginMutation.reset();
    signupMutation.reset();
    setSignupValidationError('');
    setSignupSuccessMessage('');
    clearSignupRedirect();
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
    setTwoFactorPrompt(false);
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
    clearSignupRedirect();
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
    setTwoFactorPrompt(false);
    setTwoFactorCode('');
    setTrustDevice(false);
    verifyTwoFactorMutation.reset();
  };

  const handleTwoFactorPaste = (event: ClipboardEvent<HTMLInputElement>) => {
    const pasted = event.clipboardData
      .getData('text')
      .replace(/\D/g, '')
      .slice(0, 6);
    if (pasted) {
      setTwoFactorCode(pasted);
    }
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
  const loginDescribedBy = loginErrorMessage ? loginErrorId : undefined;
  const signupDescribedBy = signupErrorMessage ? signupErrorId : undefined;
  const twoFactorDescribedBy = [
    twoFactorErrorMessage ? twoFactorErrorId : undefined,
    twoFactorGuidanceId,
  ]
    .filter(Boolean)
    .join(' ');

  const loginPaneClass = `space-y-4 pt-4 transition-opacity duration-200 ${
    twoFactorPrompt ? 'opacity-40 pointer-events-none' : ''
  }`;

  return (
    <>
      <main className='min-h-screen bg-base-200'>
        <div className='mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 py-12 sm:py-16 lg:px-8'>
          <div className='relative overflow-hidden border border-base-content/10 bg-white/70 p-6 shadow-xl shadow-primary/10 backdrop-blur dark:bg-base-300/80 dark:border-base-300/50 dark:shadow-black/20 sm:p-8'>
            <div
              aria-hidden='true'
              className='pointer-events-none absolute inset-0 bg-linear-to-br from-primary/10 via-transparent to-accent/10 opacity-30 dark:opacity-40'
            />
            <div className='relative z-10 grid gap-10 lg:grid-cols-[1.2fr_0.9fr]'>
              <section className='order-2 space-y-6 lg:order-1'>
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
                  <p className='text-xs font-semibold uppercase text-primary'>
                    GigFin invite
                  </p>
                </div>
                <h1 className='text-4xl font-semibold leading-tight text-slate-900 dark:text-white lg:text-5xl'>
                  A secure ledger for every gig payout
                </h1>
                <p className='text-lg text-base-content/80'>
                  Uber Eats, Deliveroo, Just Eat, Amazon Flex, and every other
                  gig platform—track tips, bonuses, and invoices without the
                  spreadsheet clutter.
                </p>
                <p className='text-sm text-base-content/70'>
                  Free and open source. Secure by default.
                </p>
              </div>
              <ul className='grid gap-3'>
                {featureHighlights.map((highlight) => (
                  <li
                    key={highlight.title}
                    className='rounded-2xl border border-base-content/10 bg-base-100/70 px-4 py-3 text-sm text-base-content/80 shadow-sm dark:border-base-300/50 dark:bg-base-200/60'
                  >
                    <div className='flex items-start gap-3'>
                      <span className='text-xl leading-none'>
                        {highlight.icon}
                      </span>
                      <div>
                        <p className='text-sm font-semibold text-base-content'>
                          {highlight.title}
                        </p>
                        <p className='text-sm text-base-content/70'>
                          {highlight.description}
                        </p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
              <div className='rounded-2xl bg-base-100/80 px-4 py-3 text-sm font-semibold text-base-content/80 shadow-sm dark:bg-base-200/60 dark:border-base-300/40'>
                Two-factor verification + secure sessions by default.
              </div>
              <div className='flex flex-wrap gap-2 text-xs text-base-content/60'>
                <a
                  href={githubUrl}
                  target='_blank'
                  rel='noreferrer'
                  className='font-semibold text-primary transition hover:text-primary-focus'
                >
                  View source on GitHub
                </a>
                <span className='text-base-content/40'>·</span>
                <a
                  href={githubIssuesUrl}
                  target='_blank'
                  rel='noreferrer'
                  className='text-base-content/70 transition hover:text-base-content'
                >
                  Browse issues
                </a>
              </div>
            </section>
            <section className='order-1 space-y-4 rounded-2xl border border-base-content/10 bg-base-100/70 p-6 shadow-sm shadow-base-content/5 backdrop-blur dark:border-base-300/60 dark:bg-base-200/60 lg:order-2'>
              <p className='text-xs text-base-content/70'>
                Sign in or create an account to start logging earnings without
                spreadsheets.
              </p>
              <div className='tabs tabs-box w-full gap-2'>
                <button
                  type='button'
                  className={`tab tab-lg flex-1 text-sm font-semibold transition ${
                    activeTab === 'login' ? 'tab-active' : 'bg-transparent'
                  }`}
                  onClick={() => handleTabChange('login')}
                >
                  <div className='flex flex-col gap-1 text-center'>
                    <span className='text-base-content'>Login</span>
                    <span className='hidden md:block text-[9px] font-normal uppercase text-base-content/70 leading-tight'>
                      I already have an account
                    </span>
                  </div>
                </button>
                <button
                  type='button'
                  className={`tab tab-lg flex-1 text-sm font-semibold transition ${
                    activeTab === 'signup' ? 'tab-active' : 'bg-transparent'
                  }`}
                  onClick={() => handleTabChange('signup')}
                >
                  <div className='flex flex-col gap-1 text-center'>
                    <span className='text-base-content'>Sign up</span>
                    <span className='hidden md:block text-[9px] font-normal uppercase text-base-content/70 leading-tight'>
                      I’m new to GigFin
                    </span>
                  </div>
                </button>
              </div>
              <div
                className={activeTab === 'login' ? loginPaneClass : 'hidden'}
                aria-hidden={twoFactorPrompt}
              >
                <div className='flex items-center justify-between text-xs text-base-content/60'>
                  <span>Existing account</span>
                  <span className='text-primary'>Credential login</span>
                </div>
                <form
                  onSubmit={handleLogin}
                  className='grid gap-4'
                  aria-busy={isLoginPending}
                >
                  <div className='form-control w-full flex flex-col'>
                    <label htmlFor='login-email' className='label'>
                      <span className='label-text text-sm'>Email</span>
                    </label>
                    <label className='input w-full'>
                      <input
                        id='login-email'
                        type='email'
                        required
                        value={loginForm.email}
                        onChange={handleLoginChange('email')}
                        placeholder='you@example.com'
                        aria-invalid={Boolean(loginErrorMessage)}
                        aria-describedby={loginDescribedBy}
                        className={`w-full bg-transparent grow ${
                          loginErrorMessage ? 'validator' : ''
                        }`}
                      />
                      <i className='fa-solid fa-at'></i>
                    </label>
                  </div>
                  <div className='form-control w-full flex flex-col'>
                    <label htmlFor='login-password' className='label'>
                      <span className='label-text text-sm'>Password</span>
                    </label>
                    <label className='input w-full'>
                      <input
                        id='login-password'
                        type={showLoginPassword ? 'text' : 'password'}
                        required
                        value={loginForm.password}
                        onChange={handleLoginChange('password')}
                        placeholder='••••••••'
                        aria-invalid={Boolean(loginErrorMessage)}
                        aria-describedby={loginDescribedBy}
                        className={`w-full bg-transparent ${
                          loginErrorMessage ? 'validator' : ''
                        }`}
                      />
                      <button
                        type='button'
                        aria-pressed={showLoginPassword}
                        onClick={() => setShowLoginPassword((prev) => !prev)}
                        className={`btn btn-ghost btn-xs btn-square text-xs text-base-content/70 swap swap-rotate p-0 ${
                          showLoginPassword ? 'swap-active' : ''
                        }`}
                      >
                        <i
                          className='fa-solid fa-eye-slash swap-on'
                          aria-hidden='true'
                        />
                        <i
                          className='fa-solid fa-eye swap-off'
                          aria-hidden='true'
                        />
                      </button>
                    </label>
                  </div>
                  {loginErrorMessage && (
                    <output
                      id={loginErrorId}
                      aria-live='polite'
                      className='validator-hint text-sm text-error'
                    >
                      {loginErrorMessage}
                    </output>
                  )}
                  <button
                    type='submit'
                    className='btn btn-primary w-full py-3 text-sm font-semibold transition hover:-translate-y-0.5'
                    disabled={isLoginPending}
                  >
                    {isLoginPending ? 'Signing in…' : 'Sign in'}
                  </button>
                </form>
              </div>
              <div
                className={activeTab === 'signup' ? 'space-y-4 pt-4' : 'hidden'}
              >
                <div className='flex items-center justify-between text-xs text-base-content/60'>
                  <span>New to GigFin?</span>
                  <span className='text-success'>Password + email</span>
                </div>
                <form
                  onSubmit={handleSignup}
                  className='grid gap-4'
                  aria-busy={isSignupPending}
                >
                  <div className='form-control w-full flex flex-col'>
                    <label htmlFor='signup-name' className='label'>
                      <span className='label-text text-sm'>Full name</span>
                    </label>
                    <label className='input w-full'>
                      <input
                        id='signup-name'
                        type='text'
                        required
                        placeholder='Ava Rider'
                        value={signupForm.name}
                        onChange={handleSignupChange('name')}
                        aria-invalid={Boolean(signupErrorMessage)}
                        aria-describedby={signupDescribedBy}
                        className={`bg-transparent ${
                          signupErrorMessage ? 'validator' : ''
                        }`}
                      />
                    </label>
                  </div>
                  <div className='form-control w-full flex flex-col'>
                    <label htmlFor='signup-email' className='label'>
                      <span className='label-text text-sm'>Email</span>
                    </label>
                    <label className='input w-full'>
                      <input
                        id='signup-email'
                        type='email'
                        required
                        placeholder='you@example.com'
                        value={signupForm.email}
                        onChange={handleSignupChange('email')}
                        aria-invalid={Boolean(signupErrorMessage)}
                        aria-describedby={signupDescribedBy}
                        className={`bg-transparent ${
                          signupErrorMessage ? 'validator' : ''
                        }`}
                      />
                    </label>
                  </div>
                  <div className='form-control w-full flex flex-col'>
                    <label htmlFor='signup-password' className='label'>
                      <span className='label-text text-sm'>Password</span>
                    </label>
                    <label className='input w-full'>
                      <input
                        id='signup-password'
                        type={showSignupPassword ? 'text' : 'password'}
                        required
                        placeholder='Create a password'
                        value={signupForm.password}
                        onChange={handleSignupChange('password')}
                        aria-invalid={Boolean(signupErrorMessage)}
                        aria-describedby={signupDescribedBy}
                        className={`bg-transparent ${
                          signupErrorMessage ? 'validator' : ''
                        }`}
                      />
                      <button
                        type='button'
                        aria-pressed={showSignupPassword}
                        onClick={() => setShowSignupPassword((prev) => !prev)}
                        className={`btn btn-ghost btn-xs btn-square text-xs text-base-content/70 swap swap-rotate p-0 ${
                          showSignupPassword ? 'swap-active' : ''
                        }`}
                      >
                        <i
                          className='fa-solid fa-eye-slash swap-on'
                          aria-hidden='true'
                        />
                        <i
                          className='fa-solid fa-eye swap-off'
                          aria-hidden='true'
                        />
                      </button>
                    </label>
                  </div>
                  <div className='form-control w-full flex flex-col'>
                    <label htmlFor='signup-confirm' className='label'>
                      <span className='label-text text-sm'>
                        Confirm password
                      </span>
                    </label>
                    <label className='input w-full'>
                      <input
                        id='signup-confirm'
                        type={showSignupConfirm ? 'text' : 'password'}
                        required
                        placeholder='Repeat password'
                        value={signupForm.confirmPassword}
                        onChange={handleSignupChange('confirmPassword')}
                        aria-invalid={Boolean(signupErrorMessage)}
                        aria-describedby={signupDescribedBy}
                        className={`bg-transparent ${
                          signupErrorMessage ? 'validator' : ''
                        }`}
                      />
                      <button
                        type='button'
                        aria-pressed={showSignupConfirm}
                        onClick={() => setShowSignupConfirm((prev) => !prev)}
                        className={`btn btn-ghost btn-xs btn-square text-xs text-base-content/70 swap swap-rotate p-0 ${
                          showSignupConfirm ? 'swap-active' : ''
                        }`}
                      >
                        <i
                          className='fa-solid fa-eye-slash swap-on'
                          aria-hidden='true'
                        />
                        <i
                          className='fa-solid fa-eye swap-off'
                          aria-hidden='true'
                        />
                      </button>
                    </label>
                  </div>
                  <ul className='text-xs text-base-content/70'>
                    {passwordRequirements.map((requirement) => (
                      <li key={requirement} className='flex items-center gap-2'>
                        <span className='text-primary'>•</span>
                        <span>{requirement}</span>
                      </li>
                    ))}
                  </ul>
                  {signupErrorMessage && (
                    <output
                      id={signupErrorId}
                      aria-live='polite'
                      className='validator-hint text-sm text-error'
                    >
                      {signupErrorMessage}
                    </output>
                  )}
                  {signupSuccessMessage && (
                    <output
                      id={signupSuccessId}
                      aria-live='polite'
                      className='text-sm text-success'
                    >
                      {signupSuccessMessage}
                    </output>
                  )}
                  <button
                    type='submit'
                    className='btn btn-primary w-full py-3 text-sm font-semibold transition hover:-translate-y-0.5'
                    disabled={isSignupPending}
                  >
                    {isSignupPending ? 'Creating account…' : 'Create account'}
                  </button>
                  <p className='text-xs text-base-content/60'>
                    Free and open source. Your income data stays in your
                    account.
                  </p>
                </form>
              </div>
            </section>
          </div>
        </div>
      </div>
    </main>
    {twoFactorPrompt && (
      <div className='fixed inset-0 z-50 flex items-center justify-center px-4 py-8'>
        <div
          className='absolute inset-0 bg-base-content/70 backdrop-blur-sm'
          aria-hidden='true'
        />
        <div
          role='dialog'
          aria-modal='true'
          aria-labelledby={twoFactorModalTitle}
          className='relative w-full max-w-sm rounded-3xl border border-base-content/20 bg-base-100/90 p-6 shadow-2xl shadow-base-content/30 dark:border-base-300/70 dark:bg-base-200/90'
        >
          <div className='space-y-3 text-sm text-base-content/80'>
            <div className='flex items-center justify-between gap-3'>
              <p
                id={twoFactorModalTitle}
                className='text-sm font-semibold text-base-content'
              >
                Two-factor verification
              </p>
              <span className='text-xs uppercase text-warning'>
                Step 2 of 2
              </span>
            </div>
            <p className='text-sm text-base-content/70'>
              Enter the 6-digit code from your authenticator app to finish
              signing in.
            </p>
            <form
              className='grid gap-3'
              onSubmit={handleVerifyTwoFactor}
              aria-busy={isVerifyPending}
            >
              <div className='form-control w-full'>
                <label htmlFor='twofactor-code' className='label'>
                  <span className='label-text text-sm'>Authenticator code</span>
                </label>
                <input
                  id='twofactor-code'
                  type='text'
                  inputMode='numeric'
                  pattern='[0-9]*'
                  minLength={6}
                  maxLength={6}
                  autoComplete='one-time-code'
                  required
                  value={twoFactorCode}
                  onChange={(event) => setTwoFactorCode(event.target.value)}
                  onPaste={handleTwoFactorPaste}
                  aria-invalid={Boolean(twoFactorErrorMessage)}
                  aria-describedby={twoFactorDescribedBy}
                  ref={twoFactorInputRef}
                  className='input input-bordered input-sm w-full bg-transparent'
                />
              </div>
              <label
                htmlFor='twofactor-trust'
                className='flex items-center gap-2 text-sm text-base-content/60'
              >
                <input
                  id='twofactor-trust'
                  type='checkbox'
                  checked={trustDevice}
                  onChange={(event) => setTrustDevice(event.target.checked)}
                  className='checkbox'
                />
                Trust this device for 30 days
              </label>
              {twoFactorErrorMessage && (
                <>
                  <output
                    id={twoFactorErrorId}
                    aria-live='assertive'
                    className='validator-hint text-sm text-error'
                  >
                    {twoFactorErrorMessage}
                  </output>
                  <p className='text-xs text-base-content/70'>
                    Double-check the code, sync your authenticator clock, or
                    request a new one if it keeps failing.
                  </p>
                </>
              )}
              <p
                id={twoFactorGuidanceId}
                className='text-xs text-base-content/60'
              >
                {twoFactorGuidance}
              </p>
              <button
                type='submit'
                className='btn btn-secondary w-full py-3 text-sm font-semibold transition hover:-translate-y-0.5'
                disabled={isVerifyPending}
              >
                {isVerifyPending ? 'Verifying…' : 'Verify code'}
              </button>
            </form>
            <button
              type='button'
              className='text-xs font-semibold text-base-content/70 underline-offset-4 hover:underline'
              onClick={handleTwoFactorCancel}
            >
              Use a different account
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}

export default function Home() {
  return (
    <ReactQueryProvider>
      <HomeContent />
    </ReactQueryProvider>
  );
}

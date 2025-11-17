import React, { useState, useContext, useEffect, useLayoutEffect, useRef, forwardRef } from 'react';
import { AuthContext } from '../context/AuthContext';
import { SpinnerIcon } from '../components/Icons';

type ErrorState = {
    field: 'email' | 'password' | 'confirmPassword' | 'name' | 'general' | null;
    message: string;
}

interface FormInputProps {
  id: string;
  type: string;
  placeholder: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  hasError: boolean;
}

const FormInput = forwardRef<HTMLInputElement, FormInputProps>(
  ({ id, type, placeholder, value, onChange, hasError }, ref) => (
    <div>
      <label htmlFor={id} className="sr-only">{placeholder}</label>
      <input
        ref={ref}
        id={id}
        name={id}
        type={type}
        required
        value={value}
        onChange={onChange}
        className={`appearance-none rounded-md relative block w-full px-3 py-2 border placeholder-gray-500 text-primary-light dark:text-primary-dark bg-transparent focus:outline-none focus:ring-2 focus:border-transparent transition-colors
            ${hasError
              ? 'border-red-500 dark:border-red-500 focus:ring-red-500 dark:focus:ring-red-500'
              : 'border-border-light dark:border-border-dark focus:ring-black dark:focus:ring-white'
            }`
        }
        placeholder={placeholder}
      />
    </div>
  )
);

interface AuthPageProps {
    initialMode?: 'login' | 'signup';
}

const AuthPage: React.FC<AuthPageProps> = ({ initialMode = 'login' }) => {
  const [isLogin, setIsLogin] = useState(initialMode === 'login');
  const { login, signup } = useContext(AuthContext);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<ErrorState>({ field: null, message: '' });
  const [loading, setLoading] = useState(false);
  const emailInputRef = useRef<HTMLInputElement>(null);
  
  useEffect(() => {
    setIsLogin(initialMode === 'login');
  }, [initialMode]);

  // Clear errors and focus email input when switching between login/signup
  useLayoutEffect(() => {
    setError({ field: null, message: '' });
    emailInputRef.current?.focus();
  }, [isLogin]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError({ field: null, message: '' });
    setLoading(true);

    try {
        if (isLogin) {
            await login(email, password);
        } else {
            if (password !== confirmPassword) {
                throw new Error("Passwords do not match.");
            }
            await signup(name, email, password);
        }
    } catch (err: any) {
        const errorMessage = err.message || "An error occurred.";
        let errorField: ErrorState['field'] = 'general';
        
        if (errorMessage.includes("No account found")) {
            errorField = 'email';
        } else if (errorMessage.includes("Incorrect password")) {
            errorField = 'password';
        } else if (errorMessage.includes("Passwords do not match")) {
            errorField = 'confirmPassword';
        } else if (errorMessage.includes("already exists")) {
            errorField = 'email';
        } else if (errorMessage.includes("suspended")) {
            errorField = 'general';
        }
        
        setError({ field: errorField, message: errorMessage });

        // Auto-dismiss error after 4 seconds
        setTimeout(() => setError({ field: null, message: '' }), 4000);

    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-light dark:bg-dark animate-fade-in">
      <div className="max-w-md w-full space-y-8 p-10 bg-card-light dark:bg-card-dark rounded-xl border border-border-light dark:border-border-dark">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-primary-light dark:text-primary-dark tracking-wider">
            {isLogin ? 'WELCOME BACK' : 'CREATE ACCOUNT'}
          </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px flex flex-col gap-y-4">
            {!isLogin && (
                <FormInput id="full-name" type="text" placeholder="Full Name" value={name} onChange={(e) => setName(e.target.value)} hasError={!!error.field && ['name', 'general'].includes(error.field)} />
            )}
            <FormInput ref={emailInputRef} id="email-address" type="email" placeholder="Email address" value={email} onChange={(e) => setEmail(e.target.value)} hasError={!!error.field && ['email', 'general'].includes(error.field)} />
            <FormInput id="password" type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} hasError={!!error.field && ['password', 'general'].includes(error.field)} />
            {!isLogin && (
                <FormInput id="confirm-password" type="password" placeholder="Confirm Password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} hasError={!!error.field && ['confirmPassword', 'general'].includes(error.field)} />
            )}
          </div>
          
          <div className="h-5 text-center">
            {error.message && <p key={error.message} className="text-red-500 text-sm animate-shake">{error.message}</p>}
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center items-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-black hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black dark:text-black dark:bg-white dark:hover:bg-gray-200 dark:focus:ring-white disabled:opacity-50 transition-transform duration-150 active:scale-[0.98]"
            >
              {loading && <SpinnerIcon className="animate-spin mr-3 h-5 w-5" />}
              {loading ? 'Processing...' : (isLogin ? 'Login' : 'Create account')}
            </button>
          </div>
        </form>
        <div className="text-sm text-center">
            <button 
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  setIsLogin(!isLogin)
                }} 
                className="font-medium text-secondary-light dark:text-secondary-dark hover:text-primary-light dark:hover:text-primary-dark"
            >
                {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
            </button>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
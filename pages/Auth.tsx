import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useAppContext } from '../context/AppContext';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { LogoIcon } from '../components/ui/Icons';

const Auth: React.FC = () => {
    const { currentUser, isLoading } = useAppContext();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');

    useEffect(() => {
        if (!isLoading && currentUser) {
            navigate('/dashboard', { replace: true });
        }
    }, [currentUser, isLoading, navigate]);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!supabase) {
            setError('Error: Application is not configured to connect to a database.');
            return;
        }

        if (authMode === 'signup' && password !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }

        setLoading(true);
        setMessage('');
        setError('');

        if (authMode === 'login') {
            // FIX: Reverted to `signInWithPassword` which is the correct method for Supabase JS v2 email/password authentication.
            const { error } = await supabase.auth.signInWithPassword({ email, password });
            if (error) setError(error.message);
        } else { // signup
            // FIX: Assuming 'signUp' error is a red herring caused by the signIn error. The API is generally stable.
            const { data, error } = await supabase.auth.signUp({ email, password });
            if (error) {
                setError(error.message);
            } else {
                // Supabase sends a confirmation email by default if enabled.
                // The user is technically logged in at this point if confirmation is not required.
                // The useEffect hook will handle redirection if login is successful.
                if (data.user?.identities?.length === 0) {
                    setError("User with this email already exists but is unconfirmed. Please check your email for a confirmation link.");
                } else {
                    setMessage('Signup successful! Please check your email for a verification link.');
                }
            }
        }

        setLoading(false);
    };

    if (isLoading || (!isLoading && currentUser)) {
         return (
            <div className="flex h-screen items-center justify-center bg-light dark:bg-secondary">
                <p className="text-xl text-gray-800 dark:text-gray-200">Loading...</p>
            </div>
        );
    }
    
    const title = authMode === 'login' ? 'Login to your Account' : 'Create a New Account';

    return (
        <div className="min-h-screen bg-light dark:bg-secondary flex flex-col justify-center items-center p-4">
            <Card className="max-w-md w-full">
                <div className="text-center mb-8">
                    <LogoIcon className="w-16 h-16 text-primary-500 mx-auto" />
                    <h1 className="text-3xl font-bold mt-4 text-gray-800 dark:text-white">ACCF Ikole Dashboard</h1>
                    <p className="text-gray-500 dark:text-gray-400">{title}</p>
                </div>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                    <InputField id="email" label="Email address" type="email" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email" />
                    <InputField id="password" label="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} required autoComplete={authMode === 'login' ? 'current-password' : 'new-password'} />
                    {authMode === 'signup' && (
                         <InputField id="confirm-password" label="Confirm Password" type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required autoComplete="new-password" />
                    )}
                    
                    {error && <p className="text-sm text-red-600 dark:text-red-400 text-center">{error}</p>}
                    {message && <p className="text-sm text-green-600 dark:text-green-400 text-center">{message}</p>}

                    <div>
                        <Button type="submit" className="w-full" disabled={loading}>
                            {loading ? 'Processing...' : (authMode === 'login' ? 'Login' : 'Sign Up')}
                        </Button>
                    </div>
                </form>

                <div className="mt-6 text-center">
                    <button onClick={() => { setAuthMode(authMode === 'login' ? 'signup' : 'login'); setError(''); setMessage(''); }} className="text-sm text-primary-600 hover:underline dark:text-primary-400">
                        {authMode === 'login' ? "Don't have an account? Sign Up" : "Already have an account? Login"}
                    </button>
                </div>
            </Card>
        </div>
    );
};

const InputField: React.FC<React.InputHTMLAttributes<HTMLInputElement> & {label: string}> = ({id, label, ...props}) => (
    <div>
        <label htmlFor={id} className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            {label}
        </label>
        <div className="mt-1">
            <input
                id={id}
                {...props}
                className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 focus:ring-primary-500 focus:border-primary-500"
            />
        </div>
    </div>
);


export default Auth;
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
    const [message, setMessage] = useState('');

    useEffect(() => {
        if (!isLoading && currentUser) {
            navigate('/dashboard', { replace: true });
        }
    }, [currentUser, isLoading, navigate]);

    const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');
        const { error } = await supabase.auth.signInWithOtp({
            email: email,
            options: {
                emailRedirectTo: window.location.origin,
            },
        });

        if (error) {
            setMessage(error.message);
        } else {
            setMessage('Check your email for the login link!');
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

    return (
        <div className="min-h-screen bg-light dark:bg-secondary flex flex-col justify-center items-center p-4">
            <Card className="max-w-md w-full">
                <div className="text-center mb-8">
                    <LogoIcon className="w-16 h-16 text-primary-500 mx-auto" />
                    <h1 className="text-3xl font-bold mt-4 text-gray-800 dark:text-white">ACCF Ikole Dashboard</h1>
                    <p className="text-gray-500 dark:text-gray-400">Sign in via magic link with your email below.</p>
                </div>
                
                {message ? (
                    <div className={`text-center p-4 mb-4 rounded-md ${message.includes('error') ? 'bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-300' : 'bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300'}`}>
                        {message}
                    </div>
                ) : (
                    <form onSubmit={handleLogin} className="space-y-6">
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                Email address
                            </label>
                            <div className="mt-1">
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 focus:ring-primary-500 focus:border-primary-500"
                                    placeholder="your.email@example.com"
                                />
                            </div>
                        </div>

                        <div>
                            <Button type="submit" className="w-full" disabled={loading}>
                                {loading ? 'Sending...' : 'Send Magic Link'}
                            </Button>
                        </div>
                    </form>
                )}
            </Card>
        </div>
    );
};

export default Auth;
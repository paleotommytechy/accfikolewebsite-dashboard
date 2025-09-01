import React, { useState, useEffect } from 'react';
// FIX: Replaced useHistory with useNavigate for react-router-dom v6 compatibility.
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useAppContext } from '../context/AppContext';
import { EmailIcon, LockClosedIcon, EyeIcon, EyeSlashIcon, GoogleIcon } from '../components/ui/Icons';

const Auth: React.FC = () => {
    const { currentUser, isLoading } = useAppContext();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [authMode, setAuthMode] = useState<'login' | 'signup'>('signup');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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
            const { error } = await supabase.auth.signInWithPassword({ email, password });
            if (error) setError(error.message);
        } else { // signup
            const { data, error } = await supabase.auth.signUp({ email, password });
            if (error) {
                setError(error.message);
            } else {
                if (data.user?.identities?.length === 0) {
                    setError("User with this email already exists but is unconfirmed. Please check your email for a confirmation link.");
                } else {
                    setMessage('Signup successful! Please check your email for a verification link.');
                }
            }
        }

        setLoading(false);
    };

    const signInWithGoogle = async () => {
        if (!supabase) {
            setError('Supabase client not available.');
            return;
        }
        setLoading(true);

        // The redirectTo URL tells Supabase where to send the user back to *your app*
        // after they have authenticated with Google.
        // It must include the hash '#' for react-router's HashRouter to work correctly.
        // Using window.location.origin makes this dynamic for any environment (dev, staging, prod).
        const redirectTo = `${window.location.origin}/#/auth/callback`;

        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo,
                queryParams: {
                  prompt: 'select_account'
                }
            },
        });
        if (error) {
            setError(error.message);
            setLoading(false);
        }
    };

    if (isLoading || (!isLoading && currentUser)) {
         return (
            <div className="flex h-screen items-center justify-center bg-gray-100">
                <p className="text-xl text-gray-800">Loading...</p>
            </div>
        );
    }
    
    const title = authMode === 'signup' ? "We're so glad you're joining us!" : 'Welcome Back!';

    return (
        <div 
            className="min-h-screen bg-cover bg-center flex flex-col justify-center items-center p-4" 
            style={{ backgroundImage: "url('https://images.unsplash.com/photo-1484482340112-e1e2682b4856?q=80&w=1960&auto=format&fit=crop')" }}
        >
            <div className="w-full max-w-sm bg-white/30 backdrop-blur-lg rounded-2xl shadow-2xl p-6 md:p-8 space-y-4">
                <div className="text-center">
                    <img src="https://accfikolewebsite.vercel.app/assets/logo-CsSe79S4.jpg" alt="ACCF Ikole Chapter Logo" className="w-20 h-20 mx-auto rounded-full border-4 border-cyan-200 bg-white" />
                    <h1 className="text-xl font-bold mt-4 text-slate-800">ACCF IKOLE CHAPTER</h1>
                    <p className="text-slate-600 text-sm">{title}</p>
                </div>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                    <InputField 
                        id="email" 
                        placeholder="Enter your email address" 
                        type="email" 
                        value={email} 
                        onChange={e => setEmail(e.target.value)} 
                        required 
                        autoComplete="email"
                        icon={<EmailIcon />}
                    />
                    <InputField 
                        id="password" 
                        placeholder="Password" 
                        type={showPassword ? 'text' : 'password'} 
                        value={password} 
                        onChange={e => setPassword(e.target.value)} 
                        required 
                        autoComplete={authMode === 'login' ? 'current-password' : 'new-password'}
                        icon={<LockClosedIcon />}
                        rightContent={
                            <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-gray-500">
                                {showPassword ? <EyeSlashIcon /> : <EyeIcon />}
                            </button>
                        }
                    />
                    {authMode === 'signup' && (
                         <InputField 
                            id="confirm-password" 
                            placeholder="Confirm Password" 
                            type={showConfirmPassword ? 'text' : 'password'} 
                            value={confirmPassword} 
                            onChange={e => setConfirmPassword(e.target.value)} 
                            required 
                            autoComplete="new-password"
                            icon={<LockClosedIcon />}
                            rightContent={
                                <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="text-gray-500">
                                    {showConfirmPassword ? <EyeSlashIcon /> : <EyeIcon />}
                                </button>
                            }
                        />
                    )}
                    
                    {error && <p className="text-xs text-red-600 bg-red-100 p-2 rounded-md text-center">{error}</p>}
                    {message && <p className="text-xs text-green-700 bg-green-100 p-2 rounded-md text-center">{message}</p>}

                    <div>
                        <button type="submit" className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-300 disabled:opacity-70" disabled={loading}>
                            {loading ? 'Processing...' : (authMode === 'signup' ? 'Sign Up' : 'Login')}
                        </button>
                    </div>
                </form>

                <div className="flex items-center justify-center space-x-2 my-2">
                    <span className="h-px bg-gray-400 w-full"></span>
                    <span className="text-gray-600 font-medium text-sm">or</span>
                    <span className="h-px bg-gray-400 w-full"></span>
                </div>

                <button 
                    onClick={signInWithGoogle} 
                    className="w-full flex items-center justify-center gap-2 bg-white text-slate-700 font-semibold py-3 px-4 rounded-lg border border-slate-300 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-300 disabled:opacity-70"
                    disabled={loading}
                >
                    <GoogleIcon className="w-5 h-5"/>
                    <span>Sign up with Google</span>
                </button>

                <div className="mt-4 text-center">
                    <button onClick={() => { setAuthMode(authMode === 'login' ? 'signup' : 'login'); setError(''); setMessage(''); }} className="text-sm text-slate-700 hover:text-slate-900 hover:underline">
                        {authMode === 'signup' ? "Already have an account? Login" : "Don't have an account? Sign Up"}
                    </button>
                </div>
            </div>
        </div>
    );
};

interface InputFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
    icon: React.ReactNode;
    rightContent?: React.ReactNode;
}

const InputField: React.FC<InputFieldProps> = ({ icon, rightContent, ...props }) => (
    <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
            {icon}
        </div>
        <input
            {...props}
            className="w-full bg-white/70 shadow-inner border border-transparent rounded-lg pl-10 pr-10 py-3 text-gray-900 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
        />
        {rightContent && (
             <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                {rightContent}
            </div>
        )}
    </div>
);

export default Auth;
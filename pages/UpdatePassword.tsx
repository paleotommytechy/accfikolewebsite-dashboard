
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { LockClosedIcon, EyeIcon, EyeSlashIcon } from '../components/ui/Icons';

const UpdatePassword = () => {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [sessionReady, setSessionReady] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        if (!supabase) return;
        
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'PASSWORD_RECOVERY') {
                setSessionReady(true);
            }
        });

        // In case the event already fired before the listener was attached
        supabase.auth.getSession().then(({ data: { session } }) => {
            // Supabase JS v2 automatically handles the fragment and creates a session.
            // If there's a session on this page, it must be from the recovery link.
            if (session) {
                setSessionReady(true);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }
        if (password.length < 6) {
            setError('Password should be at least 6 characters.');
            return;
        }

        setLoading(true);
        setError('');
        setMessage('');
        
        if (!supabase) return;
        
        const { error } = await supabase.auth.updateUser({ password });
        
        if (error) {
            setError(error.message);
        } else {
            setMessage('Password updated successfully! Redirecting to login...');
            setTimeout(() => {
                supabase.auth.signOut(); // Ensure session is cleared before redirect
                navigate('/auth');
            }, 2000);
        }
        setLoading(false);
    };
    
    return (
         <div 
            className="min-h-screen bg-cover bg-center flex flex-col justify-center items-center p-4" 
            style={{ backgroundImage: "url('https://images.unsplash.com/photo-1469228252629-cbe7cb7db2c8?q=80&w=773&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D')" }}
        >
            <div className="w-full max-w-sm bg-white/30 backdrop-blur-lg rounded-2xl shadow-2xl p-6 md:p-8 space-y-4">
                <div className="text-center">
                     <h1 className="text-xl font-bold mt-4 text-slate-800">Create a New Password</h1>
                </div>
                
                {!sessionReady ? (
                    <p className="text-center text-slate-600">Verifying your request... If you did not arrive here from a password reset link, please return to the login page.</p>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                         <InputField 
                            id="password" 
                            placeholder="New Password" 
                            type={showPassword ? 'text' : 'password'} 
                            value={password} 
                            onChange={e => setPassword(e.target.value)} 
                            required 
                            autoComplete="new-password"
                            icon={<LockClosedIcon />}
                            rightContent={
                                <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-gray-500">
                                    {showPassword ? <EyeSlashIcon /> : <EyeIcon />}
                                </button>
                            }
                        />
                        <InputField 
                            id="confirm-password" 
                            placeholder="Confirm New Password" 
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
                        {error && <p className="text-xs text-red-600 bg-red-100 p-2 rounded-md text-center">{error}</p>}
                        {message && <p className="text-xs text-green-700 bg-green-100 p-2 rounded-md text-center">{message}</p>}
                        
                        <div>
                            <button type="submit" className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-70" disabled={loading || !!message}>
                                {loading ? 'Updating...' : 'Update Password'}
                            </button>
                        </div>
                    </form>
                )}
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

export default UpdatePassword;

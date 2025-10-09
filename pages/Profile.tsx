import React, { useState, useRef, useEffect, Suspense, lazy } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { useNotifier } from '../context/NotificationContext';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Avatar from '../components/auth/Avatar';
import { supabase } from '../lib/supabaseClient';
import type { UserProfile } from '../types';
import { ChatIcon } from '../components/ui/Icons';

const AutoSaveField = lazy(() => import('../components/ui/AutoSaveField'));
const InputLoadingSkeleton = () => <div className="w-full h-10 bg-gray-100 dark:bg-gray-800 rounded-md animate-pulse"></div>;

// A read-only component to display a piece of user info
const InfoItem: React.FC<{label: string, value: string | null | undefined}> = ({label, value}) => (
    <div>
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{label}</p>
        <p className="mt-1 text-base text-gray-900 dark:text-gray-100">{value || 'Not set'}</p>
    </div>
);

// The editor form for the current user's profile
const ProfileEditor: React.FC<{
    profile: UserProfile;
    isEditing: boolean;
    onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
}> = ({ profile, isEditing, onInputChange }) => {
    const commonProps = {
        className: "w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-200 dark:disabled:bg-gray-800",
        disabled: !isEditing,
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Full Name</label>
                <Suspense fallback={<InputLoadingSkeleton />}>
                    <AutoSaveField {...commonProps} as="input" name="full_name" value={profile.full_name || ''} onChange={onInputChange} storageKey={`profile-editor-full_name-${profile.id}`} />
                </Suspense>
            </div>
             <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Fellowship Position</label>
                <Suspense fallback={<InputLoadingSkeleton />}>
                    <AutoSaveField {...commonProps} as="input" name="fellowship_position" value={profile.fellowship_position || ''} onChange={onInputChange} storageKey={`profile-editor-fellowship_position-${profile.id}`} />
                </Suspense>
            </div>
             <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Department</label>
                <Suspense fallback={<InputLoadingSkeleton />}>
                    <AutoSaveField {...commonProps} as="input" name="department" value={profile.department || ''} onChange={onInputChange} storageKey={`profile-editor-department-${profile.id}`} />
                </Suspense>
            </div>
            <SelectField label="Gender" name="gender" value={profile.gender || ''} onChange={onInputChange} disabled={!isEditing}>
                <option value="" disabled>Select gender...</option>
                <option>Male</option>
                <option>Female</option>
                <option>Other</option>
            </SelectField>
             <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Birthday (MM-DD)</label>
                <Suspense fallback={<InputLoadingSkeleton />}>
                    <AutoSaveField {...commonProps} as="input" name="dob" value={profile.dob || ''} onChange={onInputChange} storageKey={`profile-editor-dob-${profile.id}`} />
                </Suspense>
            </div>
            <InputField label="Email" name="email" value={profile.email} onChange={onInputChange} disabled={true} type="email" />
             <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">WhatsApp</label>
                <Suspense fallback={<InputLoadingSkeleton />}>
                    <AutoSaveField {...commonProps} as="input" type="tel" name="whatsapp" value={profile.whatsapp || ''} onChange={onInputChange} storageKey={`profile-editor-whatsapp-${profile.id}`} />
                </Suspense>
            </div>
             <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Hotline</label>
                <Suspense fallback={<InputLoadingSkeleton />}>
                    <AutoSaveField {...commonProps} as="input" type="tel" name="hotline" value={profile.hotline || ''} onChange={onInputChange} storageKey={`profile-editor-hotline-${profile.id}`} />
                </Suspense>
            </div>
        </div>
    );
};

const InputField: React.FC<React.InputHTMLAttributes<HTMLInputElement> & {label: string}> = ({label, ...props}) => (
    <div>
        <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">{label}</label>
        <input {...props} className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-200 dark:disabled:bg-gray-800" />
    </div>
);
const SelectField: React.FC<React.SelectHTMLAttributes<HTMLSelectElement> & {label: string}> = ({label, children, ...props}) => (
    <div>
        <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">{label}</label>
        <select {...props} className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-200 dark:disabled:bg-gray-800">
            {children}
        </select>
    </div>
);

const Profile: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { currentUser, isLoading: isAppLoading, refreshCurrentUser } = useAppContext();
  const { addToast } = useNotifier();
  
  const [displayedUser, setDisplayedUser] = useState<UserProfile | null>(null);
  const [profileForEditing, setProfileForEditing] = useState<UserProfile | null>(null);
  
  const [isEditing, setIsEditing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);
  
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const isOwnProfile = !userId || userId === currentUser?.id;

  useEffect(() => {
    const fetchProfile = async () => {
        setProfileLoading(true);
        setIsEditing(false);

        if (isOwnProfile && currentUser) {
            setDisplayedUser(currentUser);
            setProfileForEditing(JSON.parse(JSON.stringify(currentUser)));
            setProfileLoading(false);
        } else if (userId) {
            if (!supabase) return;
            const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
            if (error || !data) {
                addToast('Could not find user profile.', 'error');
                navigate('/dashboard', { replace: true });
            } else {
                setDisplayedUser(data as UserProfile);
                setProfileForEditing(null);
            }
            setProfileLoading(false);
        }
    };
    
    if (!isAppLoading) {
       fetchProfile();
    }
  }, [userId, currentUser, isOwnProfile, navigate, addToast, isAppLoading]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    if (!profileForEditing) return;
    const { name, value } = e.target;
    setProfileForEditing(prev => prev ? { ...prev, [name]: value } : null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileForEditing || !supabase || !isOwnProfile) return;

    try {
        const { id, email, coins, level, role, ...updateData } = profileForEditing;
        const { error } = await supabase
            .from('profiles')
            .update(updateData)
            .eq('id', id);

        if (error) throw error;
        
        addToast('Profile saved successfully!', 'success');
        
        // Clear autosaved data from localStorage
        const fieldsToClear = ['full_name', 'fellowship_position', 'department', 'dob', 'whatsapp', 'hotline'];
        fieldsToClear.forEach(field => {
            localStorage.removeItem(`profile-editor-${field}-${id}`);
        });

        await refreshCurrentUser();
        setIsEditing(false);
    } catch (error: any) {
        addToast('Error updating profile: ' + error.message, 'error');
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || !isOwnProfile || !displayedUser || !supabase) {
        return;
    }
    
    setIsUploading(true);
    try {
        const file = e.target.files[0];
        const fileExt = file.name.split('.').pop();
        const filePath = `${displayedUser.id}/${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
            .from('avatars')
            .upload(filePath, file, { upsert: true });

        if (uploadError) throw uploadError;

        const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
        const newAvatarUrl = data.publicUrl;

        const { error: updateError } = await supabase
            .from('profiles')
            .update({ avatar_url: newAvatarUrl })
            .eq('id', displayedUser.id);

        if (updateError) throw updateError;
        
        addToast('Avatar updated successfully!', 'success');
        await refreshCurrentUser();
    } catch (error: any) {
        addToast(`Error uploading to bucket 'avatars': ${error.message}`, 'error');
    } finally {
        setIsUploading(false);
    }
  };

  if (isAppLoading || profileLoading || !displayedUser) {
    return <div className="text-center p-8">Loading profile...</div>;
  }

  const headerText = isOwnProfile ? `Welcome, ${displayedUser.full_name || 'Member'}.` : `${displayedUser.full_name || 'User'}'s Profile`;

  const avatarUploader = isOwnProfile ? (
    <>
      <label htmlFor="avatar-upload" className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity">
        <span className="text-white text-sm">{isUploading ? 'Uploading...' : 'Change'}</span>
      </label>
      <input type="file" id="avatar-upload" accept="image/*" className="hidden" onChange={handleAvatarUpload} disabled={isUploading} ref={avatarInputRef} />
    </>
  ) : null;

  return (
    <div className="space-y-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-white">{headerText}</h1>

        <Card className="!p-0">
            <div className="h-32 bg-primary-500 rounded-t-lg"></div>
            <div className="p-6">
                <div className="flex flex-col sm:flex-row sm:items-end -mt-16 sm:-mt-20">
                    <div className="relative group">
                      <Avatar src={displayedUser.avatar_url} alt={displayedUser.full_name || 'User Avatar'} size="xl" className="border-4 border-white dark:border-dark" />
                       {avatarUploader}
                    </div>
                    <div className="sm:ml-4 mt-4 sm:mt-0 text-center sm:text-left">
                        <h2 className="text-2xl font-bold">{displayedUser.full_name || 'New Member'}</h2>
                        <p className="text-gray-500">{displayedUser.fellowship_position || 'position not set'}</p>
                    </div>
                    {!isOwnProfile && (
                        <div className="sm:ml-auto mt-4 sm:mt-0">
                            <Button onClick={() => navigate(`/messages/${userId}`)}>
                                <ChatIcon className="w-5 h-5 mr-2" />
                                Send Message
                            </Button>
                        </div>
                    )}
                </div>
                 <div className="mt-4 flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-300 justify-center sm:justify-start">
                    <span>Level: <span className="font-semibold text-primary-500">{displayedUser.level}</span></span>
                    <span>Coins: <span className="font-semibold text-yellow-500">{displayedUser.coins}</span></span>
                </div>
            </div>
        </Card>
        
        {isOwnProfile && profileForEditing ? (
             <Card>
                <form onSubmit={handleSave}>
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold">Personal Information</h2>
                        {isEditing ? (
                            <div className="space-x-2">
                                <Button type="button" variant="ghost" onClick={() => { setIsEditing(false); setProfileForEditing(currentUser); }}>Cancel</Button>
                                <Button type="submit">Save Changes</Button>
                            </div>
                        ) : (
                            <Button type="button" variant="outline" onClick={() => setIsEditing(true)}>Edit Profile</Button>
                        )}
                    </div>
                    <ProfileEditor profile={profileForEditing} isEditing={isEditing} onInputChange={handleInputChange} />
                </form>
            </Card>
        ) : (
             <Card>
                <h2 className="text-xl font-bold mb-6">User Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                   <InfoItem label="Full Name" value={displayedUser.full_name} />
                   <InfoItem label="Email" value={displayedUser.email} />
                   <InfoItem label="Fellowship Position" value={displayedUser.fellowship_position} />
                   <InfoItem label="Department" value={displayedUser.department} />
                   <InfoItem label="Gender" value={displayedUser.gender} />
                   <InfoItem label="WhatsApp" value={displayedUser.whatsapp} />
                </div>
            </Card>
        )}
    </div>
  );
};

export default Profile;
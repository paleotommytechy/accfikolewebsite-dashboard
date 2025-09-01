
import React, { useState, useRef, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Avatar from '../components/auth/Avatar';
import { supabase } from '../lib/supabaseClient';
import type { UserProfile } from '../types';

// ProfileEditor is now a presentational component that receives state and handlers as props.
const ProfileEditor: React.FC<{
    profile: UserProfile;
    isEditing: boolean;
    onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
}> = ({ profile, isEditing, onInputChange }) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InputField label="Full Name" name="full_name" value={profile.full_name || ''} onChange={onInputChange} disabled={!isEditing} />
            <InputField label="Fellowship Position" name="fellowship_position" value={profile.fellowship_position || ''} onChange={onInputChange} disabled={!isEditing} />
            <InputField label="Department" name="department" value={profile.department || ''} onChange={onInputChange} disabled={!isEditing} />
            <SelectField label="Gender" name="gender" value={profile.gender || ''} onChange={onInputChange} disabled={!isEditing}>
                <option value="" disabled>Select gender...</option>
                <option>Male</option>
                <option>Female</option>
                <option>Other</option>
            </SelectField>
            <InputField label="Birthday (MM-DD)" name="dob" value={profile.dob || ''} onChange={onInputChange} disabled={!isEditing} />
            <InputField label="Email" name="email" value={profile.email} onChange={onInputChange} disabled={true} type="email" />
            <InputField label="WhatsApp" name="whatsapp" value={profile.whatsapp || ''} onChange={onInputChange} disabled={!isEditing} type="tel" />
            <InputField label="Hotline" name="hotline" value={profile.hotline || ''} onChange={onInputChange} disabled={!isEditing} type="tel" />
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
  const { currentUser, isLoading, refreshCurrentUser } = useAppContext();
  const [profile, setProfile] = useState<UserProfile | null>(currentUser);
  const [isEditing, setIsEditing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Sync local state when currentUser from context changes
    setProfile(currentUser);
  }, [currentUser]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    if (!profile) return;
    const { name, value } = e.target;
    setProfile(prev => prev ? ({...prev, [name]: value}) : null);
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault(); // Prevent default form submission which causes a page reload.
    if (!profile || !supabase) return;

    try {
        const upsertData = {
            id: profile.id, // Include the primary key for upsert
            full_name: profile.full_name,
            fellowship_position: profile.fellowship_position,
            department: profile.department,
            gender: profile.gender,
            dob: profile.dob,
            whatsapp: profile.whatsapp,
            hotline: profile.hotline,
        };
        const { error } = await supabase
            .from('profiles')
            .upsert(upsertData);
        
        if (error) throw error;
        
        alert('Profile saved successfully!');
        await refreshCurrentUser();
        setIsEditing(false);
    } catch (error: any) {
        alert('Error updating profile: ' + error.message);
    }
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || !profile || !supabase) {
        return;
    }
    
    setIsUploading(true);
    try {
        const file = e.target.files[0];
        const fileExt = file.name.split('.').pop();
        const filePath = `${profile.id}/${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
            .from('avatars')
            .upload(filePath, file, { upsert: true });

        if (uploadError) throw uploadError;

        const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
        const newAvatarUrl = data.publicUrl;

        const { error: updateError } = await supabase
            .from('profiles')
            .update({ avatar_url: newAvatarUrl })
            .eq('id', profile.id);

        if (updateError) throw updateError;
        
        alert('Avatar updated successfully!');
        await refreshCurrentUser();
    } catch (error: any) {
        alert('Error uploading avatar: ' + error.message);
    } finally {
        setIsUploading(false);
    }
  };

  if (isLoading || !profile) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Welcome, {profile.full_name || 'Member'}.</h1>

        <Card className="!p-0">
            <div className="h-32 bg-primary-500 rounded-t-lg"></div>
            <div className="p-6">
                <div className="flex items-end -mt-16">
                    <div className="relative group">
                      <Avatar src={profile.avatar_url} alt={profile.full_name || 'User Avatar'} size="xl" className="border-4 border-white dark:border-dark" />
                       <label htmlFor="avatar-upload" className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="text-white text-sm">{isUploading ? 'Uploading...' : 'Change'}</span>
                        </label>
                       <input type="file" id="avatar-upload" accept="image/*" className="hidden" onChange={handleAvatarUpload} disabled={isUploading} ref={avatarInputRef} />
                    </div>
                    <div className="ml-4">
                        <h2 className="text-2xl font-bold">{profile.full_name || 'New Member'}</h2>
                        <p className="text-gray-500">{profile.fellowship_position || 'position not set'}</p>
                    </div>
                </div>
                 <div className="mt-4 flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-300">
                    <span>Level: <span className="font-semibold text-primary-500">{profile.level}</span></span>
                    <span>Coins: <span className="font-semibold text-yellow-500">{profile.coins}</span></span>
                </div>
            </div>
        </Card>
        
        <Card>
            <form onSubmit={handleSave}>
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold">Personal Information</h2>
                    {isEditing ? (
                        <div className="space-x-2">
                            <Button type="button" variant="ghost" onClick={() => { setIsEditing(false); setProfile(currentUser); }}>Cancel</Button>
                            <Button type="submit">Save Changes</Button>
                        </div>
                    ) : (
                        <Button type="button" variant="outline" onClick={() => setIsEditing(true)}>Edit Profile</Button>
                    )}
                </div>
                <ProfileEditor profile={profile} isEditing={isEditing} onInputChange={handleInputChange} />
            </form>
        </Card>
    </div>
  );
};

export default Profile;
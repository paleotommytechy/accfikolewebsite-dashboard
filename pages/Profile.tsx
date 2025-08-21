
import React, { useState, useRef } from 'react';
import { useAppContext } from '../context/AppContext';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Avatar from '../components/ui/Avatar';
import { supabase } from '../lib/supabaseClient';
import type { UserProfile, Badge } from '../types';

const ProfileEditor: React.FC<{user: UserProfile}> = ({ user }) => {
    const [profile, setProfile] = useState(user);
    const [isEditing, setIsEditing] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const avatarInputRef = useRef<HTMLInputElement>(null);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setProfile(prev => ({...prev, [name]: value}));
    }

    const handleSave = async () => {
        if (!user) return;
        // Construct an explicit update payload with only the editable fields
        // to ensure type safety and prevent accidentally updating protected fields.
        const updateData = {
            name: profile.name,
            fellowship_position: profile.fellowship_position,
            department: profile.department,
            gender: profile.gender,
            dob: profile.dob,
            whatsapp: profile.whatsapp,
            hotline: profile.hotline,
        };
        const { error } = await supabase
            .from('profiles')
            .update(updateData)
            .eq('id', user.id);
        
        if (error) {
            alert('Error updating profile: ' + error.message);
        } else {
            alert('Profile saved successfully!');
            setIsEditing(false);
        }
    }

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0 || !user) {
            return;
        }
        
        const file = e.target.files[0];
        const fileExt = file.name.split('.').pop();
        const filePath = `${user.id}.${fileExt}`;

        setIsUploading(true);
        const { error: uploadError } = await supabase.storage
            .from('avatars')
            .upload(filePath, file, { upsert: true });

        if (uploadError) {
            alert('Error uploading avatar: ' + uploadError.message);
            setIsUploading(false);
            return;
        }

        const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
        const newAvatarUrl = `${data.publicUrl}?t=${new Date().getTime()}`; // Add timestamp to break cache

        const { error: updateError } = await supabase
            .from('profiles')
            .update({ avatar_url: newAvatarUrl })
            .eq('id', user.id);

        if (updateError) {
            alert('Error updating profile with new avatar: ' + updateError.message);
        } else {
            setProfile(prev => ({ ...prev, avatar_url: newAvatarUrl }));
        }
        setIsUploading(false);
    };


    return (
        <Card>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">Personal Information</h2>
                {isEditing ? (
                    <div className="space-x-2">
                        <Button variant="ghost" onClick={() => { setIsEditing(false); setProfile(user); }}>Cancel</Button>
                        <Button onClick={handleSave}>Save Changes</Button>
                    </div>
                ) : (
                    <Button variant="outline" onClick={() => setIsEditing(true)}>Edit Profile</Button>
                )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <InputField label="Full Name" name="name" value={profile.name} onChange={handleInputChange} disabled={!isEditing} />
                <InputField label="Fellowship Position" name="fellowship_position" value={profile.fellowship_position} onChange={handleInputChange} disabled={!isEditing} />
                <InputField label="Department" name="department" value={profile.department} onChange={handleInputChange} disabled={!isEditing} />
                <SelectField label="Gender" name="gender" value={profile.gender} onChange={handleInputChange} disabled={!isEditing}>
                    <option>Male</option>
                    <option>Female</option>
                    <option>Other</option>
                </SelectField>
                <InputField label="Birthday (MM-DD)" name="dob" value={profile.dob} onChange={handleInputChange} disabled={!isEditing} />
                <InputField label="Email" name="email" value={profile.email} onChange={handleInputChange} disabled={true} type="email" />
                <InputField label="WhatsApp" name="whatsapp" value={profile.whatsapp} onChange={handleInputChange} disabled={!isEditing} type="tel" />
                <InputField label="Hotline" name="hotline" value={profile.hotline} onChange={handleInputChange} disabled={!isEditing} type="tel" />
            </div>
        </Card>
    )
}

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

const Badges: React.FC<{badges: Badge[]}> = ({ badges }) => (
    <Card title="My Badges">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {badges.map(badge => (
                <div key={badge.id} className="flex flex-col items-center text-center p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700" title={badge.description}>
                    <span className="text-4xl">{badge.icon}</span>
                    <p className="text-sm font-semibold mt-2">{badge.name}</p>
                </div>
            ))}
        </div>
    </Card>
);

const Profile: React.FC = () => {
  const { currentUser, isLoading } = useAppContext();

  if (isLoading || !currentUser) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
        <Card className="!p-0">
            <div className="h-32 bg-primary-500 rounded-t-lg"></div>
            <div className="p-6">
                <div className="flex items-end -mt-16">
                    <div className="relative group">
                      <Avatar src={currentUser.avatar_url} alt={currentUser.name} size="xl" className="border-4 border-white dark:border-dark" />
                       <label htmlFor="avatar-upload" className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="text-white text-sm">Change</span>
                        </label>
                       <input type="file" id="avatar-upload" accept="image/*" className="hidden" />
                    </div>
                    <div className="ml-4">
                        <h1 className="text-2xl font-bold">{currentUser.name}</h1>
                        <p className="text-gray-500">{currentUser.fellowship_position}</p>
                    </div>
                </div>
                 <div className="mt-4 flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-300">
                    <span>Level: <span className="font-semibold text-primary-500">{currentUser.level}</span></span>
                    <span>Coins: <span className="font-semibold text-yellow-500">{currentUser.coins}</span></span>
                </div>
            </div>
        </Card>
        
        <ProfileEditor user={currentUser} />
        
        <Badges badges={currentUser.badges} />
    </div>
  );
};

export default Profile;

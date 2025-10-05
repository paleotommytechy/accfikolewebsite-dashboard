import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useNotifier } from '../context/NotificationContext';
import type { UserProfile } from '../types';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Avatar from '../components/auth/Avatar';
import { SearchIcon, PencilAltIcon, TrashIcon, XIcon, CoinIcon } from '../components/ui/Icons';

const UserManagement: React.FC = () => {
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [coinAdjustment, setCoinAdjustment] = useState({ amount: 0, reason: '' });
    
    const { addToast, showConfirm } = useNotifier();

    const fetchUsers = useCallback(async () => {
        if (!supabase) return;
        setLoading(true);
        
        try {
            // Fetch profiles and roles in parallel
            const [profilesResponse, rolesResponse] = await Promise.all([
                supabase.from('profiles').select('*'),
                supabase.from('user_roles').select('user_id, role')
            ]);
            
            const { data: profilesData, error: profilesError } = profilesResponse;
            const { data: rolesData, error: rolesError } = rolesResponse;

            if (profilesError) throw profilesError;
            if (rolesError) throw rolesError;

            // Create a map of user_id to role for efficient lookup
            const rolesMap = new Map(rolesData.map(r => [r.user_id, r.role]));
            
            // Combine profile data with role data
            const combinedUsers = profilesData.map(profile => ({
                ...profile,
                role: rolesMap.get(profile.id) || 'member' 
            }));
            
            setUsers((combinedUsers as UserProfile[]) || []);

        } catch (error: any) {
            console.error("Error fetching users:", error.message);
            addToast('Failed to fetch users: ' + error.message, 'error');
        } finally {
            setLoading(false);
        }
    }, [addToast]);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    const filteredUsers = useMemo(() => {
        if (!searchTerm) return users;
        const lowercasedTerm = searchTerm.toLowerCase();
        return users.filter(user =>
            (user.full_name?.toLowerCase().includes(lowercasedTerm)) ||
            (user.email?.toLowerCase().includes(lowercasedTerm))
        );
    }, [searchTerm, users]);
    
    const openEditModal = (user: UserProfile) => {
        setSelectedUser(JSON.parse(JSON.stringify(user))); // Deep copy to avoid mutating state directly
        setCoinAdjustment({ amount: 0, reason: '' });
        setIsEditModalOpen(true);
    };
    
    const closeEditModal = () => {
        setSelectedUser(null);
        setIsEditModalOpen(false);
    };

    const handleUpdateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!supabase || !selectedUser) return;

        // Update profile details
        const { error: profileError } = await supabase
            .from('profiles')
            .update({
                full_name: selectedUser.full_name,
                fellowship_position: selectedUser.fellowship_position,
                department: selectedUser.department
            })
            .eq('id', selectedUser.id);

        if (profileError) {
            addToast('Error updating profile: ' + profileError.message, 'error');
            return;
        }

        // Update role via RPC
        const newRole = selectedUser.role;
        if (newRole) {
             const { error: roleError } = await supabase.rpc('update_user_role', {
                target_user_id: selectedUser.id,
                new_role: newRole
            });
            if (roleError) {
                addToast('Error updating role: ' + roleError.message, 'error');
                return;
            }
        }
        
        addToast('User updated successfully!', 'success');
        closeEditModal();
        fetchUsers();
    };
    
    const handleAdjustCoins = async () => {
        if (!supabase || !selectedUser || coinAdjustment.amount === 0) return;

        const { error } = await supabase.rpc('admin_adjust_coins', {
            target_user_id: selectedUser.id,
            amount: coinAdjustment.amount,
            reason: coinAdjustment.reason
        });

        if (error) {
            addToast('Error adjusting coins: ' + error.message, 'error');
        } else {
            addToast(`Successfully adjusted coins by ${coinAdjustment.amount}.`, 'success');
            closeEditModal();
            fetchUsers();
        }
    };
    
    const handleDeleteUser = (user: UserProfile) => {
        if (!supabase) return;
        
        showConfirm(`Are you sure you want to permanently delete ${user.full_name || user.email}? This action is irreversible.`, async () => {
            const { error } = await supabase.rpc('delete_user_account', { target_user_id: user.id });
            if (error) {
                addToast('Error deleting user: ' + error.message, 'error');
            } else {
                addToast('User successfully deleted.', 'success');
                fetchUsers();
            }
        });
    };

    const handleSelectedUserChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        if (!selectedUser) return;
        const { name, value } = e.target;
        setSelectedUser({ ...selectedUser, [name]: value });
    };

    const getRoleClasses = (role: string) => {
        switch (role) {
            case 'admin':
                return 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300';
            case 'blog':
                return 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300';
            case 'media':
                return 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300';
            case 'pro':
                return 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/50 dark:text-cyan-300';
            default:
                return 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300';
        }
    };

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white">User Management</h1>

            <Card>
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-4">
                    <h2 className="text-xl font-semibold">All Members ({filteredUsers.length})</h2>
                    <div className="relative w-full sm:max-w-xs">
                        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search by name or email..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-full bg-gray-100 dark:bg-gray-800 border-transparent rounded-md pl-10 pr-4 py-2 focus:ring-primary-500 focus:border-primary-500"
                        />
                    </div>
                </div>

                {loading ? (
                    <p className="text-center p-4">Loading users...</p>
                ) : filteredUsers.length === 0 ? (
                    <p className="text-center p-4 text-gray-500">No users found.</p>
                ) : (
                    <>
                        {/* --- DESKTOP TABLE VIEW --- */}
                        <div className="overflow-x-auto hidden md:block">
                            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                <thead className="bg-gray-50 dark:bg-gray-800">
                                    <tr>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Coins</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                                        <th scope="col" className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white dark:bg-dark divide-y divide-gray-200 dark:divide-gray-700">
                                    {filteredUsers.map(user => (
                                        <tr key={user.id}>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <Avatar src={user.avatar_url} alt={user.full_name || user.email} size="md" />
                                                    <div className="ml-4 min-w-0">
                                                        <div className="text-sm font-medium text-gray-900 dark:text-white truncate">{user.full_name}</div>
                                                        <div className="text-sm text-gray-500 truncate">{user.email}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full capitalize ${getRoleClasses(user.role)}`}>
                                                    {user.role || 'member'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-yellow-600 dark:text-yellow-400">{user.coins}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.department || 'N/A'}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <div className="flex items-center justify-end space-x-2">
                                                    <Button aria-label={`Edit ${user.full_name}`} variant="ghost" size="sm" onClick={() => openEditModal(user)}><PencilAltIcon className="w-5 h-5"/></Button>
                                                    <Button aria-label={`Delete ${user.full_name}`} variant="ghost" size="sm" onClick={() => handleDeleteUser(user)} className="text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30"><TrashIcon className="w-5 h-5"/></Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* --- MOBILE CARD VIEW --- */}
                        <div className="block md:hidden">
                             <div className="space-y-4">
                                {filteredUsers.map(user => (
                                    <div key={user.id} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                                        {/* User Info */}
                                        <div className="flex items-center gap-4">
                                            <Avatar src={user.avatar_url} alt={user.full_name || user.email} size="md" />
                                            <div className="min-w-0">
                                                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{user.full_name}</p>
                                                <p className="text-sm text-gray-500 truncate">{user.email}</p>
                                            </div>
                                        </div>

                                        <hr className="my-3 border-gray-200 dark:border-gray-700" />
                                        
                                        {/* Details */}
                                        <div className="space-y-2 text-sm">
                                            <div className="flex justify-between items-center">
                                                <span className="text-gray-500 font-medium">Role:</span>
                                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full capitalize ${getRoleClasses(user.role)}`}>
                                                    {user.role || 'member'}
                                                </span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-500 font-medium">Coins:</span>
                                                <span className="font-medium text-yellow-600 dark:text-yellow-400">{user.coins}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-500 font-medium">Department:</span>
                                                <span className="text-gray-500">{user.department || 'N/A'}</span>
                                            </div>
                                        </div>
                                        
                                        <hr className="my-3 border-gray-200 dark:border-gray-700" />
                                        
                                        {/* Actions */}
                                        <div className="flex items-center justify-end space-x-2">
                                            <Button aria-label={`Edit ${user.full_name}`} variant="ghost" size="sm" onClick={() => openEditModal(user)}>
                                                <PencilAltIcon className="w-5 h-5 mr-1" /> Edit
                                            </Button>
                                            <Button aria-label={`Delete ${user.full_name}`} variant="ghost" size="sm" onClick={() => handleDeleteUser(user)} className="text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30">
                                                <TrashIcon className="w-5 h-5 mr-1" /> Delete
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </>
                )}
            </Card>

            {/* Edit User Modal */}
            {isEditModalOpen && selectedUser && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-fade-in-up" style={{ animationDuration: '200ms' }}>
                    <Card className="max-w-2xl w-full relative !p-0 max-h-[90vh] flex flex-col">
                        <div className="p-6 flex justify-between items-center border-b dark:border-gray-700">
                            <h2 className="text-xl font-bold">Edit User: {selectedUser.full_name}</h2>
                            <button onClick={closeEditModal} aria-label="Close edit user modal"><XIcon className="w-6 h-6"/></button>
                        </div>

                        <div className="p-6 overflow-y-auto space-y-6">
                            <form id="edit-user-form" onSubmit={handleUpdateUser} className="space-y-4">
                                <h3 className="text-lg font-semibold border-b pb-2 dark:border-gray-600">Profile Information</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <InputField label="Full Name" name="full_name" value={selectedUser.full_name || ''} onChange={handleSelectedUserChange} />
                                    <InputField label="Fellowship Position" name="fellowship_position" value={selectedUser.fellowship_position || ''} onChange={handleSelectedUserChange} />
                                    <InputField label="Department" name="department" value={selectedUser.department || ''} onChange={handleSelectedUserChange} />
                                    <SelectField label="Role" name="role" value={selectedUser.role || 'member'} onChange={handleSelectedUserChange}>
                                        <option value="member">Member</option>
                                        <option value="admin">Admin</option>
                                        <option value="pro">Pro</option>
                                        <option value="blog">Blogger</option>
                                        <option value="media">Media</option>
                                    </SelectField>
                                </div>
                            </form>
                            
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold border-b pb-2 dark:border-gray-600">Coin Management</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                     <InputField
                                        label="Amount"
                                        type="number"
                                        placeholder="e.g., 50 or -50"
                                        value={coinAdjustment.amount}
                                        onChange={e => setCoinAdjustment(p => ({...p, amount: parseInt(e.target.value, 10) || 0}))}
                                    />
                                     <InputField
                                        label="Reason for Adjustment"
                                        type="text"
                                        placeholder="e.g., Prize for competition"
                                        value={coinAdjustment.reason}
                                        onChange={e => setCoinAdjustment(p => ({...p, reason: e.target.value}))}
                                    />
                                </div>
                                <Button onClick={handleAdjustCoins} disabled={coinAdjustment.amount === 0 || !coinAdjustment.reason} className="w-full">
                                    <CoinIcon className="w-5 h-5 mr-2" /> Adjust Coins
                                </Button>
                            </div>
                        </div>

                        <div className="p-6 flex justify-end gap-2 border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-800 rounded-b-lg">
                            <Button variant="ghost" onClick={closeEditModal}>Cancel</Button>
                            <Button type="submit" form="edit-user-form">Save Changes</Button>
                        </div>
                    </Card>
                </div>
            )}
        </div>
    );
};

// Helper components for modal form
const InputField: React.FC<React.InputHTMLAttributes<HTMLInputElement> & {label: string}> = ({label, ...props}) => (
    <div>
        <label htmlFor={props.id || props.name} className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">{label}</label>
        <input id={props.id || props.name} {...props} className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 focus:ring-primary-500 focus:border-primary-500" />
    </div>
);
const SelectField: React.FC<React.SelectHTMLAttributes<HTMLSelectElement> & {label: string}> = ({label, children, ...props}) => (
    <div>
        <label htmlFor={props.id || props.name} className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">{label}</label>
        <select id={props.id || props.name} {...props} className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 focus:ring-primary-500 focus:border-primary-500">
            {children}
        </select>
    </div>
);

export default UserManagement;
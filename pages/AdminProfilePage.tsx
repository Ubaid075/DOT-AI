import React, { useContext, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import { ThemeContext } from '../context/ThemeContext';
import { SecurityIcon, SpinnerIcon, LogoutIcon, SunIcon, MoonIcon, InfoIcon, UserIcon } from '../components/Icons';
import Modal from '../components/Modal';
import Toast from '../components/Toast';

const AdminProfilePage: React.FC = () => {
    const { user: adminUser, updatePassword, logout } = useContext(AuthContext);
    const { theme, toggleTheme } = useContext(ThemeContext);
    const [isPasswordModalOpen, setPasswordModalOpen] = useState(false);
    const [isLogoutModalOpen, setLogoutModalOpen] = useState(false);
    const [toast, setToast] = useState<{message: string, type: 'success' | 'error'} | null>(null);

    if (!adminUser) return null;
    
    const ProfileCard: React.FC<{ icon: React.ReactNode, title: string, children: React.ReactNode }> = ({ icon, title, children }) => (
        <div className="bg-card-light dark:bg-card-dark p-6 rounded-lg border border-border-light dark:border-border-dark">
            <div className="flex items-center space-x-3 mb-4">
                <div className="text-secondary-light dark:text-secondary-dark">{icon}</div>
                <h3 className="text-lg font-semibold text-primary-light dark:text-primary-dark">{title}</h3>
            </div>
            <div className="space-y-3">{children}</div>
        </div>
    );
    
    const ReadOnlyField: React.FC<{label: string; value: string}> = ({label, value}) => (
         <div>
            <label className="text-sm font-medium text-secondary-light dark:text-secondary-dark">{label}</label>
            <input 
                type="text" 
                value={value} 
                readOnly 
                className="w-full mt-1 p-2 bg-light dark:bg-dark border border-border-light dark:border-border-dark rounded-md focus:ring-0 focus:outline-none cursor-not-allowed opacity-70"
            />
        </div>
    );

    const ChangePasswordModal: React.FC = () => {
        const [currentPassword, setCurrentPassword] = useState('');
        const [newPassword, setNewPassword] = useState('');
        const [confirmPassword, setConfirmPassword] = useState('');
        const [error, setError] = useState('');
        const [isSaving, setIsSaving] = useState(false);

        const handleSubmit = async (e: React.FormEvent) => {
            e.preventDefault();
            setError('');
            if (newPassword !== confirmPassword) {
                setError("New passwords do not match.");
                return;
            }
            if (newPassword.length < 8) {
                setError("Password must be at least 8 characters long.");
                return;
            }
            setIsSaving(true);
            try {
                await updatePassword(currentPassword, newPassword);
                setToast({ message: "Password updated successfully!", type: 'success' });
                setTimeout(() => setPasswordModalOpen(false), 1500);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setIsSaving(false);
            }
        };

        return (
            <Modal isOpen={isPasswordModalOpen} onClose={() => setPasswordModalOpen(false)} title="Change Admin Password">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <input type="password" placeholder="Current Password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="w-full p-2 bg-light dark:bg-dark border rounded-md" required/>
                    <input type="password" placeholder="New Password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full p-2 bg-light dark:bg-dark border rounded-md" required/>
                    <input type="password" placeholder="Confirm New Password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full p-2 bg-light dark:bg-dark border rounded-md" required/>
                    {error && <p className="text-sm text-red-500">{error}</p>}
                    <button type="submit" disabled={isSaving} className="w-full mt-4 p-2 font-semibold text-white bg-black rounded-lg disabled:opacity-50 flex items-center justify-center">
                        {isSaving && <SpinnerIcon className="animate-spin mr-2 h-4 w-4" />}
                        {isSaving ? 'Updating...' : 'Update Password'}
                    </button>
                </form>
            </Modal>
        );
    };

    const LogoutConfirmationModal: React.FC = () => (
        <Modal isOpen={isLogoutModalOpen} onClose={() => setLogoutModalOpen(false)} title="Confirm Logout">
            <div className="space-y-6">
                <p className="text-sm text-secondary-light dark:text-secondary-dark">Are you sure you want to log out of your admin account?</p>
                <div className="flex justify-end space-x-3">
                    <button onClick={() => setLogoutModalOpen(false)} className="px-4 py-2 text-sm font-medium rounded-md hover:bg-gray-100 dark:hover:bg-gray-800">Cancel</button>
                    <button onClick={logout} className="px-4 py-2 text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 flex items-center space-x-2">
                        <LogoutIcon className="w-4 h-4" />
                        <span>Logout</span>
                    </button>
                </div>
            </div>
        </Modal>
    );

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-slide-in-up">
             <div className="flex items-center space-x-6">
                <img src={adminUser.profilePic} alt="Admin Profile" className="w-24 h-24 rounded-full border-2 border-border-light dark:border-border-dark object-cover" />
                <div>
                    <h2 className="text-3xl font-bold text-primary-light dark:text-primary-dark">{adminUser.name}</h2>
                    <p className="text-secondary-light dark:text-secondary-dark">{adminUser.email}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-8">
                    <ProfileCard icon={<UserIcon className="w-6 h-6"/>} title="Admin Information">
                        <ReadOnlyField label="Full Name" value={adminUser.name} />
                        <ReadOnlyField label="Email Address" value={adminUser.email} />
                         <p className="text-xs text-secondary-light dark:text-secondary-dark pt-2">
                           Admin details are managed system-wide and cannot be changed here.
                        </p>
                    </ProfileCard>
                </div>
                <div className="space-y-8">
                     <ProfileCard icon={<SecurityIcon className="w-6 h-6"/>} title="Security & Session">
                        <button onClick={() => setPasswordModalOpen(true)} className="w-full text-left text-sm font-medium hover:text-primary-light dark:hover:text-primary-dark transition-colors">Change Password</button>
                        <button onClick={() => setLogoutModalOpen(true)} className="w-full text-left text-sm font-medium text-red-500/80 hover:text-red-500 transition-colors">Logout</button>
                    </ProfileCard>
                    <ProfileCard icon={theme === 'light' ? <MoonIcon className="w-6 h-6"/> : <SunIcon className="w-6 h-6"/>} title="Interface Theme">
                        <div className="flex justify-between items-center">
                             <p className="text-sm text-secondary-light dark:text-secondary-dark">Toggle between light and dark mode.</p>
                             <button
                                onClick={toggleTheme}
                                className="p-2 rounded-full text-secondary-light dark:text-secondary-dark hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"
                            >
                                {theme === 'light' ? <MoonIcon className="w-5 h-5" /> : <SunIcon className="w-5 h-5" />}
                            </button>
                        </div>
                    </ProfileCard>
                </div>
            </div>
            
            {isPasswordModalOpen && <ChangePasswordModal />}
            {isLogoutModalOpen && <LogoutConfirmationModal />}
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </div>
    );
};

export default AdminProfilePage;
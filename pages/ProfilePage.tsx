import React, { useContext, useState, useRef } from 'react';
import { AuthContext } from '../context/AuthContext';
import { CreditIcon, EditIcon, InfoIcon, SecurityIcon, StatsIcon, SpinnerIcon, CameraIcon, ArrowLeftIcon, StarIcon, LogoutIcon, GalleryIcon, XCircleIcon, HistoryIcon, TicketIcon } from '../components/Icons';
import Modal from '../components/Modal';
import Toast from '../components/Toast';
import { ADMIN_EMAIL } from '../constants';
import { PublicImage, CreditRequest } from '../types';

interface ProfilePageProps {
    onNavigateBack: () => void;
    onNavigateToSupport: () => void;
    onBuyCredits: () => void;
}

const ProfilePage: React.FC<ProfilePageProps> = ({ onNavigateBack, onNavigateToSupport, onBuyCredits }) => {
    const { user, updateUser, updatePassword, logout, addReview, publicImages, updateUserUploadedImage, deleteUserUploadedImage, creditRequests, creditHistory } = useContext(AuthContext);
    const [isEditModalOpen, setEditModalOpen] = useState(false);
    const [isPasswordModalOpen, setPasswordModalOpen] = useState(false);
    const [isReviewModalOpen, setReviewModalOpen] = useState(false);
    const [isLogoutModalOpen, setLogoutModalOpen] = useState(false);
    const [toast, setToast] = useState<{message: string, type: 'success' | 'error'} | null>(null);
    const [editingImage, setEditingImage] = useState<PublicImage | null>(null);
    const [deletingImage, setDeletingImage] = useState<PublicImage | null>(null);

    if (!user) {
        return <div>Loading user profile...</div>;
    }
    
    const userUploads = publicImages.filter(img => img.userId === user.id).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    const generatedImages = user.generatedImages || [];
    const userCreditRequests = creditRequests.filter(req => req.userId === user.id);
    const userCreditHistory = creditHistory.filter(h => h.userId === user.id);

    const totalCredits = user.credits + user.usedCredits;
    const creditUsagePercentage = totalCredits > 0 ? (user.usedCredits / totalCredits) * 100 : 0;

    const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

    const ProfileCard: React.FC<{ icon: React.ReactNode, title: string, children: React.ReactNode, actionButton?: React.ReactNode }> = ({ icon, title, children, actionButton }) => (
        <div className="bg-card-light dark:bg-card-dark p-6 rounded-lg border border-border-light dark:border-border-dark animate-slide-in-up">
            <div className="flex justify-between items-center mb-4">
                <div className="flex items-center space-x-3">
                    <div className="text-secondary-light dark:text-secondary-dark">{icon}</div>
                    <h3 className="text-lg font-semibold text-primary-light dark:text-primary-dark">{title}</h3>
                </div>
                {actionButton}
            </div>
            <div className="space-y-3">{children}</div>
        </div>
    );
    
    const InfoRow: React.FC<{label: string; value: string | undefined}> = ({label, value}) => (
        <div className="flex justify-between items-center text-sm">
            <span className="text-secondary-light dark:text-secondary-dark">{label}</span>
            <span className="font-medium text-primary-light dark:text-primary-dark">{value || 'Not set'}</span>
        </div>
    );

    const EditUploadModal: React.FC<{ image: PublicImage; onClose: () => void; }> = ({ image, onClose }) => {
        const [title, setTitle] = useState(image.title);
        const [newImageFile, setNewImageFile] = useState<File | null>(null);
        const [previewUrl, setPreviewUrl] = useState<string>(image.imageUrl);
        const [isSaving, setIsSaving] = useState(false);
        const fileInputRef = useRef<HTMLInputElement>(null);

        const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            const file = e.target.files?.[0];
            if (file) {
                const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
                if (!allowedTypes.includes(file.type)) {
                    setToast({ message: 'Invalid file type. Use JPG, PNG, or WEBP.', type: 'error' });
                    return;
                }
                const maxSize = 5 * 1024 * 1024; // 5MB
                if (file.size > maxSize) {
                    setToast({ message: 'File is too large. Max size is 5MB.', type: 'error' });
                    return;
                }
                setNewImageFile(file);
                if (previewUrl && previewUrl.startsWith('blob:')) {
                    URL.revokeObjectURL(previewUrl);
                }
                setPreviewUrl(URL.createObjectURL(file));
            }
        };
        
        const handleSubmit = (e: React.FormEvent) => {
            e.preventDefault();
            setIsSaving(true);
            const execute_update = (newImageUrl?: string) => {
                try {
                    updateUserUploadedImage(image.id, title, newImageUrl);
                    setToast({ message: 'Image updated successfully!', type: 'success' });
                    onClose();
                } catch (err: any) {
                    setToast({ message: err.message, type: 'error' });
                } finally {
                    setIsSaving(false);
                }
            };
            
            if (newImageFile) {
                const reader = new FileReader();
                reader.onloadend = () => {
                    execute_update(reader.result as string);
                };
                reader.onerror = () => {
                    setToast({ message: 'Failed to read the new image file.', type: 'error' });
                    setIsSaving(false);
                };
                reader.readAsDataURL(newImageFile);
            } else {
                execute_update(); // No new image, just update title
            }
        };

        return (
            <Modal isOpen={true} onClose={onClose} title="Edit Image">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="w-full aspect-square bg-dark rounded-lg flex items-center justify-center overflow-hidden border border-border-dark">
                        <img src={previewUrl} alt="Preview" className="max-w-full max-h-full object-contain" />
                    </div>
                    <div>
                        <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/png, image/jpeg, image/webp" />
                        <button type="button" onClick={() => fileInputRef.current?.click()} className="w-full text-sm font-medium py-2 border border-border-light dark:border-border-dark rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                            Replace Image (Optional)
                        </button>
                    </div>
                    <div>
                        <label htmlFor="edit-title" className="text-sm font-medium text-secondary-light dark:text-secondary-dark">Title</label>
                        <input type="text" id="edit-title" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full mt-1 p-2 bg-light dark:bg-dark border border-border-light dark:border-border-dark rounded-md focus:ring-1 focus:ring-black dark:focus:ring-white focus:outline-none" required />
                    </div>
                    <button type="submit" disabled={isSaving} className="w-full p-2.5 font-semibold text-white bg-black rounded-lg hover:bg-gray-800 dark:text-black dark:bg-white dark:hover:bg-gray-200 transition-colors disabled:opacity-50 flex items-center justify-center">
                        {isSaving && <SpinnerIcon className="animate-spin mr-2 h-4 w-4" />}
                        {isSaving ? 'Saving...' : 'Save Changes'}
                    </button>
                </form>
            </Modal>
        );
    };

    const DeleteConfirmationModal: React.FC<{ image: PublicImage; onClose: () => void; }> = ({ image, onClose }) => {
        const handleConfirmDelete = () => {
            try {
                deleteUserUploadedImage(image.id);
                setToast({ message: 'Image deleted.', type: 'success' });
                onClose();
            } catch (err: any) {
                setToast({ message: err.message, type: 'error' });
            }
        };
        return (
            <Modal isOpen={true} onClose={onClose} title="Delete Image">
                <div className="space-y-6">
                    <p className="text-sm text-secondary-light dark:text-secondary-dark">Are you sure you want to delete this image? This will remove it from your profile and the public gallery permanently.</p>
                    <div className="flex justify-end space-x-3">
                        <button onClick={onClose} className="px-4 py-2 text-sm font-medium rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                            Cancel
                        </button>
                        <button onClick={handleConfirmDelete} className="px-4 py-2 text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 transition-colors">
                            Delete
                        </button>
                    </div>
                </div>
            </Modal>
        );
    };

    const EditProfileModal: React.FC = () => {
        const [name, setName] = useState(user.name);
        const [profilePic, setProfilePic] = useState(user.profilePic);
        const [isSaving, setIsSaving] = useState(false);
        const fileInputRef = useRef<HTMLInputElement>(null);

        const handlePictureClick = () => fileInputRef.current?.click();

        const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            const file = e.target.files?.[0];
            if (!file) return;

            const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
            if (!allowedTypes.includes(file.type)) {
                setToast({ message: 'Invalid file type. Use JPG, PNG, or WEBP.', type: 'error' });
                return;
            }

            const maxSize = 5 * 1024 * 1024; // 5MB
            if (file.size > maxSize) {
                setToast({ message: 'File is too large. Max size is 5MB.', type: 'error' });
                return;
            }

            const reader = new FileReader();
            reader.onloadend = () => {
                setProfilePic(reader.result as string);
            };
            reader.readAsDataURL(file);
        };

        const handleRemovePicture = () => {
            setProfilePic(`https://api.dicebear.com/8.x/initials/svg?seed=${encodeURIComponent(user.name)}`);
            setToast({ message: 'Profile picture will be removed on save.', type: 'success' });
        };
        
        const handleSubmit = async (e: React.FormEvent) => {
            e.preventDefault();
            setIsSaving(true);
            await new Promise(res => setTimeout(res, 500)); // Simulate API call
            updateUser({ ...user, name, profilePic });
            setIsSaving(false);
            setEditModalOpen(false);
            setToast({ message: 'Profile updated successfully!', type: 'success' });
        };

        return (
             <Modal isOpen={isEditModalOpen} onClose={() => setEditModalOpen(false)} title="Edit Profile">
                 <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="flex flex-col items-center space-y-4">
                        <div className="relative group cursor-pointer" onClick={handlePictureClick}>
                            <img src={profilePic} alt="Profile Preview" className="w-24 h-24 rounded-full object-cover border-2 border-border-light dark:border-border-dark" />
                            <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <CameraIcon className="w-8 h-8 text-white" />
                            </div>
                        </div>
                        <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".jpg,.jpeg,.png,.webp" className="hidden" />
                        <div className="flex items-center space-x-4">
                            <button type="button" onClick={handlePictureClick} className="text-sm font-medium text-primary-light dark:text-primary-dark hover:underline">Change Picture</button>
                            <button type="button" onClick={handleRemovePicture} className="text-sm font-medium text-red-500 hover:underline">Remove</button>
                        </div>
                    </div>
                    <div>
                        <label className="text-sm font-medium text-secondary-light dark:text-secondary-dark">Full Name</label>
                        <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full mt-1 p-2 bg-light dark:bg-dark border border-border-light dark:border-border-dark rounded-md focus:ring-1 focus:ring-black dark:focus:ring-white focus:outline-none" />
                    </div>
                    <button type="submit" disabled={isSaving} className="w-full mt-4 p-2.5 font-semibold text-white bg-black rounded-lg hover:bg-gray-800 dark:text-black dark:bg-white dark:hover:bg-gray-200 transition-colors disabled:opacity-50 flex items-center justify-center">
                        {isSaving && <SpinnerIcon className="animate-spin mr-2 h-4 w-4" />}
                        {isSaving ? 'Saving...' : 'Save Changes'}
                    </button>
                 </form>
             </Modal>
        );
    };

    const ChangePasswordModal: React.FC = () => {
        const [currentPassword, setCurrentPassword] = useState('');
        const [newPassword, setNewPassword] = useState('');
        const [confirmPassword, setConfirmPassword] = useState('');
        const [error, setError] = useState('');
        const [success, setSuccess] = useState('');
        const [isSaving, setIsSaving] = useState(false);

        const handleSubmit = async (e: React.FormEvent) => {
            e.preventDefault();
            setError('');
            setSuccess('');
            if (newPassword !== confirmPassword) {
                setError("New passwords do not match.");
                return;
            }
            if(newPassword.length < 8) {
                setError("Password must be at least 8 characters long.");
                return;
            }
            setIsSaving(true);
            try {
                await updatePassword(currentPassword, newPassword);
                setSuccess("Password updated successfully!");
                setTimeout(() => setPasswordModalOpen(false), 1500);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setIsSaving(false);
            }
        };

        return (
            <Modal isOpen={isPasswordModalOpen} onClose={() => setPasswordModalOpen(false)} title="Change Password">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <input type="password" placeholder="Current Password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="w-full p-2 bg-light dark:bg-dark border border-border-light dark:border-border-dark rounded-md" required/>
                    <input type="password" placeholder="New Password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full p-2 bg-light dark:bg-dark border border-border-light dark:border-border-dark rounded-md" required/>
                    <input type="password" placeholder="Confirm New Password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full p-2 bg-light dark:bg-dark border border-border-light dark:border-border-dark rounded-md" required/>
                    {error && <p className="text-sm text-red-500">{error}</p>}
                    {success && <p className="text-sm text-green-500">{success}</p>}
                    <button type="submit" disabled={isSaving} className="w-full mt-4 p-2 font-semibold text-white bg-black rounded-lg hover:bg-gray-800 dark:text-black dark:bg-white dark:hover:bg-gray-200 transition-colors disabled:opacity-50 flex items-center justify-center">
                        {isSaving && <SpinnerIcon className="animate-spin mr-2 h-4 w-4" />}
                        {isSaving ? 'Updating...' : 'Update Password'}
                    </button>
                </form>
            </Modal>
        );
    };

    const ReviewModal: React.FC = () => {
        const [rating, setRating] = useState(0);
        const [hoverRating, setHoverRating] = useState(0);
        const [comment, setComment] = useState('');
        const [isSubmitting, setIsSubmitting] = useState(false);

        const handleSubmit = async (e: React.FormEvent) => {
            e.preventDefault();
            if (rating === 0 || !comment.trim()) {
                setToast({ message: "Please provide a rating and a comment.", type: 'error' });
                return;
            }
            setIsSubmitting(true);
            try {
                await addReview(rating, comment);
                setToast({ message: "Thank you for your feedback!", type: 'success' });
                setReviewModalOpen(false);
            } catch (err: any) {
                setToast({ message: err.message || "Failed to submit review.", type: 'error'});
            } finally {
                setIsSubmitting(false);
            }
        };

        return (
            <Modal isOpen={isReviewModalOpen} onClose={() => setReviewModalOpen(false)} title="Leave a Review">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="flex justify-center space-x-1">
                        {[1, 2, 3, 4, 5].map(star => (
                            <button
                                type="button"
                                key={star}
                                onMouseEnter={() => setHoverRating(star)}
                                onMouseLeave={() => setHoverRating(0)}
                                onClick={() => setRating(star)}
                                className="text-yellow-400 hover:text-yellow-300"
                            >
                                <StarIcon className="w-8 h-8" filled={(hoverRating || rating) >= star} />
                            </button>
                        ))}
                    </div>
                    <textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Share your experience..." className="w-full h-28 p-2 bg-light dark:bg-dark border border-border-light dark:border-border-dark rounded-md" required/>
                    <button type="submit" disabled={isSubmitting} className="w-full mt-4 p-2 font-semibold text-white bg-black rounded-lg hover:bg-gray-800 dark:text-black dark:bg-white dark:hover:bg-gray-200 transition-colors disabled:opacity-50 flex items-center justify-center">
                        {isSubmitting && <SpinnerIcon className="animate-spin mr-2 h-4 w-4" />}
                        {isSubmitting ? 'Submitting...' : 'Submit Review'}
                    </button>
                </form>
            </Modal>
        );
    };

    const LogoutConfirmationModal: React.FC = () => (
        <Modal isOpen={isLogoutModalOpen} onClose={() => setLogoutModalOpen(false)} title="Confirm Logout">
            <div className="space-y-6">
                <p className="text-sm text-secondary-light dark:text-secondary-dark">Are you sure you want to log out of your account?</p>
                <div className="flex justify-end space-x-3">
                    <button onClick={() => setLogoutModalOpen(false)} className="px-4 py-2 text-sm font-medium rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                        Cancel
                    </button>
                    <button onClick={logout} className="px-4 py-2 text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 transition-colors flex items-center space-x-2">
                        <LogoutIcon className="w-4 h-4" />
                        <span>Logout</span>
                    </button>
                </div>
            </div>
        </Modal>
    );
    
    const CreditPurchaseStatusCard: React.FC = () => {
        const getStatusPill = (status: CreditRequest['status']) => {
            switch (status) {
                case 'Approved': return <span className="px-2 py-0.5 text-xs rounded-full bg-green-500/20 text-green-500">Approved</span>;
                case 'Rejected': return <span className="px-2 py-0.5 text-xs rounded-full bg-red-500/20 text-red-500">Rejected</span>;
                case 'Pending':
                default:
                    return <span className="px-2 py-0.5 text-xs rounded-full bg-yellow-500/20 text-yellow-500">Pending</span>;
            }
        };
        
        return (
            <ProfileCard icon={<TicketIcon className="w-6 h-6"/>} title="Credit Purchase Status">
                {userCreditRequests.length === 0 ? (
                    <p className="text-sm text-center text-secondary-light dark:text-secondary-dark py-4">You have no payment history.</p>
                ) : (
                    <div className="max-h-80 overflow-y-auto space-y-3 pr-2">
                        {userCreditRequests.slice().reverse().map(req => (
                            <div key={req.id} className="p-3 bg-light dark:bg-dark rounded-lg border border-border-light dark:border-border-dark">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="font-semibold text-sm">{req.creditPlan?.name} Plan (+{req.creditPackage} credits)</p>
                                        <p className="text-xs text-secondary-light dark:text-secondary-dark">{formatDate(req.createdAt)}</p>
                                    </div>
                                    {getStatusPill(req.status)}
                                </div>
                                 {req.status === 'Rejected' && req.adminNote && (
                                    <div className="mt-2 text-xs p-2 bg-red-500/10 text-red-500 rounded-md">
                                        <strong>Admin Note:</strong> {req.adminNote}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
                <div className="pt-4 mt-4 border-t border-border-light dark:border-border-dark">
                    <button
                        onClick={onBuyCredits}
                        className="w-full p-2 text-sm font-semibold text-white bg-black rounded-lg hover:bg-gray-800 dark:text-black dark:bg-white dark:hover:bg-gray-200 transition-colors"
                    >
                        Submit New Payment
                    </button>
                </div>
            </ProfileCard>
        );
    };

    const CreditTransactionHistoryCard: React.FC = () => (
        <ProfileCard icon={<HistoryIcon className="w-6 h-6"/>} title="Credit Transaction History">
            {userCreditHistory.length === 0 ? (
                <p className="text-sm text-center text-secondary-light dark:text-secondary-dark py-4">No credit history found.</p>
            ) : (
                <div className="max-h-80 overflow-y-auto space-y-3 pr-2">
                    {userCreditHistory.slice().reverse().map(h => (
                        <div key={h.id} className="flex justify-between items-center text-sm p-3 bg-light dark:bg-dark rounded-md border border-border-light dark:border-border-dark">
                            <div>
                                <p className="font-medium">{h.reason}</p>
                                <p className="text-xs text-secondary-light dark:text-secondary-dark">{formatDate(h.createdAt)}</p>
                            </div>
                            <span className={`font-semibold ${h.change > 0 ? 'text-green-500' : 'text-red-500'}`}>
                                {h.change > 0 ? `+${h.change}` : h.change}
                            </span>
                        </div>
                    ))}
                </div>
            )}
        </ProfileCard>
    );

    return (
        <main className="pt-8 pb-12 container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
                <div className="mb-6 animate-fade-in">
                    <button
                        onClick={onNavigateBack}
                        className="flex items-center space-x-2 text-sm font-medium text-secondary-light dark:text-secondary-dark hover:text-primary-light dark:hover:text-primary-dark transition-colors group"
                        aria-label="Go back to generator"
                    >
                        <ArrowLeftIcon className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
                        <span>Back to Generator</span>
                    </button>
                </div>
                <div className="space-y-8">
                    {/* Profile Header */}
                    <div className="flex items-center space-x-6 animate-slide-in-up">
                        <div className="relative group cursor-pointer" onClick={() => setEditModalOpen(true)}>
                            <img src={user.profilePic} alt="Profile" className="w-24 h-24 rounded-full border-2 border-border-light dark:border-border-dark object-cover" />
                            <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <CameraIcon className="w-8 h-8 text-white" />
                            </div>
                        </div>
                        <div>
                            <h2 className="text-3xl font-bold text-primary-light dark:text-primary-dark">{user.name}</h2>
                            <p className="text-secondary-light dark:text-secondary-dark">{user.email}</p>
                        </div>
                    </div>

                    {/* Grid for cards */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <div className="space-y-8">
                            <ProfileCard icon={<InfoIcon className="w-6 h-6"/>} title="Account Information" actionButton={<button onClick={() => setEditModalOpen(true)} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-800 transition-transform transform hover:scale-125 active:scale-95"><EditIcon className="w-4 h-4" /></button>}>
                                <InfoRow label="Full Name" value={user.name} />
                                <InfoRow label="Email" value={user.email} />
                                <InfoRow label="Joined Date" value={formatDate(user.createdAt)} />
                                <InfoRow label="Last Login" value={formatDate(user.lastLogin)} />
                            </ProfileCard>
                             <ProfileCard icon={<StarIcon className="w-6 h-6"/>} title="Feedback">
                                <p className="text-sm text-secondary-light dark:text-secondary-dark">Help us improve by sharing your experience.</p>
                                <button onClick={() => setReviewModalOpen(true)} className="text-sm w-full text-left font-semibold text-primary-light dark:text-primary-dark hover:underline transition-colors">Leave a Review</button>
                            </ProfileCard>
                             <CreditPurchaseStatusCard />
                            <ProfileCard icon={<SecurityIcon className="w-6 h-6"/>} title="Security">
                                <button onClick={() => setPasswordModalOpen(true)} className="text-sm w-full text-left font-medium hover:text-primary-light dark:hover:text-primary-dark transition-colors">Change Password</button>
                                <button onClick={onNavigateToSupport} className="text-sm w-full text-left font-medium hover:text-primary-light dark:hover:text-primary-dark transition-colors">Contact Support</button>
                                <button onClick={() => setLogoutModalOpen(true)} className="text-sm w-full text-left font-medium hover:text-primary-light dark:hover:text-primary-dark transition-colors">Logout</button>
                                <button onClick={() => alert('Account deletion is permanent. Please contact support to proceed.')} className="text-sm w-full text-left font-medium text-red-500/80 hover:text-red-500 transition-colors">Delete Account</button>
                            </ProfileCard>
                        </div>
                        <div className="space-y-8">
                            <ProfileCard icon={<CreditIcon className="w-6 h-6"/>} title="Credit Management">
                                <div className="space-y-2">
                                    <InfoRow label="Remaining Credits" value={user.credits.toString()} />
                                    <InfoRow label="Used Credits" value={user.usedCredits.toString()} />
                                    <InfoRow label="Total Credits" value={totalCredits.toString()} />
                                </div>
                                <div>
                                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                                        <div className="bg-gradient-to-r from-yellow-400 to-amber-500 h-2.5 rounded-full" style={{ width: `${100 - creditUsagePercentage}%` }}></div>
                                    </div>
                                    <p className="text-xs text-right mt-1 text-secondary-light dark:text-secondary-dark">{creditUsagePercentage.toFixed(0)}% used</p>
                                </div>
                                <div className="pt-4 border-t border-border-light dark:border-border-dark">
                                    <button
                                        onClick={onBuyCredits}
                                        className="w-full p-2 text-sm font-semibold text-white bg-black rounded-lg hover:bg-gray-800 dark:text-black dark:bg-white dark:hover:bg-gray-200 transition-colors"
                                    >
                                        Purchase More Credits
                                    </button>
                                </div>
                            </ProfileCard>
                            <CreditTransactionHistoryCard />
                            <ProfileCard icon={<StatsIcon className="w-6 h-6"/>} title="Activity Overview">
                                <InfoRow label="Total Images Generated" value={user.totalGenerated.toString()} />
                                <div className="pt-4 border-t border-border-light dark:border-border-dark">
                                    <h4 className="font-semibold text-sm mb-3">Recent Generations</h4>
                                    {generatedImages.length === 0 ? (
                                        <p className="text-sm text-center text-secondary-light dark:text-secondary-dark py-4">Your generation history is empty.</p>
                                    ) : (
                                        <div className="max-h-60 overflow-y-auto space-y-4 pr-2">
                                            {generatedImages.slice(-5).reverse().map(record => (
                                                <div key={record.id} className="flex items-center space-x-4">
                                                    <img src={record.imageUrl} alt={record.prompt} className="w-16 h-16 rounded-md object-cover flex-shrink-0 border border-border-light dark:border-border-dark" />
                                                    <div className="flex-grow">
                                                        <p className="font-medium text-sm line-clamp-2" title={record.prompt}>{record.prompt}</p>
                                                        <p className="text-xs text-secondary-light dark:text-secondary-dark">{record.style} &middot; {formatDate(record.createdAt)}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </ProfileCard>
                        </div>
                    </div>
                     {/* My Uploads Section */}
                     <div className="mt-8">
                        <ProfileCard icon={<GalleryIcon className="w-6 h-6"/>} title="My Uploads">
                             {userUploads.length === 0 ? (
                                <p className="text-sm text-center text-secondary-light dark:text-secondary-dark py-4">You haven't uploaded any images yet.</p>
                            ) : (
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                    {userUploads.map(image => (
                                        <div key={image.id} className="group relative aspect-square bg-card-dark rounded-lg overflow-hidden border border-border-light dark:border-border-dark">
                                            <img src={image.imageUrl} alt={image.title} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-2">
                                                <button onClick={() => setEditingImage(image)} className="p-2 bg-white/20 text-white rounded-full hover:bg-white/30 transition-transform transform hover:scale-110 active:scale-95" title="Edit Image"><EditIcon className="w-5 h-5"/></button>
                                                <button onClick={() => setDeletingImage(image)} className="p-2 bg-white/20 text-white rounded-full hover:bg-white/30 transition-transform transform hover:scale-110 active:scale-95" title="Delete Image"><XCircleIcon className="w-5 h-5"/></button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </ProfileCard>
                    </div>
                </div>
            </div>
            {isEditModalOpen && <EditProfileModal />}
            {isPasswordModalOpen && <ChangePasswordModal />}
            {isReviewModalOpen && <ReviewModal />}
            {isLogoutModalOpen && <LogoutConfirmationModal />}
            {editingImage && <EditUploadModal image={editingImage} onClose={() => setEditingImage(null)} />}
            {deletingImage && <DeleteConfirmationModal image={deletingImage} onClose={() => setDeletingImage(null)} />}
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </main>
    );
};

export default ProfilePage;
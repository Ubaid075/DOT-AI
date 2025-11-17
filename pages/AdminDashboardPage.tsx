import React, { useContext, useState, useRef, useMemo } from 'react';
import { AuthContext } from '../context/AuthContext';
import { ThemeContext } from '../context/ThemeContext';
import { User, Review, SupportMessage, SystemSettings, PublicImage, CreditRequest, ImageReport } from '../types';
import { SunIcon, MoonIcon, LogoutIcon, CheckCircleIcon, XCircleIcon, StarIcon, InfoIcon, EditIcon, SecurityIcon, CameraIcon, SpinnerIcon, TicketIcon, UserIcon, EnvelopeIcon, StatsIcon, SettingsIcon, BlockIcon, GalleryIcon, FlagIcon } from '../components/Icons';
import Modal from '../components/Modal';
import Toast from '../components/Toast';
import AdminProfilePage from './AdminProfilePage';

type Tab = 'analytics' | 'users' | 'reviews' | 'support' | 'settings' | 'profile' | 'gallery' | 'payments' | 'reports';

const AdminDashboardPage: React.FC = () => {
    const { 
        user: adminUser, logout, users, adminUpdateUser, deleteUser,
        reviews, updateReviewStatus, deleteReview, 
        supportMessages, updateSupportTicketStatus,
        creditHistory, systemSettings, updateSystemSettings,
        publicImages, addPublicImage, deletePublicImage,
        creditRequests, approveCreditRequest, rejectCreditRequest,
        imageReports, updateImageReportStatus
    } = useContext(AuthContext);
    const { theme, toggleTheme } = useContext(ThemeContext);
    const [activeTab, setActiveTab] = useState<Tab>('analytics');
    const [toast, setToast] = useState<{message: string, type: 'success' | 'error'} | null>(null);

    if (!adminUser) return null;
    
    const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const formatDateTime = (dateString: string) => new Date(dateString).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });

    const TabButton: React.FC<{tab: Tab, label: string, icon: React.ReactNode}> = ({tab, label, icon}) => (
        <button
            onClick={() => setActiveTab(tab)}
            className={`flex items-center space-x-2 px-4 py-2 text-sm font-medium rounded-t-lg transition-colors whitespace-nowrap ${
                activeTab === tab 
                ? 'border-b-2 border-primary-light dark:border-primary-dark text-primary-light dark:text-primary-dark'
                : 'text-secondary-light dark:text-secondary-dark hover:text-primary-light dark:hover:text-primary-dark'
            }`}
        >
            {icon}
            <span className="hidden sm:inline">{label}</span>
        </button>
    );

    // #region Confirmation Modal
    const ConfirmationModal: React.FC<{ isOpen: boolean; onClose: () => void; onConfirm: () => void; title: string; children: React.ReactNode; confirmText?: string; confirmClass?: string; }> = ({ isOpen, onClose, onConfirm, title, children, confirmText = 'Confirm', confirmClass = 'bg-red-600 hover:bg-red-700' }) => (
        <Modal isOpen={isOpen} onClose={onClose} title={title}>
            <div className="space-y-4">
                <div className="text-secondary-light dark:text-secondary-dark">{children}</div>
                <div className="flex justify-end space-x-3">
                    <button onClick={onClose} className="px-4 py-2 text-sm font-medium rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-transform active:scale-95">Cancel</button>
                    <button onClick={onConfirm} className={`px-4 py-2 text-sm font-medium rounded-md text-white ${confirmClass} transition-transform active:scale-95`}>{confirmText}</button>
                </div>
            </div>
        </Modal>
    );
    // #endregion

    // #region Analytics Tab
    const AnalyticsTab = () => {
        const totalUsers = users.filter(u => u.role === 'user').length;
        const totalGenerated = users.reduce((acc, user) => acc + (user.totalGenerated || 0), 0);
        const totalCreditsPurchased = creditHistory.filter(h => h.reason === 'Purchase').reduce((acc, h) => acc + h.change, 0);

        return (
            <div className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="p-6 bg-card-light dark:bg-card-dark border rounded-lg"><h4 className="text-sm font-medium text-secondary-light dark:text-secondary-dark">Total Users</h4><p className="text-3xl font-bold">{totalUsers}</p></div>
                    <div className="p-6 bg-card-light dark:bg-card-dark border rounded-lg"><h4 className="text-sm font-medium text-secondary-light dark:text-secondary-dark">Total Images Generated</h4><p className="text-3xl font-bold">{totalGenerated}</p></div>
                    <div className="p-6 bg-card-light dark:bg-card-dark border rounded-lg"><h4 className="text-sm font-medium text-secondary-light dark:text-secondary-dark">Total Credits Purchased</h4><p className="text-3xl font-bold">{totalCreditsPurchased}</p></div>
                </div>
                <div>
                    <h3 className="text-xl font-semibold mb-4">Credit Transaction Log</h3>
                    <div className="bg-card-light dark:bg-card-dark border rounded-lg overflow-hidden max-h-96 overflow-y-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 dark:bg-gray-900/50 text-xs uppercase sticky top-0"><tr className="text-left"><th className="px-6 py-3">User</th><th className="px-6 py-3">Change</th><th className="px-6 py-3">Reason</th><th className="px-6 py-3">Date</th></tr></thead>
                            <tbody>{creditHistory.slice().reverse().map(h => (<tr key={h.id} className="border-b"><td className="px-6 py-4">{h.userName}</td><td className={`px-6 py-4 font-semibold ${h.change > 0 ? 'text-green-500' : 'text-red-500'}`}>{h.change > 0 ? `+${h.change}` : h.change}</td><td className="px-6 py-4">{h.reason}</td><td className="px-6 py-4">{formatDateTime(h.createdAt)}</td></tr>))}</tbody>
                        </table>
                    </div>
                </div>
            </div>
        );
    };
    // #endregion

    // #region Users Tab
    const UsersTab = () => {
        const [search, setSearch] = useState('');
        const [editingUser, setEditingUser] = useState<Omit<User, 'password'> | null>(null);
        const [deletingUser, setDeletingUser] = useState<Omit<User, 'password'> | null>(null);

        const filteredUsers = useMemo(() => 
            users.filter(u => u.role === 'user' && (u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase())))
        , [users, search]);

        const handleSaveUser = (updatedUser: Omit<User, 'password'>) => {
            adminUpdateUser(updatedUser);
            setToast({message: "User updated successfully", type: 'success'});
            setEditingUser(null);
        };

        const handleDeleteUser = () => {
            if(!deletingUser) return;
            deleteUser(deletingUser.id);
            setToast({message: "User has been deleted.", type: 'success'});
            setDeletingUser(null);
        };
        
        const handleToggleStatus = (userToToggle: Omit<User, 'password'>) => {
            const newStatus = userToToggle.status === 'active' ? 'blocked' : 'active';
            adminUpdateUser({ ...userToToggle, status: newStatus });
            setToast({ message: `User has been ${newStatus}.`, type: 'success'});
        };

        return (
            <div className="space-y-4">
                <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or email..." className="w-full p-2 bg-transparent border rounded-md"/>
                <div className="bg-card-light dark:bg-card-dark border rounded-lg overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 dark:bg-gray-900/50 text-xs uppercase"><tr className="text-left"><th className="px-6 py-3">User</th><th className="px-6 py-3">Credits</th><th className="px-6 py-3">Status</th><th className="px-6 py-3">Joined</th><th className="px-6 py-3 text-right">Actions</th></tr></thead>
                        <tbody>{filteredUsers.map((u) => (<tr key={u.id} className="border-b">
                            <td className="px-6 py-4"><div className="font-medium">{u.name}</div><div className="text-xs text-secondary-light dark:text-secondary-dark">{u.email}</div></td>
                            <td className="px-6 py-4 font-mono">{u.credits}</td>
                            <td className="px-6 py-4"><span className={`px-2 py-1 text-xs rounded-full ${u.status === 'active' ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}`}>{u.status}</span></td>
                            <td className="px-6 py-4">{formatDate(u.createdAt)}</td>
                            <td className="px-6 py-4 text-right space-x-2">
                                <button onClick={() => setEditingUser(u)} className="p-1.5 transition-transform transform hover:scale-125 active:scale-95"><EditIcon className="w-4 h-4"/></button>
                                <button onClick={() => handleToggleStatus(u)} className="p-1.5 transition-transform transform hover:scale-125 active:scale-95" title={u.status === 'active' ? 'Block User' : 'Unblock User'}>{u.status === 'active' ? <BlockIcon className="w-4 h-4 text-orange-500"/> : <CheckCircleIcon className="w-4 h-4 text-green-500"/>}</button>
                                <button onClick={() => setDeletingUser(u)} className="p-1.5 transition-transform transform hover:scale-125 active:scale-95"><XCircleIcon className="w-4 h-4 text-red-500"/></button>
                            </td>
                        </tr>))}</tbody>
                    </table>
                </div>
                {editingUser && <UserEditModal user={editingUser} onSave={handleSaveUser} onClose={() => setEditingUser(null)} />}
                {deletingUser && <ConfirmationModal isOpen={!!deletingUser} onClose={() => setDeletingUser(null)} onConfirm={handleDeleteUser} title="Delete User" confirmText="Delete">
                    <p>Are you sure you want to delete <strong>{deletingUser.name}</strong>? This action is irreversible.</p>
                </ConfirmationModal>}
            </div>
        );
    };

    const UserEditModal: React.FC<{ user: Omit<User, 'password'>; onSave: (user: Omit<User, 'password'>) => void; onClose: () => void; }> = ({ user, onSave, onClose }) => {
        const [formData, setFormData] = useState(user);
        const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
            const { name, value } = e.target;
            setFormData(prev => ({ ...prev, [name]: name === 'credits' ? (parseInt(value, 10) || 0) : value }));
        };
        return (
            <Modal isOpen={true} onClose={onClose} title={`Edit ${user.name}`}>
                <form onSubmit={(e) => { e.preventDefault(); onSave(formData); }} className="space-y-4">
                    <div><label className="text-sm">Full Name</label><input type="text" name="name" value={formData.name} onChange={handleChange} className="w-full mt-1 p-2 bg-light dark:bg-dark border rounded-md" /></div>
                    <div><label className="text-sm">Email</label><input type="email" name="email" value={formData.email} onChange={handleChange} className="w-full mt-1 p-2 bg-light dark:bg-dark border rounded-md" /></div>
                    <div><label className="text-sm">Credits</label><input type="number" name="credits" value={formData.credits} onChange={handleChange} className="w-full mt-1 p-2 bg-light dark:bg-dark border rounded-md" /></div>
                    <div><label className="text-sm">Role</label><select name="role" value={formData.role} onChange={handleChange} className="w-full mt-1 p-2 bg-light dark:bg-dark border rounded-md"><option value="user">User</option><option value="admin">Admin</option></select></div>
                    <div className="flex justify-end space-x-2 pt-4"><button type="button" onClick={onClose} className="px-4 py-2 text-sm rounded-md transition-transform active:scale-95">Cancel</button><button type="submit" className="px-4 py-2 text-sm text-white bg-black rounded-md transition-transform active:scale-95">Save Changes</button></div>
                </form>
            </Modal>
        );
    };
    // #endregion
    
    // #region Credit Requests Tab
    const CreditRequestsTab = () => {
        const [rejectingRequest, setRejectingRequest] = useState<CreditRequest | null>(null);
        const [rejectionNote, setRejectionNote] = useState('');
        
        const handleApprove = (requestId: string) => {
            approveCreditRequest(requestId);
            setToast({ message: "Request approved and credits added.", type: 'success' });
        };
        
        const handleRejectSubmit = () => {
            if (!rejectingRequest) return;
            rejectCreditRequest(rejectingRequest.id, rejectionNote || "No reason provided.");
            setToast({ message: "Request has been rejected.", type: 'success' });
            setRejectingRequest(null);
            setRejectionNote('');
        };

        const pendingRequests = creditRequests.filter(r => r.status === 'Pending');
        const resolvedRequests = creditRequests.filter(r => r.status !== 'Pending');

        const RequestTable: React.FC<{reqs: CreditRequest[]}> = ({ reqs }) => (
             <div className="bg-card-light dark:bg-card-dark border rounded-lg overflow-x-auto">
                <table className="w-full text-sm">
                    <thead className="bg-gray-50 dark:bg-gray-900/50 text-xs uppercase"><tr className="text-left"><th className="px-6 py-3">User</th><th className="px-6 py-3">Package</th><th className="px-6 py-3">Payment Details</th><th className="px-6 py-3">Submitted</th><th className="px-6 py-3">Status</th><th className="px-6 py-3 text-right">Actions</th></tr></thead>
                    <tbody>{reqs.slice().reverse().map((req) => (<tr key={req.id} className="border-b">
                        <td className="px-6 py-4 font-medium">{req.userName}</td>
                        <td className="px-6 py-4">{req.creditPlan?.name} <span className="text-xs">(${req.creditPlan?.price})</span><br/><span className="text-xs text-secondary-light dark:text-secondary-dark">{req.creditPackage} credits</span></td>
                        <td className="px-6 py-4">
                            <div className="font-mono text-xs" title={req.transactionId}>{`TXID: ${req.transactionId.substring(0, 10)}...`}</div>
                            <div>Paid <span className="font-semibold">${req.amountPaid.toFixed(2)}</span> on {formatDate(req.createdAt)}</div>
                            {req.proofImage && (
                                <a href={req.proofImage} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 hover:underline mt-1 inline-block font-semibold">
                                    View Proof
                                </a>
                            )}
                            {req.note && <div className="mt-1 pt-1 border-t text-xs italic text-secondary-light dark:text-secondary-dark">Note: "{req.note}"</div>}
                        </td>
                        <td className="px-6 py-4 text-xs">{formatDateTime(req.createdAt)}</td>
                        <td className="px-6 py-4">
                             <span className={`px-2 py-1 text-xs rounded-full ${
                                req.status === 'Approved' ? 'bg-green-500/20 text-green-500' : 
                                req.status === 'Rejected' ? 'bg-red-500/20 text-red-500' :
                                'bg-yellow-500/20 text-yellow-500'}`
                             }>{req.status}</span>
                        </td>
                        <td className="px-6 py-4 text-right space-x-2">
                           {req.status === 'Pending' ? (<>
                                <button onClick={() => handleApprove(req.id)} className="px-3 py-1 text-xs rounded-full text-white bg-green-600 hover:bg-green-700 transition-transform active:scale-95">Approve</button>
                                <button onClick={() => setRejectingRequest(req)} className="px-3 py-1 text-xs rounded-full text-white bg-red-600 hover:bg-red-700 transition-transform active:scale-95">Reject</button>
                           </>) : (
                             <span className="text-xs text-secondary-light dark:text-secondary-dark italic">Resolved</span>
                           )}
                        </td>
                    </tr>))}</tbody>
                </table>
            </div>
        );

        return (
            <div className="space-y-8">
                <div>
                    <h3 className="text-xl font-semibold mb-4">Pending Requests ({pendingRequests.length})</h3>
                    {pendingRequests.length > 0 ? <RequestTable reqs={pendingRequests} /> : <p className="text-sm text-secondary-light dark:text-secondary-dark p-4 bg-card-light dark:bg-card-dark border rounded-lg">No pending requests.</p>}
                </div>
                 <div>
                    <h3 className="text-xl font-semibold mb-4">Resolved Requests ({resolvedRequests.length})</h3>
                    {resolvedRequests.length > 0 ? <RequestTable reqs={resolvedRequests} /> : <p className="text-sm text-secondary-light dark:text-secondary-dark p-4 bg-card-light dark:bg-card-dark border rounded-lg">No resolved requests yet.</p>}
                </div>
                {rejectingRequest && <Modal isOpen={!!rejectingRequest} onClose={() => setRejectingRequest(null)} title="Reject Payment Request">
                    <div className="space-y-4">
                        <p className="text-sm text-secondary-light dark:text-secondary-dark">Please provide a reason for rejecting the request from <strong>{rejectingRequest.userName}</strong>. This note will be visible to the user.</p>
                        <textarea value={rejectionNote} onChange={e => setRejectionNote(e.target.value)} placeholder="e.g., Transaction ID not found." rows={3} className="w-full p-2 bg-light dark:bg-dark border rounded-md"/>
                        <div className="flex justify-end space-x-3">
                            <button onClick={() => setRejectingRequest(null)} className="px-4 py-2 text-sm font-medium rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-transform active:scale-95">Cancel</button>
                            <button onClick={handleRejectSubmit} className="px-4 py-2 text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 transition-transform active:scale-95">Confirm Rejection</button>
                        </div>
                    </div>
                </Modal>}
            </div>
        );
    };
    // #endregion

    // #region Image Reports Tab
    const ImageReportsTab = () => {
        const pendingReports = imageReports.filter(r => r.status === 'Pending');
        const resolvedReports = imageReports.filter(r => r.status === 'Resolved');
        const [deletingImage, setDeletingImage] = useState<PublicImage | null>(null);
    
        const handleResolve = (reportId: string) => {
            updateImageReportStatus(reportId, 'Resolved');
            setToast({ message: 'Report marked as resolved.', type: 'success' });
        };
        
        const handleDeleteImageClick = (imageId: string) => {
            const image = publicImages.find(img => img.id === imageId);
            if(image) {
                setDeletingImage(image);
            } else {
                setToast({ message: "Could not find the image to delete. It might have been already removed.", type: 'error' });
            }
        };
        
        const handleDeleteImageConfirm = async () => {
            if (!deletingImage) return;
            try {
                await deletePublicImage(deletingImage.id);
                setToast({ message: "Image removed from gallery.", type: 'success' });
                // Also resolve reports related to this image
                const reportsToResolve = imageReports.filter(r => r.imageId === deletingImage.id && r.status === 'Pending');
                reportsToResolve.forEach(report => updateImageReportStatus(report.id, 'Resolved'));
            } catch (err: any) {
                setToast({ message: err.message, type: 'error' });
            } finally {
                setDeletingImage(null);
            }
        };
    
        const ReportsTable: React.FC<{ reports: ImageReport[] }> = ({ reports }) => (
            <div className="bg-card-light dark:bg-card-dark border rounded-lg overflow-x-auto">
                <table className="w-full text-sm">
                    <thead className="bg-gray-50 dark:bg-gray-900/50 text-xs uppercase"><tr className="text-left"><th className="px-6 py-3">Image</th><th className="px-6 py-3">Reason</th><th className="px-6 py-3">Reported By</th><th className="px-6 py-3">Date</th><th className="px-6 py-3">Status</th><th className="px-6 py-3 text-right">Actions</th></tr></thead>
                    <tbody>
                        {reports.slice().reverse().map(report => (
                            <tr key={report.id} className="border-b">
                                <td className="px-6 py-4"><img src={report.imageUrl} alt="Reported" className="w-12 h-12 rounded-md object-cover"/></td>
                                <td className="px-6 py-4 max-w-sm"><p className="truncate" title={report.reason}>{report.reason}</p></td>
                                <td className="px-6 py-4">{report.reporterName}</td>
                                <td className="px-6 py-4 text-xs">{formatDateTime(report.createdAt)}</td>
                                <td className="px-6 py-4"><span className={`px-2 py-1 text-xs rounded-full ${report.status === 'Resolved' ? 'bg-green-500/20 text-green-500' : 'bg-yellow-500/20 text-yellow-500'}`}>{report.status}</span></td>
                                <td className="px-6 py-4 text-right space-x-2">
                                    {report.status === 'Pending' && <>
                                        <button onClick={() => handleResolve(report.id)} className="px-3 py-1 text-xs rounded-full text-white bg-green-600 hover:bg-green-700">Resolve</button>
                                        <button onClick={() => handleDeleteImageClick(report.imageId)} className="px-3 py-1 text-xs rounded-full text-white bg-red-600 hover:bg-red-700">Delete Image</button>
                                    </>}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
        
        return (
            <div className="space-y-8">
                <div>
                    <h3 className="text-xl font-semibold mb-4">Pending Reports ({pendingReports.length})</h3>
                    {pendingReports.length > 0 ? <ReportsTable reports={pendingReports} /> : <p className="text-sm text-secondary-light dark:text-secondary-dark p-4 bg-card-light dark:bg-card-dark border rounded-lg">No pending reports.</p>}
                </div>
                <div>
                    <h3 className="text-xl font-semibold mb-4">Resolved Reports ({resolvedReports.length})</h3>
                    {resolvedReports.length > 0 ? <ReportsTable reports={resolvedReports} /> : <p className="text-sm text-secondary-light dark:text-secondary-dark p-4 bg-card-light dark:bg-card-dark border rounded-lg">No resolved reports yet.</p>}
                </div>
                 {deletingImage && <ConfirmationModal isOpen={!!deletingImage} onClose={() => setDeletingImage(null)} onConfirm={handleDeleteImageConfirm} title="Delete Gallery Image" confirmText="Delete">
                    <p>Are you sure you want to permanently delete this image from the public gallery? This will also resolve any pending reports for this image.</p>
                </ConfirmationModal>}
            </div>
        );
    };
    // #endregion

    // #region Gallery Tab
    const GalleryManagementTab = () => {
        const [imageUrl, setImageUrl] = useState('');
        const [prompt, setPrompt] = useState('');
        const [isSubmitting, setIsSubmitting] = useState(false);
        const [deletingImage, setDeletingImage] = useState<PublicImage | null>(null);

        const handleAddImage = async (e: React.FormEvent) => {
            e.preventDefault();
            if (!imageUrl.trim() || !prompt.trim()) {
                setToast({ message: "Image URL and prompt are required.", type: 'error' });
                return;
            }
            setIsSubmitting(true);
            try {
                await addPublicImage(imageUrl, prompt);
                setToast({ message: "Image added to gallery!", type: 'success' });
                setImageUrl('');
                setPrompt('');
            } catch (err: any) {
                setToast({ message: err.message, type: 'error' });
            } finally {
                setIsSubmitting(false);
            }
        };

        const handleDeleteImage = async () => {
            if (!deletingImage) return;
            try {
                await deletePublicImage(deletingImage.id);
                setToast({ message: "Image removed from gallery.", type: 'success' });
            } catch (err: any) {
                setToast({ message: err.message, type: 'error' });
            } finally {
                setDeletingImage(null);
            }
        };

        return (
            <div className="space-y-8">
                <div className="bg-card-light dark:bg-card-dark p-6 border rounded-lg">
                    <h3 className="text-xl font-semibold mb-4">Add New Gallery Image</h3>
                    <form onSubmit={handleAddImage} className="space-y-4">
                        <div><label className="text-sm">Image URL</label><input type="url" value={imageUrl} onChange={e => setImageUrl(e.target.value)} placeholder="https://..." className="w-full mt-1 p-2 bg-light dark:bg-dark border rounded-md" /></div>
                        <div><label className="text-sm">Prompt / Description</label><textarea value={prompt} onChange={e => setPrompt(e.target.value)} rows={3} placeholder="A detailed description of the image..." className="w-full mt-1 p-2 bg-light dark:bg-dark border rounded-md"></textarea></div>
                        <div className="text-right"><button type="submit" disabled={isSubmitting} className="px-5 py-2 text-sm text-white bg-black rounded-md disabled:opacity-50 transition-transform active:scale-95">{isSubmitting ? 'Adding...' : 'Add Image'}</button></div>
                    </form>
                </div>

                <div>
                    <h3 className="text-xl font-semibold mb-4">Manage Gallery ({publicImages.length})</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                        {publicImages.slice().reverse().map(image => (
                            <div key={image.id} className="group relative aspect-square bg-card-dark rounded-lg overflow-hidden border">
                                <img src={image.imageUrl} alt={image.title} className="w-full h-full object-cover"/>
                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <button onClick={() => setDeletingImage(image)} className="p-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition-transform transform hover:scale-110 active:scale-95"><XCircleIcon className="w-6 h-6"/></button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                 {deletingImage && <ConfirmationModal isOpen={!!deletingImage} onClose={() => setDeletingImage(null)} onConfirm={handleDeleteImage} title="Delete Gallery Image" confirmText="Delete">
                    <p>Are you sure you want to permanently delete this image from the public gallery?</p>
                </ConfirmationModal>}
            </div>
        );
    };
    // #endregion
    
    // #region Reviews Tab
    const ReviewsTab = () => {
        const [deletingReview, setDeletingReview] = useState<Review | null>(null);
        
        const handleToggleApproved = (review: Review) => {
            updateReviewStatus(review.id, !review.approved);
            setToast({ message: `Review status updated.`, type: 'success' });
        };
        
        const handleDelete = () => {
            if (!deletingReview) return;
            deleteReview(deletingReview.id);
            setToast({ message: "Review has been deleted.", type: 'success' });
            setDeletingReview(null);
        };

        return (
            <div className="space-y-4">
                <div className="bg-card-light dark:bg-card-dark border rounded-lg overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 dark:bg-gray-900/50 text-xs uppercase"><tr className="text-left"><th className="px-6 py-3">User</th><th className="px-6 py-3">Rating</th><th className="px-6 py-3">Comment</th><th className="px-6 py-3">Date</th><th className="px-6 py-3">Status</th><th className="px-6 py-3 text-right">Actions</th></tr></thead>
                        <tbody>{reviews.slice().reverse().map((r) => (<tr key={r.id} className="border-b">
                            <td className="px-6 py-4">{r.name}</td>
                            <td className="px-6 py-4 flex items-center">{[...Array(r.rating)].map((_, i) => <StarIcon key={i} className="w-4 h-4 text-yellow-500" />)}</td>
                            <td className="px-6 py-4 max-w-sm"><p className="truncate" title={r.comment}>{r.comment}</p></td>
                            <td className="px-6 py-4">{formatDate(r.date)}</td>
                            <td className="px-6 py-4"><span className={`px-2 py-1 text-xs rounded-full ${r.approved ? 'bg-green-500/20 text-green-500' : 'bg-yellow-500/20 text-yellow-500'}`}>{r.approved ? 'Approved' : 'Pending'}</span></td>
                            <td className="px-6 py-4 text-right space-x-2">
                                <button onClick={() => handleToggleApproved(r)} className="p-1.5 transition-transform transform hover:scale-125 active:scale-95" title={r.approved ? 'Un-approve' : 'Approve'}>
                                    {r.approved ? <XCircleIcon className="w-4 h-4 text-orange-500"/> : <CheckCircleIcon className="w-4 h-4 text-green-500"/>}
                                </button>
                                <button onClick={() => setDeletingReview(r)} className="p-1.5 transition-transform transform hover:scale-125 active:scale-95"><XCircleIcon className="w-4 h-4 text-red-500"/></button>
                            </td>
                        </tr>))}</tbody>
                    </table>
                </div>
                {deletingReview && <ConfirmationModal isOpen={!!deletingReview} onClose={() => setDeletingReview(null)} onConfirm={handleDelete} title="Delete Review" confirmText="Delete">
                    <p>Are you sure you want to delete this review? This action is irreversible.</p>
                </ConfirmationModal>}
            </div>
        );
    };
    // #endregion

    // #region Support Tab
    const SupportTab = () => {
        const handleUpdateStatus = (ticketId: string, status: 'Read' | 'Resolved') => {
            updateSupportTicketStatus(ticketId, status);
            setToast({ message: `Ticket marked as ${status}.`, type: 'success' });
        };
        
        return (
            <div className="space-y-4">
                 <div className="bg-card-light dark:bg-card-dark border rounded-lg overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 dark:bg-gray-900/50 text-xs uppercase"><tr className="text-left"><th className="px-6 py-3">User</th><th className="px-6 py-3">Message</th><th className="px-6 py-3">Date</th><th className="px-6 py-3">Status</th><th className="px-6 py-3 text-right">Actions</th></tr></thead>
                        <tbody>{supportMessages.slice().reverse().map((t) => (<tr key={t.id} className="border-b">
                            <td className="px-6 py-4"><div className="font-medium">{t.name}</div><div className="text-xs">{t.email}</div></td>
                            <td className="px-6 py-4 max-w-sm"><p className="truncate" title={t.message}>{t.message}</p></td>
                            <td className="px-6 py-4">{formatDateTime(t.createdAt)}</td>
                            <td className="px-6 py-4"><span className={`px-2 py-1 text-xs rounded-full ${
                                t.status === 'Resolved' ? 'bg-green-500/20 text-green-500' : 
                                t.status === 'Read' ? 'bg-blue-500/20 text-blue-500' :
                                'bg-yellow-500/20 text-yellow-500'}`
                             }>{t.status}</span></td>
                            <td className="px-6 py-4 text-right space-x-2">
                                {t.status === 'Pending' && <button onClick={() => handleUpdateStatus(t.id, 'Read')} className="px-3 py-1 text-xs rounded-full text-white bg-blue-600 hover:bg-blue-700">Mark as Read</button>}
                                {t.status !== 'Resolved' && <button onClick={() => handleUpdateStatus(t.id, 'Resolved')} className="px-3 py-1 text-xs rounded-full text-white bg-green-600 hover:bg-green-700">Resolve</button>}
                            </td>
                        </tr>))}</tbody>
                    </table>
                </div>
            </div>
        );
    };
    // #endregion
    
    // #region Settings Tab
    const SettingsTab = () => {
        const [settings, setSettings] = useState<SystemSettings>(systemSettings);
        const [isSaving, setIsSaving] = useState(false);
        
        const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
            const { name, value, type } = e.target;
            if (type === 'checkbox') {
                 const { checked } = e.target as HTMLInputElement;
                 setSettings(prev => ({ ...prev, [name]: checked }));
            } else {
                 setSettings(prev => ({ ...prev, [name]: value }));
            }
        };

        const handleSubmit = (e: React.FormEvent) => {
            e.preventDefault();
            setIsSaving(true);
            updateSystemSettings(settings);
            setTimeout(() => {
                setIsSaving(false);
                setToast({ message: "Settings saved successfully!", type: 'success' });
            }, 500);
        };
        
        return (
             <form onSubmit={handleSubmit} className="max-w-2xl mx-auto space-y-8">
                <div className="bg-card-light dark:bg-card-dark p-6 border rounded-lg">
                    <h3 className="text-xl font-semibold mb-4">General Settings</h3>
                    <div className="space-y-4">
                        <div><label className="text-sm">Platform Name</label><input type="text" name="platformName" value={settings.platformName} onChange={handleChange} className="w-full mt-1 p-2 bg-light dark:bg-dark border rounded-md" /></div>
                        <div><label className="text-sm">Default Theme</label><select name="defaultTheme" value={settings.defaultTheme} onChange={handleChange} className="w-full mt-1 p-2 bg-light dark:bg-dark border rounded-md"><option value="light">Light</option><option value="dark">Dark</option></select></div>
                         <div className="flex items-center space-x-3 pt-2">
                            <input type="checkbox" id="maintenanceMode" name="maintenanceMode" checked={settings.maintenanceMode} onChange={handleChange} className="h-4 w-4 rounded border-gray-300 text-black focus:ring-black"/>
                            <label htmlFor="maintenanceMode" className="text-sm font-medium">Enable Maintenance Mode</label>
                         </div>
                         <p className="text-xs text-secondary-light dark:text-secondary-dark">When enabled, only admins can access the site.</p>
                    </div>
                </div>
                 <div className="flex justify-end">
                    <button type="submit" disabled={isSaving} className="px-5 py-2 text-sm text-white bg-black rounded-md disabled:opacity-50 flex items-center">
                        {isSaving && <SpinnerIcon className="animate-spin mr-2 h-4 w-4"/>}
                        {isSaving ? 'Saving...' : 'Save Settings'}
                    </button>
                 </div>
            </form>
        );
    };
    // #endregion

    return (
        <div className="min-h-screen bg-light dark:bg-dark text-primary-light dark:text-primary-dark flex flex-col">
            <header className="bg-card-light dark:bg-card-dark border-b border-border-light dark:border-border-dark w-full sticky top-0 z-10">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <h1 className="text-xl font-bold tracking-tighter">Admin Dashboard</h1>
                        <div className="flex items-center space-x-4">
                            <span className="text-sm font-medium hidden sm:inline">{adminUser.name}</span>
                            <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-800">
                                {theme === 'light' ? <MoonIcon className="w-5 h-5" /> : <SunIcon className="w-5 h-5" />}
                            </button>
                            <button onClick={logout} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-800">
                                <LogoutIcon className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                    <div className="flex items-center border-t border-border-light dark:border-border-dark overflow-x-auto -mb-px">
                        <TabButton tab="analytics" label="Analytics" icon={<StatsIcon className="w-4 h-4" />} />
                        <TabButton tab="users" label="Users" icon={<UserIcon className="w-4 h-4" />} />
                        <TabButton tab="payments" label="Payments" icon={<TicketIcon className="w-4 h-4" />} />
                        <TabButton tab="gallery" label="Gallery" icon={<GalleryIcon className="w-4 h-4" />} />
                        <TabButton tab="reviews" label="Reviews" icon={<StarIcon className="w-4 h-4" />} />
                        <TabButton tab="support" label="Support" icon={<EnvelopeIcon className="w-4 h-4" />} />
                        <TabButton tab="reports" label="Reports" icon={<FlagIcon className="w-4 h-4" />} />
                        <TabButton tab="settings" label="Settings" icon={<SettingsIcon className="w-4 h-4" />} />
                        <TabButton tab="profile" label="Profile" icon={<InfoIcon className="w-4 h-4" />} />
                    </div>
                </div>
            </header>
            <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="animate-fade-in">
                    {activeTab === 'analytics' && <AnalyticsTab />}
                    {activeTab === 'users' && <UsersTab />}
                    {activeTab === 'reviews' && <ReviewsTab />}
                    {activeTab === 'support' && <SupportTab />}
                    {activeTab === 'settings' && <SettingsTab />}
                    {activeTab === 'profile' && <AdminProfilePage />}
                    {activeTab === 'gallery' && <GalleryManagementTab />}
                    {activeTab === 'payments' && <CreditRequestsTab />}
                    {activeTab === 'reports' && <ImageReportsTab />}
                </div>
            </main>
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </div>
    );
};

export default AdminDashboardPage;

import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { ADMIN_EMAIL } from '../constants';
import { ArrowLeftIcon, EnvelopeIcon, SpinnerIcon } from '../components/Icons';
import Toast from '../components/Toast';

interface SupportPageProps {
    onNavigateBack: () => void;
}

const SupportPage: React.FC<SupportPageProps> = ({ onNavigateBack }) => {
    const { user, submitSupportTicket } = useContext(AuthContext);

    const [message, setMessage] = useState('');
    const [category, setCategory] = useState('General Inquiry');
    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState<{message: string, type: 'success' | 'error'} | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!message.trim()) {
            setToast({ message: "Please provide a message.", type: 'error' });
            return;
        }
        setLoading(true);
        try {
            await submitSupportTicket(message, category);
            setToast({ message: "Your message has been sent. We'll get back to you shortly!", type: 'success' });
            setMessage('');
        } catch (err: any) {
            setToast({ message: err.message || "Failed to send message.", type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    if (!user) return null;

    return (
        <main className="pt-8 pb-12 container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mx-auto">
                <div className="mb-6 animate-fade-in">
                    <button
                        onClick={onNavigateBack}
                        className="flex items-center space-x-2 text-sm font-medium text-secondary-light dark:text-secondary-dark hover:text-primary-light dark:hover:text-primary-dark transition-colors group"
                        aria-label="Go back to profile"
                    >
                        <ArrowLeftIcon className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
                        <span>Back to Profile</span>
                    </button>
                </div>

                <div className="bg-card-light dark:bg-card-dark p-8 rounded-lg border border-border-light dark:border-border-dark animate-slide-in-up">
                    <div className="text-center mb-8">
                        <EnvelopeIcon className="w-12 h-12 mx-auto text-secondary-light dark:text-secondary-dark" />
                        <h2 className="text-3xl font-bold mt-4">Contact Support</h2>
                        <p className="text-secondary-light dark:text-secondary-dark mt-2">
                            Have a question or issue? Let us know below. Your message will be sent securely to our admin team.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                         <div>
                            <label htmlFor="category" className="block text-sm font-medium text-secondary-light dark:text-secondary-dark">Category</label>
                            <select id="category" value={category} onChange={(e) => setCategory(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-transparent border border-border-light dark:border-border-dark rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white sm:text-sm">
                                <option>General Inquiry</option>
                                <option>Billing Issue</option>
                                <option>Technical Problem</option>
                                <option>Feedback</option>
                            </select>
                        </div>
                        <div>
                             <label htmlFor="message" className="block text-sm font-medium text-secondary-light dark:text-secondary-dark">Your Question or Message</label>
                            <textarea id="message" value={message} onChange={(e) => setMessage(e.target.value)} rows={6} required className="mt-1 block w-full px-3 py-2 bg-transparent border border-border-light dark:border-border-dark rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white sm:text-sm" placeholder="Please describe your issue in detail..."></textarea>
                        </div>
                        <div>
                            <button type="submit" disabled={loading} className="w-full flex justify-center items-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-black hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black dark:text-black dark:bg-white dark:hover:bg-gray-200 dark:focus:ring-white disabled:opacity-50">
                                {loading && <SpinnerIcon className="animate-spin -ml-1 mr-3 h-5 w-5" />}
                                {loading ? 'Sending...' : 'Send Message'}
                            </button>
                        </div>
                    </form>
                    
                    <div className="text-center mt-8 text-sm text-secondary-light dark:text-secondary-dark">
                        <p>You can also reach us directly at <a href={`mailto:${ADMIN_EMAIL}?subject=Support%20Request`} className="font-medium text-primary-light dark:text-primary-dark underline hover:no-underline">{ADMIN_EMAIL}</a>.</p>
                    </div>

                </div>
            </div>
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </main>
    );
};

export default SupportPage;
import React, { useContext, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import { ArrowLeftIcon, XCircleIcon, DownloadIcon } from '../components/Icons';
import Toast from '../components/Toast';

interface FavoritesPageProps {
    onNavigateBack: () => void;
}

const FavoritesPage: React.FC<FavoritesPageProps> = ({ onNavigateBack }) => {
    const { user, removeFavorite } = useContext(AuthContext);
    const [toast, setToast] = useState<{message: string, type: 'success' | 'error'} | null>(null);

    const favorites = user?.favoriteImages || [];

    const handleDownload = async (imageUrl: string, prompt: string = 'favorite-image') => {
        try {
            const response = await fetch(imageUrl);
            if (!response.ok) throw new Error('Network response was not ok.');
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);

            const link = document.createElement('a');
            link.href = url;
            const filename = prompt.trim().toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').slice(0, 50) || 'dot-ai-favorite';
            link.download = `${filename}.jpeg`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
            setToast({ message: "Download started!", type: 'success' });
        } catch (err) {
            console.error("Download failed:", err);
            setToast({ message: "Download failed. Please try again.", type: 'error' });
        }
    };

    return (
        <main className="pt-8 pb-12 container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-6xl mx-auto">
                <div className="mb-6 animate-fade-in">
                    <button
                        onClick={onNavigateBack}
                        className="flex items-center space-x-2 text-sm font-medium text-secondary-light dark:text-secondary-dark hover:text-primary-light dark:hover:text-primary-dark transition-colors group"
                        aria-label="Go back"
                    >
                        <ArrowLeftIcon className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
                        <span>Back</span>
                    </button>
                </div>
                <h2 className="text-3xl font-bold mb-6 animate-slide-in-up">My Favorites</h2>
                {favorites.length === 0 ? (
                    <div className="text-center py-20 bg-card-light dark:bg-card-dark border-2 border-dashed border-border-light dark:border-border-dark rounded-xl animate-fade-in">
                        <p className="font-semibold text-primary-light dark:text-primary-dark">You haven't saved any favorites yet.</p>
                        <p className="text-sm text-secondary-light dark:text-secondary-dark mt-2">Click the heart icon on a generated image to save it here.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-slide-in-up">
                        {favorites.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map((fav) => (
                            <div key={fav.id} className="group relative aspect-square bg-card-light dark:bg-card-dark rounded-lg overflow-hidden border border-border-light dark:border-border-dark shadow-sm">
                                <img src={fav.imageUrl} alt={fav.prompt} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex flex-col justify-end p-4">
                                    <p className="text-xs text-white/90 line-clamp-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">{fav.prompt}</p>
                                </div>
                                <div className="absolute top-2 right-2 flex space-x-1">
                                    <button 
                                        onClick={() => handleDownload(fav.imageUrl!, fav.prompt)}
                                        className="p-1.5 bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all hover:bg-green-500 transform hover:scale-110"
                                        title="Download Image"
                                    >
                                        <DownloadIcon className="w-5 h-5" />
                                    </button>
                                    <button 
                                        onClick={() => removeFavorite(fav.imageId)}
                                        className="p-1.5 bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500 transform hover:scale-110"
                                        title="Remove from Favorites"
                                    >
                                        <XCircleIcon className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </main>
    );
};

export default FavoritesPage;
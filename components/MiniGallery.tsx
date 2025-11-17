import React, { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { HeartIcon } from './Icons';

interface MiniGalleryProps {
    onOpenFavorites: () => void;
}

const MiniGallery: React.FC<MiniGalleryProps> = ({ onOpenFavorites }) => {
    const { user } = useContext(AuthContext);
    const recentFavorites = user?.favoriteImages?.slice(-4).reverse() || [];

    if (recentFavorites.length === 0) {
        return null;
    }

    return (
        <div 
            className="fixed bottom-4 right-4 z-20 bg-card-light/80 dark:bg-card-dark/80 backdrop-blur-lg border border-border-light dark:border-border-dark rounded-lg shadow-2xl p-3 animate-slide-in-up"
            style={{ animationDelay: '0.5s', animationFillMode: 'backwards' }}
        >
            <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-secondary-light dark:text-secondary-dark">Recent Favorites</h4>
                <button onClick={onOpenFavorites} className="text-xs font-medium text-primary-light dark:text-primary-dark hover:underline">View All</button>
            </div>
            <div className="flex space-x-2">
                {recentFavorites.map(fav => (
                    <div key={fav.id} className="w-16 h-16 rounded-md overflow-hidden group relative border border-border-light dark:border-border-dark">
                        <img src={fav.imageUrl} alt={fav.prompt} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                             <HeartIcon filled className="w-6 h-6 text-red-500" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default MiniGallery;
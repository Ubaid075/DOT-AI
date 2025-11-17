import React, { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { ThemeContext } from '../context/ThemeContext';
import { SunIcon, MoonIcon, CreditIcon, HeartIcon, GalleryIcon, UploadIcon } from './Icons';

interface HeaderProps {
    onBuyCredits: () => void;
    onNavigate: (page: 'generator' | 'profile' | 'favorites' | 'gallery') => void;
    onUploadImage: () => void;
}

const Header: React.FC<HeaderProps> = ({ onBuyCredits, onNavigate, onUploadImage }) => {
  const { user } = useContext(AuthContext);
  const { theme, toggleTheme } = useContext(ThemeContext);

  return (
    <header className="fixed top-0 left-0 right-0 z-10 bg-light/80 dark:bg-dark/80 backdrop-blur-sm border-b border-border-light dark:border-border-dark animate-fade-in">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <button onClick={() => onNavigate('generator')} className="flex-shrink-0">
            <h1 className="text-xl font-bold tracking-tighter text-primary-light dark:text-primary-dark">
              DOT AI
            </h1>
          </button>
          {user && (
            <div className="flex items-center space-x-2 sm:space-x-4">
              <div className="flex items-center space-x-2 bg-card-light dark:bg-card-dark border border-border-light dark:border-border-dark px-3 py-1.5 rounded-full text-sm">
                <CreditIcon className="w-5 h-5 text-yellow-500" />
                <span className="font-semibold text-primary-light dark:text-primary-dark">{user.credits}</span>
                <span className="text-secondary-light dark:text-secondary-dark hidden sm:inline">Credits</span>
              </div>
              
              {/* Desktop Buy Credits Button */}
              <button
                onClick={onBuyCredits}
                className="hidden sm:inline-flex items-center justify-center px-4 py-1.5 border border-transparent text-sm font-medium rounded-full text-white bg-black hover:bg-gray-800 dark:text-black dark:bg-white dark:hover:bg-gray-200 transition-colors"
              >
                Buy Credits
              </button>

              {/* Mobile Buy Credits Button */}
              <button
                onClick={onBuyCredits}
                className="sm:hidden p-2 rounded-full text-secondary-light dark:text-secondary-dark hover:bg-gray-200 dark:hover:bg-gray-800 transition-all duration-200 transform hover:scale-110 active:scale-95"
                aria-label="Buy Credits"
                title="Buy Credits"
              >
                <CreditIcon className="w-5 h-5" />
              </button>

              {/* Desktop Upload Button */}
              <button
                onClick={onUploadImage}
                className="hidden sm:inline-flex items-center justify-center px-4 py-1.5 border border-border-light dark:border-border-dark text-sm font-medium rounded-full text-primary-light dark:text-primary-dark bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                title="Upload Image to Gallery"
              >
                <UploadIcon className="w-4 h-4 -ml-1 mr-2" />
                <span>Upload</span>
              </button>
              
              {/* Mobile Upload Button */}
              <button
                onClick={onUploadImage}
                className="sm:hidden p-2 rounded-full text-secondary-light dark:text-secondary-dark hover:bg-gray-200 dark:hover:bg-gray-800 transition-all duration-200 transform hover:scale-110 active:scale-95"
                aria-label="Upload Image to Gallery"
                title="Upload Image to Gallery"
              >
                <UploadIcon className="w-5 h-5" />
              </button>
              
              <button
                onClick={() => onNavigate('gallery')}
                className="p-2 rounded-full text-secondary-light dark:text-secondary-dark hover:bg-gray-200 dark:hover:bg-gray-800 transition-all duration-200 transform hover:scale-110 active:scale-95"
                aria-label="View Gallery"
              >
                <GalleryIcon className="w-5 h-5" />
              </button>
              <button
                onClick={() => onNavigate('favorites')}
                className="p-2 rounded-full text-secondary-light dark:text-secondary-dark hover:bg-gray-200 dark:hover:bg-gray-800 transition-all duration-200 transform hover:scale-110 active:scale-95"
                aria-label="View Favorites"
              >
                <HeartIcon className="w-5 h-5" />
              </button>
              <button
                onClick={toggleTheme}
                className="p-2 rounded-full text-secondary-light dark:text-secondary-dark hover:bg-gray-200 dark:hover:bg-gray-800 transition-all duration-200 transform hover:scale-110 active:scale-95"
              >
                {theme === 'light' ? <MoonIcon className="w-5 h-5" /> : <SunIcon className="w-5 h-5" />}
              </button>
              <button
                onClick={() => onNavigate('profile')}
                className="w-8 h-8 rounded-full overflow-hidden text-secondary-light dark:text-secondary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-light dark:focus:ring-offset-dark focus:ring-primary-light dark:focus:ring-primary-dark transition-all duration-200 transform hover:scale-110 active:scale-95"
                aria-label="View Profile"
              >
                <img 
                    src={user.profilePic} 
                    alt="Profile" 
                    className="w-full h-full object-cover" 
                />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
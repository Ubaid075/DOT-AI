
import React, { useState, useContext } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, AuthContext } from './context/AuthContext';
import LandingPage from './pages/LandingPage';
import AuthPage from './pages/AuthPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import LoggedInLayout from './layouts/LoggedInLayout';
import { SpinnerIcon } from './components/Icons';
import PublicGalleryPage from './pages/PublicGalleryPage';

const MaintenancePage: React.FC = () => (
    <div className="w-full h-screen flex flex-col items-center justify-center bg-light dark:bg-dark text-center px-4">
        <h1 className="text-4xl font-bold text-primary-light dark:text-primary-dark mb-4">Under Maintenance</h1>
        <p className="text-lg text-secondary-light dark:text-secondary-dark">We're currently performing some scheduled maintenance. We'll be back online shortly!</p>
    </div>
);

const AppContent: React.FC = () => {
    const { user, loading, systemSettings } = useContext(AuthContext);
    const [authMode, setAuthMode] = useState<'hidden' | 'login' | 'signup'>('hidden');
    const [showGallery, setShowGallery] = useState(false);

    if (loading || !systemSettings) { // Guard against systemSettings being undefined on initial render
        return (
            <div className="w-full h-screen flex flex-col items-center justify-center bg-light dark:bg-dark text-primary-light dark:text-primary-dark space-y-4">
                <SpinnerIcon className="w-10 h-10 animate-spin" />
                <span>Loading Platform...</span>
            </div>
        );
    }
    
    if (systemSettings.maintenanceMode && user?.role !== 'admin') {
        return <MaintenancePage />;
    }

    if (user) {
        if (user.role === 'admin') {
            return <AdminDashboardPage />;
        }
        return <LoggedInLayout />;
    }
    
    if (showGallery) {
        return <PublicGalleryPage onNavigateBack={() => setShowGallery(false)} />;
    }

    if (authMode !== 'hidden') {
        return <AuthPage initialMode={authMode} />;
    }

    return <LandingPage 
        onGetStarted={() => setAuthMode('signup')} 
        onLogin={() => setAuthMode('login')}
        onViewGallery={() => setShowGallery(true)} 
    />;
};

const App: React.FC = () => {
  return (
    <ThemeProvider>
        <AuthProvider>
            <AppContent />
        </AuthProvider>
    </ThemeProvider>
  );
};

export default App;

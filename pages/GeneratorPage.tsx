import React, { useState, useContext, useCallback, useMemo } from 'react';
import { AuthContext } from '../context/AuthContext';
import { DownloadIcon, HeartIcon, SpinnerIcon } from '../components/Icons';
import { ImageStyle, ImageResolution, GeneratedImage } from '../types';
import { CREDITS_PER_GENERATION, ADMIN_EMAIL, IMAGE_FRAMES, IMAGE_RESOLUTIONS } from '../constants';
import { generateImage } from '../services/geminiService';
import Modal from '../components/Modal';
import Toast from '../components/Toast';

interface GeneratorPageProps {
  onBuyCredits: () => void;
}

const SkeletonLoader: React.FC = () => (
    <div className="w-full h-full bg-card-light dark:bg-card-dark p-4">
        <div className="w-full h-full bg-gray-300 dark:bg-gray-700 rounded-lg animate-pulse"></div>
    </div>
);


const GeneratorPage: React.FC<GeneratorPageProps> = ({ onBuyCredits }) => {
    const { user, recordImageGeneration, addFavorite, removeFavorite, systemSettings } = useContext(AuthContext);
    const [prompt, setPrompt] = useState('');
    const [style, setStyle] = useState<ImageStyle>(ImageStyle.AESTHETIC);
    const [frame, setFrame] = useState<'1:1' | '3:4' | '4:3' | '9:16' | '16:9'>('1:1');
    const [resolution, setResolution] = useState<ImageResolution>(ImageResolution.HIGH);
    const [generatedImage, setGeneratedImage] = useState<GeneratedImage | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<React.ReactNode | null>(null);
    const [imageMetadata, setImageMetadata] = useState<{width: number, height: number, size: string} | null>(null);
    const [isDownloadModalOpen, setDownloadModalOpen] = useState(false);
    const [toast, setToast] = useState<{message: string, type: 'success' | 'error'} | null>(null);

    const hasEnoughCredits = useMemo(() => user && user.credits >= CREDITS_PER_GENERATION, [user]);

    const isFavorited = useMemo(() => {
        if (!generatedImage || !user?.favoriteImages) return false;
        return user.favoriteImages.some(fav => fav.imageId === generatedImage.id);
    }, [generatedImage, user?.favoriteImages]);

    const handleFavoriteToggle = () => {
        if (!generatedImage) return;

        if (isFavorited) {
            removeFavorite(generatedImage.id);
            setToast({ message: 'Removed from favorites!', type: 'success' });
        } else {
            addFavorite(generatedImage.id, generatedImage.imageUrl, generatedImage.prompt);
            setToast({ message: 'Added to favorites!', type: 'success' });
        }
    };

    const getImageMetadata = useCallback((dataUrl: string): Promise<{width: number, height: number, size: string}> => {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                const head = 'data:image/jpeg;base64,';
                const bytes = Math.round((dataUrl.length - head.length) * 3 / 4);
                const sizeInKB = bytes / 1024;
                const size = sizeInKB > 1024 ? `${(sizeInKB / 1024).toFixed(2)} MB` : `${sizeInKB.toFixed(1)} KB`;
                resolve({ width: img.width, height: img.height, size });
            };
            img.onerror = reject;
            img.src = dataUrl;
        });
    }, []);

    const handleGenerate = useCallback(async () => {
        if (!prompt.trim()) {
            setError("Please enter a prompt.");
            return;
        }
        if (!hasEnoughCredits) {
            onBuyCredits();
            return;
        }

        setLoading(true);
        setError(null);
        setGeneratedImage(null);
        setImageMetadata(null);

        try {
            const fullPrompt = `${prompt}, ${style} style`;
            const imageUrl = await generateImage(fullPrompt, frame, resolution);
            const newImageRecord = recordImageGeneration(imageUrl, fullPrompt, style);
            setGeneratedImage(newImageRecord);
            const metadata = await getImageMetadata(imageUrl);
            setImageMetadata(metadata);
        } catch (err: any) {
            setError(err.message || 'An unexpected error occurred.');
        } finally {
            setLoading(false);
        }
    }, [prompt, style, frame, resolution, hasEnoughCredits, recordImageGeneration, getImageMetadata, onBuyCredits]);
    
    const openDownloadModal = () => {
        if (generatedImage) setDownloadModalOpen(true);
    };

    const DownloadModal: React.FC = () => {
        const [filename, setFilename] = useState(prompt.trim().toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').slice(0, 50) || 'dot-ai-image');
        const [isDownloading, setIsDownloading] = useState(false);
        if (!generatedImage) return null;
    
        const handleActualDownload = async () => {
            if (isDownloading) return;
            setIsDownloading(true);
            try {
                const response = await fetch(generatedImage.imageUrl);
                if (!response.ok) {
                    throw new Error('Network response was not ok.');
                }
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `${filename || 'dot-ai-image'}.jpeg`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                window.URL.revokeObjectURL(url);
                setDownloadModalOpen(false);
                setToast({ message: 'Download started!', type: 'success' });
            } catch (err) {
                console.error("Download failed:", err);
                setToast({ message: 'Download failed. Please try again.', type: 'error' });
            } finally {
                setIsDownloading(false);
            }
        };
    
        return (
            <Modal isOpen={isDownloadModalOpen} onClose={() => setDownloadModalOpen(false)} title="Download Image">
                <div className="space-y-6">
                    <div className="w-full aspect-square bg-card-dark rounded-lg flex items-center justify-center overflow-hidden border border-border-light dark:border-border-dark">
                        <img src={generatedImage.imageUrl} alt="Download preview" className="max-w-full max-h-full object-contain" />
                    </div>
                    {imageMetadata && (
                        <div className="text-sm bg-light dark:bg-dark p-4 rounded-lg border border-border-light dark:border-border-dark">
                            <div className="space-y-1 text-secondary-light dark:text-secondary-dark">
                                <div className="flex justify-between"><span>Resolution:</span> <span className="font-medium text-primary-light dark:text-primary-dark">{imageMetadata.width} &times; {imageMetadata.height} px</span></div>
                                <div className="flex justify-between"><span>Est. File Size:</span> <span className="font-medium text-primary-light dark:text-primary-dark">{imageMetadata.size}</span></div>
                            </div>
                        </div>
                    )}
                    <div>
                        <label htmlFor="filename" className="block text-sm font-medium text-secondary-light dark:text-secondary-dark mb-1">Filename</label>
                        <div className="relative"><input type="text" id="filename" value={filename} onChange={(e) => setFilename(e.target.value)} className="w-full p-2.5 pr-14 bg-transparent border border-border-light dark:border-border-dark rounded-lg focus:ring-1 focus:ring-black dark:focus:ring-white focus:outline-none" /><span className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm text-secondary-light dark:text-secondary-dark pointer-events-none">.jpeg</span></div>
                    </div>
                    <button 
                        onClick={handleActualDownload} 
                        disabled={isDownloading} 
                        className="w-full p-3 font-semibold text-white bg-black rounded-lg hover:bg-gray-800 dark:text-black dark:bg-white dark:hover:bg-gray-200 transition-colors flex items-center justify-center space-x-2 disabled:opacity-50"
                    >
                        {isDownloading ? (
                            <>
                                <SpinnerIcon className="w-5 h-5 animate-spin" />
                                <span>Preparing...</span>
                            </>
                        ) : (
                            <>
                                <DownloadIcon className="w-5 h-5"/>
                                <span>Download High Quality</span>
                            </>
                        )}
                    </button>
                </div>
            </Modal>
        );
    };

    return (
        <main className="pt-8 pb-12 container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto animate-slide-in-up">
                <div className="space-y-6">
                    <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="A white cat astronaut exploring a neon-lit alien jungle, 4K, hyperrealistic..." className="w-full h-28 p-4 text-base bg-card-light dark:bg-card-dark border border-border-light dark:border-border-dark rounded-xl focus:ring-2 focus:ring-black dark:focus:ring-white focus:outline-none transition-all shadow-sm" />
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <select value={style} onChange={(e) => setStyle(e.target.value as ImageStyle)} className="w-full p-3 bg-card-light dark:bg-card-dark border border-border-light dark:border-border-dark rounded-lg focus:ring-2 focus:ring-black dark:focus:ring-white focus:outline-none">
                            {systemSettings.enabledStyles.map((s) => (<option key={s} value={s}>{s}</option>))}
                        </select>
                        <select value={frame} onChange={(e) => setFrame(e.target.value as any)} className="w-full p-3 bg-card-light dark:bg-card-dark border border-border-light dark:border-border-dark rounded-lg focus:ring-2 focus:ring-black dark:focus:ring-white focus:outline-none">{IMAGE_FRAMES.map((f) => (<option key={f.value} value={f.value}>{f.label}</option>))}</select>
                        <select value={resolution} onChange={(e) => setResolution(e.target.value as ImageResolution)} className="w-full p-3 bg-card-light dark:bg-card-dark border border-border-light dark:border-border-dark rounded-lg focus:ring-2 focus:ring-black dark:focus:ring-white focus:outline-none">{IMAGE_RESOLUTIONS.map((r) => (<option key={r.value} value={r.value}>{r.label}</option>))}</select>
                    </div>
                    <button 
                        onClick={hasEnoughCredits ? handleGenerate : onBuyCredits} 
                        disabled={loading} 
                        className={`w-full p-3 font-semibold rounded-lg transition-all transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100 ${
                            hasEnoughCredits 
                                ? 'text-white bg-black hover:bg-gray-800 dark:text-black dark:bg-white dark:hover:bg-gray-200' 
                                : 'text-black bg-yellow-400 hover:bg-yellow-500'
                        }`}
                    >
                        {loading 
                            ? 'Generating...' 
                            : hasEnoughCredits 
                                ? `Generate (${CREDITS_PER_GENERATION} credit)` 
                                : `Purchase Credits`
                        }
                    </button>
                </div>
                                
                {error && <div className="mt-6 text-center text-red-500 p-3 bg-red-500/10 rounded-lg text-sm">{error}</div>}

                <div className="mt-8 aspect-square bg-card-light dark:bg-card-dark border-2 border-dashed border-border-light dark:border-border-dark rounded-xl flex items-center justify-center relative overflow-hidden transition-all duration-300 shadow-inner">
                    {loading && <SkeletonLoader />}
                    {!loading && generatedImage && (
                        <div className="relative w-full h-full group animate-fade-in">
                            <img src={generatedImage.imageUrl} alt="Generated AI" className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-105" />
                            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-60 transition-all flex items-center justify-center space-x-4">
                                <button onClick={openDownloadModal} className="opacity-0 group-hover:opacity-100 transition-opacity p-3 bg-white/20 backdrop-blur-sm rounded-full text-white" title="Download"><DownloadIcon className="w-6 h-6" /></button>
                                <button onClick={handleFavoriteToggle} className={`opacity-0 group-hover:opacity-100 transition-opacity p-3 bg-white/20 backdrop-blur-sm rounded-full ${isFavorited ? 'text-red-500' : 'text-white'}`} title="Favorite"><HeartIcon className="w-6 h-6" filled={isFavorited} /></button>
                            </div>
                        </div>
                    )}
                    {!loading && !generatedImage && (
                        <div className="text-center text-secondary-light dark:text-secondary-dark p-4">
                            <p className="font-semibold">Your generated image will appear here.</p>
                            <p className="text-sm">Remember to favorite or download your creations!</p>
                        </div>
                    )}
                </div>
            </div>
            {isDownloadModalOpen && <DownloadModal />}
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </main>
    );
};

export default GeneratorPage;
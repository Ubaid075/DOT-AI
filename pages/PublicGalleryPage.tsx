import React, { useContext, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import { PublicImage, ImageReport } from '../types';
import { ArrowLeftIcon, HeartIcon, ThumbsUpIcon, CommentIcon, FlagIcon, SpinnerIcon, DownloadIcon } from '../components/Icons';
import Modal from '../components/Modal';
import Toast from '../components/Toast';

const ReportModal: React.FC<{
    image: PublicImage;
    onClose: () => void;
    onSubmitSuccess: () => void;
}> = ({ image, onClose, onSubmitSuccess }) => {
    const { submitImageReport } = useContext(AuthContext);
    const [reason, setReason] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (!reason.trim()) {
            setError('Please provide a reason for your report.');
            return;
        }
        setIsSubmitting(true);
        try {
            await submitImageReport(image.id, image.imageUrl, reason);
            onSubmitSuccess();
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Failed to submit report.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Modal isOpen={true} onClose={onClose} title="Report Image">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="flex items-start space-x-4 p-3 bg-light dark:bg-dark rounded-lg border border-border-light dark:border-border-dark">
                    <img src={image.imageUrl} alt="Image to report" className="w-16 h-16 rounded-md object-cover flex-shrink-0" />
                    <div className="text-sm">
                        <p className="font-semibold text-primary-light dark:text-primary-dark">You are reporting this image:</p>
                        <p className="text-secondary-light dark:text-secondary-dark line-clamp-2" title={image.title}>{image.title}</p>
                    </div>
                </div>

                <p className="text-sm text-secondary-light dark:text-secondary-dark">Please tell us why you are reporting this image. Your report helps us keep the community safe.</p>
                <div>
                    <label htmlFor="report_reason" className="sr-only">Reason</label>
                    <textarea 
                        id="report_reason" 
                        value={reason} 
                        onChange={e => setReason(e.target.value)}
                        rows={4}
                        placeholder="e.g., Inappropriate content, spam, copyright violation..."
                        className="w-full p-2 bg-transparent border border-border-light dark:border-border-dark rounded-md focus:ring-1 focus:ring-black dark:focus:ring-white focus:outline-none"
                        required
                    />
                </div>
                 {error && <p className="text-sm text-center text-red-500 animate-shake">{error}</p>}
                <div className="flex justify-end space-x-3 pt-2">
                    <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-transform active:scale-95">Cancel</button>
                    <button type="submit" disabled={isSubmitting} className="px-4 py-2 text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 flex items-center transition-transform active:scale-95">
                         {isSubmitting && <SpinnerIcon className="animate-spin mr-2 h-4 w-4" />}
                        {isSubmitting ? 'Submitting...' : 'Submit Report'}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

const PublicGalleryPage: React.FC<{onNavigateBack: () => void}> = ({ onNavigateBack }) => {
    const { publicImages, user } = useContext(AuthContext);
    const [selectedImage, setSelectedImage] = useState<PublicImage | null>(null);
    const [reportingImage, setReportingImage] = useState<PublicImage | null>(null);
    const [toast, setToast] = useState<{message: string, type: 'success' | 'error'} | null>(null);

    const handleReportClick = (e: React.MouseEvent, image: PublicImage) => {
        e.stopPropagation();
        if (!user) {
            setToast({ message: "You must be logged in to report images.", type: 'error' });
            return;
        }
        setReportingImage(image);
    };
    
    const handleDownload = async (e: React.MouseEvent, imageUrl: string, prompt: string) => {
        e.stopPropagation();
        try {
            let blob: Blob;
            if (imageUrl.startsWith('data:')) {
                const dataURLtoBlob = (dataURL: string): Blob => {
                    const parts = dataURL.split(',');
                    const contentType = parts[0].split(':')[1].split(';')[0];
                    const raw = window.atob(parts[1]);
                    const rawLength = raw.length;
                    const uInt8Array = new Uint8Array(rawLength);
                    for (let i = 0; i < rawLength; ++i) {
                        uInt8Array[i] = raw.charCodeAt(i);
                    }
                    return new Blob([uInt8Array], { type: contentType });
                };
                blob = dataURLtoBlob(imageUrl);
            } else {
                const response = await fetch(imageUrl);
                if (!response.ok) throw new Error('Network response was not ok.');
                blob = await response.blob();
            }

            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            const filename = prompt.trim().toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').slice(0, 50) || 'dot-ai-gallery-image';
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

    const GalleryDetailModal: React.FC<{ image: PublicImage; onClose: () => void; }> = ({ image, onClose }) => {
        const { togglePublicImageLike, addPublicImageComment, addFavorite, removeFavorite } = useContext(AuthContext);
        const [commentText, setCommentText] = useState('');
        const [isReporting, setIsReporting] = useState(false);
        const [isDownloading, setIsDownloading] = useState(false);
        
        const isLiked = user ? image.likes.some(like => like.userId === user.id) : false;
        const isFavorited = user ? user.favoriteImages.some(fav => fav.imageId === image.id) : false;

        const handleCommentSubmit = (e: React.FormEvent) => {
            e.preventDefault();
            if (!commentText.trim() || !user) {
                if (!user) setToast({ message: "You must be logged in to comment.", type: 'error' });
                return;
            };
            addPublicImageComment(image.id, commentText);
            setCommentText('');
            setToast({ message: "Comment posted!", type: 'success' });
        };
        
        const handleFavoriteToggle = () => {
            if (!user) {
                setToast({ message: "You must be logged in to favorite images.", type: 'error' });
                return;
            }
            if (isFavorited) {
                removeFavorite(image.id);
                setToast({ message: "Removed from favorites", type: 'success' });
            } else {
                addFavorite(image.id, image.imageUrl, image.title);
                setToast({ message: "Added to favorites", type: 'success' });
            }
        };

        const handleLikeToggle = () => {
             if (!user) {
                setToast({ message: "You must be logged in to like images.", type: 'error' });
                return;
            }
            togglePublicImageLike(image.id);
        };
        
        const handleModalDownload = async () => {
            if (isDownloading) return;
            setIsDownloading(true);
            try {
                let blob: Blob;
                if (image.imageUrl.startsWith('data:')) {
                    const dataURLtoBlob = (dataURL: string): Blob => {
                        const parts = dataURL.split(',');
                        const contentType = parts[0].split(':')[1].split(';')[0];
                        const raw = window.atob(parts[1]);
                        const rawLength = raw.length;
                        const uInt8Array = new Uint8Array(rawLength);
                        for (let i = 0; i < rawLength; ++i) {
                            uInt8Array[i] = raw.charCodeAt(i);
                        }
                        return new Blob([uInt8Array], { type: contentType });
                    };
                    blob = dataURLtoBlob(image.imageUrl);
                } else {
                    const response = await fetch(image.imageUrl);
                    if (!response.ok) throw new Error('Network response was not ok.');
                    blob = await response.blob();
                }

                const url = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                const filename = image.title.trim().toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').slice(0, 50) || 'dot-ai-gallery-image';
                link.download = `${filename}.jpeg`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                window.URL.revokeObjectURL(url);
                setToast({ message: "Download started!", type: 'success' });
            } catch (err) {
                console.error("Download failed:", err);
                setToast({ message: "Download failed. Please try again.", type: 'error' });
            } finally {
                setIsDownloading(false);
            }
        };

        return (
            <Modal isOpen={!!image} onClose={onClose} title={image.title}>
                <div className="max-h-[80vh] flex flex-col md:flex-row gap-6">
                    <div className="md:w-1/2 flex-shrink-0 bg-dark rounded-lg flex items-center justify-center">
                        <img src={image.imageUrl} alt={image.title} className="max-w-full max-h-full object-contain rounded-lg"/>
                    </div>
                    <div className="md:w-1/2 flex flex-col">
                        <div className="flex items-center space-x-2 mb-3 pb-3 border-b border-border-light dark:border-border-dark flex-shrink-0">
                            <img src={image.userProfilePic} alt={image.userName} className="w-8 h-8 rounded-full object-cover" />
                            <div>
                                <p className="text-sm font-semibold">{image.userName}</p>
                                <p className="text-xs text-secondary-light dark:text-secondary-dark">Uploaded on {new Date(image.createdAt).toLocaleDateString()}</p>
                            </div>
                        </div>
                        <p className="text-sm text-secondary-light dark:text-secondary-dark mb-4 flex-shrink-0">{image.title}</p>
                        <div className="flex items-center flex-wrap gap-x-4 gap-y-2 mb-4 flex-shrink-0">
                             <button onClick={handleLikeToggle} className={`flex items-center space-x-1.5 text-sm ${isLiked ? 'text-blue-500' : ''} transition-transform transform hover:scale-110`}><ThumbsUpIcon className="w-5 h-5" filled={isLiked}/><span>{image.likes.length}</span></button>
                             <div className="flex items-center space-x-1.5 text-sm"><CommentIcon className="w-5 h-5"/><span>{image.comments.length}</span></div>
                             <button onClick={handleFavoriteToggle} className={`flex items-center space-x-1.5 text-sm ${isFavorited ? 'text-red-500' : ''} transition-transform transform hover:scale-110`}><HeartIcon className="w-5 h-5" filled={isFavorited}/><span>Favorite</span></button>
                             <button onClick={handleModalDownload} disabled={isDownloading} className="flex items-center space-x-1.5 text-sm text-secondary-light dark:text-secondary-dark hover:text-primary-light dark:hover:text-primary-dark transition-transform transform hover:scale-110 disabled:opacity-50">
                                {isDownloading ? <SpinnerIcon className="w-5 h-5 animate-spin" /> : <DownloadIcon className="w-5 h-5" />}
                                <span>{isDownloading ? '...' : 'Download'}</span>
                             </button>
                             <button onClick={() => user ? setIsReporting(true) : setToast({ message: "You must be logged in to report images.", type: 'error' })} className="flex items-center space-x-1.5 text-sm text-secondary-light dark:text-secondary-dark hover:text-red-500 transition-transform transform hover:scale-110"><FlagIcon className="w-5 h-5"/><span>Report</span></button>
                        </div>
                        <div className="flex-grow overflow-y-auto pr-2 space-y-3 mb-4">
                            {image.comments.slice().reverse().map(comment => (
                                <div key={comment.id} className="flex items-start space-x-3">
                                    <img src={comment.userProfilePic} alt={comment.userName} className="w-8 h-8 rounded-full"/>
                                    <div className="bg-light dark:bg-dark p-2 rounded-lg text-sm">
                                        <p className="font-semibold">{comment.userName}</p>
                                        <p>{comment.text}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                        {user && (
                            <form onSubmit={handleCommentSubmit} className="mt-auto flex-shrink-0 flex space-x-2">
                                <input type="text" value={commentText} onChange={e => setCommentText(e.target.value)} placeholder="Add a comment..." className="w-full p-2 bg-light dark:bg-dark border rounded-md"/>
                                <button type="submit" className="px-4 py-2 text-sm text-white bg-black rounded-md">Post</button>
                            </form>
                        )}
                    </div>
                </div>
                {isReporting && <ReportModal image={image} onClose={() => setIsReporting(false)} onSubmitSuccess={() => {
                    setIsReporting(false);
                    setToast({ message: "Image reported. Our team will review it.", type: 'success' });
                }} />}
            </Modal>
        )
    };

    return (
        <main className="pt-8 pb-12 container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-6xl mx-auto">
                <div className="mb-6 animate-fade-in">
                    <button onClick={onNavigateBack} className="flex items-center space-x-2 text-sm font-medium text-secondary-light dark:text-secondary-dark hover:text-primary-light dark:hover:text-primary-dark transition-colors group">
                        <ArrowLeftIcon className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
                        <span>Back</span>
                    </button>
                </div>
                <h2 className="text-3xl font-bold mb-6 animate-slide-in-up">Public Gallery</h2>

                {publicImages.length === 0 ? (
                    <div className="text-center py-20 bg-card-light dark:bg-card-dark border-2 border-dashed rounded-xl">
                        <p className="font-semibold">The gallery is currently empty.</p>
                        <p className="text-sm text-secondary-light dark:text-secondary-dark mt-2">Check back later for curated images from our admin.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-6 animate-slide-in-up">
                        {publicImages.slice().reverse().map((img) => (
                            <div key={img.id}>
                                <div onClick={() => setSelectedImage(img)} className="group relative aspect-square bg-card-dark rounded-lg overflow-hidden border cursor-pointer">
                                    <img src={img.imageUrl} alt={img.title} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-between p-3">
                                        <div className="flex items-center space-x-3 text-white text-sm font-medium">
                                            <div className="flex items-center space-x-1"><ThumbsUpIcon className="w-4 h-4" filled/><span>{img.likes.length}</span></div>
                                            <div className="flex items-center space-x-1"><CommentIcon className="w-4 h-4"/><span>{img.comments.length}</span></div>
                                        </div>
                                    </div>
                                    <div className="absolute top-2 right-2 flex items-center space-x-1">
                                        <button
                                            onClick={(e) => handleDownload(e, img.imageUrl, img.title)}
                                            className="p-1.5 bg-black/40 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all hover:bg-green-600 transform hover:scale-110"
                                            title="Download Image"
                                        >
                                            <DownloadIcon className="w-5 h-5" />
                                        </button>
                                        <button
                                            onClick={(e) => handleReportClick(e, img)}
                                            className="p-1.5 bg-black/40 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all hover:bg-red-600 transform hover:scale-110"
                                            title="Report Image"
                                        >
                                            <FlagIcon className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                                <p className="text-sm text-center mt-2 text-primary-light dark:text-primary-dark truncate" title={img.title}>
                                    {img.title}
                                </p>
                            </div>
                        ))}
                    </div>
                )}
            </div>
            {selectedImage && <GalleryDetailModal image={selectedImage} onClose={() => setSelectedImage(null)} />}
            {reportingImage && <ReportModal image={reportingImage} onClose={() => setReportingImage(null)} onSubmitSuccess={() => {
                setReportingImage(null);
                setToast({ message: "Image reported. Our team will review it.", type: 'success' });
            }} />}
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </main>
    );
};

export default PublicGalleryPage;
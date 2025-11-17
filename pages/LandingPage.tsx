import React, { useContext, useState, useEffect } from 'react';
import { ThemeContext } from '../context/ThemeContext';
import { AuthContext } from '../context/AuthContext';
import { SunIcon, MoonIcon, StarIcon } from '../components/Icons';
import { Review } from '../types';

interface LandingPageProps {
  onGetStarted: () => void;
  onLogin: () => void;
  onViewGallery: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted, onLogin, onViewGallery }) => {
    const { theme, toggleTheme } = useContext(ThemeContext);
    const { reviews, publicImages } = useContext(AuthContext);
    const [currentIndex, setCurrentIndex] = useState(0);

    const approvedReviews = reviews.filter(r => r.approved);
    const galleryPreviewImages = publicImages.slice(-4).reverse();

    useEffect(() => {
        if (approvedReviews.length > 1) {
            const timer = setTimeout(() => {
                setCurrentIndex((prevIndex) => (prevIndex + 1) % approvedReviews.length);
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [currentIndex, approvedReviews.length]);


    const FeatureCard: React.FC<{title: string; description: string;}> = ({title, description}) => (
        <div className="bg-card-light dark:bg-card-dark p-6 rounded-lg border border-border-light dark:border-border-dark h-full transition-all duration-300 shadow-md hover:shadow-xl hover:-translate-y-2">
            <h3 className="text-lg font-semibold mb-2 text-primary-light dark:text-primary-dark">{title}</h3>
            <p className="text-secondary-light dark:text-secondary-dark">{description}</p>
        </div>
    );
    
    const ReviewCard: React.FC<{ review: Review }> = ({ review }) => (
        <div className="bg-card-light dark:bg-card-dark p-8 rounded-lg border border-border-light dark:border-border-dark w-full mx-auto animate-fade-in text-center">
            <div className="flex justify-center mb-4">
                {[...Array(5)].map((_, i) => (
                    <StarIcon key={i} filled={i < review.rating} className="w-5 h-5 text-yellow-500" />
                ))}
            </div>
            <blockquote className="text-lg italic text-primary-light dark:text-primary-dark mb-4">"{review.comment}"</blockquote>
            <div className="flex items-center justify-center space-x-3">
                <img src={review.profilePicture} alt={review.name} className="w-10 h-10 rounded-full object-cover border-2 border-border-light dark:border-border-dark" />
                <p className="font-semibold text-secondary-light dark:text-secondary-dark">{review.name}</p>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-light dark:bg-dark text-primary-light dark:text-primary-dark transition-colors duration-300">
            <header className="absolute top-0 left-0 right-0 z-10">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center h-16">
                    <h1 className="text-xl font-bold tracking-tighter">DOT AI</h1>
                    <button
                        onClick={toggleTheme}
                        className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"
                    >
                        {theme === 'light' ? <MoonIcon className="w-5 h-5" /> : <SunIcon className="w-5 h-5" />}
                    </button>
                </div>
            </header>

            <main className="container mx-auto px-4 sm:px-6 lg:px-8">
                <section className="min-h-screen flex flex-col items-center justify-center text-center">
                    <div className="animate-slide-in-up">
                        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tighter mb-4">
                            Generate Stunning <span className="text-transparent bg-clip-text bg-gradient-to-r from-gray-700 to-black dark:from-gray-300 dark:to-white">AI Images</span> Instantly
                        </h1>
                        <p className="max-w-2xl mx-auto text-lg md:text-xl text-secondary-light dark:text-secondary-dark mb-8">
                            Cartoon, 3D, HDR, Portraits & more. Unleash your creativity with professional-quality results in seconds.
                        </p>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                            <button
                                onClick={onGetStarted}
                                className="px-8 py-3 w-full sm:w-auto border border-transparent text-base font-medium rounded-full text-white bg-black hover:bg-gray-800 dark:text-black dark:bg-white dark:hover:bg-gray-200 transition-all transform hover:scale-105 active:scale-95"
                            >
                                Get Started For Free
                            </button>
                            <button
                                onClick={onLogin}
                                className="px-8 py-3 w-full sm:w-auto border border-border-light dark:border-border-dark text-base font-medium rounded-full text-primary-light dark:text-primary-dark bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800 transition-all transform hover:scale-105 active:scale-95"
                            >
                                Login to Your Account
                            </button>
                        </div>
                    </div>
                </section>
                
                {galleryPreviewImages.length > 0 && (
                    <section className="py-20 text-center">
                        <div className="animate-slide-in-up" style={{ animationDelay: '0.2s' }}>
                            <h2 className="text-3xl font-bold mb-4">Explore Our Gallery</h2>
                            <p className="max-w-2xl mx-auto text-secondary-light dark:text-secondary-dark mb-12">
                                A curated collection of stunning images generated by our platform.
                            </p>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
                                {galleryPreviewImages.map((image) => (
                                    <div key={image.id} className="aspect-square bg-card-light dark:bg-card-dark rounded-lg overflow-hidden border border-border-light dark:border-border-dark group transition-all duration-300 shadow-md hover:shadow-2xl hover:scale-105">
                                        <img src={image.imageUrl} alt={image.title} className="w-full h-full object-cover" />
                                    </div>
                                ))}
                            </div>
                            <button
                                onClick={onViewGallery}
                                className="px-8 py-3 border border-border-light dark:border-border-dark text-base font-medium rounded-full text-primary-light dark:text-primary-dark bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800 transition-all transform hover:scale-105"
                            >
                                View Full Gallery
                            </button>
                        </div>
                    </section>
                )}

                <section className="py-20">
                    <h2 className="text-3xl font-bold text-center mb-12">Why DOT Ai?</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        <FeatureCard title="Multiple Styles" description="From aesthetic and cartoon to ultra-realistic HDR, find the perfect style for your vision." />
                        <FeatureCard title="Blazing Fast" description="Our optimized platform delivers high-quality images in seconds, not minutes." />
                        <FeatureCard title="Privacy First" description="We never store your generated images or prompts. Your creativity is your own." />
                        <FeatureCard title="Free Credits" description="Sign up and receive 25 free credits to start generating immediately." />
                    </div>
                </section>
                
                {approvedReviews.length > 0 && (
                    <section className="py-20">
                        <h2 className="text-3xl font-bold text-center mb-12">What Our Users Say</h2>
                        <div className="max-w-2xl mx-auto relative h-64">
                             {approvedReviews.map((review, index) => (
                                <div
                                    key={review.id}
                                    className={`absolute w-full transition-opacity duration-1000 ${index === currentIndex ? 'opacity-100' : 'opacity-0'}`}
                                >
                                    {index === currentIndex && <ReviewCard review={review} />}
                                </div>
                            ))}
                        </div>
                    </section>
                )}

            </main>
        </div>
    );
};

export default LandingPage;
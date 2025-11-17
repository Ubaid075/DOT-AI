import { ImageStyle, Review, ImageFrame, CreditPlan, ImageResolution } from './types';

export const IMAGE_STYLES: ImageStyle[] = [
    ImageStyle.AESTHETIC,
    ImageStyle.CARTOON,
    ImageStyle.THREE_D,
    ImageStyle.HDR,
    ImageStyle.PORTRAIT,
    ImageStyle.REALISTIC,
    ImageStyle.ULTRA_HIGH_QUALITY,
    ImageStyle.ANIME,
    ImageStyle.PIXEL_ART,
    ImageStyle.VINTAGE,
    ImageStyle.FOUR_K,
    ImageStyle.EIGHT_K,
    ImageStyle.SIXTEEN_K,
];

export const IMAGE_FRAMES: { label: ImageFrame, value: '1:1' | '3:4' | '4:3' | '9:16' | '16:9' }[] = [
    { label: ImageFrame.SQUARE, value: '1:1' },
    { label: ImageFrame.PORTRAIT, value: '3:4' },
    { label: ImageFrame.LANDSCAPE, value: '4:3' },
    { label: ImageFrame.WIDE_PORTRAIT, value: '9:16' },
    { label: ImageFrame.WIDE_LANDSCAPE, value: '16:9' },
];

export const IMAGE_RESOLUTIONS: { label: string, value: ImageResolution }[] = [
    { label: "High (1024x1024)", value: ImageResolution.HIGH },
    { label: "Medium (512x512)", value: ImageResolution.MEDIUM },
    { label: "Low (256x256)", value: ImageResolution.LOW },
];

export const CREDIT_PLANS: CreditPlan[] = [
    { id: 'plan_basic', name: 'Basic', credits: 100, price: 9, notes: 'For casual usage' },
    { id: 'plan_standard', name: 'Standard', credits: 200, price: 17, notes: 'Frequent image generation' },
    { id: 'plan_pro', name: 'Pro', credits: 400, price: 40, notes: 'Heavy usage / professional' },
    { id: 'plan_premium', name: 'Premium', credits: 1000, price: 75, notes: 'Large-scale generation' },
];

export const CREDITS_PER_GENERATION = 1;
export const FREE_CREDITS_ON_SIGNUP = 25;
export const ADMIN_EMAIL = "ubaidjfh@gmail.com";
export const PAYONEER_ACCOUNT_DETAILS = "70582770001401348";

export const PRELOADED_REVIEWS: Omit<Review, 'id' | 'date' | 'userId' | 'approved'>[] = [
    {
        name: 'Alex Johnson',
        rating: 5,
        comment: "Absolutely stunning results! The 3D models are incredibly detailed. I'm blown away by the quality.",
        profilePicture: `https://api.dicebear.com/8.x/initials/svg?seed=Alex Johnson`,
    },
    {
        name: 'Samantha Bee',
        rating: 5,
        comment: "As a photographer, I'm impressed with the HDR and Portrait styles. They look so professional and save me so much editing time.",
        profilePicture: `https://api.dicebear.com/8.x/initials/svg?seed=Samantha Bee`,
    },
    {
        name: 'Chris Lee',
        rating: 4,
        comment: "Great tool for concept art. The Aesthetic and Anime styles are perfect for brainstorming new character designs. Would love more customization options!",
        profilePicture: `https://api.dicebear.com/8.x/initials/svg?seed=Chris Lee`,
    },
    {
        name: 'Maria Garcia',
        rating: 5,
        comment: "So easy to use! I got 25 free credits on signup and was able to generate amazing images for my blog right away. Highly recommend.",
        profilePicture: `https://api.dicebear.com/8.x/initials/svg?seed=Maria Garcia`,
    },
    {
        name: 'David Chen',
        rating: 5,
        comment: "The privacy-first approach is a huge plus. I love that my creations aren't stored anywhere. The performance is also top-notch.",
        profilePicture: `https://api.dicebear.com/8.x/initials/svg?seed=David Chen`,
    }
];
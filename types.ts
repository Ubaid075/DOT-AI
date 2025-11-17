export interface User {
  id: string;
  name: string;
  email: string;
  credits: number;
  role: 'user' | 'admin';
  status: 'active' | 'blocked';
  password?: string; // For mock DB simulation only
  profilePic?: string;
  createdAt: string;
  
  // Relations
  generatedImages: GeneratedImage[];
  uploadedImages: PublicImage[];
  favoriteImages: Favorite[];
  creditRequests: CreditRequest[];
  supportMessages: SupportMessage[];

  // FE-only properties from old model, kept for some UI logic
  lastLogin: string;
  totalGenerated: number;
  usedCredits: number;
}

export interface GeneratedImage {
  id: string;
  userId: string;
  imageUrl: string;
  prompt: string;
  style: string; // From ImageStyle enum
  createdAt: string;
}

export interface PublicImage {
  id: string;
  userId: string;
  title: string;
  imageUrl: string;
  createdAt: string;
  
  // Populated from relations for UI
  userName: string;
  userProfilePic: string;
  comments: Comment[];
  likes: Like[];
}

export interface Favorite {
  id: string;
  userId: string;
  imageId: string; // Can be GeneratedImage or PublicImage id
  createdAt: string;
  // Denormalized for easy display
  imageUrl?: string;
  prompt?: string;
}

export interface Comment {
  id: string;
  imageId: string;
  userId: string;
  text: string;
  createdAt: string;
  // Denormalized for easy display
  userName: string;
  userProfilePic: string;
}

export interface Like {
  id: string;
  imageId: string;
  userId: string;
  createdAt: string;
}

export interface CreditRequest {
  id: string;
  userId: string;
  transactionId: string;
  amountPaid: number;
  creditPackage: number; // e.g., 100, 200, 400, 1000
  proofImage: string; // URL
  note?: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  createdAt: string;
  approvedAt?: string;
  
  // Denormalized for easy display
  userName: string;
  creditPlan?: CreditPlan; // For UI context
  adminNote?: string; // For rejection reason
}

export interface SupportMessage {
  id: string;
  userId: string;
  message: string;
  category: string;
  createdAt: string;
  
  // FE properties
  status: 'Pending' | 'Read' | 'Resolved';
  name: string; // Denormalized
  email: string; // Denormalized
}

export interface CreditPlan {
    id: string;
    name: string;
    credits: number;
    price: number;
    notes: string;
}

export interface Review {
  id:string;
  userId: string;
  name: string;
  profilePicture?: string;
  rating: number; // 1-5
  comment: string;
  date: string;
  approved: boolean;
}

export enum ImageStyle {
  AESTHETIC = "Aesthetic",
  CARTOON = "Cartoon",
  THREE_D = "3D Model",
  HDR = "HDR Photography",
  PORTRAIT = "Portrait",
  REALISTIC = "Realistic",
  ULTRA_HIGH_QUALITY = "Ultra High Quality",
  ANIME = "Anime",
  PIXEL_ART = "Pixel Art",
  VINTAGE = "Vintage Photography",
  FOUR_K = "4K Resolution",
  EIGHT_K = "8K Resolution",
  SIXTEEN_K = "16K Resolution",
}

export enum ImageFrame {
    SQUARE = "Square (1:1)",
    PORTRAIT = "Portrait (3:4)",
    LANDSCAPE = "Landscape (4:3)",
    WIDE_PORTRAIT = "Wide Portrait (9:16)",
    WIDE_LANDSCAPE = "Wide Landscape (16:9)",
}

export enum ImageResolution {
    HIGH = "1024x1024",
    MEDIUM = "512x512",
    LOW = "256x256",
}

export interface CreditHistory {
  id: string;
  userId: string;
  userName: string;
  change: number;
  reason: 'Admin Update' | 'Purchase' | 'Generation' | 'Signup';
  adminId?: string;
  createdAt: string;
}

export interface SystemSettings {
    platformName: string;
    defaultTheme: 'light' | 'dark';
    maintenanceMode: boolean;
    enabledStyles: ImageStyle[];
}

export interface Notification {
  id: string;
  userId: string;
  message: string;
  type: 'success' | 'error' | 'info';
  createdAt: string;
  read: boolean;
}

export interface ImageReport {
  id: string;
  imageId: string;
  imageUrl: string;
  reportedByUserId: string;
  reporterName: string;
  reason: string;
  createdAt: string;
  status: 'Pending' | 'Resolved';
}
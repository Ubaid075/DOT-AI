import React, { createContext, useState, useEffect, useMemo, useCallback } from 'react';
import { User, Review, SupportMessage, Favorite, CreditPlan, SystemSettings, CreditHistory, ImageStyle, PublicImage, Like, Comment, CreditRequest, GeneratedImage, Notification, ImageReport } from '../types';
import { FREE_CREDITS_ON_SIGNUP, ADMIN_EMAIL, CREDITS_PER_GENERATION, PRELOADED_REVIEWS, IMAGE_STYLES } from '../constants';

interface AuthContextType {
  user: Omit<User, 'password'> | null;
  loading: boolean;
  users: Omit<User, 'password'>[];
  reviews: Review[];
  supportMessages: SupportMessage[];
  creditHistory: CreditHistory[];
  systemSettings: SystemSettings;
  publicImages: PublicImage[];
  creditRequests: CreditRequest[];
  notifications: Notification[];
  imageReports: ImageReport[];
  login: (email: string, pass: string) => Promise<void>;
  signup: (name: string, email: string, pass: string) => Promise<void>;
  logout: () => void;
  recordImageGeneration: (imageUrl: string, prompt: string, style: ImageStyle) => GeneratedImage;
  updateUser: (user: Omit<User, 'password'>) => void;
  adminUpdateUser: (user: Omit<User, 'password'>) => void;
  updatePassword: (currentPass: string, newPass: string) => Promise<void>;
  addReview: (rating: number, comment: string) => Promise<void>;
  updateReviewStatus: (reviewId: string, approved: boolean) => void;
  deleteReview: (reviewId: string) => void;
  submitSupportTicket: (message: string, category: string) => Promise<void>;
  updateSupportTicketStatus: (ticketId: string, status: 'Read' | 'Resolved') => void;
  addFavorite: (imageId: string, imageUrl: string, prompt: string) => void;
  removeFavorite: (imageId: string) => void;
  requestCredits: (plan: CreditPlan, transactionId: string, amountPaid: number, dateOfPayment: string, paymentProofUrl: string, userNote?: string) => Promise<void>;
  approveCreditRequest: (requestId: string) => void;
  rejectCreditRequest: (requestId: string, note: string) => void;
  deleteUser: (userId: string) => void;
  updateSystemSettings: (settings: SystemSettings) => void;
  markNotificationsAsRead: (notificationIds: string[]) => void;
  submitImageReport: (imageId: string, imageUrl: string, reason: string) => Promise<void>;
  updateImageReportStatus: (reportId: string, status: 'Resolved') => void;
  // Gallery Functions
  addPublicImage: (imageUrl: string, prompt: string) => Promise<void>;
  addUserUploadedImage: (imageUrl: string, title: string) => void;
  updateUserUploadedImage: (imageId: string, title: string, newImageUrl?: string) => void;
  deletePublicImage: (imageId: string) => Promise<void>;
  deleteUserUploadedImage: (imageId: string) => void;
  togglePublicImageLike: (imageId: string) => void;
  addPublicImageComment: (imageId: string, text: string) => void;
}

export const AuthContext = createContext<AuthContextType>({} as AuthContextType);

const MOCK_USERS_DB_KEY = 'mock_users_db_v2';
const MOCK_REVIEWS_DB_KEY = 'mock_reviews_db_v2';
const MOCK_SUPPORT_DB_KEY = 'mock_support_db_v2';
const MOCK_HISTORY_DB_KEY = 'mock_credit_history_db_v2';
const MOCK_SETTINGS_DB_KEY = 'mock_system_settings_db_v2';
const MOCK_GALLERY_DB_KEY = 'mock_gallery_db_v2';
const MOCK_PAYMENTS_DB_KEY = 'mock_payments_db_v2';
const MOCK_NOTIFICATIONS_DB_KEY = 'mock_notifications_db_v2';
const MOCK_REPORTS_DB_KEY = 'mock_image_reports_db_v2';
const SESSION_KEY = 'dot_ai_session_v2';

const getMockData = <T,>(key: string, initializer: () => T): T => {
    try {
        const stored = localStorage.getItem(key);
        if (stored) return JSON.parse(stored);
        const initialData = initializer();
        localStorage.setItem(key, JSON.stringify(initialData));
        return initialData;
    } catch {
        const initialData = initializer();
        localStorage.setItem(key, JSON.stringify(initialData));
        return initialData;
    }
}

const saveMockData = <T,>(key: string, data: T) => {
    localStorage.setItem(key, JSON.stringify(data));
}

const getInitialUsers = (): User[] => {
    const now = new Date().toISOString();
    const adminUser: User = {
        id: 'admin-0',
        name: 'Admin',
        email: ADMIN_EMAIL,
        password: 'ubaidinhome075',
        credits: 999999,
        role: 'admin',
        status: 'active',
        createdAt: now,
        lastLogin: now,
        totalGenerated: 0,
        usedCredits: 0,
        profilePic: `https://api.dicebear.com/8.x/initials/svg?seed=Admin`,
        favoriteImages: [],
        generatedImages: [],
        uploadedImages: [],
        creditRequests: [],
        supportMessages: [],
    };
    return [adminUser];
};

const getInitialPublicImages = (): PublicImage[] => {
    const now = new Date().toISOString();
    return [
        {
            id: 'gallery-1',
            userId: 'admin-0',
            imageUrl: 'https://storage.googleapis.com/proudcity/mebanenc/uploads/2021/03/placeholder-image.png',
            title: 'A placeholder image from the web, showcasing a serene landscape.',
            userName: 'Admin',
            userProfilePic: `https://api.dicebear.com/8.x/initials/svg?seed=Admin`,
            createdAt: now,
            likes: [],
            comments: [],
        }
    ];
};


const getInitialSettings = (): SystemSettings => ({
    platformName: 'DOT AI',
    defaultTheme: 'dark',
    maintenanceMode: false,
    enabledStyles: IMAGE_STYLES,
});

const sanitizeUserForSession = (user: User): Omit<User, 'password'> => {
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<Omit<User, 'password'> | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [supportMessages, setSupportMessages] = useState<SupportMessage[]>([]);
  const [creditHistory, setCreditHistory] = useState<CreditHistory[]>([]);
  const [systemSettings, setSystemSettings] = useState<SystemSettings>(getInitialSettings());
  const [publicImages, setPublicImages] = useState<PublicImage[]>([]);
  const [creditRequests, setCreditRequests] = useState<CreditRequest[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [imageReports, setImageReports] = useState<ImageReport[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setUsers(getMockData(MOCK_USERS_DB_KEY, getInitialUsers));
    setReviews(getMockData(MOCK_REVIEWS_DB_KEY, () => PRELOADED_REVIEWS.map((r, i) => ({...r, id: `preloaded-${i}`, userId: 'system', date: new Date().toISOString(), approved: true}))));
    setSupportMessages(getMockData(MOCK_SUPPORT_DB_KEY, () => []));
    setCreditHistory(getMockData(MOCK_HISTORY_DB_KEY, () => []));
    setSystemSettings(getMockData(MOCK_SETTINGS_DB_KEY, getInitialSettings));
    setPublicImages(getMockData(MOCK_GALLERY_DB_KEY, getInitialPublicImages));
    setCreditRequests(getMockData(MOCK_PAYMENTS_DB_KEY, () => []));
    setNotifications(getMockData(MOCK_NOTIFICATIONS_DB_KEY, () => []));
    setImageReports(getMockData(MOCK_REPORTS_DB_KEY, () => []));

    try {
      const sessionUser = sessionStorage.getItem(SESSION_KEY);
      if (sessionUser) {
        setUser(JSON.parse(sessionUser));
      }
    } catch (error) {
      console.error("Failed to parse session user:", error);
    } finally {
      setLoading(false);
    }
  }, []);
  
  // Cross-tab data synchronization
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
        if (!user) return; 

        if (event.key === MOCK_USERS_DB_KEY && event.newValue) {
            try {
                const updatedUsers: User[] = JSON.parse(event.newValue);
                setUsers(updatedUsers);
                const updatedCurrentUser = updatedUsers.find(u => u.id === user.id);
                if (updatedCurrentUser) {
                    const sanitized = sanitizeUserForSession(updatedCurrentUser);
                    if (JSON.stringify(sanitized) !== JSON.stringify(user)) {
                         setUser(sanitized);
                         sessionStorage.setItem(SESSION_KEY, JSON.stringify(sanitized));
                    }
                } else { // Current user was deleted
                    logout();
                }
            } catch (e) { console.error("Failed to sync user data from storage", e); }
        }

        // Sync other data models for real-time updates in admin panel etc.
        if (event.key === MOCK_NOTIFICATIONS_DB_KEY && event.newValue) setNotifications(JSON.parse(event.newValue));
        if (event.key === MOCK_REVIEWS_DB_KEY && event.newValue) setReviews(JSON.parse(event.newValue));
        if (event.key === MOCK_SUPPORT_DB_KEY && event.newValue) setSupportMessages(JSON.parse(event.newValue));
        if (event.key === MOCK_HISTORY_DB_KEY && event.newValue) setCreditHistory(JSON.parse(event.newValue));
        if (event.key === MOCK_GALLERY_DB_KEY && event.newValue) setPublicImages(JSON.parse(event.newValue));
        if (event.key === MOCK_PAYMENTS_DB_KEY && event.newValue) setCreditRequests(JSON.parse(event.newValue));
        if (event.key === MOCK_REPORTS_DB_KEY && event.newValue) setImageReports(JSON.parse(event.newValue));
        if (event.key === MOCK_SETTINGS_DB_KEY && event.newValue) setSystemSettings(JSON.parse(event.newValue));
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [user]);

  const createNotification = useCallback((userId: string, message: string, type: Notification['type']) => {
    const newNotification: Notification = {
        id: `notif-${Date.now()}`,
        userId,
        message,
        type,
        createdAt: new Date().toISOString(),
        read: false,
    };
    setNotifications(prev => {
        const updated = [...prev, newNotification];
        saveMockData(MOCK_NOTIFICATIONS_DB_KEY, updated);
        return updated;
    });
  }, []);

  const markNotificationsAsRead = useCallback((notificationIds: string[]) => {
    setNotifications(prev => {
        const updated = prev.map(n => 
            notificationIds.includes(n.id) ? { ...n, read: true } : n
        );
        saveMockData(MOCK_NOTIFICATIONS_DB_KEY, updated);
        return updated;
    });
  }, []);

  const logCreditChange = useCallback((userId: string, userName: string, change: number, reason: CreditHistory['reason']) => {
      const newLog: CreditHistory = { id: `hist-${Date.now()}`, userId, userName, change, reason, adminId: user?.id, createdAt: new Date().toISOString() };
      setCreditHistory(prev => {
          const updated = [...prev, newLog];
          saveMockData(MOCK_HISTORY_DB_KEY, updated);
          return updated;
      });
  }, [user?.id]);
  
  const updateUserStateAndSession = useCallback((fullUser: User) => {
    setUsers(prevUsers => {
        const updatedUsersList = prevUsers.map(u => u.id === fullUser.id ? fullUser : u);
        saveMockData(MOCK_USERS_DB_KEY, updatedUsersList);
        
        if (user && user.id === fullUser.id) {
            const userForSession = sanitizeUserForSession(fullUser);
            setUser(userForSession);
            sessionStorage.setItem(SESSION_KEY, JSON.stringify(userForSession));
        }
        return updatedUsersList;
    });
  }, [user]);


  const login = useCallback(async (email: string, pass: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const allUsers = getMockData<User[]>(MOCK_USERS_DB_KEY, getInitialUsers);
        const foundUser = allUsers.find(u => u.email === email);
        if (!foundUser) return reject(new Error("No account found with this email."));
        if (foundUser.password !== pass) return reject(new Error("Incorrect password. Please try again."));
        if (foundUser.status === 'blocked') return reject(new Error("Your account has been suspended."));
        
        const updatedUser = { ...foundUser, lastLogin: new Date().toISOString() };
        updateUserStateAndSession(updatedUser);
        
        const userForSession = sanitizeUserForSession(updatedUser);
        setUser(userForSession);
        sessionStorage.setItem(SESSION_KEY, JSON.stringify(userForSession));
        resolve();
      }, 500);
    });
  }, [updateUserStateAndSession]);

  const signup = useCallback(async (name: string, email: string, pass: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        setUsers(prevUsers => {
            if (prevUsers.some(u => u.email === email)) {
                reject(new Error("User with this email already exists."));
                return prevUsers;
            }
            
            const now = new Date().toISOString();
            const newUser: User = {
              id: Date.now().toString(),
              name, email, password: pass,
              credits: FREE_CREDITS_ON_SIGNUP,
              role: 'user', status: 'active',
              createdAt: now, lastLogin: now,
              totalGenerated: 0, usedCredits: 0,
              profilePic: `https://api.dicebear.com/8.x/initials/svg?seed=${encodeURIComponent(name)}`,
              favoriteImages: [], generatedImages: [], uploadedImages: [], creditRequests: [], supportMessages: [],
            };
            const updatedUsers = [...prevUsers, newUser];
            saveMockData(MOCK_USERS_DB_KEY, updatedUsers);
            logCreditChange(newUser.id, newUser.name, FREE_CREDITS_ON_SIGNUP, 'Signup');
            
            const userForSession = sanitizeUserForSession(newUser);
            setUser(userForSession);
            sessionStorage.setItem(SESSION_KEY, JSON.stringify(userForSession));
            resolve();
            return updatedUsers;
        });
      }, 500);
    });
  }, [logCreditChange]);

  const logout = useCallback(() => {
    setUser(null);
    sessionStorage.removeItem(SESSION_KEY);
  }, []);
  
  const updateUser = useCallback((updatedUser: Omit<User, 'password'>) => {
    setUsers(prevUsers => {
        const currentUserInDb = prevUsers.find(u => u.id === updatedUser.id);
        if (!currentUserInDb) return prevUsers;

        const fullUser: User = { ...currentUserInDb, ...updatedUser };
        const updatedUsersList = prevUsers.map(u => u.id === fullUser.id ? fullUser : u);
        saveMockData(MOCK_USERS_DB_KEY, updatedUsersList);

        if (user && user.id === fullUser.id) {
            const userForSession = sanitizeUserForSession(fullUser);
            setUser(userForSession);
            sessionStorage.setItem(SESSION_KEY, JSON.stringify(userForSession));
        }
        return updatedUsersList;
    });
  }, [user]);

  const adminUpdateUser = useCallback((updatedUser: Omit<User, 'password'>) => {
    if (user?.role !== 'admin') return;
    setUsers(prevUsers => {
        const currentUserInDb = prevUsers.find(u => u.id === updatedUser.id);
        if (!currentUserInDb) return prevUsers;

        const creditChange = updatedUser.credits - currentUserInDb.credits;
        if(creditChange !== 0) {
            logCreditChange(updatedUser.id, updatedUser.name, creditChange, 'Admin Update');
        }

        const fullUser: User = { ...currentUserInDb, ...updatedUser };
        const updatedUsersList = prevUsers.map(u => u.id === fullUser.id ? fullUser : u);
        saveMockData(MOCK_USERS_DB_KEY, updatedUsersList);
        return updatedUsersList;
    });
  }, [user, logCreditChange]);

  const recordImageGeneration = useCallback((imageUrl: string, prompt: string, style: ImageStyle): GeneratedImage => {
    if (!user) throw new Error("User not logged in");
    
    const newGeneration: GeneratedImage = {
        id: `gen-${Date.now()}`,
        userId: user.id,
        imageUrl,
        prompt,
        style,
        createdAt: new Date().toISOString(),
    };

    const updatedUser: Omit<User, 'password'> = { 
        ...user, 
        credits: user.credits - CREDITS_PER_GENERATION,
        usedCredits: (user.usedCredits || 0) + CREDITS_PER_GENERATION,
        totalGenerated: (user.totalGenerated || 0) + 1,
        generatedImages: [...(user.generatedImages || []), newGeneration],
    };
    
    updateUser(updatedUser);
    logCreditChange(user.id, user.name, -CREDITS_PER_GENERATION, 'Generation');
    return newGeneration;
  }, [user, logCreditChange, updateUser]);

  const updatePassword = useCallback(async (currentPass: string, newPass: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (!user) return reject(new Error("Not logged in."));
      setTimeout(() => {
        setUsers(prevUsers => {
            const fullUser = prevUsers.find(u => u.id === user.id);
            if (!fullUser || fullUser.password !== currentPass) {
                reject(new Error("Incorrect current password."));
                return prevUsers;
            }
            fullUser.password = newPass;
            const updatedUsers = prevUsers.map(u => u.id === user.id ? fullUser : u);
            saveMockData(MOCK_USERS_DB_KEY, updatedUsers);
            resolve();
            return updatedUsers;
        });
      }, 500);
    });
  }, [user]);

  const addReview = useCallback(async (rating: number, comment: string): Promise<void> => {
    if (!user) throw new Error("You must be logged in to leave a review.");
    await new Promise(res => setTimeout(res, 500)); // Simulate API call
    const newReview: Review = {
      id: `review-${Date.now()}`,
      userId: user.id,
      name: user.name,
      profilePicture: user.profilePic,
      rating,
      comment,
      date: new Date().toISOString(),
      approved: false,
    };
    setReviews(prev => {
      const updated = [newReview, ...prev];
      saveMockData(MOCK_REVIEWS_DB_KEY, updated);
      return updated;
    });
  }, [user]);

  const updateReviewStatus = useCallback((reviewId: string, approved: boolean) => {
    if (user?.role !== 'admin') return;
    setReviews(prev => {
      const updated = prev.map(r => r.id === reviewId ? { ...r, approved } : r);
      saveMockData(MOCK_REVIEWS_DB_KEY, updated);
      return updated;
    });
  }, [user]);

  const deleteReview = useCallback((reviewId: string) => {
    if (user?.role !== 'admin') return;
    setReviews(prev => {
      const updated = prev.filter(r => r.id !== reviewId);
      saveMockData(MOCK_REVIEWS_DB_KEY, updated);
      return updated;
    });
  }, [user]);
  
  const submitSupportTicket = useCallback(async (message: string, category: string): Promise<void> => {
    if (!user) throw new Error("You must be logged in.");
    await new Promise(res => setTimeout(res, 500));
    const newTicket: SupportMessage = {
        id: `support-${Date.now()}`,
        userId: user.id,
        name: user.name,
        email: user.email,
        message,
        category,
        createdAt: new Date().toISOString(),
        status: 'Pending',
    };
    setSupportMessages(prev => {
        const updated = [newTicket, ...prev];
        saveMockData(MOCK_SUPPORT_DB_KEY, updated);
        return updated;
    });
  }, [user]);

  const updateSupportTicketStatus = useCallback((ticketId: string, status: 'Read' | 'Resolved') => {
     setSupportMessages(prev => {
        const updated = prev.map(t => t.id === ticketId ? { ...t, status } : t);
        saveMockData(MOCK_SUPPORT_DB_KEY, updated);
        return updated;
    });
  }, []);

  const addFavorite = useCallback((imageId: string, imageUrl: string, prompt: string) => {
    if (!user) return;
    const newFavorite: Favorite = {
        id: `fav-${Date.now()}`,
        userId: user.id,
        imageId,
        imageUrl,
        prompt,
        createdAt: new Date().toISOString(),
    };
    const updatedUser = {
        ...user,
        favoriteImages: [...(user.favoriteImages || []), newFavorite],
    };
    updateUser(updatedUser);
  }, [user, updateUser]);

  const removeFavorite = useCallback((imageId: string) => {
    if (!user) return;
    const updatedUser = {
        ...user,
        favoriteImages: (user.favoriteImages || []).filter(fav => fav.imageId !== imageId),
    };
    updateUser(updatedUser);
  }, [user, updateUser]);

  const requestCredits = useCallback(async (plan: CreditPlan, transactionId: string, amountPaid: number, dateOfPayment: string, paymentProofUrl: string, userNote?: string): Promise<void> => {
    if (!user) throw new Error("You must be logged in to request credits.");
    if (!transactionId.trim()) throw new Error("A valid Transaction ID is required.");
    if (!amountPaid || amountPaid <= 0) throw new Error("A valid amount is required.");
    if (!dateOfPayment) throw new Error("A valid payment date is required.");
    if (!paymentProofUrl) throw new Error("Payment proof is required.");
    
    await new Promise(res => setTimeout(res, 500));

    const newRequest: CreditRequest = {
        id: `pr-${Date.now()}`,
        userId: user.id,
        userName: user.name,
        transactionId,
        creditPackage: plan.credits,
        creditPlan: plan,
        amountPaid,
        proofImage: paymentProofUrl,
        status: 'Pending',
        note: userNote,
        createdAt: new Date().toISOString(),
    };
    
    setCreditRequests(prev => {
        const updated = [newRequest, ...prev];
        saveMockData(MOCK_PAYMENTS_DB_KEY, updated);
        return updated;
    });

  }, [user]);

  const approveCreditRequest = useCallback((requestId: string) => {
    if (user?.role !== 'admin') return;

    let requestToProcess: CreditRequest | undefined;

    setCreditRequests(prev => {
        const request = prev.find(r => r.id === requestId);
        if (!request || request.status !== 'Pending') return prev;
        requestToProcess = request;
        const updated = prev.map(r => r.id === requestId ? { ...r, status: 'Approved' as 'Approved', approvedAt: new Date().toISOString() } : r);
        saveMockData(MOCK_PAYMENTS_DB_KEY, updated);
        return updated;
    });

    setTimeout(() => { // Defer user update to ensure request state is updated first
        if (!requestToProcess) return;

        setUsers(prevUsers => {
            const userToUpdate = prevUsers.find(u => u.id === requestToProcess!.userId);
            if (!userToUpdate) {
                console.error("User for payment request not found!");
                return prevUsers;
            }
            
            const fullUser: User = {
                ...userToUpdate,
                credits: userToUpdate.credits + requestToProcess!.creditPackage,
            };
            
            logCreditChange(fullUser.id, fullUser.name, requestToProcess!.creditPackage, 'Purchase');
            createNotification(
                requestToProcess!.userId, 
                `Your payment for ${requestToProcess!.creditPackage} credits was approved. They have been added to your account.`,
                'success'
            );
            
            const updatedUsers = prevUsers.map(u => u.id === fullUser.id ? fullUser : u);
            saveMockData(MOCK_USERS_DB_KEY, updatedUsers);
            return updatedUsers;
        });
    }, 0);
  }, [user, logCreditChange, createNotification]);

  const rejectCreditRequest = useCallback((requestId: string, note: string) => {
    if (user?.role !== 'admin') return;
    
    setCreditRequests(prev => {
        const request = prev.find(r => r.id === requestId);
        if (!request || request.status !== 'Pending') return prev;

        const updatedRequest: CreditRequest = {
          ...request,
          status: 'Rejected',
          adminNote: note,
          approvedAt: new Date().toISOString(),
        };
        
        createNotification(
            request.userId,
            `Your payment request was rejected. Admin note: "${note}"`,
            'error'
        );

        const updated = prev.map(r => r.id === requestId ? updatedRequest : r);
        saveMockData(MOCK_PAYMENTS_DB_KEY, updated);
        return updated;
    });
  }, [user, createNotification]);

  const deleteUser = useCallback((userId: string) => {
      setUsers(prev => {
          const updated = prev.filter(u => u.id !== userId);
          saveMockData(MOCK_USERS_DB_KEY, updated);
          return updated;
      });
  }, []);
  
  const updateSystemSettings = useCallback((settings: SystemSettings) => {
      saveMockData(MOCK_SETTINGS_DB_KEY, settings);
      setSystemSettings(settings);
  }, []);

  const submitImageReport = useCallback(async (imageId: string, imageUrl: string, reason: string): Promise<void> => {
    if (!user) throw new Error("You must be logged in to report an image.");
    if (!reason.trim()) throw new Error("A reason for the report is required.");

    await new Promise(res => setTimeout(res, 500));

    const newReport: ImageReport = {
        id: `report-${Date.now()}`,
        imageId,
        imageUrl,
        reportedByUserId: user.id,
        reporterName: user.name,
        reason,
        createdAt: new Date().toISOString(),
        status: 'Pending',
    };

    setImageReports(prev => {
        const updated = [newReport, ...prev];
        saveMockData(MOCK_REPORTS_DB_KEY, updated);
        return updated;
    });
  }, [user]);

  const updateImageReportStatus = useCallback((reportId: string, status: 'Resolved') => {
      if (user?.role !== 'admin') return;
      setImageReports(prev => {
          const updated = prev.map(r => r.id === reportId ? { ...r, status } : r);
          saveMockData(MOCK_REPORTS_DB_KEY, updated);
          return updated;
      });
  }, [user]);

  // Gallery Functions
  const addPublicImage = useCallback(async (imageUrl: string, title: string): Promise<void> => {
      if (!user || user.role !== 'admin') return Promise.reject(new Error("Unauthorized"));
      const newImage: PublicImage = {
          id: `gallery-${Date.now()}`, imageUrl, title, userId: 'admin',
          userName: 'Admin', userProfilePic: `https://api.dicebear.com/8.x/initials/svg?seed=Admin`,
          createdAt: new Date().toISOString(), likes: [], comments: [],
      };
      setPublicImages(prev => {
          const updated = [newImage, ...prev];
          saveMockData(MOCK_GALLERY_DB_KEY, updated);
          return updated;
      });
  }, [user]);

  const addUserUploadedImage = useCallback((imageUrl: string, title: string) => {
    if (!user) return;
    const newImage: PublicImage = {
        id: `gallery-${Date.now()}`, imageUrl, title, userId: user.id,
        userName: user.name, userProfilePic: user.profilePic || '',
        createdAt: new Date().toISOString(), likes: [], comments: [],
    };
    setPublicImages(prev => {
        const updated = [newImage, ...prev];
        saveMockData(MOCK_GALLERY_DB_KEY, updated);
        return updated;
    });
  }, [user]);
  
  const updateUserUploadedImage = useCallback((imageId: string, title: string, newImageUrl?: string) => {
    if (!user) throw new Error("You must be logged in to edit an image.");
    setPublicImages(prev => {
        const imageIndex = prev.findIndex(img => img.id === imageId);
        if (imageIndex === -1) throw new Error("Image not found.");
        if (prev[imageIndex].userId !== user.id) throw new Error("You don't have permission to edit this image.");
        
        const updatedImage = { ...prev[imageIndex], title, imageUrl: newImageUrl || prev[imageIndex].imageUrl };
        const updated = [...prev];
        updated[imageIndex] = updatedImage;
        saveMockData(MOCK_GALLERY_DB_KEY, updated);
        return updated;
    });
  }, [user]);

  const deletePublicImage = useCallback(async (imageId: string): Promise<void> => {
      if (!user || user.role !== 'admin') return Promise.reject(new Error("Unauthorized"));
      setPublicImages(prev => {
          const updated = prev.filter(img => img.id !== imageId);
          saveMockData(MOCK_GALLERY_DB_KEY, updated);
          return updated;
      });
  }, [user]);
  
  const deleteUserUploadedImage = useCallback((imageId: string) => {
    if (!user) throw new Error("You must be logged in to delete an image.");
    setPublicImages(prev => {
        const imageToDelete = prev.find(img => img.id === imageId);
        if (!imageToDelete) throw new Error("Image not found.");
        if (imageToDelete.userId !== user.id) throw new Error("You don't have permission to delete this image.");
        
        const updated = prev.filter(img => img.id !== imageId);
        saveMockData(MOCK_GALLERY_DB_KEY, updated);
        return updated;
    });
  }, [user]);

  const togglePublicImageLike = useCallback((imageId: string) => {
      if (!user) return;
      setPublicImages(prev => {
          const imageIndex = prev.findIndex(img => img.id === imageId);
          if (imageIndex === -1) return prev;
          const image = { ...prev[imageIndex] };
          const likeIndex = image.likes.findIndex(like => like.userId === user.id);

          if (likeIndex > -1) {
              image.likes = image.likes.filter((_, index) => index !== likeIndex);
          } else {
              const newLike: Like = { id: `like-${Date.now()}`, imageId: imageId, userId: user.id, createdAt: new Date().toISOString() };
              image.likes = [...image.likes, newLike];
          }
          const updated = [...prev];
          updated[imageIndex] = image;
          saveMockData(MOCK_GALLERY_DB_KEY, updated);
          return updated;
      });
  }, [user]);

  const addPublicImageComment = useCallback((imageId: string, text: string) => {
      if (!user) return;
      setPublicImages(prev => {
          const imageIndex = prev.findIndex(img => img.id === imageId);
          if (imageIndex === -1) return prev;

          const newComment: Comment = {
              id: `comment-${Date.now()}`, imageId, userId: user.id, userName: user.name,
              userProfilePic: user.profilePic || '', text, createdAt: new Date().toISOString(),
          };
          const image = { ...prev[imageIndex] };
          image.comments = [...image.comments, newComment];
          const updated = [...prev];
          updated[imageIndex] = image;
          saveMockData(MOCK_GALLERY_DB_KEY, updated);
          return updated;
      });
  }, [user]);

  const value = useMemo(() => ({ 
      user, 
      users: users.map(sanitizeUserForSession), 
      reviews, supportMessages, creditHistory, systemSettings, loading, publicImages,
      creditRequests, notifications, imageReports,
      login, signup, logout, recordImageGeneration, updateUser, adminUpdateUser, updatePassword,
      addReview, updateReviewStatus, deleteReview, submitSupportTicket, updateSupportTicketStatus,
      addFavorite, removeFavorite, requestCredits, approveCreditRequest, rejectCreditRequest,
      deleteUser, updateSystemSettings, markNotificationsAsRead,
      submitImageReport, updateImageReportStatus,
      addPublicImage, addUserUploadedImage, updateUserUploadedImage, deletePublicImage, deleteUserUploadedImage, togglePublicImageLike, addPublicImageComment
  }), [user, users, reviews, supportMessages, creditHistory, systemSettings, loading, publicImages, creditRequests, notifications, imageReports, login, signup, logout, recordImageGeneration, updateUser, adminUpdateUser, updatePassword, addReview, updateReviewStatus, deleteReview, submitSupportTicket, updateSupportTicketStatus, addFavorite, removeFavorite, requestCredits, approveCreditRequest, rejectCreditRequest, deleteUser, updateSystemSettings, markNotificationsAsRead, submitImageReport, updateImageReportStatus, addPublicImage, addUserUploadedImage, updateUserUploadedImage, deletePublicImage, deleteUserUploadedImage, togglePublicImageLike, addPublicImageComment]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

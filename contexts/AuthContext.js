// contexts/AuthContext.js
import React, { createContext, useState, useContext, useEffect } from 'react';
import { googleAuthService } from '../services/googleAuthService';
import { supabaseService } from '../services/supabaseService';

// Create the context
const AuthContext = createContext(null);

// Context provider component
export const AuthProvider = ({ children }) => {
    const [session, setSession] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // Initialize auth state
    useEffect(() => {
        const initializeAuth = async () => {
            setIsLoading(true);
            setError(null);

            try {
                // Check localStorage first
                const hasLocalAuth = checkLocalStorageAuth();

                // If no local auth, check Supabase
                if (!hasLocalAuth) {
                    const supabaseSession = await supabaseService.getSession();
                    if (supabaseSession) {
                        setSession(supabaseSession);
                    }
                }
            } catch (err) {
                console.error('Auth initialization error:', err);
                setError('Failed to initialize authentication.');
            } finally {
                setIsLoading(false);
            }

            // Set up Supabase auth state listener
            const { subscription } = supabaseService.subscribeToAuthChanges((_event, supabaseSession) => {
                setSession(prev => supabaseSession || prev);
            });

            // Set up storage event listener
            const handleStorageChange = (e) => {
                if (e.key === 'userId' || e.key === 'googleToken') {
                    if (e.key === 'userId' && !e.newValue) {
                        // User logged out
                        setSession(null);
                    } else {
                        // Re-check auth
                        checkLocalStorageAuth();
                    }
                }
            };

            window.addEventListener('storage', handleStorageChange);

            // Clean up function
            return () => {
                subscription.unsubscribe();
                window.removeEventListener('storage', handleStorageChange);
            };
        };

        initializeAuth();
    }, []);

    // Check localStorage for auth data
    const checkLocalStorageAuth = () => {
        try {
            const userId = localStorage.getItem('userId');
            const token = localStorage.getItem('googleToken');
            const userEmail = localStorage.getItem('userEmail');

            if (userId && token) {
                console.log('Found existing auth in localStorage');
                setSession({
                    user: {
                        id: userId,
                        email: userEmail || 'user@example.com'
                    }
                });
                return true;
            }
            return false;
        } catch (err) {
            console.error('Error checking localStorage auth:', err);
            return false;
        }
    };

    // Handle Google auth completion
    const handleAuthChange = ({ isAuthenticated, userId, email }) => {
        if (isAuthenticated && userId) {
            setSession({
                user: {
                    id: userId,
                    email: email
                }
            });
        } else {
            setSession(null);
        }
    };

    // Handle logout
    const logout = async () => {
        try {
            // Use the googleAuthService to handle logout
            await googleAuthService.logout();
            setSession(null);
        } catch (err) {
            console.error('Logout error:', err);
            setError('Failed to log out. Please try again.');
        }
    };

    // Value to be provided by the context
    const contextValue = {
        session,
        isAuthenticated: !!session?.user,
        user: session?.user,
        isLoading,
        error,
        handleAuthChange,
        logout,
        userId: session?.user?.id
    };

    return (
        <AuthContext.Provider value={contextValue}>
            {children}
        </AuthContext.Provider>
    );
};

// Custom hook to use the auth context
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

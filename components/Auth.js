// components/Auth.js
"use client";

import { useState, useEffect } from 'react';
import { LogIn, LogOut } from 'lucide-react';

const Auth = ({ onAuthChange }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [userEmail, setUserEmail] = useState('');
    const [isInitialized, setIsInitialized] = useState(false);

    useEffect(() => {
        const initializeAuth = async () => {
            try {
                // Check if user was previously logged in
                const savedEmail = localStorage.getItem('userEmail');
                const savedUserId = localStorage.getItem('userId');

                if (savedEmail && savedUserId) {
                    setIsAuthenticated(true);
                    setUserEmail(savedEmail);
                    onAuthChange({
                        isAuthenticated: true,
                        userId: savedUserId,
                        email: savedEmail
                    });
                }

                // Load Google API
                if (!window.gapi) {
                    const script = document.createElement('script');
                    script.src = "https://apis.google.com/js/api.js";
                    script.onload = () => {
                        window.gapi.load('client:auth2', async () => {
                            try {
                                await window.gapi.client.init({
                                    apiKey: process.env.NEXT_PUBLIC_GOOGLE_API_KEY,
                                    clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
                                    discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest'],
                                    scope: 'https://www.googleapis.com/auth/calendar.readonly'
                                });

                                // Check if already signed in
                                const isSignedIn = window.gapi.auth2.getAuthInstance().isSignedIn.get();
                                if (isSignedIn) {
                                    const googleUser = window.gapi.auth2.getAuthInstance().currentUser.get();
                                    handleAuthSuccess(googleUser);
                                }

                                setIsInitialized(true);
                            } catch (error) {
                                console.error('Error initializing Google API client:', error);
                                setIsInitialized(true);
                            }
                        });
                    };
                    document.body.appendChild(script);
                } else {
                    setIsInitialized(true);
                }
            } catch (error) {
                console.error('Error in initialization:', error);
                setIsInitialized(true);
            }
        };

        initializeAuth();
    }, []);

    const handleAuthSuccess = (googleUser) => {
        try {
            const profile = googleUser.getBasicProfile();
            const userId = profile.getId();
            const email = profile.getEmail();

            setIsAuthenticated(true);
            setUserEmail(email);
            onAuthChange({
                isAuthenticated: true,
                userId: userId,
                email: email
            });

            localStorage.setItem('userId', userId);
            localStorage.setItem('userEmail', email);
        } catch (error) {
            console.error('Error in handleAuthSuccess:', error);
        }
    };

    const handleLogin = async () => {
        try {
            if (!window.gapi?.auth2) {
                console.error('Google API not initialized');
                return;
            }

            const googleAuth = window.gapi.auth2.getAuthInstance();
            const googleUser = await googleAuth.signIn({
                scope: 'https://www.googleapis.com/auth/calendar.readonly'
            });
            handleAuthSuccess(googleUser);
        } catch (error) {
            console.error('Login failed:', error);
        }
    };

    const handleLogout = async () => {
        try {
            if (window.gapi?.auth2) {
                await window.gapi.auth2.getAuthInstance().signOut();
            }

            setIsAuthenticated(false);
            setUserEmail('');
            onAuthChange({ isAuthenticated: false, userId: null, email: null });

            localStorage.removeItem('userId');
            localStorage.removeItem('userEmail');
        } catch (error) {
            console.error('Logout failed:', error);
        }
    };

    if (!isInitialized) {
        return <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
        </div>;
    }

    return (
        <div className="flex items-center gap-4">
            {!isAuthenticated ? (
                <button
                    onClick={handleLogin}
                    className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                >
                    <LogIn className="h-4 w-4" />
                    Login with Google
                </button>
            ) : (
                <div className="flex items-center gap-4">
                    <span className="text-gray-600">{userEmail}</span>
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
                    >
                        <LogOut className="h-4 w-4" />
                        Logout
                    </button>
                </div>
            )}
        </div>
    );
};

export default Auth;

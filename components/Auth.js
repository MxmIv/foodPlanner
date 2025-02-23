import React, { useState, useEffect } from 'react';
import { LogIn, LogOut } from 'lucide-react';

const Auth = ({ onAuthChange }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [userEmail, setUserEmail] = useState('');
    const [isInitialized, setIsInitialized] = useState(false);
    const [tokenClient, setTokenClient] = useState(null);

    useEffect(() => {
        const initializeAuth = async () => {
            try {
                // Check if user was previously logged in
                const savedEmail = localStorage.getItem('userEmail');
                const savedUserId = localStorage.getItem('userId');
                const savedToken = localStorage.getItem('googleToken');

                if (savedEmail && savedUserId && savedToken) {
                    setIsAuthenticated(true);
                    setUserEmail(savedEmail);
                    onAuthChange({
                        isAuthenticated: true,
                        userId: savedUserId,
                        email: savedEmail
                    });
                }

                // Load Google Identity Services
                const script = document.createElement('script');
                script.src = 'https://accounts.google.com/gsi/client';
                script.async = true;
                script.defer = true;
                script.onload = initializeGoogleClient;
                document.body.appendChild(script);
            } catch (error) {
                console.error('Error in initialization:', error);
                setIsInitialized(true);
            }
        };

        initializeAuth();
    }, []);

    const initializeGoogleClient = async () => {
        try {
            // Initialize Google client
            const client = window.google.accounts.oauth2.initTokenClient({
                client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
                scope: 'https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email',
                callback: handleTokenResponse,
            });

            setTokenClient(client);

            // Load Google API client library
            await loadGapiClient();
            setIsInitialized(true);

            // If we have a saved token, initialize GAPI with it
            const savedToken = localStorage.getItem('googleToken');
            if (savedToken) {
                window.gapi.client.setToken({ access_token: savedToken });
            }
        } catch (error) {
            console.error('Error initializing Google client:', error);
            setIsInitialized(true);
        }
    };

    const loadGapiClient = async () => {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://apis.google.com/js/api.js';
            script.onload = async () => {
                try {
                    await new Promise(resolve => window.gapi.load('client', resolve));
                    await window.gapi.client.init({
                        apiKey: process.env.NEXT_PUBLIC_GOOGLE_API_KEY,
                        discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest']
                    });
                    resolve();
                } catch (error) {
                    reject(error);
                }
            };
            script.onerror = reject;
            document.body.appendChild(script);
        });
    };

    const handleTokenResponse = async (response) => {
        if (response.access_token) {
            try {
                // Store the token
                localStorage.setItem('googleToken', response.access_token);

                // Set the token for GAPI client
                window.gapi.client.setToken({
                    access_token: response.access_token
                });

                // Get user info using the access token
                const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                    headers: { Authorization: `Bearer ${response.access_token}` }
                });
                const userInfo = await userInfoResponse.json();

                setIsAuthenticated(true);
                setUserEmail(userInfo.email);
                onAuthChange({
                    isAuthenticated: true,
                    userId: userInfo.sub,
                    email: userInfo.email
                });

                localStorage.setItem('userId', userInfo.sub);
                localStorage.setItem('userEmail', userInfo.email);
            } catch (error) {
                console.error('Error getting user info:', error);
            }
        }
    };

    const handleLogin = () => {
        if (tokenClient) {
            tokenClient.requestAccessToken();
        } else {
            console.error('Token client not initialized');
        }
    };

    const handleLogout = async () => {
        try {
            // Revoke the token
            const token = localStorage.getItem('googleToken');
            if (token) {
                await fetch(`https://oauth2.googleapis.com/revoke?token=${token}`, {
                    method: 'POST'
                });
                window.gapi.client.setToken(null);
            }

            // Clear all stored data
            localStorage.removeItem('userId');
            localStorage.removeItem('userEmail');
            localStorage.removeItem('googleToken');

            setIsAuthenticated(false);
            setUserEmail('');
            onAuthChange({ isAuthenticated: false, userId: null, email: null });
        } catch (error) {
            console.error('Logout failed:', error);
        }
    };

    if (!isInitialized) {
        return (
            <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
            </div>
        );
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

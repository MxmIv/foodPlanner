import React, { useState, useEffect } from 'react';
import { LogIn, LogOut } from 'lucide-react';

const Auth = ({ onAuthChange }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [userEmail, setUserEmail] = useState('');
    const [isInitialized, setIsInitialized] = useState(false);
    const [tokenClient, setTokenClient] = useState(null);
    const [authError, setAuthError] = useState(null);

    useEffect(() => {
        const initializeAuth = async () => {
            try {
                console.log('Initializing auth component...');

                // Check if user was previously logged in
                const savedEmail = localStorage.getItem('userEmail');
                const savedUserId = localStorage.getItem('userId');
                const savedToken = localStorage.getItem('googleToken');

                if (savedEmail && savedUserId && savedToken) {
                    // Will validate the token later in the initialization process
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
                script.onerror = (error) => {
                    console.error('Failed to load Google Identity Services:', error);
                    setAuthError('Failed to load Google authentication services.');
                    setIsInitialized(true);
                };
                document.body.appendChild(script);
            } catch (error) {
                console.error('Error in auth initialization:', error);
                setAuthError('Authentication initialization failed.');
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

            // If we have a saved token, validate it then initialize GAPI with it
            const savedToken = localStorage.getItem('googleToken');
            if (savedToken) {
                const isValid = await validateToken(savedToken);
                if (isValid) {
                    window.gapi.client.setToken({ access_token: savedToken });
                } else {
                    // Clear invalid token
                    localStorage.removeItem('googleToken');
                    localStorage.removeItem('userId');
                    localStorage.removeItem('userEmail');
                    setIsAuthenticated(false);
                    setUserEmail('');
                    onAuthChange({ isAuthenticated: false, userId: null, email: null });
                }
            }
        } catch (error) {
            console.error('Error initializing Google client:', error);
            setIsInitialized(true);
        }
    };

    const loadGapiClient = async () => {
        return new Promise((resolve, reject) => {
            console.log('Loading GAPI client...');
            const script = document.createElement('script');
            script.src = 'https://apis.google.com/js/api.js';
            script.onload = async () => {
                try {
                    await new Promise(resolve => window.gapi.load('client', resolve));
                    await window.gapi.client.init({
                        apiKey: process.env.NEXT_PUBLIC_GOOGLE_API_KEY,
                        discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest']
                    });
                    console.log('GAPI client loaded and initialized');
                    resolve();
                } catch (error) {
                    console.error('Error initializing GAPI client:', error);
                    reject(error);
                }
            };
            script.onerror = (error) => {
                console.error('Error loading GAPI script:', error);
                reject(new Error('Failed to load Google API script'));
            };
            document.body.appendChild(script);
        });
    };

    // Add this new function to validate tokens
    const validateToken = async (token) => {
        try {
            // Check token validity by making a simple request
            const response = await fetch('https://www.googleapis.com/oauth2/v3/tokeninfo?access_token=' + token);

            if (!response.ok) {
                console.warn('Token validation failed:', response.status, response.statusText);
                return false;
            }

            const data = await response.json();

            // Check if token has the right audience and has not expired
            const isValid = data.aud === process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID &&
                data.exp && (parseInt(data.exp) > Math.floor(Date.now() / 1000));

            if (!isValid) {
                console.warn('Token is invalid or expired:', data);
            }

            return isValid;
        } catch (error) {
            console.error('Token validation error:', error);
            return false;
        }
    };

    const handleTokenResponse = async (response) => {
        if (response.access_token) {
            try {
                console.log('Received token response');
                setAuthError(null);

                // Store the token
                localStorage.setItem('googleToken', response.access_token);

                // Set the token for GAPI client if available
                if (window.gapi && window.gapi.client) {
                    window.gapi.client.setToken({
                        access_token: response.access_token
                    });
                }

                // Get user info using the access token with better error handling
                try {
                    const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                        headers: { Authorization: `Bearer ${response.access_token}` }
                    });

                    if (!userInfoResponse.ok) {
                        throw new Error(`Error fetching user info: ${userInfoResponse.statusText}`);
                    }

                    const userInfo = await userInfoResponse.json();

                    if (!userInfo || !userInfo.sub || !userInfo.email) {
                        throw new Error('Incomplete user info received');
                    }

                    console.log('User authenticated:', userInfo.email);

                    setIsAuthenticated(true);
                    setUserEmail(userInfo.email);

                    // Store user info in localStorage
                    localStorage.setItem('userId', userInfo.sub);
                    localStorage.setItem('userEmail', userInfo.email);

                    // Notify parent component about authentication
                    onAuthChange({
                        isAuthenticated: true,
                        userId: userInfo.sub,
                        email: userInfo.email
                    });

                    // Dispatch a custom event that MealPlanner can listen for
                    const authEvent = new CustomEvent('googleAuthComplete', {
                        detail: {
                            isAuthenticated: true,
                            userId: userInfo.sub,
                            email: userInfo.email
                        }
                    });
                    window.dispatchEvent(authEvent);

                } catch (userInfoError) {
                    console.error('Error getting user info:', userInfoError);
                    setAuthError('Failed to get user information: ' + userInfoError.message);
                    handleLogout(); // Logout on error
                }
            } catch (error) {
                console.error('Error handling token response:', error);
                setAuthError('Authentication process failed: ' + error.message);
            }
        } else {
            console.warn('No access token received');
            setAuthError('No access token received from Google. Please try again.');
        }
    };

    const handleLogin = () => {
        setAuthError(null);
        if (tokenClient) {
            tokenClient.requestAccessToken();
        } else {
            console.error('Token client not initialized');
            setAuthError('Authentication service not initialized. Please refresh the page and try again.');
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

            // Make sure to pass the logout state to parent components
            onAuthChange({
                isAuthenticated: false,
                userId: null,
                email: null
            });

            // Force page refresh to reset all components' state
            // This is a simple but effective way to ensure all components reset
            window.location.reload();
        } catch (error) {
            console.error('Logout failed:', error);
        }
    };

    if (!isInitialized) {
        return (
            <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
                <span className="ml-2">Initializing authentication...</span>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-end gap-4">
            {authError && (
                <div className="w-full bg-red-50 text-red-600 p-3 rounded-md text-sm mb-2">
                    {authError}
                </div>
            )}

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

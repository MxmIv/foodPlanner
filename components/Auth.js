import React, { useState, useEffect } from 'react';
import { LogIn, LogOut } from 'lucide-react';
import { googleAuthService } from '../services/googleAuthService';
import { useAuth } from '../contexts/AuthContext';

const Auth = () => {
    const { handleAuthChange, isAuthenticated, user } = useAuth();
    const [isInitialized, setIsInitialized] = useState(false);
    const [tokenClient, setTokenClient] = useState(null);
    const [authError, setAuthError] = useState(null);

    useEffect(() => {
        const initializeAuth = async () => {
            try {
                console.log('Initializing auth component...');

                // Initialize Google client
                await googleAuthService.initializeClient();

                // Create token client
                const client = googleAuthService.createTokenClient(handleTokenResponse);
                setTokenClient(client);

                // Initialize GAPI client
                await googleAuthService.initializeGapiClient();

                setIsInitialized(true);

                // Validate existing token if present
                const savedToken = googleAuthService.getToken();
                if (savedToken) {
                    const isValid = await googleAuthService.validateToken(savedToken);
                    if (isValid) {
                        if (window.gapi && window.gapi.client) {
                            window.gapi.client.setToken({ access_token: savedToken });
                        }
                    } else {
                        // Clear invalid token
                        localStorage.removeItem('googleToken');
                        localStorage.removeItem('userId');
                        localStorage.removeItem('userEmail');
                        handleAuthChange({
                            isAuthenticated: false,
                            userId: null,
                            email: null
                        });
                    }
                }
            } catch (error) {
                console.error('Error in auth initialization:', error);
                setAuthError('Authentication initialization failed: ' + error.message);
                setIsInitialized(true);
            }
        };

        initializeAuth();

        // Cleanup function to remove any added scripts when component unmounts
        return () => {
            const scripts = document.querySelectorAll('script[src="https://accounts.google.com/gsi/client"]');
            scripts.forEach(script => script.remove());
        };
    }, []);

    const handleTokenResponse = async (response) => {
        if (response.access_token) {
            try {
                console.log('Received token response');
                setAuthError(null);

                // Store the token
                googleAuthService.saveAuthData('', '', response.access_token);

                // Get user info
                const { userInfo, error: userInfoError } = await googleAuthService.getUserInfo(response.access_token);

                if (userInfoError) {
                    throw new Error(`Error getting user info: ${userInfoError.message}`);
                }

                console.log('User authenticated:', userInfo.email);

                // Store complete user info
                googleAuthService.saveAuthData(userInfo.sub, userInfo.email, response.access_token);

                // Notify context about authentication
                handleAuthChange({
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

            } catch (error) {
                console.error('Error handling token response:', error);
                setAuthError('Authentication process failed: ' + error.message);
                handleLogout(); // Logout on error
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
            await googleAuthService.logout();

            // Notify auth context
            handleAuthChange({
                isAuthenticated: false,
                userId: null,
                email: null
            });

            // Force page refresh to reset all components' state
            window.location.reload();
        } catch (error) {
            console.error('Logout failed:', error);
            setAuthError('Logout failed: ' + error.message);
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
                    <span className="text-gray-600">{user?.email}</span>
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

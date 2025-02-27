import React, { useState, useEffect } from 'react';
import { LogIn, LogOut, AlertCircle } from 'lucide-react';
import { googleAuthService } from '../services/googleAuthService';
import { useAuth } from '../contexts/AuthContext';

const Auth = () => {
    const { handleAuthChange, isAuthenticated, user } = useAuth();
    const [isInitialized, setIsInitialized] = useState(false);
    const [tokenClient, setTokenClient] = useState(null);
    const [authError, setAuthError] = useState(null);
    const [showFullError, setShowFullError] = useState(false);

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
            <div className="flex items-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
                <span className="ml-2 text-sm text-gray-600">Initializing...</span>
            </div>
        );
    }

    return (
        <div className="flex items-center">
            {authError && (
                <div className="relative mr-3">
                    <button
                        className="text-red-500 hover:text-red-700"
                        onClick={() => setShowFullError(!showFullError)}
                        title={authError}
                    >
                        <AlertCircle className="h-5 w-5" />
                    </button>

                    {showFullError && (
                        <div className="absolute top-full right-0 mt-1 p-3 bg-white border border-red-200 rounded shadow-md z-50 w-64">
                            <p className="text-sm text-red-600">{authError}</p>
                        </div>
                    )}
                </div>
            )}

            {!isAuthenticated ? (
                <button
                    onClick={handleLogin}
                    className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded hover:bg-primary-light transition-colors"
                >
                    <LogIn className="h-4 w-4" />
                    <span>Login</span>
                </button>
            ) : (
                <div className="flex items-center gap-3">
                    <span className="text-gray-600 text-sm hidden md:inline-block truncate max-w-[180px]">
                        {user?.email}
                    </span>
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 bg-gray-100 text-gray-700 px-4 py-2 rounded hover:bg-gray-200 transition-colors"
                    >
                        <LogOut className="h-4 w-4" />
                        <span className="hidden sm:inline">Logout</span>
                    </button>
                </div>
            )}
        </div>
    );
};

export default Auth;

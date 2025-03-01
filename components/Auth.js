import React, { useState, useEffect } from 'react';
import { LogIn, LogOut, AlertCircle } from 'lucide-react';
import { googleAuthService } from '../services/googleAuthService';
import { userService } from '../services/userService';
import { useAuth } from '../contexts/AuthContext';

const Auth = () => {
    const { handleAuthChange, isAuthenticated, user } = useAuth();
    const [isInitialized, setIsInitialized] = useState(false);
    const [tokenClient, setTokenClient] = useState(null);
    const [authError, setAuthError] = useState(null);
    const [showFullError, setShowFullError] = useState(false);
    const [userEmail, setUserEmail] = useState('');

    useEffect(() => {
        const initializeAuth = async () => {
            try {
                console.log('Initializing auth component...');

                // Test localStorage access
                try {
                    localStorage.setItem('test_key', 'test_value');
                    localStorage.removeItem('test_key');
                    console.log('localStorage test: Success');
                } catch (storageError) {
                    console.error('localStorage test failed:', storageError);
                    setAuthError('Your browser storage is not working properly. Please check your privacy settings.');
                    setIsInitialized(true);
                    return;
                }

                // Initialize Google client
                await googleAuthService.initializeClient();

                // Create token client
                const client = googleAuthService.createTokenClient(handleTokenResponse);
                setTokenClient(client);

                // Initialize GAPI client
                await googleAuthService.initializeGapiClient();

                setIsInitialized(true);

                // Check if user was previously logged in
                const savedEmail = localStorage.getItem('userEmail');
                const savedUserId = localStorage.getItem('userId');
                const savedToken = localStorage.getItem('googleToken');

                if (savedEmail && savedUserId && savedToken) {
                    console.log('Found saved authentication data');
                    setUserEmail(savedEmail);
                    // Validate token
                    const isValid = await googleAuthService.validateToken(savedToken);
                    if (isValid) {
                        console.log('Saved token is valid');
                        // Set GAPI client token directly
                        if (window.gapi && window.gapi.client) {
                            window.gapi.client.setToken({ access_token: savedToken });
                        }

                        handleAuthChange({
                            isAuthenticated: true,
                            userId: savedUserId,
                            email: savedEmail
                        });
                    } else {
                        console.warn('Saved token is invalid, clearing');
                        localStorage.removeItem('googleToken');
                        localStorage.removeItem('userId');
                        localStorage.removeItem('userEmail');
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
                console.log('Received access token from Google');
                setAuthError(null);

                // Store the token directly
                localStorage.setItem('googleToken', response.access_token);
                console.log('Token stored in localStorage');

                // Set GAPI client token directly
                if (window.gapi && window.gapi.client) {
                    window.gapi.client.setToken({ access_token: response.access_token });
                    console.log('Token set in GAPI client');
                }

                // Get user info from Google
                const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                    headers: { Authorization: `Bearer ${response.access_token}` }
                });

                if (!userInfoResponse.ok) {
                    throw new Error(`Error fetching user info: ${userInfoResponse.statusText}`);
                }

                const googleUserInfo = await userInfoResponse.json();
                console.log('Got user info from Google:', googleUserInfo.email);

                // Store Google's ID and email for reference
                localStorage.setItem('googleId', googleUserInfo.sub);
                localStorage.setItem('userEmail', googleUserInfo.email);

                // Find or create user in our database to get consistent ID
                const { user, error: userError } = await userService.findOrCreateUser(
                    googleUserInfo.email,
                    googleUserInfo.sub
                );

                if (userError) {
                    console.error('Error finding/creating user:', userError);
                    setAuthError('Error with user account: ' + userError.message);
                    return;
                }

                if (!user) {
                    console.error('User not found and not created');
                    setAuthError('Error with user account: Could not establish user identity');
                    return;
                }

                // Store our consistent user ID
                localStorage.setItem('userId', user.id);
                console.log('User mapped successfully:', {
                    googleId: googleUserInfo.sub,
                    email: googleUserInfo.email,
                    consistentUserId: user.id
                });

                // Update component state
                setUserEmail(googleUserInfo.email);

                // Notify parent about authentication change
                handleAuthChange({
                    isAuthenticated: true,
                    userId: user.id, // Use our consistent ID
                    email: googleUserInfo.email,
                    token: response.access_token
                });

                // Dispatch event for listeners
                window.dispatchEvent(new CustomEvent('googleAuthComplete', {
                    detail: {
                        isAuthenticated: true,
                        userId: user.id, // Use our consistent ID
                        googleId: googleUserInfo.sub,
                        email: googleUserInfo.email,
                        token: response.access_token
                    }
                }));

            } catch (error) {
                console.error('Error handling token:', error);
                setAuthError('Authentication process failed: ' + error.message);
            }
        } else {
            console.warn('No access token received');
            setAuthError('No access token received from Google. Please try again.');
        }
    };

    const handleLogin = () => {
        // Test localStorage first
        try {
            localStorage.setItem('test_key', 'test_value');
            localStorage.removeItem('test_key');
        } catch (e) {
            setAuthError('Your browser storage is not working properly. Please check your privacy settings and try again.');
            return;
        }

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
            // Direct removal of tokens
            localStorage.removeItem('googleToken');
            localStorage.removeItem('googleId');
            localStorage.removeItem('userId');
            localStorage.removeItem('userEmail');

            // Reset GAPI client if available
            if (window.gapi && window.gapi.client) {
                window.gapi.client.setToken(null);
            }

            // Clear component state
            setUserEmail('');

            // Notify parent about authentication change
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
                        {userEmail || user?.email}
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

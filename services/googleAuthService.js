// services/googleAuthService.js

export const googleAuthService = {
    // Initialize Google client
    initializeClient: async () => {
        return new Promise((resolve, reject) => {
            try {
                if (typeof window === 'undefined') {
                    return reject(new Error('Cannot initialize Google client in server environment'));
                }

                // Check if script already loaded
                if (window.google && window.google.accounts) {
                    console.log('Google Identity Services already loaded');
                    resolve(true);
                    return;
                }

                // Load Google Identity Services
                const script = document.createElement('script');
                script.src = 'https://accounts.google.com/gsi/client';
                script.async = true;
                script.defer = true;
                script.id = 'google-identity-services';

                script.onload = () => {
                    console.log('Google Identity Services loaded successfully');
                    resolve(true);
                };

                script.onerror = (error) => {
                    console.error('Failed to load Google Identity Services:', error);
                    reject(new Error('Failed to load Google authentication services.'));
                };

                document.body.appendChild(script);
            } catch (error) {
                console.error('Error initializing Google client:', error);
                reject(error);
            }
        });
    },

    // Initialize GAPI client
    initializeGapiClient: async () => {
        return new Promise((resolve, reject) => {
            try {
                if (typeof window === 'undefined') {
                    return reject(new Error('Cannot initialize GAPI in server environment'));
                }

                // Check if GAPI already loaded and initialized
                if (window.gapi && window.gapi.client) {
                    console.log('GAPI already loaded and initialized');
                    resolve(true);
                    return;
                }

                // Check if script already exists but not initialized
                if (window.gapi && !window.gapi.client) {
                    // Initialize the existing GAPI
                    window.gapi.load('client', async () => {
                        try {
                            await window.gapi.client.init({
                                apiKey: process.env.NEXT_PUBLIC_GOOGLE_API_KEY,
                                discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest']
                            });
                            console.log('GAPI client initialized from existing gapi object');
                            resolve(true);
                        } catch (error) {
                            console.error('Error initializing GAPI client:', error);
                            reject(error);
                        }
                    });
                    return;
                }

                // Load GAPI script
                const script = document.createElement('script');
                script.src = 'https://apis.google.com/js/api.js';
                script.id = 'google-api-script';

                script.onload = async () => {
                    try {
                        await new Promise(resolve => window.gapi.load('client', resolve));
                        await window.gapi.client.init({
                            apiKey: process.env.NEXT_PUBLIC_GOOGLE_API_KEY,
                            discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest']
                        });
                        console.log('GAPI client loaded and initialized');
                        resolve(true);
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
            } catch (error) {
                console.error('Error in initializeGapiClient:', error);
                reject(error);
            }
        });
    },

    // Create a token client
    createTokenClient: (callback) => {
        if (!window.google || !window.google.accounts || !window.google.accounts.oauth2) {
            console.error('Google Identity Services not fully loaded');
            return null;
        }

        return window.google.accounts.oauth2.initTokenClient({
            client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
            scope: 'https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email',
            callback: callback
        });
    },

    // Validate a token
    validateToken: async (token) => {
        try {
            if (!token) return false;

            const response = await fetch(`https://www.googleapis.com/oauth2/v3/tokeninfo?access_token=${token}`);

            if (!response.ok) {
                console.warn('Token validation failed:', response.status, response.statusText);
                return false;
            }

            const data = await response.json();

            // Check if token has the right audience and has not expired
            const isValid = data.aud === process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID &&
                data.exp && (parseInt(data.exp) > Math.floor(Date.now() / 1000));

            if (!isValid) {
                console.warn('Token is invalid or expired');
            }

            return isValid;
        } catch (error) {
            console.error('Token validation error:', error);
            return false;
        }
    },

    // Get user info
    getUserInfo: async (token) => {
        try {
            if (!token) throw new Error('No token provided');

            const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (!response.ok) {
                throw new Error(`Error fetching user info: ${response.statusText}`);
            }

            const userInfo = await response.json();

            if (!userInfo || !userInfo.sub || !userInfo.email) {
                throw new Error('Incomplete user info received');
            }

            return { userInfo, error: null };
        } catch (error) {
            console.error('Error getting user info:', error);
            return { userInfo: null, error };
        }
    },

    // Log out
    logout: async () => {
        try {
            // Revoke the token if available
            const token = localStorage.getItem('googleToken');
            if (token) {
                try {
                    await fetch(`https://oauth2.googleapis.com/revoke?token=${token}`, {
                        method: 'POST'
                    });
                } catch (revokeError) {
                    console.error('Error revoking token (continuing logout):', revokeError);
                }

                // Reset GAPI client token
                if (window.gapi && window.gapi.client) {
                    window.gapi.client.setToken(null);
                }
            }

            // Clear all stored data
            localStorage.removeItem('userId');
            localStorage.removeItem('userEmail');
            localStorage.removeItem('googleToken');

            return { error: null };
        } catch (error) {
            console.error('Logout error:', error);
            return { error };
        }
    },

    // Save auth data to localStorage
    saveAuthData: (userId, email, token) => {
        try {
            localStorage.setItem('userId', userId);
            localStorage.setItem('userEmail', email);
            localStorage.setItem('googleToken', token);

            // Set token for GAPI client if available
            if (window.gapi && window.gapi.client) {
                window.gapi.client.setToken({ access_token: token });
            }

            return true;
        } catch (error) {
            console.error('Error saving auth data to localStorage:', error);
            return false;
        }
    },

    // Check if currently authenticated
    isAuthenticated: () => {
        return !!localStorage.getItem('googleToken') && !!localStorage.getItem('userId');
    },

    // Get the current user ID
    getUserId: () => {
        return localStorage.getItem('userId');
    },

    // Get the current user email
    getUserEmail: () => {
        return localStorage.getItem('userEmail');
    },

    // Get the current token
    getToken: () => {
        return localStorage.getItem('googleToken');
    }
};

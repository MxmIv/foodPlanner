// lib/google-api.js

const DISCOVERY_DOCS = ['https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest'];

const googleApi = {
    initGapi: () => {
        return new Promise((resolve, reject) => {
            if (typeof window !== 'undefined' && window.gapi) {
                window.gapi.load('client', () => {
                    window.gapi.client
                        .init({
                            apiKey: process.env.NEXT_PUBLIC_GOOGLE_API_KEY, // Replace with your API Key
                            discoveryDocs: DISCOVERY_DOCS,
                        })
                        .then(() => {
                            console.log("gapi client initialized successfully");
                            resolve();
                        })
                        .catch((error) => {
                            console.error("Error initializing gapi client:", error);
                            reject(error);
                        });
                });
            } else {
                const errMsg = "gapi not available in window";
                console.error(errMsg);
                reject(errMsg);
            }
        });
    },

    handleAuthClick: async () => {
        try {
            // Ensure gapi is initialized
            if (!window.gapi || !window.gapi.client) {
                console.log("gapi client not ready, initializing...");
                await googleApi.initGapi();
            }
        } catch (error) {
            console.error("Error during gapi initialization in handleAuthClick:", error);
            return Promise.reject(error);
        }

        return new Promise((resolve, reject) => {
            if (
                typeof window !== 'undefined' &&
                window.google &&
                window.google.accounts &&
                window.google.accounts.oauth2
            ) {
                const tokenClient = window.google.accounts.oauth2.initTokenClient({
                    client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
                    scope: 'https://www.googleapis.com/auth/calendar.events',
                    callback: (resp) => {
                        if (resp.error !== undefined) {
                            console.error("Token client callback error:", resp.error);
                            reject(resp.error);
                        } else {
                            console.log("Token obtained successfully:", resp);
                            resolve(resp);
                        }
                    },
                });

                try {
                    if (!window.gapi.client.getToken()) {
                        tokenClient.requestAccessToken({ prompt: 'consent' });
                    } else {
                        tokenClient.requestAccessToken({ prompt: '' });
                    }
                } catch (error) {
                    console.error("Error during token request:", error);
                    reject(error);
                }
            } else {
                const errMsg = "Google API not initialized properly in handleAuthClick";
                console.error(errMsg);
                reject(errMsg);
            }
        });
    },

    handleSignoutClick: () => {
        if (
            typeof window !== 'undefined' &&
            window.gapi &&
            window.gapi.client &&
            window.google &&
            window.google.accounts &&
            window.google.accounts.oauth2
        ) {
            const token = window.gapi.client.getToken();
            if (token !== null) {
                window.google.accounts.oauth2.revoke(token.access_token, () => {
                    console.log("Access token revoked");
                    window.gapi.client.setToken('');
                });
            } else {
                console.log("No token found to revoke");
            }
        } else {
            console.error("Sign out failed: required Google APIs not available");
        }
    },

    listUpcomingEvents: async () => {
        if (
            typeof window !== 'undefined' &&
            window.gapi &&
            window.gapi.client &&
            window.gapi.client.calendar
        ) {
            try {
                const request = {
                    calendarId: 'primary',
                    timeMin: new Date().toISOString(),
                    showDeleted: false,
                    singleEvents: true,
                    maxResults: 10,
                    orderBy: 'startTime',
                };
                const response = await window.gapi.client.calendar.events.list(request);
                console.log("Fetched upcoming events:", response.result.items);
                return response.result.items;
            } catch (error) {
                console.error("Error listing events:", error);
                return [];
            }
        } else {
            const errMsg = "Error: gapi client calendar not available";
            console.error(errMsg);
            return [];
        }
    },

    createCalendarEvent: async (event) => {
        if (
            typeof window !== 'undefined' &&
            window.gapi &&
            window.gapi.client &&
            window.gapi.client.calendar &&
            window.gapi.client.getToken()
        ) {
            try {
                const response = await window.gapi.client.calendar.events.insert({
                    calendarId: 'primary',
                    resource: event,
                });
                console.log("Event created successfully:", response.result);
                return response.result;
            } catch (error) {
                console.error("Error creating calendar event:", error);
                throw error;
            }
        } else {
            const errorMsg = "Cannot create event: gapi client not properly initialized or token missing.";
            console.error(errorMsg);
            throw new Error(errorMsg);
        }
    }
};

export { googleApi };

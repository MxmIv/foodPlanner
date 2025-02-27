// services/googleCalendarService.js
import { googleAuthService } from './googleAuthService';

export const googleCalendarService = {
    // Check if Google API is ready
    isApiReady: async () => {
        // Check if both gapi and google objects are available
        if (window.gapi && window.gapi.client && window.google) {
            return true;
        }
        return false;
    },

    // Initialize API
    initializeApi: async () => {
        try {
            // First initialize Google Identity Services
            await googleAuthService.initializeClient();

            // Then initialize GAPI client
            await googleAuthService.initializeGapiClient();

            return { success: true, error: null };
        } catch (error) {
            console.error('Error initializing Google Calendar API:', error);
            return { success: false, error };
        }
    },

    // Get events for a specific date range
    getEventsForRange: async (startDateTime, endDateTime) => {
        try {
            // Check for authentication
            const token = googleAuthService.getToken();
            if (!token) {
                return {
                    items: [],
                    error: 'No authentication token available. Please log in.'
                };
            }

            // Validate the token
            const isValid = await googleAuthService.validateToken(token);
            if (!isValid) {
                // Token is invalid, attempt to reload the page to trigger re-authentication
                localStorage.removeItem('googleToken');
                return {
                    items: [],
                    error: 'Authentication token expired. Please log in again.'
                };
            }

            // Make the API request
            const response = await fetch(
                `https://www.googleapis.com/calendar/v3/calendars/primary/events?` +
                new URLSearchParams({
                    timeMin: startDateTime,
                    timeMax: endDateTime,
                    singleEvents: 'true',
                    orderBy: 'startTime'
                }),
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            // Handle HTTP errors
            if (response.status === 401) {
                // Token expired or invalid
                localStorage.removeItem('googleToken');
                return {
                    items: [],
                    error: 'Authentication token expired. Please log in again.'
                };
            }

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                return {
                    items: [],
                    error: `Calendar API error: ${errorData.error?.message || response.statusText}`
                };
            }

            // Parse and return the data
            const data = await response.json();
            console.log('Events retrieved:', data.items?.length || 0);

            return {
                items: data.items || [],
                error: null
            };
        } catch (error) {
            console.error('Error fetching calendar events:', error);
            return {
                items: [],
                error: `Failed to fetch calendar events: ${error.message}`
            };
        }
    },

    // Check if calendar is available and accessible
    checkCalendarAccess: async () => {
        try {
            const token = googleAuthService.getToken();
            if (!token) return false;

            const response = await fetch(
                'https://www.googleapis.com/calendar/v3/calendars/primary',
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            return response.ok;
        } catch (error) {
            console.error('Error checking calendar access:', error);
            return false;
        }
    }
};

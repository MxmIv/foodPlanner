// services/googleCalendarService.js
import { googleAuthService } from './googleAuthService';

export const googleCalendarService = {
    // Check if Google API is ready
    isApiReady: async () => {
        try {
            console.log('Checking Google API readiness:', {
                gapiExists: !!window.gapi,
                gapiClientExists: !!(window.gapi && window.gapi.client),
                googleExists: !!window.google
            });

            // Check if both gapi and google objects are available
            const isReady = !!(window.gapi && window.gapi.client && window.google);
            console.log('Google API ready status:', isReady);
            return isReady;
        } catch (error) {
            console.error('Error checking if Google API is ready:', error);
            return false;
        }
    },

    // Initialize API
    initializeApi: async () => {
        try {
            console.log('Starting Google Calendar API initialization');

            // First initialize Google Identity Services
            await googleAuthService.initializeClient();
            console.log('Google Identity Services initialized');

            // Then initialize GAPI client
            await googleAuthService.initializeGapiClient();
            console.log('GAPI client initialized');

            return { success: true, error: null };
        } catch (error) {
            console.error('Error initializing Google Calendar API:', error);
            return { success: false, error };
        }
    },

    // Get events for a specific date range
    getEventsForRange: async (startDateTime, endDateTime) => {
        try {
            console.log('Getting events for range:', { startDateTime, endDateTime });

            // Direct token retrieval
            const token = localStorage.getItem('googleToken');
            if (!token) {
                console.warn('No Google token found in localStorage');
                return {
                    items: [],
                    error: 'No authentication token available. Please log in.'
                };
            }

            console.log('Found token in localStorage, length:', token.length);

            // First attempt - Use GAPI client if available
            if (window.gapi && window.gapi.client && window.gapi.client.calendar) {
                try {
                    console.log('Attempting to use GAPI client for events');

                    // Make sure token is set in GAPI
                    window.gapi.client.setToken({ access_token: token });

                    const response = await window.gapi.client.calendar.events.list({
                        'calendarId': 'primary',
                        'timeMin': startDateTime,
                        'timeMax': endDateTime,
                        'singleEvents': true,
                        'orderBy': 'startTime'
                    });

                    console.log('GAPI client success, events retrieved:',
                        response.result.items?.length || 0);

                    return {
                        items: response.result.items || [],
                        error: null
                    };
                } catch (gapiError) {
                    console.error('GAPI client error:', gapiError);
                    // Fall back to fetch API
                }
            }

            // Second attempt - Use fetch API
            console.log('Using fetch API for calendar events');
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

            if (!response.ok) {
                console.error('Fetch API error:', response.status, response.statusText);
                if (response.status === 401) {
                    // Token expired - clear it
                    localStorage.removeItem('googleToken');
                    return {
                        items: [],
                        error: 'Authentication token expired. Please log in again.'
                    };
                }

                const errorText = await response.text();
                return {
                    items: [],
                    error: `Calendar API error (${response.status}): ${errorText}`
                };
            }

            const data = await response.json();
            console.log('Fetch API success, events retrieved:',
                data.items?.length || 0);

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

    // Explicitly initialize the Calendar API
    initializeCalendarAPI: async () => {
        try {
            console.log('Explicitly initializing Calendar API');

            if (!window.gapi || !window.gapi.client) {
                console.error('GAPI client not available');
                return { success: false, error: 'GAPI client not available' };
            }

            // Load the Calendar API specifically
            await new Promise((resolve, reject) => {
                window.gapi.client.load('calendar', 'v3', () => {
                    console.log('Calendar API loaded successfully');
                    resolve();
                });
            });

            console.log('Calendar API initialization complete, checking status:',
                !!window.gapi.client.calendar);

            // Set token in GAPI client if available
            const token = localStorage.getItem('googleToken');
            if (token && window.gapi.client) {
                window.gapi.client.setToken({ access_token: token });
                console.log('Set existing token in GAPI client');
            }

            return {
                success: !!window.gapi.client.calendar,
                error: null
            };
        } catch (error) {
            console.error('Error initializing Calendar API:', error);
            return { success: false, error };
        }
    },

    // Check if calendar is available and accessible
    checkCalendarAccess: async () => {
        try {
            const token = localStorage.getItem('googleToken');
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

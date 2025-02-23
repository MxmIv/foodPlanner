// google-api.js
import { google } from 'googleapis';

export const getGoogleCalendarEvents = async (auth) => {
    try {
        const calendar = google.calendar({ version: 'v3', auth });

        // Get start and end of current week
        const now = new Date();
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay() + (now.getDay() === 0 ? -6 : 1));
        startOfWeek.setHours(0, 0, 0, 0);

        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        endOfWeek.setHours(23, 59, 59, 999);

        const response = await calendar.events.list({
            calendarId: 'primary',
            timeMin: startOfWeek.toISOString(),
            timeMax: endOfWeek.toISOString(),
            singleEvents: true,
            orderBy: 'startTime',
        });

        return response.data.items;
    } catch (error) {
        console.error('Error fetching calendar events:', error);
        return [];
    }
};

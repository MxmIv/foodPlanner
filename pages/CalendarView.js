import React, { useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import { googleApi } from './google-api';

const CalendarView = () => {
    const [events, setEvents] = useState([]);

    useEffect(() => {
        const fetchEvents = async () => {
            try {
                const upcomingEvents = await googleApi.listUpcomingEvents();
                // Map events to FullCalendar's expected format.
                const fcEvents = upcomingEvents.map((event) => ({
                    id: event.id,
                    title: event.summary,
                    start: event.start.dateTime || event.start.date,
                    end: event.end.dateTime || event.end.date,
                }));
                setEvents(fcEvents);
            } catch (error) {
                console.error("Error fetching calendar events:", error);
            }
        };

        fetchEvents();
    }, []);

    return (
        <div style={{ marginTop: '2rem' }}>
            <h2>My Google Calendar</h2>
            <FullCalendar
                plugins={[dayGridPlugin]}
                initialView="dayGridMonth"
                events={events}
                height="auto"
            />
        </div>
    );
};

export default CalendarView;

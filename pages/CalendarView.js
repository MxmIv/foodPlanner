// CalendarView.js
import React, { useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import { googleApi } from '@components/google-api';

const CalendarView = ({ isSignedIn, calendarRefreshCounter }) => {
    const [events, setEvents] = useState([]);

    useEffect(() => {
        const fetchEvents = async () => {
            console.log("fetchEvents called. isSignedIn:", isSignedIn, "Refresh counter:", calendarRefreshCounter);
            if (!isSignedIn) {
                console.log("User is not signed in. Skipping event fetch.");
                return;
            }
            try {
                const upcomingEvents = await googleApi.listUpcomingEvents();
                console.log("Fetched upcoming events from API:", upcomingEvents);
                const fcEvents = upcomingEvents.map((event) => ({
                    id: event.id,
                    title: event.summary,
                    start: event.start.dateTime || event.start.date,
                    end: event.end.dateTime || event.end.date,
                    allDay: !!(event.start.date && !event.start.dateTime)
                }));
                console.log("Mapped FullCalendar events:", fcEvents);
                setEvents(fcEvents);
            } catch (error) {
                console.error("Error fetching calendar events:", error);
            }
        };

        fetchEvents();
    }, [isSignedIn, calendarRefreshCounter]);

    return (
        <div style={{ marginTop: '2rem', width: '100%' }}>
            <h2>My Google Calendar</h2>
            <FullCalendar
                plugins={[dayGridPlugin]}
                headerToolbar={{
                    left: 'prev,next today',
                    center: 'title',
                    right: '' // No view switching controls needed
                }}
                initialView="dayGridWeek"
                events={events}
                height="800px"
            />
            {/* Global CSS for event box styling */}
            <style jsx global>{`
        .fc .fc-daygrid-event {
          font-size: 1.2em;
          padding: 10px;
          min-height: 60px;
          line-height: 1.2;
        }
        .fc .fc-daygrid-event .fc-event-title {
          white-space: normal !important;
          overflow: visible !important;
          text-overflow: unset !important;
        }
      `}</style>
        </div>
    );
};

export default CalendarView;

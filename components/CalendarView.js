import React, { useState, useEffect } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import { googleApi } from "./google-api"; // ✅ Ensure correct import

const CalendarView = ({ isSignedIn, mealEntries }) => {
    const [googleEvents, setGoogleEvents] = useState([]);
    const [gapiLoaded, setGapiLoaded] = useState(false);

    useEffect(() => {
        const fetchEvents = async () => {
            try {
                if (!window.gapi) {
                    console.warn("Google API not yet loaded. Retrying in 1 second...");
                    setTimeout(fetchEvents, 1000); // Retry after 1 second
                    return;
                }

                setGapiLoaded(true); // ✅ Mark gapi as loaded

                console.log("Fetching Google Calendar events...");
                const events = await googleApi.listUpcomingEvents();
                console.log("Loaded Google Events:", events);

                // ✅ Format Google Events to display in the calendar
                const formattedEvents = events.map((event) => ({
                    id: event.id,
                    title: `🔔 ${event.summary}`,
                    start: event.start.dateTime || event.start.date,
                    end: event.end.dateTime || event.end.date,
                    allDay: true,
                }));

                setGoogleEvents(formattedEvents);
            } catch (error) {
                console.error("Error loading Google Calendar events:", error);
            }
        };

        if (isSignedIn) {
            fetchEvents();
        }
    }, [isSignedIn]);

    return (
        <div>
            <FullCalendar
                plugins={[dayGridPlugin]}
                headerToolbar={{ left: "prev,next today", center: "title", right: "" }}
                initialView="dayGridWeek"
                events={[
                    ...googleEvents,
                    ...Object.keys(mealEntries).map((date) => ({
                        id: `lunch-${date}`,
                        title: `🍽 Lunch: ${mealEntries[date]?.lunch || "No meal planned"}`,
                        start: date,
                        allDay: true,
                    })),
                    ...Object.keys(mealEntries).map((date) => ({
                        id: `dinner-${date}`,
                        title: `🍽 Dinner: ${mealEntries[date]?.dinner || "No meal planned"}`,
                        start: date,
                        allDay: true,
                    })),
                ]}
                height="800px"
            />
        </div>
    );
};

export default CalendarView;

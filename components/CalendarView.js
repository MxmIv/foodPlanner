import React, { useState, useEffect } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import { googleApi } from "./google-api";

const CalendarView = ({ isSignedIn, mealEntries }) => {
    const [googleEvents, setGoogleEvents] = useState([]);

    useEffect(() => {
        if (isSignedIn) {
            googleApi.listUpcomingEvents().then((events) => {
                const formattedEvents = events.map((event) => ({
                    id: event.id,
                    title: `🔔 ${event.summary}`,
                    start: event.start.dateTime || event.start.date,
                    end: event.end.dateTime || event.end.date,
                    allDay: true,
                }));
                setGoogleEvents(formattedEvents);
            });
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

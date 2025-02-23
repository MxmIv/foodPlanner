import React, { useState } from "react";
import GoogleSignIn from "../components/GoogleSignIn";
import CalendarView from "../components/CalendarView";
import MealEntryPanel from "../components/MealEntryPanel";

export default function Home() {
    const [isSignedIn, setIsSignedIn] = useState(false);
    const [mealEntries, setMealEntries] = useState({});

    return (
        <div style={{ display: "flex", gap: "2rem", padding: "2rem" }}>
            <div style={{ flex: "1", minWidth: "300px" }}>
                <GoogleSignIn setIsSignedIn={setIsSignedIn} />
                <MealEntryPanel onMealChange={setMealEntries} />
            </div>
            <div style={{ flex: "2", minWidth: "600px" }}>
                <CalendarView isSignedIn={isSignedIn} mealEntries={mealEntries} />
            </div>
        </div>
    );
}

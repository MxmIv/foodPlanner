import React, { useState, useEffect } from "react";

const MealEntryPanel = ({ onMealChange, userId }) => {
    const [mealEntries, setMealEntries] = useState({});

    // ✅ Load meals from localStorage when user logs in
    useEffect(() => {
        if (userId) {
            const savedMeals = localStorage.getItem(`meals_${userId}`);
            if (savedMeals) {
                const parsedMeals = JSON.parse(savedMeals);
                setMealEntries(parsedMeals);
                onMealChange(parsedMeals);
            }
        }
    }, [userId]);

    // ✅ Save meals to localStorage when user enters a meal
    const handleInputChange = (date, mealType, value) => {
        const updatedMeals = {
            ...mealEntries,
            [date]: { ...mealEntries[date], [mealType]: value },
        };
        setMealEntries(updatedMeals);
        onMealChange(updatedMeals);

        if (userId) {
            localStorage.setItem(`meals_${userId}`, JSON.stringify(updatedMeals));
        }
    };

    return (
        <div style={{ width: "100%" }}>
            <h3>Plan Your Meals</h3>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                <tr>
                    <th>Date</th>
                    <th>Lunch</th>
                    <th>Dinner</th>
                </tr>
                </thead>
                <tbody>
                {[...Array(7)].map((_, index) => {
                    const today = new Date();
                    const date = new Date(today);
                    date.setDate(today.getDate() + index);
                    const formattedDate = date.toISOString().split("T")[0];

                    return (
                        <tr key={formattedDate}>
                            <td>{date.toLocaleDateString("en-GB")}</td>
                            <td>
                                <input
                                    type="text"
                                    placeholder="Enter lunch"
                                    value={mealEntries[formattedDate]?.lunch || ""}
                                    onChange={(e) =>
                                        handleInputChange(formattedDate, "lunch", e.target.value)
                                    }
                                />
                            </td>
                            <td>
                                <input
                                    type="text"
                                    placeholder="Enter dinner"
                                    value={mealEntries[formattedDate]?.dinner || ""}
                                    onChange={(e) =>
                                        handleInputChange(formattedDate, "dinner", e.target.value)
                                    }
                                />
                            </td>
                        </tr>
                    );
                })}
                </tbody>
            </table>
        </div>
    );
};

export default MealEntryPanel;

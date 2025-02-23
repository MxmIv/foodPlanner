import React, { useState } from "react";

const MealEntryPanel = ({ onMealChange }) => {
    const [mealEntries, setMealEntries] = useState({});

    const handleInputChange = (date, mealType, value) => {
        const updatedMeals = {
            ...mealEntries,
            [date]: { ...mealEntries[date], [mealType]: value },
        };
        setMealEntries(updatedMeals);
        onMealChange(updatedMeals);
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
                                    value={mealEntries[formattedDate]?.lunch || ""}
                                    onChange={(e) =>
                                        handleInputChange(formattedDate, "lunch", e.target.value)
                                    }
                                />
                            </td>
                            <td>
                                <input
                                    type="text"
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

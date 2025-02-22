// components/MealPlanner.js
import { useState, useEffect } from 'react';

const MealPlanner = () => {
    const [meal, setMeal] = useState('');
    const [mealEntries, setMealEntries] = useState([]);

    // Load saved entries from local storage when the component mounts
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const storedMeals = localStorage.getItem('mealEntries');
            if (storedMeals) {
                setMealEntries(JSON.parse(storedMeals));
            }
        }
    }, []);

    // Save the updated list to local storage whenever mealEntries changes
    useEffect(() => {
        if (typeof window !== 'undefined') {
            localStorage.setItem('mealEntries', JSON.stringify(mealEntries));
        }
    }, [mealEntries]);

    // Handle the form submission
    const handleSubmit = (e) => {
        e.preventDefault();
        if (meal.trim() === '') return;
        setMealEntries([...mealEntries, meal]);
        setMeal('');
    };

    return (
        <div style={{ marginTop: '2rem' }}>
            <h2>Meal Planner</h2>
            <form onSubmit={handleSubmit}>
                <input
                    type="text"
                    placeholder="Enter full dish name"
                    value={meal}
                    onChange={(e) => setMeal(e.target.value)}
                    style={{ padding: '0.5rem', marginRight: '0.5rem' }}
                />
                <button type="submit" style={{ padding: '0.5rem 1rem' }}>
                    Add Meal
                </button>
            </form>
            {mealEntries.length > 0 && (
                <>
                    <h3 style={{ marginTop: '1rem' }}>Meal Entries:</h3>
                    <ul>
                        {mealEntries.map((entry, index) => (
                            <li key={index}>{entry}</li>
                        ))}
                    </ul>
                </>
            )}
        </div>
    );
};

export default MealPlanner;

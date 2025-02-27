// components/MealSuggestions.js
"use client";

import React, { useState, useEffect } from 'react';
import { BookOpen, Plus, Coffee, Moon } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { mealService } from '../services/mealService';
import { useMeals } from '../contexts/MealContext';

const MealSuggestions = () => {
    const { userId, isAuthenticated } = useAuth();
    const { updateMeal } = useMeals();
    const [frequentMeals, setFrequentMeals] = useState({
        lunch: [],
        dinner: []
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (userId && isAuthenticated) {
            loadFrequentMeals();
        }
    }, [userId, isAuthenticated]);

    const loadFrequentMeals = async () => {
        try {
            setIsLoading(true);
            setError(null);

            // Get frequent lunch meals
            const { data: lunchData, error: lunchError } = await mealService.getFrequentMeals(userId, 'lunch', 10);
            if (lunchError) throw lunchError;

            // Get frequent dinner meals
            const { data: dinnerData, error: dinnerError } = await mealService.getFrequentMeals(userId, 'dinner', 10);
            if (dinnerError) throw dinnerError;

            setFrequentMeals({
                lunch: lunchData || [],
                dinner: dinnerData || []
            });
        } catch (err) {
            console.error('Error loading frequent meals:', err);
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    // Handle adding a meal to the current planner
    const handleAddMeal = (mealType, mealName, dayIndex) => {
        updateMeal(mealType, dayIndex, mealName);
    };

    // Prevent rendering if not authenticated
    if (!userId || !isAuthenticated) return null;

    return (
        <div className="card mb-8" id="meal-suggestions">
            <div className="bg-primary text-white p-4 flex items-center gap-3">
                <BookOpen className="h-6 w-6" />
                <h3 className="text-xl font-bold">Quick Add Frequent Meals</h3>
            </div>

            <div className="card-body">
                {isLoading ? (
                    <div className="text-center text-gray-500 py-4">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
                        <p className="mt-2">Loading suggestions...</p>
                    </div>
                ) : error ? (
                    <div className="bg-red-50 text-red-600 p-3 rounded-md">
                        Error loading meal suggestions: {error}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Lunch Suggestions */}
                        <div>
                            <div className="flex items-center gap-2 mb-4 pb-2 border-b border-neutral-medium">
                                <Coffee className="h-5 w-5 text-primary" />
                                <h4 className="text-lg font-semibold text-primary">Frequent Lunches</h4>
                            </div>

                            {frequentMeals.lunch.length === 0 ? (
                                <p className="text-center text-neutral-dark py-4">No frequent lunches found</p>
                            ) : (
                                <div className="grid gap-2">
                                    {frequentMeals.lunch.map((item, index) => (
                                        <div
                                            key={index}
                                            className="flex items-center justify-between p-3 bg-neutral-light rounded-lg hover:bg-neutral-medium transition-colors"
                                        >
                                            <span className="font-medium">{item.meal_name}</span>
                                            <div className="flex items-center text-sm">
                                                <span className="text-neutral-dark mr-2">({item.count} times)</span>
                                                <button
                                                    onClick={() => {
                                                        const today = new Date().getDay() - 1; // 0-6 (Sun-Sat) to 0-6 (Mon-Sun)
                                                        const dayIndex = today < 0 ? 6 : today; // Handle Sunday
                                                        handleAddMeal('lunch', item.meal_name, dayIndex);
                                                    }}
                                                    className="btn-primary p-1 rounded-full"
                                                    title="Add to today's lunch"
                                                >
                                                    <Plus className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Dinner Suggestions */}
                        <div>
                            <div className="flex items-center gap-2 mb-4 pb-2 border-b border-neutral-medium">
                                <Moon className="h-5 w-5 text-primary" />
                                <h4 className="text-lg font-semibold text-primary">Frequent Dinners</h4>
                            </div>

                            {frequentMeals.dinner.length === 0 ? (
                                <p className="text-center text-neutral-dark py-4">No frequent dinners found</p>
                            ) : (
                                <div className="grid gap-2">
                                    {frequentMeals.dinner.map((item, index) => (
                                        <div
                                            key={index}
                                            className="flex items-center justify-between p-3 bg-neutral-light rounded-lg hover:bg-neutral-medium transition-colors"
                                        >
                                            <span className="font-medium">{item.meal_name}</span>
                                            <div className="flex items-center text-sm">
                                                <span className="text-neutral-dark mr-2">({item.count} times)</span>
                                                <button
                                                    onClick={() => {
                                                        const today = new Date().getDay() - 1; // 0-6 (Sun-Sat) to 0-6 (Mon-Sun)
                                                        const dayIndex = today < 0 ? 6 : today; // Handle Sunday
                                                        handleAddMeal('dinner', item.meal_name, dayIndex);
                                                    }}
                                                    className="btn-primary p-1 rounded-full"
                                                    title="Add to today's dinner"
                                                >
                                                    <Plus className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MealSuggestions;

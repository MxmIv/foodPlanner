// components/MealHistory.js
"use client";

import React, { useState, useEffect } from 'react';
import { History, Utensils, Moon, Search, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { mealService } from '../services/mealService';

const MealHistory = () => {
    const { userId, isAuthenticated } = useAuth();
    const [mealHistory, setMealHistory] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState('all'); // 'all', 'lunch', or 'dinner'

    useEffect(() => {
        if (userId && isAuthenticated) {
            loadMealHistory();
        }
    }, [userId, isAuthenticated]);

    const loadMealHistory = async () => {
        try {
            setIsLoading(true);
            setError(null);

            // Get lunch history
            const { data: lunchData, error: lunchError } = await mealService.getMealHistory(userId, 'lunch', 50);
            if (lunchError) throw lunchError;

            // Get dinner history
            const { data: dinnerData, error: dinnerError } = await mealService.getMealHistory(userId, 'dinner', 50);
            if (dinnerError) throw dinnerError;

            // Combine and format data
            const history = [];

            // Add lunch meals
            lunchData.forEach(meal => {
                history.push({
                    date: new Date(meal.meal_date),
                    meal: meal.meal_name,
                    type: 'lunch'
                });
            });

            // Add dinner meals
            dinnerData.forEach(meal => {
                history.push({
                    date: new Date(meal.meal_date),
                    meal: meal.meal_name,
                    type: 'dinner'
                });
            });

            // Sort by date, most recent first
            history.sort((a, b) => b.date - a.date);
            setMealHistory(history);
        } catch (err) {
            console.error('Error loading meal history:', err);
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    // Filter meals based on search term and active tab
    const filteredMeals = mealHistory.filter(item => {
        const matchesSearch = item.meal.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesTab = activeTab === 'all' || item.type === activeTab;
        return matchesSearch && matchesTab;
    });

    // Group meals by month
    const mealsByMonth = filteredMeals.reduce((acc, meal) => {
        const monthYear = meal.date.toLocaleDateString('en-US', {
            month: 'long',
            year: 'numeric'
        });

        if (!acc[monthYear]) {
            acc[monthYear] = [];
        }

        acc[monthYear].push(meal);
        return acc;
    }, {});

    // Prevent rendering if not authenticated
    if (!userId || !isAuthenticated) return null;

    return (
        <div className="card" id="meal-history">
            <div className="bg-primary text-white p-4 flex items-center gap-3">
                <History className="h-6 w-6" />
                <h3 className="text-xl font-bold">Meal History</h3>
            </div>

            <div className="card-body">
                {/* Search and Filter Controls */}
                <div className="flex flex-col md:flex-row gap-4 mb-6">
                    <div className="relative flex-grow">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="h-4 w-4 text-gray-400" />
                        </div>
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Search meals..."
                            className="pl-10 pr-10 py-2 border border-gray-300 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                        />
                        {searchTerm && (
                            <button
                                onClick={() => setSearchTerm('')}
                                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                            >
                                <X className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                            </button>
                        )}
                    </div>

                    <div className="flex rounded-md shadow-sm">
                        <button
                            onClick={() => setActiveTab('all')}
                            className={`px-4 py-2 text-sm font-medium border border-gray-300 rounded-l-md ${
                                activeTab === 'all'
                                    ? 'bg-primary text-white border-primary'
                                    : 'bg-white text-gray-700 hover:bg-gray-50'
                            }`}
                        >
                            All Meals
                        </button>
                        <button
                            onClick={() => setActiveTab('lunch')}
                            className={`px-4 py-2 text-sm font-medium border-t border-b border-r border-gray-300 ${
                                activeTab === 'lunch'
                                    ? 'bg-green-600 text-white border-green-600'
                                    : 'bg-white text-gray-700 hover:bg-gray-50'
                            }`}
                        >
                            <div className="flex items-center gap-1">
                                <Utensils className="h-3 w-3" />
                                <span>Lunch</span>
                            </div>
                        </button>
                        <button
                            onClick={() => setActiveTab('dinner')}
                            className={`px-4 py-2 text-sm font-medium border-t border-b border-r border-gray-300 rounded-r-md ${
                                activeTab === 'dinner'
                                    ? 'bg-indigo-600 text-white border-indigo-600'
                                    : 'bg-white text-gray-700 hover:bg-gray-50'
                            }`}
                        >
                            <div className="flex items-center gap-1">
                                <Moon className="h-3 w-3" />
                                <span>Dinner</span>
                            </div>
                        </button>
                    </div>
                </div>

                {/* Content Area */}
                {isLoading ? (
                    <div className="text-center text-gray-500 py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                        <p className="mt-2">Loading meal history...</p>
                    </div>
                ) : filteredMeals.length === 0 ? (
                    <div className="text-center text-gray-500 py-8">
                        {searchTerm
                            ? `No meals matching "${searchTerm}"`
                            : "No meal history available"}
                    </div>
                ) : (
                    <div className="space-y-6">
                        {Object.entries(mealsByMonth).map(([monthYear, meals]) => (
                            <div key={monthYear} className="border rounded-lg overflow-hidden">
                                <div className="bg-gray-100 px-4 py-2 font-medium text-gray-700">
                                    {monthYear}
                                </div>
                                <div className="divide-y divide-gray-200">
                                    {meals.map((item, index) => (
                                        <div
                                            key={`${item.date.toISOString()}-${item.type}-${index}`}
                                            className="flex flex-col sm:flex-row sm:items-center px-4 py-3 hover:bg-gray-50"
                                        >
                                            <div className="flex items-center mb-2 sm:mb-0 sm:w-1/3">
                                                <div className="w-24 text-gray-500 text-sm mr-2">
                                                    {item.date.toLocaleDateString('en-US', {
                                                        weekday: 'short',
                                                        month: 'short',
                                                        day: 'numeric'
                                                    })}
                                                </div>
                                                <div
                                                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                        item.type === 'lunch'
                                                            ? 'bg-green-100 text-green-800'
                                                            : 'bg-indigo-100 text-indigo-800'
                                                    }`}
                                                >
                                                    {item.type === 'lunch' ? 'Lunch' : 'Dinner'}
                                                </div>
                                            </div>
                                            <div className="sm:w-2/3 font-medium">
                                                {item.meal}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {error && (
                    <div className="mt-4 bg-red-50 text-red-600 p-3 rounded-md">
                        Error loading meal history: {error}
                    </div>
                )}
            </div>
        </div>
    );
};

export default MealHistory;

// services/mealService.js
import { supabaseService } from './supabaseService';

const supabase = supabaseService.getClient();

export const mealService = {
    // Get meals for a specific week
    getMealsForWeek: async (userId, startDate, endDate) => {
        try {
            console.log(`Getting meals for ${userId} from ${startDate} to ${endDate}`);
            const { data, error } = await supabase
                .from('meal_plans')
                .select('*')
                .eq('user_id', userId)
                .gte('meal_date', startDate)
                .lte('meal_date', endDate)
                .order('meal_date', { ascending: true });

            if (error) throw error;
            return { data, error: null };
        } catch (error) {
            console.error('Error getting meals for week:', error);
            return { data: [], error };
        }
    },

    // Get meal history for a specific meal type
    getMealHistory: async (userId, mealType, limit = 10) => {
        try {
            const { data, error } = await supabase
                .from('meal_plans')
                .select('*')
                .eq('user_id', userId)
                .eq('meal_type', mealType)
                .order('meal_date', { ascending: false })
                .limit(limit);

            if (error) throw error;
            return { data, error: null };
        } catch (error) {
            console.error('Error getting meal history:', error);
            return { data: [], error };
        }
    },

    // Get most frequent meals - modified to use a custom SQL query
    getFrequentMeals: async (userId, mealType, limit = 5) => {
        try {
            // Alternative approach without using .group()
            const { data, error } = await supabase
                .from('meal_plans')
                .select('meal_name, meal_type')
                .eq('user_id', userId)
                .eq('meal_type', mealType);

            if (error) throw error;

            // Calculate frequencies manually
            const mealCounts = data.reduce((acc, meal) => {
                const mealName = meal.meal_name;
                if (!acc[mealName]) {
                    acc[mealName] = 0;
                }
                acc[mealName]++;
                return acc;
            }, {});

            // Convert to array and sort
            const frequentMeals = Object.entries(mealCounts).map(([meal_name, count]) => ({
                meal_name,
                count
            })).sort((a, b) => b.count - a.count).slice(0, limit);

            return { data: frequentMeals, error: null };
        } catch (error) {
            console.error('Error getting frequent meals:', error);
            return { data: [], error };
        }
    },

    // Update meals for a week (delete existing and insert new)
    updateMealsForWeek: async (userId, startDate, endDate, mealRecords) => {
        try {
            // Start a transaction
            const { error: deleteError } = await supabase
                .from('meal_plans')
                .delete()
                .eq('user_id', userId)
                .gte('meal_date', startDate)
                .lte('meal_date', endDate);

            if (deleteError) throw deleteError;

            // Only insert if there are records to insert
            if (mealRecords.length > 0) {
                const { error: insertError } = await supabase
                    .from('meal_plans')
                    .insert(mealRecords);

                if (insertError) throw insertError;
            }

            return { error: null };
        } catch (error) {
            console.error('Error updating meals for week:', error);
            return { error };
        }
    },

    // Get meals for a specific date
    getMealsForDate: async (userId, date) => {
        try {
            const { data, error } = await supabase
                .from('meal_plans')
                .select('*')
                .eq('user_id', userId)
                .eq('meal_date', date);

            if (error) throw error;
            return { data, error: null };
        } catch (error) {
            console.error('Error getting meals for date:', error);
            return { data: [], error };
        }
    }
};

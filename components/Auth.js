// components/Auth.js
"use client";

import { useState, useEffect } from 'react';
import { LogIn, LogOut } from 'lucide-react';

const Auth = ({ onAuthChange }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [userEmail, setUserEmail] = useState('');

    useEffect(() => {
        // Check if user was previously logged in
        const savedEmail = localStorage.getItem('userEmail');
        const savedUserId = localStorage.getItem('userId');
        if (savedEmail && savedUserId) {
            setIsAuthenticated(true);
            setUserEmail(savedEmail);
            onAuthChange({
                isAuthenticated: true,
                userId: savedUserId,
                email: savedEmail
            });
        }

        // Load Google API
        const script = document.createElement('script');
        script.src = "https://apis.google.com/js/api.js";
        script.onload = () => {
            window.gapi.load('client:auth2', initClient);
        };
        document.body.appendChild(script);
    }, []);

    const initClient = () => {
        window.gapi.client.init({
            clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
            scope: 'email profile https://www.googleapis.com/auth/calendar.readonly',
            plugin_name: 'meal_planner'
        }).then(() => {
            // Check if already signed in
            if (window.gapi.auth2.getAuthInstance().isSignedIn.get()) {
                handleAuthSuccess(window.gapi.auth2.getAuthInstance().currentUser.get());
            }
        }).catch(error => {
            console.error('Error initializing Google API client:', error);
        });
    };

    const handleAuthSuccess = (googleUser) => {
        const profile = googleUser.getBasicProfile();
        const userId = profile.getId();
        const email = profile.getEmail();

        setIsAuthenticated(true);
        setUserEmail(email);
        onAuthChange({
            isAuthenticated: true,
            userId: userId,
            email: email
        });

        localStorage.setItem('userId', userId);
        localStorage.setItem('userEmail', email);
    };

    const handleLogin = async () => {
        try {
            if (window.gapi && window.gapi.auth2) {
                const googleAuth = window.gapi.auth2.getAuthInstance();
                const googleUser = await googleAuth.signIn();
                handleAuthSuccess(googleUser);
            } else {
                console.error('Google API not loaded');
            }
        } catch (error) {
            console.error('Login failed:', error);
        }
    };

    const handleLogout = async () => {
        try {
            if (window.gapi && window.gapi.auth2) {
                await window.gapi.auth2.getAuthInstance().signOut();
            }

            setIsAuthenticated(false);
            setUserEmail('');
            onAuthChange({ isAuthenticated: false, userId: null, email: null });

            localStorage.removeItem('userId');
            localStorage.removeItem('userEmail');
        } catch (error) {
            console.error('Logout failed:', error);
        }
    };

    return (
        <div className="flex items-center gap-4">
            {!isAuthenticated ? (
                <button
                    onClick={handleLogin}
                    className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                >
                    <LogIn className="h-4 w-4" />
                    Login with Google
                </button>
            ) : (
                <div className="flex items-center gap-4">
                    <span className="text-gray-600">{userEmail}</span>
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
                    >
                        <LogOut className="h-4 w-4" />
                        Logout
                    </button>
                </div>
            )}
        </div>
    );
};

export default Auth;

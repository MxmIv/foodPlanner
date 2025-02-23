import React, { useState, useEffect } from "react";
import { googleApi } from "./google-api";

const GoogleSignIn = ({ setIsSignedIn, setUserId }) => {
    const [userInfo, setUserInfo] = useState(null);
    const [gapiLoaded, setGapiLoaded] = useState(false);

    useEffect(() => {
        const checkStoredSession = async () => {
            if (!window.gapi) {
                console.warn("Google API not yet loaded. Retrying in 1 second...");
                setTimeout(checkStoredSession, 1000);
                return;
            }

            setGapiLoaded(true); // ✅ gapi is now available

            const storedToken = localStorage.getItem("googleAuthToken");
            if (storedToken) {
                try {
                    await googleApi.initGapi();
                    window.gapi.client.setToken(JSON.parse(storedToken)); // ✅ Restore Token
                    setIsSignedIn(true);

                    // ✅ Fetch user info & restore session
                    const info = await googleApi.getUserInfo();
                    if (info) {
                        setUserInfo(info);
                        setUserId(info.sub);
                    }
                } catch (error) {
                    console.error("Auto login failed:", error);
                }
            }
        };

        // ✅ Ensure gapi is fully loaded before checking session
        if (window.gapi) {
            checkStoredSession();
        } else {
            window.addEventListener("gapiLoaded", checkStoredSession);
        }
    }, []);

    const handleSignIn = async () => {
        try {
            if (!gapiLoaded) {
                console.warn("Attempted login before gapi was loaded.");
                return;
            }

            await googleApi.handleAuthClick();
            setIsSignedIn(true);

            // ✅ Get user info & store session
            const info = await googleApi.getUserInfo();
            if (info) {
                setUserInfo(info);
                setUserId(info.sub);
                localStorage.setItem("googleAuthToken", JSON.stringify(window.gapi.client.getToken())); // ✅ Store token
            }
        } catch (error) {
            console.error("Sign-in error:", error);
        }
    };

    const handleSignOut = () => {
        googleApi.handleSignoutClick();
        setIsSignedIn(false);
        setUserInfo(null);
        setUserId(null);
        localStorage.removeItem("googleAuthToken"); // ✅ Clear token on logout
    };

    return (
        <div style={{ marginBottom: "1rem" }}>
            {userInfo ? (
                <>
                    <p>Signed in as: <strong>{userInfo.name}</strong></p>
                    <button onClick={handleSignOut}>Sign Out</button>
                </>
            ) : (
                <button onClick={handleSignIn} disabled={!gapiLoaded}>Sign In with Google</button>
            )}
        </div>
    );
};

export default GoogleSignIn;

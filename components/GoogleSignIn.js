import React, { useState, useEffect } from "react";
import { googleApi } from "./google-api";

const GoogleSignIn = ({ setIsSignedIn }) => {
    const [userInfo, setUserInfo] = useState(null);

    useEffect(() => {
        googleApi.initGapi().then(() => {
            if (window.gapi?.client?.getToken()) {
                setIsSignedIn(true);
                googleApi.getUserInfo().then(setUserInfo);
            }
        }).catch(error => {
            console.error("Google API init error:", error);
        });
    }, []);

    const handleSignIn = async () => {
        try {
            await googleApi.handleAuthClick();
            setIsSignedIn(true);
            const info = await googleApi.getUserInfo();
            setUserInfo(info);
        } catch (error) {
            console.error("Sign-in error:", error);
        }
    };

    const handleSignOut = () => {
        googleApi.handleSignoutClick();
        setIsSignedIn(false);
        setUserInfo(null);
    };

    return (
        <div style={{ marginBottom: "1rem" }}>
            {userInfo ? (
                <>
                    <p>Signed in as: <strong>{userInfo.name}</strong></p>
                    <button onClick={handleSignOut}>Sign Out</button>
                </>
            ) : (
                <button onClick={handleSignIn}>Sign In with Google</button>
            )}
        </div>
    );
};

export default GoogleSignIn;

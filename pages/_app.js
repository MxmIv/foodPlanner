// _app.js
import '@styles/globals.css';
import Script from 'next/script';

function MyApp({ Component, pageProps }) {
    return (
        <>
            <Script
                src="https://apis.google.com/js/api.js"
                strategy="lazyOnload"
                onLoad={() => {
                    console.log("gapi script loaded successfully");
                }}
                onError={(e) => {
                    console.error("Error loading gapi script:", e);
                }}
            />
            <Script
                src="https://accounts.google.com/gsi/client"
                strategy="lazyOnload"
                onLoad={() => {
                    console.log("Google Identity Services client loaded");
                    if (typeof window !== 'undefined') {
                        try {
                            window.google.accounts.oauth2.initTokenClient({
                                client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID, // from .env.local
                                scope:
                                    'https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/userinfo.profile',
                                callback: '', // Callback will be provided when calling handleAuthClick
                            });
                        } catch (error) {
                            console.error("Error initializing token client:", error);
                        }
                    }
                }}
                onError={(e) => {
                    console.error("Error loading GSI client script:", e);
                }}
            />
            <Component {...pageProps} />
        </>
    );
}

export default MyApp;

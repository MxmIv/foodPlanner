const DISCOVERY_DOCS = [
    "https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest",
];

const googleApi = {
    initGapi: () => {
        return new Promise((resolve, reject) => {
            if (!window.gapi) {
                reject("Google API not loaded.");
                return;
            }

            window.gapi.load("client", async () => {
                try {
                    await window.gapi.client.init({
                        apiKey: process.env.NEXT_PUBLIC_GOOGLE_API_KEY,
                        discoveryDocs: DISCOVERY_DOCS,
                    });
                    resolve();
                } catch (error) {
                    reject(error);
                }
            });
        });
    },

    handleAuthClick: async () => {
        try {
            if (!window.gapi?.client) await googleApi.initGapi();
            return new Promise((resolve, reject) => {
                const tokenClient = window.google.accounts.oauth2.initTokenClient({
                    client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
                    scope: "https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/userinfo.profile",
                    callback: (resp) => (resp.error ? reject(resp) : resolve(resp)),
                });
                tokenClient.requestAccessToken({ prompt: "consent" });
            });
        } catch (error) {
            throw error;
        }
    },

    handleSignoutClick: () => {
        if (window.gapi?.client.getToken()) {
            window.google.accounts.oauth2.revoke(window.gapi.client.getToken().access_token);
            window.gapi.client.setToken(null);
        }
    },

    listUpcomingEvents: async () => {
        if (!window.gapi?.client?.calendar) await googleApi.initGapi();
        try {
            const response = await window.gapi.client.calendar.events.list({
                calendarId: "primary",
                timeMin: new Date().toISOString(),
                showDeleted: false,
                singleEvents: true,
                maxResults: 50,
                orderBy: "startTime",
            });
            return response.result.items;
        } catch (error) {
            return [];
        }
    },

    getUserInfo: async () => {
        if (!window.gapi || !window.gapi.client.getToken()) {
            console.warn("gapi client not ready or no token available");
            return null;
        }

        const token = window.gapi.client.getToken().access_token;
        try {
            const response = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
                headers: { Authorization: `Bearer ${token}` },
            });
            return await response.json();
        } catch (error) {
            console.error("Error fetching user info:", error);
            return null;
        }
    },
};

export { googleApi };

import { useState, useEffect } from 'react';

const SCOPES = 'https://www.googleapis.com/auth/drive.file';

export default function useDrivePicker({ clientId, developerKey, apiKey }) {
    const [isApiLoaded, setIsApiLoaded] = useState(false);
    const [pickerApiLoaded, setPickerApiLoaded] = useState(false);
    const [gisLoaded, setGisLoaded] = useState(false);
    const [tokenClient, setTokenClient] = useState(null);

    // Load scripts
    useEffect(() => {
        const checkScripts = () => {
            if (window.gapi) {
                if (!window.gapi.client) {
                    window.gapi.load('client:picker', () => {
                        setPickerApiLoaded(true);
                    });
                } else {
                    window.gapi.load('picker', () => {
                        setPickerApiLoaded(true);
                    });
                }
            }
            if (window.google?.accounts?.oauth2) {
                setGisLoaded(true);
            }
        };

        const interval = setInterval(checkScripts, 500);
        return () => clearInterval(interval);
    }, []);

    // Init Token Client
    useEffect(() => {
        if (gisLoaded && clientId) {
            try {
                const client = window.google.accounts.oauth2.initTokenClient({
                    client_id: clientId,
                    scope: SCOPES,
                    callback: '', // defined at request time
                });
                setTokenClient(client);
            } catch (e) {
                console.error("Error initializing token client:", e);
            }
        }
    }, [gisLoaded, clientId]);

    const createPicker = (oauthToken, callback) => {
        if (pickerApiLoaded && oauthToken) {
            const picker = new window.google.picker.PickerBuilder()
                .addView(window.google.picker.ViewId.DOCS)
                .setOAuthToken(oauthToken)
                .setDeveloperKey(developerKey || apiKey) // Drive Picker needs Developer Key (API Key)
                .setCallback(callback)
                .build();
            picker.setVisible(true);
        } else {
            console.error("Picker API not loaded or Token missing");
        }
    };

    const openPicker = (callback) => {
        if (!tokenClient) {
            console.error("Token client not initialized. Check internet or Client ID.");
            return;
        }

        tokenClient.callback = async (response) => {
            if (response.error !== undefined) {
                console.error("Auth error", response);
                throw (response);
            }
            createPicker(response.access_token, callback);
        };

        if (window.gapi.client && window.gapi.client.getToken() === null) {
            // Prompt the user to select a Google Account and ask for consent to share their data
            tokenClient.requestAccessToken({ prompt: 'consent' });
        } else {
            // Skip display of account chooser and consent dialog for an existing session.
            tokenClient.requestAccessToken({ prompt: '' });
        }
    };

    return { openPicker, isReady: pickerApiLoaded && gisLoaded };
}

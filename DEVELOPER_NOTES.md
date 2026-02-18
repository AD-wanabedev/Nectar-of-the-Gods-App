# Nectar of the Gods - Developer Notes & Guide

This document contains the key technical details, setup guides, and architectural explanations discussed during the development of the app. It serves as a permanent record of "How It Works".

## 1. The Technology Stack
**Where does everything live?**

*   **Code:** Stored on **GitHub**. This is the source of truth.
*   **Hosting:** The live website is hosted on **Vercel**. It updates automatically when you push to GitHub.
*   **Database:** **Firebase** (Firestore). It stores all Leads, Projects, and User data.
*   **Authentication:** **Firebase Auth**. Handles user logins.
*   **File Storage:** **Firebase Storage**. Stores uploaded images and PDFs.

## 2. Key Features Implementation

### Privacy & Device Management
-   **Device Tracking:** The app generates a unique random ID for every browser/device.
-   **Storage:** This ID is stored in your browser's `localStorage` and sent to Firebase.
-   **Security:** You can view active devices in `Settings`. Clicking "Block" sets a flag in Firebase that instantly logs that device out.

### Master Tracker Sync (Google Sheets)
-   **Strategy:** We use a Google Apps Script as a "Webhook".
-   **Flow:**
    1.  App saves lead to Firebase.
    2.  App sends a verified copy of that data to the Google Apps Script URL.
    3.  Script appends a row to your Google Sheet.
-   **Setup:**
    -   Script Code is preserved in `google_apps_script.js` (in artifacts).
    -   URL is saved in the App's `Settings` page.

## 3. Google Services Setup
To make Google Drive and Sheets work, we configured:
-   **Google Cloud Console:** Enabled Drive API and set "Redirect URIs" for authentication.
-   **Google Apps Script:** Deployed a Web App with access set to "Anyone" to allow the app to push data securely.

## 4. Troubleshooting

**"I can't see the Settings button on my phone!"**
-   **Cause:** Your phone is caching an old version of the app.
-   **Fix:** Close the app completely and reopen it 2-3 times, or reinstall it. PWA (Progressive Web Apps) update in the background.

**"Google Drive Error 400"**
-   **Cause:** The website URL (e.g., localhost or vercel.app) is not listed in Google Cloud Console.
-   **Fix:** Add the URI to "Authorized Javascript origins" and "Authorized redirect URIs" in the Cloud Console.

## 5. Git Branches (Main vs Master)
You might notice two branches: **`main`** and **`master`**.
*   **Why?** Use of `master` was the standard for years, but the industry shifted to `main`. Your project likely started with `master` but we switched to `main` for modern standards.
*   **Function:** Right now, they are **Identical Clones**.
*   **Workflow:** We work on `main`. Every time we finish a task, we also copy (merge) it to `master` just to be safe, ensuring that whichever one Vercel looks for, it finds the latest code.

---
*Generated from Developer Conversation on Feb 19, 2026*

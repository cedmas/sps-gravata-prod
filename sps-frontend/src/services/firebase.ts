import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { createUserWithEmailAndPassword, signOut } from "firebase/auth";
import { initializeApp as initializeAppSecondary, deleteApp } from "firebase/app";

// TODO: Replace with real config from user's .env file
const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "mock-key",
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "mock-project.firebaseapp.com",
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "mock-project",
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "mock-project.appspot.com",
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;

// Helper to create user without logging out the admin
export const registerUser = async (email: string, pass: string) => {
    const SECONDARY_APP_NAME = 'secondaryAppForRegistration';
    // Initialize a secondary app instance
    const secondaryApp = initializeAppSecondary(firebaseConfig, SECONDARY_APP_NAME);
    const secondaryAuth = getAuth(secondaryApp);

    try {
        const userCredential = await createUserWithEmailAndPassword(secondaryAuth, email, pass);
        // Immediately sign out from the secondary app just to be safe (though it shouldn't affect main)
        await signOut(secondaryAuth);
        return userCredential.user;
    } finally {
        // Clean up
        await deleteApp(secondaryApp);
    }
};

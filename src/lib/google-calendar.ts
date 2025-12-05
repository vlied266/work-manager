/**
 * Google Calendar Integration Utilities
 * 
 * Helper functions for Google Calendar integration
 */

import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth } from "@/lib/firebase";

/**
 * Request Google Calendar permissions by triggering a sign-in with calendar scope
 * This will show a popup if the user hasn't granted calendar permissions yet
 * Returns the access token needed for Google Calendar API calls
 */
export async function requestCalendarPermissions(): Promise<string | null> {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error("User is not authenticated");
    }

    const provider = new GoogleAuthProvider();
    provider.addScope('https://www.googleapis.com/auth/calendar.events');
    
    // Re-authenticate to get fresh token with calendar scope
    // This will show a popup if the user hasn't granted calendar permissions
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    
    if (!credential?.accessToken) {
      throw new Error("Failed to get access token from Google");
    }
    
    return credential.accessToken;
  } catch (error: any) {
    console.error("Error requesting calendar permissions:", error);
    if (error.code === 'auth/popup-closed-by-user') {
      throw new Error("Sign-in was cancelled. Please try again.");
    }
    if (error.code === 'auth/user-mismatch') {
      throw new Error("Please sign in with the same Google account.");
    }
    throw error;
  }
}

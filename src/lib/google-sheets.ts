/**
 * Google Sheets Integration Utilities
 * 
 * Helper functions for Google Sheets integration
 */

import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth } from "@/lib/firebase";

/**
 * Request Google Sheets permissions by triggering a sign-in with sheets scope
 * This will show a popup if the user hasn't granted sheets permissions yet
 * Returns the access token needed for Google Sheets API calls
 */
export async function requestSheetsPermissions(): Promise<string | null> {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error("User is not authenticated");
    }

    const provider = new GoogleAuthProvider();
    provider.addScope('https://www.googleapis.com/auth/spreadsheets.readonly');
    
    // Re-authenticate to get fresh token with sheets scope
    // This will show a popup if the user hasn't granted sheets permissions
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    
    if (!credential?.accessToken) {
      throw new Error("Failed to get access token from Google");
    }
    
    // Store access token in sessionStorage for later use
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('google_sheets_token', credential.accessToken);
    }
    
    return credential.accessToken;
  } catch (error: any) {
    console.error("Error requesting sheets permissions:", error);
    if (error.code === 'auth/popup-closed-by-user') {
      throw new Error("Sign-in was cancelled. Please try again.");
    }
    if (error.code === 'auth/user-mismatch') {
      throw new Error("Please sign in with the same Google account.");
    }
    throw error;
  }
}

/**
 * Get stored Google Sheets access token from sessionStorage
 */
export function getStoredSheetsToken(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }
  return sessionStorage.getItem('google_sheets_token');
}

/**
 * Extract spreadsheet ID from Google Sheets URL
 * Supports formats:
 * - https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit
 * - https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit#gid=0
 */
export function extractSpreadsheetId(url: string): string | null {
  const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  return match ? match[1] : null;
}


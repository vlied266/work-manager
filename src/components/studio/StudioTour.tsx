"use client";

import { useEffect, useRef, useCallback } from "react";
import { driver } from "driver.js";
import "driver.js/dist/driver.css";
import "./studio-tour.css";

const TOUR_STORAGE_KEY = "studio-tour-completed";

const safeHasCompletedTour = () => {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(TOUR_STORAGE_KEY) === "true";
  } catch {
    return false;
  }
};

const safeSetTourCompleted = () => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(TOUR_STORAGE_KEY, "true");
  } catch {
    // Ignore storage errors (e.g., Safari private mode) so the tour can still close
  }
};

export function useStudioTour(autoStart = false) {
  const driverObj = useRef<ReturnType<typeof driver> | null>(null);
  const skipCompletionRef = useRef(false);

  const startTour = useCallback(() => {
    // Destroy existing instance if any
    if (driverObj.current) {
      skipCompletionRef.current = true;
      driverObj.current.destroy();
      driverObj.current = null;
    }

    // Initialize driver.js
    const driverInstance = driver({
      showProgress: true,
      allowClose: true,
      showButtons: ["next", "previous", "close"],
      steps: [
        {
          element: "[data-tour='toolbox']",
          popover: {
            title: "📦 Atomic Tasks Toolbox",
            description: "Here are your Atomic Tasks. Drag them to the canvas to build your workflow.",
            side: "right",
            align: "start",
          },
        },
        {
          element: "[data-tour='canvas']",
          popover: {
            title: "🎨 Workflow Canvas",
            description: "This is your workflow. Drag and drop steps here, and reorder them as needed.",
            side: "top",
            align: "center",
          },
        },
        {
          element: "[data-tour='config-panel']",
          popover: {
            title: "⚙️ Configuration Panel",
            description: "Click a step to configure its logic, variables, and settings here.",
            side: "left",
            align: "start",
          },
        },
      ],
      onDestroyed: () => {
        if (skipCompletionRef.current) {
          skipCompletionRef.current = false;
        } else {
          // Mark tour as completed in localStorage when tour is closed
          safeSetTourCompleted();
        }
        // Clean up
        driverObj.current = null;
      },
    });

    driverObj.current = driverInstance;
    
    // Start the tour
    driverInstance.drive();
  }, []);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;

    // Auto-start if requested and user hasn't completed the tour
    if (autoStart && !safeHasCompletedTour()) {
      // Small delay to ensure DOM is ready
      timer = setTimeout(() => {
        startTour();
      }, 1000);
    }

    return () => {
      if (timer) {
        clearTimeout(timer);
      }
      // Cleanup on unmount
      if (driverObj.current) {
        skipCompletionRef.current = true;
        driverObj.current.destroy();
        driverObj.current = null;
      }
    };
  }, [autoStart, startTour]);

  return { startTour };
}


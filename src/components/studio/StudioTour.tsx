"use client";

import { useEffect, useRef, useCallback } from "react";
import { driver } from "driver.js";
import "driver.js/dist/driver.css";
import "./studio-tour.css";

export function useStudioTour(autoStart = false) {
  const driverObj = useRef<ReturnType<typeof driver> | null>(null);

  const startTour = useCallback(() => {
    // Destroy existing instance if any
    if (driverObj.current) {
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
      onDestroyStarted: () => {
        // Mark tour as completed in localStorage when tour is closed
        localStorage.setItem("studio-tour-completed", "true");
      },
      onDestroyed: () => {
        // Clean up
        driverObj.current = null;
      },
    });

    driverObj.current = driverInstance;
    
    // Start the tour
    driverInstance.drive();
  }, []);

  useEffect(() => {
    // Auto-start if requested and user hasn't completed the tour
    if (autoStart) {
      const hasCompletedTour = localStorage.getItem("studio-tour-completed") === "true";
      if (!hasCompletedTour) {
        // Small delay to ensure DOM is ready
        const timer = setTimeout(() => {
          startTour();
        }, 1000);
        return () => clearTimeout(timer);
      }
    }

    return () => {
      // Cleanup on unmount
      if (driverObj.current) {
        driverObj.current.destroy();
      }
    };
  }, [autoStart, startTour]);

  return { startTour };
}


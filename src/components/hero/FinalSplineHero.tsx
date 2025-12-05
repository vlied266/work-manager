"use client";

import dynamic from 'next/dynamic';
import React, { useEffect, useRef } from 'react';

// Dynamically import Spline to avoid SSR issues
const Spline = dynamic(
  () => import('@splinetool/react-spline'),
  { 
    ssr: false,
    loading: () => (
      <div className="w-full h-[600px] flex items-center justify-center bg-transparent">
        <div className="text-slate-400 text-sm">Loading 3D scene...</div>
      </div>
    )
  }
);

// Spline scene extracted from https://my.spline.design/stackableglass-IEdJwnzWoNcSaf6VXjvnCl2g-AHg/
const SCENE_PATH = 'https://prod.spline.design/IEdJwnzWoNcSaf6VXjvnCl2g/scene.splinecode';

export default function FinalSplineHero() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkAndFixCanvas = () => {
      if (!containerRef.current) return;
      
      const canvas = containerRef.current.querySelector('canvas');
      if (canvas) {
        // Force transparent background
        canvas.style.background = 'transparent';
        canvas.style.backgroundColor = 'transparent';
        
        // Fix any parent containers
        let element: HTMLElement | null = canvas.parentElement;
        while (element && element !== containerRef.current) {
          element.style.background = 'transparent';
          element.style.backgroundColor = 'transparent';
          element = element.parentElement;
        }
      }
    };

    // Check immediately and periodically
    const interval = setInterval(checkAndFixCanvas, 100);
    
    // Also check after delays
    setTimeout(checkAndFixCanvas, 500);
    setTimeout(checkAndFixCanvas, 1000);
    setTimeout(checkAndFixCanvas, 2000);

    // Watch for DOM changes
    const observer = new MutationObserver(checkAndFixCanvas);
    if (containerRef.current) {
      observer.observe(containerRef.current, {
        childList: true,
        subtree: true,
      });
    }

    return () => {
      clearInterval(interval);
      observer.disconnect();
    };
  }, []);

  return (
    <div 
      ref={containerRef}
      className="w-full h-[600px] relative overflow-hidden"
      style={{ 
        background: 'transparent',
        backgroundColor: 'transparent'
      }}
    >
      <Spline 
        scene={SCENE_PATH}
        style={{ 
          width: '100%', 
          height: '100%',
          background: 'transparent',
          backgroundColor: 'transparent',
          display: 'block'
        }}
      />
    </div>
  );
}

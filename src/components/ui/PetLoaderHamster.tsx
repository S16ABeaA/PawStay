import React, { useState, useEffect } from 'react';

/**
 * Premium PetLoader Component: "Juggling Pup"
 * Features a dog on its back playfully batting and kicking a tennis ball, 
 * utilizing complex CSS kinematics for continuous, smooth juggling physics.
 */
interface PetLoaderProps {
  onComplete?: () => void;
  dataLoaded?: boolean;
}

const PetLoader: React.FC<PetLoaderProps> = ({ onComplete, dataLoaded = false }) => {
  const [progress, setProgress] = useState(0);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [loadingText, setLoadingText] = useState("Warming up the wheel");

  // Progress simulation (eases near the end)
  useEffect(() => {
    const loadingInterval = setInterval(() => {
      setProgress((prev) => {
        const step = dataLoaded
          ? (prev > 90 ? Math.random() * 2 + 1.5 : Math.random() * 5 + 2)
          : (prev > 85 ? Math.random() * 1.2 : Math.random() * 2.5 + 0.5);
        const next = prev + step;
        
        // Update status text to match PawStay tone
        if (next > 25 && next < 50) setLoadingText("Gathering nearby pet services");
        if (next >= 50 && next < 80) setLoadingText("Confirming availability and details");
        if (next >= 80 && next < 100) setLoadingText("Almost ready — finalizing results");
        if (next >= 100) setLoadingText("Done — preparing your results");

        if (!dataLoaded) {
          return Math.min(next, 95);
        }

        if (next >= 100) {
          clearInterval(loadingInterval);
          setTimeout(() => {
            setIsFadingOut(true);
            setTimeout(() => onComplete?.(), 800); // Wait for fade out
          }, 800);
          return 100;
        }
        return next;
      });
    }, 60);
    return () => clearInterval(loadingInterval);
  }, [onComplete, dataLoaded]);

  return (
    <div 
      className={`fixed inset-0 z-[9999] flex flex-col justify-center items-center overflow-hidden transition-all duration-[800ms] cubic-bezier(0.16, 1, 0.3, 1) ${
        isFadingOut ? 'opacity-0 scale-[1.05] pointer-events-none' : 'opacity-100 scale-100'
      }`}
      style={{
        background: 'radial-gradient(circle at 50% 40%, #fff7ed 0%, #ffedd5 100%)'
      }}
    >
      <style>{`
        /* Premium Timing Functions */
        :root {
          --wheel-speed: 1.2s; 
          --run-speed: 0.15s;
        }

        /* Ambient Background Mesh */
        .ambient-glow {
          position: absolute;
          width: 50vw;
          height: 50vw;
          background: radial-gradient(circle, rgba(245, 158, 11, 0.08) 0%, rgba(0,0,0,0) 65%);
          border-radius: 50%;
          top: 45%;
          left: 50%;
          transform: translate(-50%, -50%);
          pointer-events: none;
        }

        /* ---------------- HAMSTER & WHEEL KINEMATICS ---------------- */
        @keyframes wheelSpin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(-360deg); }
        }

        @keyframes hamsterBob {
          0%, 100% { transform: translateY(0px) rotate(2deg); }
          50% { transform: translateY(-2px) rotate(-1deg); }
        }

        @keyframes pedalFront {
          0% { transform: rotate(-20deg); }
          50% { transform: rotate(30deg); }
          100% { transform: rotate(-20deg); }
        }

        @keyframes pedalBack {
          0% { transform: rotate(30deg); }
          50% { transform: rotate(-20deg); }
          100% { transform: rotate(30deg); }
        }

        @keyframes earTwitch {
          0%, 80%, 100% { transform: rotate(0deg); }
          85% { transform: rotate(-15deg); }
          90% { transform: rotate(10deg); }
          95% { transform: rotate(-5deg); }
        }

        /* ---------------- CLASS ASSIGNMENTS ---------------- */
        .fx-wheel { animation: wheelSpin var(--wheel-speed) linear infinite; transform-origin: 100px 100px; }
        .fx-hamster { animation: hamsterBob var(--run-speed) ease-in-out infinite; transform-origin: 100px 150px; }
        
        .fx-leg-f1 { animation: pedalFront var(--run-speed) linear infinite; transform-origin: 75px 150px; }
        .fx-leg-f2 { animation: pedalBack var(--run-speed) linear infinite; transform-origin: 70px 148px; }
        .fx-leg-b1 { animation: pedalBack var(--run-speed) linear infinite; transform-origin: 115px 150px; }
        .fx-leg-b2 { animation: pedalFront var(--run-speed) linear infinite; transform-origin: 110px 148px; }
        
        .fx-ear { animation: earTwitch 3s ease-in-out infinite; transform-origin: 65px 125px; }
      `}</style>

      {/* Ambient Lighting */}
      <div className="ambient-glow"></div>

      {/* The Actor Container */}
      <div className="relative w-full flex justify-center items-center h-[240px] mb-4 mt-8">
        
        {/* Floor Line */}
        <div className="absolute bottom-[20px] left-1/2 -translate-x-1/2 w-[350px] h-[2px] bg-gradient-to-r from-transparent via-orange-200 to-transparent"></div>

        {/* ======================= HAMSTER WHEEL SVG ======================= */}
        <svg width="240" height="240" viewBox="0 0 200 220" className="block overflow-visible relative z-10">
          
          {/* Dynamic Floor Shadow */}
          <ellipse cx="100" cy="205" rx="55" ry="8" fill="#fdba74" opacity="0.4" />

          {/* === BACK STAND === */}
          <path d="M 100 100 L 135 200 L 65 200 Z" fill="none" stroke="#fed7aa" strokeWidth="6" strokeLinejoin="round" />
          <line x1="45" y1="200" x2="155" y2="200" stroke="#fed7aa" strokeWidth="8" strokeLinecap="round" />

          {/* === BACK WHEEL & SPOKES === */}
          <g className="fx-wheel">
            <circle cx="100" cy="100" r="75" fill="none" stroke="#ffedd5" strokeWidth="2" />
            {[0, 45, 90, 135].map(deg => (
              <line key={deg} x1="25" y1="100" x2="175" y2="100" stroke="#ffedd5" strokeWidth="2" transform={`rotate(${deg} 100 100)`} />
            ))}
            <circle cx="100" cy="100" r="73" fill="none" stroke="#fed7aa" strokeWidth="4" strokeDasharray="10 10" />
          </g>

          {/* === THE HAMSTER === */}
          <g className="fx-hamster">
            {/* Back Legs (Darker) */}
            <line x1="110" y1="145" x2="110" y2="160" stroke="#b45309" strokeWidth="5" strokeLinecap="round" className="fx-leg-b2" />
            <line x1="70" y1="145" x2="70" y2="160" stroke="#b45309" strokeWidth="5" strokeLinecap="round" className="fx-leg-f2" />

            {/* Tiny Tail */}
            <path d="M 130 135 Q 138 135 135 142" stroke="#fcd34d" strokeWidth="4" strokeLinecap="round" fill="none" />

            {/* Main Body (Chubby oval) */}
            <ellipse cx="100" cy="135" rx="32" ry="22" fill="#d97706" />
            
            {/* White Belly */}
            <ellipse cx="100" cy="142" rx="26" ry="12" fill="#fffbeb" />

            {/* Head Area */}
            <circle cx="70" cy="132" r="18" fill="#d97706" />
            <path d="M 70 114 Q 55 114 52 135 Q 52 145 70 148 Z" fill="#fffbeb" />

            {/* Pink Nose */}
            <circle cx="50" cy="135" r="2.5" fill="#f43f5e" />

            {/* Rosy Cheek */}
            <circle cx="65" cy="140" r="4" fill="#fb7185" opacity="0.6" />

            {/* Eye (Focused ahead) */}
            <circle cx="62" cy="128" r="3" fill="#1c1917" />
            <circle cx="61" cy="127" r="1" fill="#ffffff" />

            {/* Ears */}
            <g className="fx-ear">
              <circle cx="75" cy="116" r="6" fill="#b45309" />
              <circle cx="75" cy="116" r="3" fill="#fb7185" />
            </g>

            {/* Front Legs (Lighter) */}
            <line x1="115" y1="148" x2="115" y2="162" stroke="#fcd34d" strokeWidth="5" strokeLinecap="round" className="fx-leg-b1" />
            <line x1="75" y1="148" x2="75" y2="162" stroke="#fcd34d" strokeWidth="5" strokeLinecap="round" className="fx-leg-f1" />
          </g>

          {/* === FRONT WHEEL RIM === */}
          <g className="fx-wheel">
            <circle cx="100" cy="100" r="80" fill="none" stroke="#f97316" strokeWidth="6" />
            <circle cx="100" cy="100" r="84" fill="none" stroke="#fdba74" strokeWidth="2" />
            <circle cx="100" cy="100" r="76" fill="none" stroke="#fdba74" strokeWidth="2" />
          </g>

          {/* === FRONT STAND AXLE === */}
          <circle cx="100" cy="100" r="6" fill="#ea580c" />
          <circle cx="100" cy="100" r="3" fill="#fffbeb" />

        </svg>
      </div>

      {/* Premium Glassmorphism Progress UI */}
      <div className="relative w-full max-w-[320px] px-6 flex flex-col items-center">
        {/* Status Text */}
        <div className="text-[13px] font-semibold tracking-[0.08em] uppercase text-orange-600/80 mb-4 h-5">
          {progress >= 100 ? (
            <span className="text-emerald-500 transition-colors duration-500">Power Generated</span>
          ) : (
            <span className="flex items-center gap-2 min-w-0">
              <span className="truncate whitespace-nowrap">{loadingText}</span>
              <span className="flex gap-[2px]">
                <span className="w-1 h-1 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                <span className="w-1 h-1 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                <span className="w-1 h-1 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
              </span>
            </span>
          )}
        </div>
        
        {/* Sleek Progress Track */}
        <div className="relative w-full h-[6px] bg-orange-100 rounded-full overflow-hidden backdrop-blur-md shadow-[inset_0_1px_2px_rgba(0,0,0,0.05)]">
          {/* Animated Fill Gradient */}
          <div 
            className="absolute top-0 left-0 h-full rounded-full bg-gradient-to-r from-orange-400 via-amber-400 to-orange-400 transition-all duration-150 ease-out"
            style={{ width: `${progress}%` }}
          >
            {/* Shimmer overlay on the bar */}
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-white/50 to-transparent -translate-x-full animate-[shimmer_1s_infinite]"></div>
          </div>
        </div>
      </div>

      {/* Global Utility Keyframes */}
      <style>{`
        @keyframes shimmer {
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
};

export default PetLoader;
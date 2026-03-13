import React, { useState, useEffect } from 'react';

/**
 * Premium PetLoader Component: "The Playful Pup"
 * Features a stationary but highly dynamic vignette of a dog on its back
 * playfully batting a tennis ball, utilizing complex CSS kinematics for batting, 
 * kicking, and gravity physics.
 */
interface PetLoaderProps {
  onComplete?: () => void;
  dataLoaded?: boolean;
}

const PetLoader: React.FC<PetLoaderProps> = ({ onComplete, dataLoaded = false }) => {
  const [progress, setProgress] = useState(0);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [loadingText, setLoadingText] = useState("Throwing the request");

  // Progress simulation (eases near the end)
  useEffect(() => {
    const loadingInterval = setInterval(() => {
      setProgress((prev) => {
        const step = dataLoaded
          ? (prev > 90 ? Math.random() * 2 + 1.5 : Math.random() * 5 + 2)
          : (prev > 85 ? Math.random() * 1.2 : Math.random() * 2.5 + 0.5);
        const next = prev + step;
        
        // Update status text to match PawStay tone
        if (next > 30 && next < 60) setLoadingText("Checking pet-friendly options");
        if (next >= 60 && next < 90) setLoadingText("Verifying availability and rates");
        if (next >= 90) setLoadingText("All set — preparing your results");

        if (!dataLoaded) {
          return Math.min(next, 95);
        }

        if (next >= 100) {
          clearInterval(loadingInterval);
          setTimeout(() => {
            setIsFadingOut(true);
            setTimeout(() => onComplete?.(), 800); // Wait for fade out
          }, 600);
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
        background: 'radial-gradient(circle at 50% 40%, #f0f9ff 0%, #e2e8f0 100%)'
      }}
    >
      <style>{`
        /* Premium Timing Functions */
        :root {
          --cycle: 3.8s; /* Extended slightly for the prance back */
        }

        /* Ambient Background Mesh */
        .ambient-glow {
          position: absolute;
          width: 50vw;
          height: 50vw;
          background: radial-gradient(circle, rgba(14, 165, 233, 0.08) 0%, rgba(0,0,0,0) 65%);
          border-radius: 50%;
          top: 45%;
          left: 50%;
          transform: translate(-50%, -50%);
          pointer-events: none;
        }

        /* ---------------- FLYING DISK KINEMATICS ---------------- */
        @keyframes dogJump {
          0% { transform: translate(-250px, 0px) scaleX(1) rotate(0deg); animation-timing-function: cubic-bezier(0.4, 0, 0.2, 1); }
          8% { transform: translate(-190px, -15px) scaleX(1) rotate(3deg); animation-timing-function: cubic-bezier(0.4, 0, 0.2, 1); } 
          16% { transform: translate(-130px, 0px) scaleX(1) rotate(-2deg); animation-timing-function: cubic-bezier(0.4, 0, 0.2, 1); } 
          24% { transform: translate(-70px, -15px) scaleX(1) rotate(3deg); animation-timing-function: cubic-bezier(0.4, 0, 0.2, 1); } 
          32% { transform: translate(-10px, 0px) scaleX(1) rotate(0deg); animation-timing-function: cubic-bezier(0.4, 0, 0.2, 1); } 
          38% { transform: translate(0px, 15px) scaleX(1) rotate(-6deg); animation-timing-function: cubic-bezier(0.2, 0.8, 0.2, 1); } /* Explosive jump */
          50% { transform: translate(60px, -65px) scaleX(1) rotate(18deg); animation-timing-function: cubic-bezier(0.8, 0.2, 1, 0.8); } /* Catch */
          62% { transform: translate(110px, 0px) scaleX(1) rotate(-5deg); animation-timing-function: cubic-bezier(0.4, 0, 0.2, 1); } /* Land */
          68% { transform: translate(120px, 5px) scaleX(1) rotate(0deg); animation-timing-function: ease-out; } /* Squash */
          72% { transform: translate(120px, 0px) scaleX(-1) rotate(0deg); animation-timing-function: cubic-bezier(0.4, 0, 0.2, 1); } /* Snap Turn Around */
          80% { transform: translate(60px, -20px) scaleX(-1) rotate(5deg); animation-timing-function: cubic-bezier(0.4, 0, 0.2, 1); } /* Big bound back */
          88% { transform: translate(0px, 0px) scaleX(-1) rotate(-2deg); animation-timing-function: ease-out; } /* Land center */
          94% { transform: translate(0px, 8px) scaleX(-1) rotate(0deg); animation-timing-function: ease-in; } /* Squash center */
          100% { transform: translate(0px, 0px) scaleX(-1) rotate(0deg); } /* Wait holding the disk */
        }

        @keyframes diskFly {
          0% { transform: translate(-120px, 30px) rotate(-15deg) scale(0.6); opacity: 0; }
          5% { transform: translate(-80px, 10px) rotate(-5deg) scale(0.7); opacity: 1; animation-timing-function: linear; } 
          16% { transform: translate(-15px, -15px) rotate(0deg) scale(0.8); opacity: 1; animation-timing-function: linear; }
          27% { transform: translate(50px, -20px) rotate(5deg) scale(0.9); opacity: 1; animation-timing-function: linear; }
          38% { transform: translate(115px, -5px) rotate(10deg) scale(0.95); opacity: 1; animation-timing-function: linear; }
          50% { transform: translate(188px, 28px) rotate(18deg) scale(1); opacity: 1; } 
          50.1%, 100% { transform: translate(188px, 28px) rotate(18deg) scale(1); opacity: 0; } 
        }

        @keyframes diskMouth {
          0%, 50% { opacity: 0; }
          50.1%, 100% { opacity: 1; } 
        }

        @keyframes jawSnap {
          0%, 38% { transform: rotate(15deg); } 
          42%, 48% { transform: rotate(45deg); } 
          50%, 100% { transform: rotate(0deg); } 
        }

        @keyframes legFront {
          0% { transform: rotate(-20deg); }
          8% { transform: rotate(40deg); }
          16% { transform: rotate(-30deg); }
          24% { transform: rotate(40deg); }
          32% { transform: rotate(-20deg); }
          38% { transform: rotate(-30deg); } 
          44% { transform: rotate(50deg); } 
          50% { transform: rotate(60deg); } 
          62% { transform: rotate(-10deg); } 
          68% { transform: rotate(-20deg); } 
          72% { transform: rotate(20deg); } /* Pivot to turn */
          80% { transform: rotate(55deg); } /* Reach far out for bound */
          88% { transform: rotate(-15deg); } /* Land center */
          94% { transform: rotate(-25deg); } /* Squash */
          100% { transform: rotate(0deg); } /* Settle */
        }

        @keyframes legBack {
          0% { transform: rotate(20deg); }
          8% { transform: rotate(-40deg); }
          16% { transform: rotate(30deg); }
          24% { transform: rotate(-40deg); }
          32% { transform: rotate(20deg); }
          38% { transform: rotate(40deg); } 
          44% { transform: rotate(-20deg); } 
          50% { transform: rotate(-55deg); } 
          62% { transform: rotate(20deg); } 
          68% { transform: rotate(30deg); } 
          72% { transform: rotate(-10deg); } /* Pivot to turn */
          80% { transform: rotate(-45deg); } /* Push hard off back */
          88% { transform: rotate(25deg); } /* Land center */
          94% { transform: rotate(35deg); } /* Squash */
          100% { transform: rotate(0deg); } /* Settle */
        }

        @keyframes shadowJump {
          0% { transform: translate(-250px, 0px) scale(1); opacity: 0.4; animation-timing-function: cubic-bezier(0.4, 0, 0.2, 1); }
          8% { transform: translate(-190px, 0px) scale(0.7); opacity: 0.2; animation-timing-function: cubic-bezier(0.4, 0, 0.2, 1); }
          16% { transform: translate(-130px, 0px) scale(1); opacity: 0.4; animation-timing-function: cubic-bezier(0.4, 0, 0.2, 1); }
          24% { transform: translate(-70px, 0px) scale(0.7); opacity: 0.2; animation-timing-function: cubic-bezier(0.4, 0, 0.2, 1); }
          32% { transform: translate(-10px, 0px) scale(1.1); opacity: 0.5; animation-timing-function: cubic-bezier(0.4, 0, 0.2, 1); }
          38% { transform: translate(0px, 0px) scale(1.2); opacity: 0.6; animation-timing-function: cubic-bezier(0.2, 0.8, 0.2, 1); }
          50% { transform: translate(60px, 0px) scale(0.4); opacity: 0.08; animation-timing-function: cubic-bezier(0.8, 0.2, 1, 0.8); }
          62% { transform: translate(110px, 0px) scale(1.1); opacity: 0.5; animation-timing-function: cubic-bezier(0.4, 0, 0.2, 1); }
          68% { transform: translate(120px, 0px) scale(1.2); opacity: 0.6; animation-timing-function: ease-out; }
          72% { transform: translate(120px, 0px) scale(1); opacity: 0.5; animation-timing-function: cubic-bezier(0.4, 0, 0.2, 1); }
          80% { transform: translate(60px, 0px) scale(0.6); opacity: 0.15; animation-timing-function: cubic-bezier(0.4, 0, 0.2, 1); }
          88% { transform: translate(0px, 0px) scale(1.1); opacity: 0.5; animation-timing-function: ease-out; }
          94% { transform: translate(0px, 0px) scale(1.25); opacity: 0.65; animation-timing-function: ease-in; }
          100% { transform: translate(0px, 0px) scale(1); opacity: 0.4; }
        }
        
        @keyframes tailWag {
          0%, 100% { transform: rotate(0deg); }
          50% { transform: rotate(25deg); }
        }

        @keyframes earFlop {
          0%, 32% { transform: rotate(-30deg); } 
          38% { transform: rotate(10deg); } 
          44%, 55% { transform: rotate(-40deg); } 
          62% { transform: rotate(20deg); } 
          68% { transform: rotate(5deg); } 
          72% { transform: rotate(25deg); } /* Whip forward as dog snaps around */
          80% { transform: rotate(-35deg); } /* Pin back during fast bound */
          88% { transform: rotate(20deg); } /* Flop forward hard on landing */
          94% { transform: rotate(30deg); } /* Flop further during squash */
          100% { transform: rotate(0deg); } /* Settle */
        }

        /* ---------------- CLASS ASSIGNMENTS ---------------- */
        /* Changed 'infinite' to 'forwards' so the sequence stops and holds its final frame */
        .fx-dog-jump { animation: dogJump var(--cycle) forwards; transform-origin: 80px 100px; }
        .fx-disk-fly { animation: diskFly var(--cycle) forwards; }
        .fx-disk-mouth { animation: diskMouth var(--cycle) linear forwards; }
        .fx-jaw { animation: jawSnap var(--cycle) ease-in-out forwards; transform-origin: 110px 78px; }
        .fx-leg-f { animation: legFront var(--cycle) ease-in-out forwards; transform-origin: 95px 105px; }
        .fx-leg-b { animation: legBack var(--cycle) ease-in-out forwards; transform-origin: 55px 105px; }
        .fx-shadow { animation: shadowJump var(--cycle) forwards; }
        /* Keep the tail wagging infinitely! */
        .fx-tail { animation: tailWag 0.25s ease-in-out infinite; transform-origin: 45px 95px; }
        .fx-ear { animation: earFlop var(--cycle) ease-in-out forwards; transform-origin: 108px 70px; }
      `}</style>

      {/* Ambient Lighting */}
      <div className="ambient-glow"></div>

      {/* The Actor Container (Centered Vignette) */}
      <div className="relative w-full flex justify-center items-center h-[200px] mb-8">
        
        {/* Floor Line (Expanded width to accommodate the long run) */}
        <div className="absolute bottom-[20px] left-1/2 -translate-x-1/2 w-[450px] h-[2px] bg-gradient-to-r from-transparent via-slate-300 to-transparent"></div>

        {/* ======================= JUMPING DOG & DISK SVG ======================= */}
        <svg width="280" height="160" viewBox="0 0 240 160" className="block overflow-visible relative z-10">
          
          {/* Dynamic Shadow */}
          <ellipse cx="80" cy="130" rx="35" ry="5" fill="#94a3b8" className="fx-shadow" />

          {/* === FLYING DISK (Disk 1) === */}
          <g className="fx-disk-fly">
            <ellipse cx="0" cy="0" rx="16" ry="5" fill="#0ea5e9" />
            <ellipse cx="0" cy="-1" rx="12" ry="3" fill="#38bdf8" />
            <path d="M -10 -2 Q 0 -4 10 -2" stroke="#bae6fd" fill="none" strokeWidth="1.5" strokeLinecap="round" />
          </g>

          {/* === THE DOG === */}
          <g className="fx-dog-jump">
            
            {/* Back Elements (Left Side / Background) */}
            <g>
              {/* Tail (Fast wagging) */}
              <path d="M 45 95 Q 20 100 15 75" fill="none" stroke="#d97706" strokeWidth="9" strokeLinecap="round" className="fx-tail" />
              
              {/* Back Left Leg */}
              <path d="M 65 105 L 60 128 L 65 128" stroke="#92400e" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" fill="none" className="fx-leg-b" style={{ transformOrigin: '65px 105px' }} />
              
              {/* Front Left Leg */}
              <path d="M 105 105 L 105 128 L 110 128" stroke="#92400e" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" fill="none" className="fx-leg-f" style={{ transformOrigin: '105px 105px' }} />
              
              {/* Background Ear */}
              <path d="M 105 70 Q 95 90 102 100 Q 110 95 112 75 Z" fill="#92400e" className="fx-ear" style={{ transformOrigin: '105px 70px' }} />
            </g>

            {/* Main Body */}
            <rect x="45" y="82" width="70" height="36" rx="18" fill="#d97706" />
            {/* Body highlight */}
            <rect x="50" y="86" width="60" height="12" rx="6" fill="#fcd34d" opacity="0.4" />

            {/* Head */}
            <g>
              {/* Head Base */}
              <circle cx="110" cy="72" r="16" fill="#d97706" />
              
              {/* Upper Snout */}
              <path d="M 110 65 L 128 68 Q 132 68 130 75 L 110 78 Z" fill="#d97706" />
              {/* Nose */}
              <circle cx="130" cy="69" r="3" fill="#292524" />

              {/* === CAUGHT DISK (Disk 2 - Appears in mouth) === */}
              <g className="fx-disk-mouth">
                <ellipse cx="127" cy="78" rx="16" ry="4" fill="#0ea5e9" />
                <ellipse cx="127" cy="77" rx="12" ry="2" fill="#38bdf8" />
              </g>

              {/* Lower Jaw (Snaps shut on disk) */}
              <path d="M 110 78 L 126 78 Q 130 78 126 84 L 110 85 Z" fill="#d97706" className="fx-jaw" />

              {/* Eye */}
              <circle cx="115" cy="65" r="2.5" fill="#f8fafc" />
              <circle cx="116" cy="65" r="1.5" fill="#292524" />

              {/* Foreground Ear (Floppy) */}
              <path d="M 108 70 Q 98 90 105 102 Q 115 95 116 75 Z" fill="#b45309" className="fx-ear" style={{ transformOrigin: '108px 70px' }} />
            </g>

            {/* Foreground Elements (Right Side) */}
            <g>
              {/* Back Right Leg */}
              <path d="M 55 105 L 50 128 L 56 128" stroke="#d97706" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" fill="none" className="fx-leg-b" />
              
              {/* Front Right Leg */}
              <path d="M 95 105 L 95 128 L 102 128" stroke="#d97706" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" fill="none" className="fx-leg-f" />
            </g>

          </g>
        </svg>
      </div>

      {/* Premium Glassmorphism Progress UI */}
      <div className="relative w-full max-w-[320px] px-6 flex flex-col items-center">
        {/* Status Text */}
        <div className="text-[13px] font-semibold tracking-[0.08em] uppercase text-slate-500 mb-4 h-5">
          {progress >= 100 ? (
            <span className="text-sky-500 transition-colors duration-500">Playtime Complete</span>
          ) : (
            <span className="flex items-center gap-2 min-w-0">
              <span className="truncate whitespace-nowrap">{loadingText}</span>
              <span className="flex gap-[2px]">
                <span className="w-1 h-1 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                <span className="w-1 h-1 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                <span className="w-1 h-1 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
              </span>
            </span>
          )}
        </div>
        
        {/* Sleek Progress Track */}
        <div className="relative w-full h-[4px] bg-slate-200/50 rounded-full overflow-hidden backdrop-blur-md shadow-[inset_0_1px_2px_rgba(0,0,0,0.05)]">
          {/* Animated Fill Gradient */}
          <div 
            className="absolute top-0 left-0 h-full rounded-full bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-400 transition-all duration-150 ease-out"
            style={{ width: `${progress}%` }}
          >
            {/* Shimmer overlay on the bar */}
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full animate-[shimmer_1.5s_infinite]"></div>
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
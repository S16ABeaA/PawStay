import React, { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

interface PetLoaderProps {
  onComplete?: () => void;
  className?: string;
  text?: string;
  dataLoaded?: boolean;
}

interface PetLoaderGateProps {
  dataLoaded: boolean;
  children: React.ReactNode;
  loaderClassName?: string;
  loaderText?: string;
}

const PetLoader: React.FC<PetLoaderProps> = ({ onComplete, dataLoaded = false }) => {
  const [progress, setProgress] = useState(0);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [loadingText, setLoadingText] = useState("Fetching your furry friends");

  // Progress simulation (eases near the end)
  useEffect(() => {
    const loadingInterval = setInterval(() => {
      setProgress((prev) => {
        const step = dataLoaded
          ? (prev > 90 ? Math.random() * 2 + 1.5 : Math.random() * 5 + 2)
          : (prev > 85 ? Math.random() * 1.2 : Math.random() * 2.5 + 0.5);
        const next = prev + step;
        
        // Update playful text based on progress
        if (next > 30 && next < 60) setLoadingText("Finding pet-friendly matches");
        if (next >= 60 && next < 90) setLoadingText("Checking availability and details");
        if (next >= 90) setLoadingText("Ready — showing results shortly");

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
        background: 'radial-gradient(circle at 50% 40%, #fff1f2 0%, #e2e8f0 100%)'
      }}
    >
      <style>{`
        /* Premium Timing Functions */
        :root {
          --ease-out-bounce: cubic-bezier(0.175, 0.885, 0.32, 1.275);
          --ease-in-out-sine: cubic-bezier(0.445, 0.05, 0.55, 0.95);
          --play-cycle: 2.2s; /* Total duration of one batting combo */
        }

        /* Ambient Background Mesh */
        .ambient-glow {
          position: absolute;
          width: 50vw;
          height: 50vw;
          background: radial-gradient(circle, rgba(244,63,94,0.06) 0%, rgba(0,0,0,0) 65%);
          border-radius: 50%;
          top: 45%;
          left: 50%;
          transform: translate(-50%, -50%);
          pointer-events: none;
        }

        /* ---------------- PLAYFUL KINEMATICS ---------------- */
        
        /* Yarn Ball Physics (Gets batted up twice) */
        @keyframes yarnBounce {
          0%, 100% { transform: translate(0px, 0px) rotate(0deg); }
          
          /* First Bat (Left Paw) */
          10% { transform: translate(-8px, 4px) rotate(-20deg); } /* Windup */
          20% { transform: translate(15px, -35px) rotate(120deg); animation-timing-function: cubic-bezier(0.33, 1, 0.68, 1); } /* Up */
          35% { transform: translate(8px, 0px) rotate(180deg); animation-timing-function: cubic-bezier(0.32, 0, 0.67, 0); } /* Down */
          
          /* Second Bat (Right Paw) */
          50% { transform: translate(12px, 5px) rotate(160deg); } /* Windup */
          60% { transform: translate(-10px, -45px) rotate(-50deg); animation-timing-function: cubic-bezier(0.33, 1, 0.68, 1); } /* Up higher */
          80% { transform: translate(0px, 0px) rotate(-180deg); animation-timing-function: cubic-bezier(0.32, 0, 0.67, 0); } /* Down */
        }

        /* Front Paw Batting Sequences */
        @keyframes batLeft {
          0%, 30%, 100% { transform: rotate(0deg); }
          10% { transform: rotate(-25deg); } /* Reach back */
          15% { transform: rotate(35deg); } /* Strike! */
          25% { transform: rotate(-5deg); } /* Follow through */
        }

        @keyframes batRight {
          0%, 45%, 85%, 100% { transform: rotate(0deg); }
          50% { transform: rotate(30deg); } /* Reach back */
          55% { transform: rotate(-45deg); } /* Strike! */
          70% { transform: rotate(10deg); } /* Follow through */
        }

        /* Back Leg Bunny Kicks (Fast, continuous wiggles) */
        @keyframes bunnyKickBack {
          0%, 100% { transform: rotate(0deg); }
          25% { transform: rotate(15deg); }
          75% { transform: rotate(-5deg); }
        }
        @keyframes bunnyKickFront {
          0%, 100% { transform: rotate(0deg); }
          25% { transform: rotate(-10deg); }
          75% { transform: rotate(15deg); }
        }

        /* Body & Head Micro-Movements */
        @keyframes bodyWiggle {
          0%, 100% { transform: rotate(0deg) translateY(0px); }
          20% { transform: rotate(-2deg) translateY(1px); }
          60% { transform: rotate(3deg) translateY(-1px); }
        }
        
        @keyframes headTrack {
          0%, 100% { transform: rotate(0deg); }
          20% { transform: rotate(8deg); } /* Look right */
          60% { transform: rotate(-12deg); } /* Look left/up */
        }

        /* Happy Tail Swish */
        @keyframes tailSwish {
          0%, 100% { transform: rotate(0deg); }
          25% { transform: rotate(20deg); }
          75% { transform: rotate(-15deg); }
        }

        @keyframes blink {
          0%, 46%, 48%, 50%, 100% { transform: scaleY(1); }
          47%, 49% { transform: scaleY(0.1); }
        }

        /* ---------------- CLASS ASSIGNMENTS ---------------- */
        .fx-yarn { animation: yarnBounce var(--play-cycle) linear infinite; transform-origin: center; }
        .fx-bat-bg { animation: batLeft var(--play-cycle) linear infinite; }
        .fx-bat-fg { animation: batRight var(--play-cycle) linear infinite; }
        .fx-kick-bg { animation: bunnyKickBack 0.25s linear infinite; }
        .fx-kick-fg { animation: bunnyKickFront 0.25s linear infinite; }
        .fx-body { animation: bodyWiggle var(--play-cycle) linear infinite; transform-origin: 50px 75px; }
        .fx-head { animation: headTrack var(--play-cycle) linear infinite; transform-origin: 32px 75px; }
        .fx-tail { animation: tailSwish calc(var(--play-cycle) * 0.7) var(--ease-in-out-sine) infinite; }
        .fx-blink { animation: blink 4s linear infinite; transform-origin: center; }
      `}</style>

      {/* Ambient Lighting */}
      <div className="ambient-glow"></div>

      {/* The Actor Container (Centered Vignette) */}
      <div className="relative w-full flex justify-center items-center h-[200px] mb-8">
        
        {/* Floor Line */}
        <div className="absolute bottom-[20px] left-1/2 -translate-x-1/2 w-[300px] h-[2px] bg-gradient-to-r from-transparent via-slate-300 to-transparent"></div>

        {/* ======================= PLAYFUL CAT & YARN SVG ======================= */}
        <svg width="220" height="150" viewBox="0 0 150 120" className="block overflow-visible relative z-10">
          
          {/* Base Soft Shadow */}
          <ellipse cx="75" cy="100" rx="45" ry="5" fill="#94a3b8" opacity="0.4" />

          {/* === YARN BALL (Moves independently of cat) === */}
          <g className="fx-yarn" style={{ transformOrigin: '75px 40px' }}>
            <circle cx="75" cy="40" r="14" fill="#f43f5e" opacity="0.2" /> {/* Glow */}
            <circle cx="75" cy="40" r="10" fill="#f43f5e" /> {/* Main Ball */}
            {/* Yarn Threads */}
            <path d="M 68 35 Q 75 30 82 38" stroke="#be123c" fill="none" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M 70 45 Q 75 48 80 42" stroke="#be123c" fill="none" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M 72 32 L 78 48" stroke="#be123c" fill="none" strokeWidth="1.5" strokeLinecap="round" />
          </g>

          {/* === THE CAT === */}
          <g className="fx-body">
            
            {/* Back Elements (Left Side of Body) */}
            <g>
              {/* Tail (Resting on floor, swishing up) */}
              <path d="M 105 88 Q 135 95 125 65" fill="none" stroke="#475569" strokeWidth="8" strokeLinecap="round" className="fx-tail" style={{ transformOrigin: '105px 88px' }} />
              
              {/* Left Back Leg (Kicking) */}
              <path d="M 95 85 L 110 60" stroke="#334155" strokeWidth="9" strokeLinecap="round" className="fx-kick-bg" style={{ transformOrigin: '95px 85px' }} />
              
              {/* Left Front Paw (Batting) */}
              <path d="M 60 80 L 65 50" stroke="#334155" strokeWidth="8" strokeLinecap="round" className="fx-bat-bg" style={{ transformOrigin: '60px 80px' }} />
            </g>

            {/* Main Body Pill (Lying on back) */}
            <rect x="40" y="70" width="65" height="26" rx="13" fill="#475569" />
            {/* Belly highlight */}
            <rect x="45" y="74" width="50" height="12" rx="6" fill="#64748b" opacity="0.5" />

            {/* Head (Looking up/right) */}
            <g className="fx-head">
              <circle cx="32" cy="75" r="18" fill="#475569" />
              
              {/* Ears (Pointing down-left towards floor) */}
              <path d="M 18 80 L 8 92 L 25 88 Z" fill="#475569" stroke="#475569" strokeWidth="2" strokeLinejoin="round" />
              <path d="M 28 65 L 18 52 L 35 60 Z" fill="#475569" stroke="#475569" strokeWidth="2" strokeLinejoin="round" />
              {/* Ear inners */}
              <path d="M 18 80 L 12 88 L 22 86 Z" fill="#f8fafc" opacity="0.4" />
              <path d="M 28 65 L 22 56 L 31 62 Z" fill="#f8fafc" opacity="0.4" />

              {/* Face Details (Upside down perspective) */}
              <g className="fx-blink">
                <circle cx="38" cy="68" r="2.5" fill="#f8fafc" /> {/* Right eye (top) */}
                <circle cx="40" cy="80" r="2.5" fill="#f8fafc" /> {/* Left eye (bottom) */}
              </g>
              {/* Little pink nose pointing towards the toy */}
              <circle cx="45" cy="74" r="2" fill="#f43f5e" />
            </g>

            {/* Foreground Elements (Right Side of Body) */}
            <g>
              {/* Right Back Leg (Kicking) */}
              <path d="M 90 88 L 100 65" stroke="#475569" strokeWidth="9" strokeLinecap="round" className="fx-kick-fg" style={{ transformOrigin: '90px 88px' }} />
              
              {/* Right Front Paw (Batting) */}
              <path d="M 50 82 L 55 52" stroke="#475569" strokeWidth="8" strokeLinecap="round" className="fx-bat-fg" style={{ transformOrigin: '50px 82px' }} />
            </g>

          </g>
        </svg>
      </div>

      {/* Premium Glassmorphism Progress UI */}
      <div className="relative w-full max-w-[320px] px-6 flex flex-col items-center">
        {/* Status Text */}
        <div className="text-[13px] font-semibold tracking-[0.08em] uppercase text-slate-500 mb-4 h-5">
          {progress >= 100 ? (
            <span className="text-rose-500 transition-colors duration-500">Playtime Complete</span>
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
            className="absolute top-0 left-0 h-full rounded-full bg-gradient-to-r from-rose-500 via-pink-400 to-rose-400 transition-all duration-150 ease-out"
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

export { PetLoader };

const PetLoaderGate: React.FC<PetLoaderGateProps> = ({
  dataLoaded,
  children,
  loaderClassName,
  loaderText,
}) => {
  const [loaderComplete, setLoaderComplete] = useState(false);

  // Reset when a new loading cycle begins (e.g. refetch / navigation)
  useEffect(() => {
    if (!dataLoaded) {
      setLoaderComplete(false);
    }
  }, [dataLoaded]);

  if (!loaderComplete) {
    return (
      <PetLoader
        dataLoaded={dataLoaded}
        onComplete={() => setLoaderComplete(true)}
        className={loaderClassName}
        text={loaderText}
      />
    );
  }

  return <>{children}</>;
};

export { PetLoaderGate };
export default PetLoader;

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

const PetLoader: React.FC<PetLoaderProps> = ({ onComplete, className, text, dataLoaded = true }) => {
  const [progress, setProgress] = useState(0);
  const [isFadingOut, setIsFadingOut] = useState(false);

  const walkersRef = useRef<HTMLDivElement>(null);
  const parallaxBgRef = useRef<HTMLDivElement>(null);
  const parallaxFgRef = useRef<HTMLDivElement>(null);
  const pawsContainerRef = useRef<HTMLDivElement>(null);
  const requestRef = useRef<number | null>(null);
  const hasCompletedRef = useRef(false);
  const pauseTimeoutRef = useRef<number | null>(null);
  const fadeTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    const loadingInterval = setInterval(() => {
      setProgress((prev) => {
        let step: number;
        if (dataLoaded) {
          // Accelerate towards 100% once data is ready
          step = prev > 90 ? Math.random() * 2 + 1 : Math.random() * 5 + 2;
        } else {
          step = prev > 80 ? Math.random() * 1.5 : Math.random() * 3 + 0.5;
        }
        const next = prev + step;

        if (!dataLoaded) {
          return Math.min(next, 95);
        }

        return Math.min(next, 100);
      });
    }, 60);

    return () => clearInterval(loadingInterval);
  }, [dataLoaded]);

  useEffect(() => {
    if (!onComplete) return;
    if (!dataLoaded || progress < 100) return;
    if (hasCompletedRef.current) return;

    hasCompletedRef.current = true;

    pauseTimeoutRef.current = window.setTimeout(() => {
      setIsFadingOut(true);
      fadeTimeoutRef.current = window.setTimeout(() => {
        onComplete();
      }, 800);
    }, 400);
  }, [dataLoaded, progress, onComplete]);

  useEffect(() => {
    return () => {
      if (pauseTimeoutRef.current !== null) {
        clearTimeout(pauseTimeoutRef.current);
        pauseTimeoutRef.current = null;
      }
      if (fadeTimeoutRef.current !== null) {
        clearTimeout(fadeTimeoutRef.current);
        fadeTimeoutRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    let x = -600;
    let bgX = 0;
    let fgX = 0;
    let lastPawX = -600;
    let stepCount = 0;

    const animate = () => {
      x += 2.5;
      bgX -= 0.3;
      fgX -= 0.8;

      if (x > window.innerWidth + 200) {
        x = -600;
        if (pawsContainerRef.current) {
          pawsContainerRef.current.innerHTML = '';
        }
      }

      if (bgX <= -1000) {
        bgX = 0;
      }
      if (fgX <= -1000) {
        fgX = 0;
      }

      if (walkersRef.current) {
        walkersRef.current.style.transform = `translateX(${x}px)`;
      }
      if (parallaxBgRef.current) {
        parallaxBgRef.current.style.transform = `translateX(${bgX}px)`;
      }
      if (parallaxFgRef.current) {
        parallaxFgRef.current.style.transform = `translateX(${fgX}px)`;
      }

      if (x - lastPawX > 48 && pawsContainerRef.current) {
        const isRightFoot = stepCount % 2 === 0;
        const scale = isRightFoot ? 'scale(0.95)' : 'scale(0.85)';
        const opacity = isRightFoot ? '0.12' : '0.08';

        const spawnPaw = (colorClass: string, offset: number, isCat: boolean) => {
          const paw = document.createElement('div');
          const y = isCat ? (isRightFoot ? 2 : -3) : (isRightFoot ? 4 : -1);
          paw.className = `absolute ${isCat ? 'w-[10px] h-[10px]' : 'w-[14px] h-[14px]'} ${colorClass} animate-paw-fade`;
          paw.style.left = `${x + offset}px`;
          paw.style.bottom = `${(isCat ? 24 : 18) + y}px`;
          paw.style.transform = scale;
          paw.style.opacity = opacity;
          paw.innerHTML = '<svg fill="currentColor" viewBox="0 0 24 24"><path d="M12,2C9.5,2 7.5,4 7.5,6.5C7.5,9 9.5,11 12,11C14.5,11 16.5,9 16.5,6.5C16.5,4 14.5,2 12,2M6.5,11C4.5,11 3,12.5 3,14.5C3,16.5 4.5,18 6.5,18C8.5,18 10,16.5 10,14.5C10,12.5 8.5,11 6.5,11M17.5,11C15.5,11 14,12.5 14,14.5C14,16.5 15.5,18 17.5,18C19.5,18 21,16.5 21,14.5C21,12.5 19.5,11 17.5,11M12,13C9,13 6.5,15.5 6.5,18.5C6.5,21.5 9,24 12,24C15,24 17.5,21.5 17.5,18.5C17.5,15.5 15,13 12,13Z" /></svg>';
          pawsContainerRef.current?.appendChild(paw);
          setTimeout(() => {
            if (paw.parentNode) {
              paw.remove();
            }
          }, 2500);
        };

        spawnPaw('text-slate-800', 34, true);
        spawnPaw('text-amber-700', 170, false);
        spawnPaw('text-slate-400', 298, true);
        spawnPaw('text-amber-900', 434, false);

        lastPawX = x;
        stepCount += 1;
      }

      requestRef.current = requestAnimationFrame(animate);
    };

    requestRef.current = requestAnimationFrame(animate);

    return () => {
      if (requestRef.current !== null) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, []);

  const statusText = text ?? (progress >= 100 ? 'Loading Complete' : 'Loading');

  return (
    <div
      className={cn(
        'flex w-full min-h-[360px] flex-col items-center justify-center overflow-hidden rounded-2xl transition-all duration-&lsqb;800ms&rsqb; cubic-bezier(0.16,1,0.3,1)',
        isFadingOut ? 'pointer-events-none scale-[1.02] opacity-0' : 'scale-100 opacity-100',
        className,
      )}
      style={{
        background: 'radial-gradient(circle at 50% 0%, #f8fafc 0%, #e2e8f0 100%)',
      }}
    >
      <style>{`
        :root {
          --ease-in-out-sine: cubic-bezier(0.445, 0.05, 0.55, 0.95);
          --stride-time: 0.65s;
        }
        .ambient-glow {
          position: absolute;
          width: 60vw;
          height: 60vw;
          background: radial-gradient(circle, rgba(217,119,6,0.05) 0%, rgba(0,0,0,0) 70%);
          border-radius: 50%;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          pointer-events: none;
        }
        @keyframes legSwingFront {
          0% { transform: rotate(-30deg); }
          50% { transform: rotate(35deg); }
          100% { transform: rotate(-30deg); }
        }
        @keyframes legSwingBack {
          0% { transform: rotate(35deg); }
          50% { transform: rotate(-30deg); }
          100% { transform: rotate(35deg); }
        }
        @keyframes bodyWeight {
          0%, 50%, 100% { transform: translateY(0px); }
          25%, 75% { transform: translateY(-3.5px); }
        }
        @keyframes shadowDeform {
          0%, 50%, 100% { transform: scaleX(1) scaleY(1); opacity: 0.15; }
          25%, 75% { transform: scaleX(0.85) scaleY(0.9); opacity: 0.08; }
        }
        @keyframes tailWagDog {
          0%, 100% { transform: rotate(-10deg); }
          50% { transform: rotate(18deg); }
        }
        @keyframes tailSwayCat {
          0%, 100% { transform: rotate(8deg); }
          50% { transform: rotate(-12deg); }
        }
        @keyframes earFlapDog {
          0%, 50%, 100% { transform: rotate(0deg); }
          25%, 75% { transform: rotate(-8deg); }
        }
        @keyframes blink {
          0%, 46%, 48%, 50%, 100% { transform: scaleY(1); }
          47%, 49% { transform: scaleY(0.1); }
        }
        @keyframes pawFade {
          0% { opacity: 0; transform: scale(0.6) translateY(4px); filter: blur(2px); }
          15% { opacity: var(--tw-opacity, 0.1); transform: scale(1) translateY(0); filter: blur(0px); }
          80% { opacity: var(--tw-opacity, 0.1); transform: scale(1) translateY(0); filter: blur(0px); }
          100% { opacity: 0; transform: scale(1.1) translateY(0); filter: blur(4px); }
        }
        .mech-leg-1 { animation: legSwingFront var(--stride-time) var(--ease-in-out-sine) infinite; }
        .mech-leg-2 { animation: legSwingBack var(--stride-time) var(--ease-in-out-sine) infinite; }
        .mech-body { animation: bodyWeight var(--stride-time) linear infinite; }
        .mech-shadow { animation: shadowDeform var(--stride-time) linear infinite; transform-origin: center; }
        .fx-dog-tail { animation: tailWagDog calc(var(--stride-time) * 0.5) var(--ease-in-out-sine) infinite; transform-origin: left center; }
        .fx-dog-ear { animation: earFlapDog var(--stride-time) linear infinite; transform-origin: top right; }
        .fx-cat-tail { animation: tailSwayCat calc(var(--stride-time) * 2) var(--ease-in-out-sine) infinite; transform-origin: left bottom; }
        .fx-blink { animation: blink 4.5s linear infinite; transform-origin: center; }
        .animate-paw-fade { animation: pawFade 2.5s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        @keyframes shimmer {
          100% { transform: translateX(100%); }
        }
      `}</style>

      <div className="ambient-glow"></div>

      <div className="pointer-events-none absolute left-0 top-[50%] -mt-[100px] h-[200px] w-full overflow-hidden opacity-40">
        <div ref={parallaxBgRef} className="absolute left-0 top-0 flex h-full w-[2000px] items-end">
          <svg width="2000" height="150" viewBox="0 0 2000 150" preserveAspectRatio="none">
            <path d="M0,150 L0,80 Q250,140 500,70 T1000,90 T1500,60 T2000,100 L2000,150 Z" fill="#cbd5e1" opacity="0.3" />
            <path d="M0,150 L0,100 Q300,50 600,110 T1200,60 T1800,120 T2000,80 L2000,150 Z" fill="#e2e8f0" opacity="0.5" />
          </svg>
        </div>
      </div>

      <div className="pointer-events-none absolute left-0 top-[56%] -mt-[70px] h-[120px] w-full overflow-hidden opacity-25">
        <div ref={parallaxFgRef} className="absolute left-0 top-0 flex h-full w-[2000px] items-end">
          <svg width="2000" height="100" viewBox="0 0 2000 100" preserveAspectRatio="none">
            <path d="M0,100 L0,55 Q180,95 360,60 T760,70 T1180,45 T1600,75 T2000,58 L2000,100 Z" fill="#94a3b8" opacity="0.35" />
          </svg>
        </div>
      </div>

      <div className="absolute left-0 top-[55%] h-[1px] w-full bg-gradient-to-r from-transparent via-slate-300 to-transparent"></div>
      <div ref={pawsContainerRef} className="pointer-events-none absolute left-0 top-[55%] h-[60px] w-full"></div>

      <div className="pointer-events-none absolute left-0 top-[55%] -mt-[120px] h-[150px] w-full overflow-visible">
        <div ref={walkersRef} className="absolute bottom-0 left-0 flex items-end gap-12 px-10">
          <svg width="75" height="85" viewBox="0 0 100 100" className="relative z-10 block overflow-visible">
            <ellipse cx="50" cy="88" rx="20" ry="2.5" fill="#94a3b8" className="mech-shadow" />
            <g className="mech-body">
              <path d="M 38 60 L 36 85" stroke="#334155" strokeWidth="6" strokeLinecap="round" className="mech-leg-2" style={{ transformOrigin: '38px 60px' }} />
              <path d="M 58 60 L 56 85" stroke="#334155" strokeWidth="6" strokeLinecap="round" className="mech-leg-1" style={{ transformOrigin: '58px 60px' }} />
            </g>
            <g className="mech-body">
              <path d="M 28 58 Q 5 50 15 25" fill="none" stroke="#475569" strokeWidth="7" strokeLinecap="round" className="fx-cat-tail" style={{ transformOrigin: '28px 58px' }} />
              <rect x="25" y="46" width="42" height="18" rx="9" fill="#475569" />
              <circle cx="68" cy="38" r="15" fill="#475569" />
              <path d="M 57 28 L 54 13 L 66 25 Z" fill="#475569" stroke="#475569" strokeWidth="2" strokeLinejoin="round" />
              <path d="M 70 24 L 77 12 L 79 28 Z" fill="#475569" stroke="#475569" strokeWidth="2" strokeLinejoin="round" />
              <path d="M 57 28 L 55 16 L 63 24 Z" fill="#f8fafc" opacity="0.4" />
              <path d="M 71 25 L 75 16 L 76 28 Z" fill="#f8fafc" opacity="0.4" />
              <g className="fx-blink" style={{ transformOrigin: '72px 36px' }}>
                <circle cx="72" cy="36" r="2.5" fill="#f8fafc" />
                <circle cx="79" cy="40" r="1.5" fill="#f1f5f9" opacity="0.6" />
              </g>
            </g>
            <g className="mech-body">
              <path d="M 44 60 L 44 85" stroke="#475569" strokeWidth="6" strokeLinecap="round" className="mech-leg-1" style={{ transformOrigin: '44px 60px' }} />
              <path d="M 64 60 L 64 85" stroke="#475569" strokeWidth="6" strokeLinecap="round" className="mech-leg-2" style={{ transformOrigin: '64px 60px' }} />
            </g>
          </svg>

          <svg width="95" height="95" viewBox="0 0 100 100" className="relative z-20 block overflow-visible">
            <ellipse cx="55" cy="88" rx="26" ry="3.5" fill="#94a3b8" className="mech-shadow" />
            <g className="mech-body">
              <path d="M 36 60 L 34 85" stroke="#92400e" strokeWidth="7" strokeLinecap="round" className="mech-leg-2" style={{ transformOrigin: '36px 60px' }} />
              <path d="M 62 60 L 60 85" stroke="#92400e" strokeWidth="7" strokeLinecap="round" className="mech-leg-1" style={{ transformOrigin: '62px 60px' }} />
            </g>
            <g className="mech-body">
              <path d="M 25 46 Q 10 40 12 25" fill="none" stroke="#d97706" strokeWidth="8" strokeLinecap="round" className="fx-dog-tail" style={{ transformOrigin: '25px 46px' }} />
              <rect x="22" y="40" width="54" height="24" rx="12" fill="#d97706" />
              <rect x="65" y="22" width="26" height="28" rx="10" fill="#d97706" />
              <rect x="80" y="34" width="22" height="14" rx="7" fill="#fcd34d" />
              <g className="fx-blink" style={{ transformOrigin: '78px 30px' }}>
                <circle cx="78" cy="30" r="3" fill="#f8fafc" />
                <circle cx="97" cy="38" r="3.5" fill="#78350f" />
              </g>
              <path d="M 72 22 Q 62 42 70 52 Q 82 48 78 22 Z" fill="#92400e" className="fx-dog-ear" style={{ transformOrigin: '75px 22px' }} />
            </g>
            <g className="mech-body">
              <path d="M 44 60 L 44 85" stroke="#d97706" strokeWidth="7" strokeLinecap="round" className="mech-leg-1" style={{ transformOrigin: '44px 60px' }} />
              <path d="M 72 60 L 72 85" stroke="#d97706" strokeWidth="7" strokeLinecap="round" className="mech-leg-2" style={{ transformOrigin: '72px 60px' }} />
            </g>
          </svg>

          <svg width="65" height="75" viewBox="0 0 100 100" className="relative z-15 block overflow-visible">
            <ellipse cx="50" cy="88" rx="20" ry="2.5" fill="#cbd5e1" className="mech-shadow" style={{ animationDelay: '-0.15s' }} />
            <g className="mech-body" style={{ animationDelay: '-0.15s' }}>
              <path d="M 38 60 L 36 85" stroke="#64748b" strokeWidth="6" strokeLinecap="round" className="mech-leg-2" style={{ transformOrigin: '38px 60px', animationDelay: '-0.15s' }} />
              <path d="M 58 60 L 56 85" stroke="#64748b" strokeWidth="6" strokeLinecap="round" className="mech-leg-1" style={{ transformOrigin: '58px 60px', animationDelay: '-0.15s' }} />
            </g>
            <g className="mech-body" style={{ animationDelay: '-0.15s' }}>
              <path d="M 28 58 Q 5 50 15 25" fill="none" stroke="#94a3b8" strokeWidth="7" strokeLinecap="round" className="fx-cat-tail" style={{ transformOrigin: '28px 58px', animationDelay: '-0.15s' }} />
              <rect x="25" y="46" width="42" height="18" rx="9" fill="#94a3b8" />
              <circle cx="68" cy="38" r="15" fill="#94a3b8" />
              <path d="M 57 28 L 54 13 L 66 25 Z" fill="#94a3b8" stroke="#94a3b8" strokeWidth="2" strokeLinejoin="round" />
              <path d="M 70 24 L 77 12 L 79 28 Z" fill="#94a3b8" stroke="#94a3b8" strokeWidth="2" strokeLinejoin="round" />
              <path d="M 57 28 L 55 16 L 63 24 Z" fill="#f1f5f9" opacity="0.6" />
              <path d="M 71 25 L 75 16 L 76 28 Z" fill="#f1f5f9" opacity="0.6" />
              <g className="fx-blink" style={{ transformOrigin: '72px 36px', animationDelay: '-0.15s' }}>
                <circle cx="72" cy="36" r="2.5" fill="#f8fafc" />
                <circle cx="79" cy="40" r="1.5" fill="#f1f5f9" opacity="0.6" />
              </g>
            </g>
            <g className="mech-body" style={{ animationDelay: '-0.15s' }}>
              <path d="M 44 60 L 44 85" stroke="#94a3b8" strokeWidth="6" strokeLinecap="round" className="mech-leg-1" style={{ transformOrigin: '44px 60px', animationDelay: '-0.15s' }} />
              <path d="M 64 60 L 64 85" stroke="#94a3b8" strokeWidth="6" strokeLinecap="round" className="mech-leg-2" style={{ transformOrigin: '64px 60px', animationDelay: '-0.15s' }} />
            </g>
          </svg>

          <svg width="110" height="110" viewBox="0 0 100 100" className="relative z-30 block overflow-visible">
            <ellipse cx="55" cy="88" rx="28" ry="4" fill="#94a3b8" className="mech-shadow" style={{ animationDelay: '-0.45s' }} />
            <g className="mech-body" style={{ animationDelay: '-0.45s' }}>
              <path d="M 36 60 L 34 85" stroke="#451a03" strokeWidth="7.5" strokeLinecap="round" className="mech-leg-2" style={{ transformOrigin: '36px 60px', animationDelay: '-0.45s' }} />
              <path d="M 62 60 L 60 85" stroke="#451a03" strokeWidth="7.5" strokeLinecap="round" className="mech-leg-1" style={{ transformOrigin: '62px 60px', animationDelay: '-0.45s' }} />
            </g>
            <g className="mech-body" style={{ animationDelay: '-0.45s' }}>
              <path d="M 25 46 Q 10 40 12 25" fill="none" stroke="#78350f" strokeWidth="8.5" strokeLinecap="round" className="fx-dog-tail" style={{ transformOrigin: '25px 46px', animationDelay: '-0.45s' }} />
              <rect x="22" y="40" width="54" height="26" rx="13" fill="#78350f" />
              <rect x="65" y="22" width="28" height="30" rx="10" fill="#78350f" />
              <rect x="80" y="34" width="24" height="15" rx="7.5" fill="#d97706" />
              <g className="fx-blink" style={{ transformOrigin: '78px 30px', animationDelay: '-0.45s' }}>
                <circle cx="78" cy="30" r="3" fill="#f8fafc" />
                <circle cx="98" cy="38" r="4" fill="#292524" />
              </g>
              <path d="M 72 22 Q 62 42 70 52 Q 82 48 78 22 Z" fill="#451a03" className="fx-dog-ear" style={{ transformOrigin: '75px 22px', animationDelay: '-0.45s' }} />
            </g>
            <g className="mech-body" style={{ animationDelay: '-0.45s' }}>
              <path d="M 44 60 L 44 85" stroke="#78350f" strokeWidth="7.5" strokeLinecap="round" className="mech-leg-1" style={{ transformOrigin: '44px 60px', animationDelay: '-0.45s' }} />
              <path d="M 72 60 L 72 85" stroke="#78350f" strokeWidth="7.5" strokeLinecap="round" className="mech-leg-2" style={{ transformOrigin: '72px 60px', animationDelay: '-0.45s' }} />
            </g>
          </svg>
        </div>
      </div>

      <div className="absolute top-[68%] flex w-full max-w-[320px] flex-col items-center px-6">
        <div className="mb-4 h-5 text-[13px] font-semibold uppercase tracking-[0.08em] text-slate-500">
          {progress >= 100 && onComplete ? (
            <span className="text-orange-600 transition-colors duration-500">Loading Complete</span>
          ) : (
            <span className="flex items-center gap-2">
              {statusText}
              {!text && (
                <span className="flex gap-[2px]">
                  <span className="h-1 w-1 animate-bounce rounded-full bg-slate-400" style={{ animationDelay: '0ms' }}></span>
                  <span className="h-1 w-1 animate-bounce rounded-full bg-slate-400" style={{ animationDelay: '150ms' }}></span>
                  <span className="h-1 w-1 animate-bounce rounded-full bg-slate-400" style={{ animationDelay: '300ms' }}></span>
                </span>
              )}
            </span>
          )}
        </div>

        <div className="relative h-[4px] w-full overflow-hidden rounded-full bg-slate-200/50 shadow-[inset_0_1px_2px_rgba(0,0,0,0.05)] backdrop-blur-md">
          <div
            className="absolute left-0 top-0 h-full rounded-full bg-gradient-to-r from-orange-500 via-amber-400 to-orange-400 transition-all duration-150 ease-out"
            style={{ width: `${progress}%` }}
          >
            <div className="absolute left-0 top-0 h-full w-full -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/40 to-transparent"></div>
          </div>
        </div>
      </div>
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

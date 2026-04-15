import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Cookie, X, ShieldCheck, Activity, Map, ChevronRight, PawPrint } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";

export function CookieBanner() {
  const [isVisible, setIsVisible] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [hoverAccept, setHoverAccept] = useState(false);
  const [isSnatching, setIsSnatching] = useState(false);

  const [preferences, setPreferences] = useState({
    essential: true,
    analytics: true,
    marketing: false
  });

  useEffect(() => {
    const consent = localStorage.getItem("pawstay_cookie_consent");
    if (!consent) {
      const timer = setTimeout(() => setIsVisible(true), 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    if (accepted || isSnatching) return;

    setIsSnatching(true);
    setTimeout(() => {
      setAccepted(true);
      setHoverAccept(false);
    }, 700);

    setTimeout(() => {
      localStorage.setItem("pawstay_cookie_consent", "accepted_all");
      localStorage.setItem("pawstay_cookie_prefs", JSON.stringify({ essential: true, analytics: true, marketing: true }));
      setIsVisible(false);
      setIsSnatching(false);
    }, 1600);
  };

  const handleSave = () => {
    localStorage.setItem("pawstay_cookie_consent", "custom");
    localStorage.setItem("pawstay_cookie_prefs", JSON.stringify(preferences));
    setIsVisible(false);
  };

  const handleDecline = () => {
    localStorage.setItem("pawstay_cookie_consent", "essential_only");
    localStorage.setItem("pawstay_cookie_prefs", JSON.stringify({ essential: true, analytics: false, marketing: false }));
    setIsVisible(false);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 100, scale: 0.9, x: "-50%" }}
          animate={{ opacity: 1, y: 0, scale: 1, x: "-50%" }}
          exit={{ opacity: 0, y: 100, scale: 0.8, x: "-50%" }}
          transition={{ duration: 0.6, type: "spring", bounce: 0.4 }}
          className="fixed bottom-6 left-1/2 z-[9999] w-[calc(100vw-32px)] max-w-[420px]"
        >
          {/* Dynamic Island / Glass Pill Container */}
          <motion.div
            layout
            className="relative overflow-hidden bg-background/80 backdrop-blur-2xl border border-border/50 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.3)] rounded-[2.5rem]"
          >
            {/* Subtle ambient glow with a tiny pet hint */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-orange-500/10" />
              <PawPrint className="absolute right-5 top-4 h-4 w-4 text-foreground/15" />
            </div>

            <div className="relative z-10 p-6">
              <AnimatePresence mode="popLayout">
                {/* ---------------- COMPACT VIEW ---------------- */}
                {!expanded ? (
                  <motion.div
                    key="compact"
                    initial={{ opacity: 0, filter: "blur(4px)" }}
                    animate={{ opacity: 1, filter: "blur(0px)" }}
                    exit={{ opacity: 0, filter: "blur(4px)", transition: { duration: 0.2 } }}
                    className="flex flex-col"
                  >
                    {/* Header line */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {/* Cookie icon with a subtle paw accent */}
                        <div className="relative w-12 h-12 flex items-center justify-center shrink-0">
                          <motion.div
                            animate={
                              isSnatching
                                ? { rotate: [0, 0, -12, 12, -6, 6, 0], scale: [1, 1, 1.1, 1.1, 1, 1, 1] }
                                : accepted
                                ? { scale: 1.05 }
                                : hoverAccept
                                  ? { scale: 1.04, y: -1 }
                                  : { scale: 1, y: 0 }
                            }
                            transition={
                              isSnatching
                                ? { duration: 0.7, times: [0, 0.4, 0.45, 0.5, 0.55, 0.6, 1], ease: "easeInOut" }
                                : { type: "spring", stiffness: 320, damping: 20 }
                            }
                            className="bg-card shadow-sm border border-border/50 rounded-full w-12 h-12 flex items-center justify-center relative overflow-hidden"
                          >
                            {/* Epic Exploding Crumbs */}
                            <AnimatePresence>
                              {(isSnatching || accepted) && (
                                <>
                                  {[
                                    { x: -25, y: -20, r: -45 },
                                    { x: 30, y: -15, r: 90 },
                                    { x: -15, y: 25, r: 180 },
                                    { x: 20, y: 30, r: 45 },
                                    { x: -5, y: -35, r: -90 },
                                  ].map((crumb, i) => (
                                    <motion.div
                                      key={i}
                                      initial={{ x: 0, y: 0, scale: 0, opacity: 1, rotate: 0 }}
                                      animate={isSnatching ? { 
                                        x: crumb.x, 
                                        y: crumb.y, 
                                        scale: [0, 1.5, 0], 
                                        opacity: [1, 1, 0],
                                        rotate: crumb.r
                                      } : { opacity: 0 }}
                                      transition={{ duration: 0.5, delay: 0.4, ease: "easeOut" }}
                                      className="absolute w-1.5 h-1.5 bg-orange-400/80 rounded-md z-10"
                                    />
                                  ))}
                                </>
                              )}
                            </AnimatePresence>

                            <motion.div
                              animate={
                                isSnatching
                                  ? { scale: [1, 1, 0.4, 0], opacity: [1, 1, 0, 0], rotate: [0, 0, -45, -90] }
                                  : accepted
                                    ? { scale: 0, opacity: 0 }
                                    : { x: 0, y: 0, scale: 1, rotate: 0, opacity: 1 }
                              }
                              transition={
                                isSnatching
                                  ? { duration: 0.7, times: [0, 0.4, 0.5, 1], ease: "easeOut" }
                                  : { duration: 0.2 }
                              }
                              className="absolute inset-0 flex items-center justify-center"
                            >
                              <Cookie className="h-6 w-6 text-orange-500" />
                            </motion.div>
                            
                            <motion.div
                              animate={
                                isSnatching
                                  ? { 
                                      x: [0, 4, -14, -14, -14], 
                                      y: [0, 4, -14, -14, -14], 
                                      scale: [1, 0.8, 1.8, 1.8, 1.6], 
                                      rotate: [0, 15, -35, -35, -10] 
                                    }
                                  : accepted
                                    ? { x: -14, y: -14, scale: 1.6, rotate: -10, opacity: 1 }
                                    : { x: 0, y: 0, scale: 1, opacity: 0.9, rotate: 0 }
                              }
                              transition={
                                isSnatching
                                  ? { duration: 0.7, times: [0, 0.25, 0.45, 0.65, 1], ease: "easeInOut" }
                                  : { duration: 0.2 }
                              }
                              className="absolute -bottom-0.5 -right-0.5 h-5 w-5 rounded-full bg-primary/15 border border-primary/20 flex items-center justify-center z-20"
                            >
                              <PawPrint className="h-2.5 w-2.5 text-primary" />
                            </motion.div>
                          </motion.div>
                        </div>

                        <div>
                          <h3 className="font-bold text-[17px] tracking-tight">Your Privacy</h3>
                          <p className="text-xs text-muted-foreground leading-snug max-w-[200px] mt-0.5">
                            We use cookies to fetch you the best experience.
                          </p>
                        </div>
                      </div>

                      <button 
                        onClick={() => setIsVisible(false)}
                        className="w-8 h-8 flex items-center justify-center rounded-full bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors self-start shrink-0"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>

                    {/* Action Row */}
                    <div className="mt-5 flex items-center gap-2">
                      <Button 
                        variant="ghost" 
                        onClick={() => setExpanded(true)}
                        className="h-11 rounded-full text-sm font-medium px-4 text-muted-foreground hover:text-foreground bg-muted/50 hover:bg-muted shrink-0"
                      >
                        Manage
                      </Button>
                      <div className="flex-1 flex gap-2">
                        <Button 
                          variant="outline" 
                          onClick={handleDecline}
                          className="flex-1 h-11 rounded-full text-sm border-border/50"
                        >
                          Decline
                        </Button>
                        <Button 
                          onClick={handleAccept}
                          onMouseEnter={() => setHoverAccept(true)}
                          onMouseLeave={() => setHoverAccept(false)}
                          className="flex-1 h-11 rounded-full text-sm font-semibold bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 transition-transform active:scale-95 relative overflow-hidden group"
                        >
                          <span className="relative z-10 flex items-center justify-center">
                            {accepted ? "Saved" : "Accept All"}
                          </span>
                          <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 rounded-full" />
                        </Button>
                      </div>
                    </div>
                  </motion.div>

                ) : (
                
                /* ---------------- EXPANDED VIEW ---------------- */
                  <motion.div
                    key="expanded"
                    initial={{ opacity: 0, filter: "blur(4px)" }}
                    animate={{ opacity: 1, filter: "blur(0px)", transition: { delay: 0.1 } }}
                    exit={{ opacity: 0, filter: "blur(4px)", transition: { duration: 0.2 } }}
                    className="flex flex-col"
                  >
                    <div className="flex items-center gap-3 mb-6">
                      <button 
                        onClick={() => setExpanded(false)}
                        className="w-8 h-8 flex items-center justify-center rounded-full bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                      >
                        <ChevronRight className="h-4 w-4 rotate-180" />
                      </button>
                      <h3 className="font-bold text-lg tracking-tight">Preferences</h3>
                    </div>

                    <div className="space-y-3 mb-6 px-1">
                      {/* Essential */}
                      <div className="flex items-center justify-between bg-card/50 border border-border/50 p-3.5 rounded-2xl">
                        <div className="flex items-center gap-3.5">
                          <div className="w-9 h-9 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
                            <ShieldCheck className="h-4.5 w-4.5" />
                          </div>
                          <div>
                            <p className="text-sm font-bold">Essential</p>
                            <p className="text-[11px] text-muted-foreground mt-0.5">Required to explore PawStay</p>
                          </div>
                        </div>
                        <Switch checked={true} disabled />
                      </div>

                      {/* Analytics */}
                      <div className="flex items-center justify-between bg-card/50 border border-border/50 p-3.5 rounded-2xl">
                        <div className="flex items-center gap-3.5">
                          <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                            <Activity className="h-4.5 w-4.5" />
                          </div>
                          <div>
                            <p className="text-sm font-bold">Analytics</p>
                            <p className="text-[11px] text-muted-foreground mt-0.5">Helps us track and improve</p>
                          </div>
                        </div>
                        <Switch 
                          checked={preferences.analytics} 
                          onCheckedChange={(c) => setPreferences({...preferences, analytics: c})} 
                        />
                      </div>

                      {/* Marketing */}
                      <div className="flex items-center justify-between bg-card/50 border border-border/50 p-3.5 rounded-2xl">
                        <div className="flex items-center gap-3.5">
                          <div className="w-9 h-9 rounded-full bg-orange-500/10 text-orange-500 flex items-center justify-center shrink-0">
                            <Map className="h-4.5 w-4.5" />
                          </div>
                          <div>
                            <p className="text-sm font-bold">Marketing</p>
                            <p className="text-[11px] text-muted-foreground mt-0.5">For personalized offers</p>
                          </div>
                        </div>
                        <Switch 
                          checked={preferences.marketing} 
                          onCheckedChange={(c) => setPreferences({...preferences, marketing: c})} 
                        />
                      </div>
                    </div>

                    <div className="flex flex-col gap-3">
                      <Button 
                        onClick={handleSave}
                        className="w-full h-12 rounded-full font-bold bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 text-[15px]"
                      >
                        Save & Close
                      </Button>
                      <div className="text-center">
                        <Link 
                          to="/legal/privacy#cookies" 
                          className="text-xs text-muted-foreground hover:text-foreground underline-offset-4 hover:underline"
                          onClick={() => setIsVisible(false)}
                        >
                          View Full Privacy Policy
                        </Link>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

const fs = require('fs');
let file = fs.readFileSync('src/components/CookieBanner.tsx', 'utf8');

file = file.replace(/const handleAccept = \(\) => \{[\s\S]*?\}, 1000\);\n  \};/, `const handleAccept = () => {
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
    }, 1600); // Wait longer so the user can enjoy the masterpiece
  };`);

file = file.replace(/<div className="relative w-12 h-12 flex items-center justify-center shrink-0">[\s\S]*?<div>\n\s*<h3 className="font-bold text-\[17px\] tracking-tight">Your Privacy<\/h3>/, `<div className="relative w-12 h-12 flex items-center justify-center shrink-0">
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
                              {isSnatching && (
                                <>
                                  {[
                                    { x: -25, y: -20, r: -45 },
                                    { x: 30, y: -15, r: 90 },
                                    { x: -15, y: 25, r: 180 },
                                    { x: 20, y: 30, r: 45 },
                                    { x: -2, y: -35, r: -90 },
                                  ].map((crumb, i) => (
                                    <motion.div
                                      key={i}
                                      initial={{ x: 0, y: 0, scale: 0, opacity: 1, rotate: 0 }}
                                      animate={{ 
                                        x: crumb.x, 
                                        y: crumb.y, 
                                        scale: [0, 1.5, 0], 
                                        opacity: [1, 1, 0],
                                        rotate: crumb.r
                                      }}
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
                          <h3 className="font-bold text-[17px] tracking-tight">Your Privacy</h3>`);

fs.writeFileSync('src/components/CookieBanner.tsx', file);

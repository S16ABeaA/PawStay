import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X, User, Heart, Bell, HelpCircle } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { authApi } from "@/services/authApi";
import NotificationBell from "@/components/NotificationBell";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { fetchAmenities } from "@/services/amenitiesApi";

const SERVICE_NAV_ITEMS = [
  {
    key: "hotel",
    label: "Pet Hotels",
    path: "/hotels",
    sectionId: "hotels",
    apiServiceType: "hotel",
    description: "Comfortable overnight stays for your pets",
  },
  {
    key: "grooming",
    label: "Grooming",
    path: "/grooming",
    sectionId: "salons",
    apiServiceType: "grooming",
    description: "Professional grooming and spa services",
  },
  {
    key: "vet",
    label: "Veterinary",
    path: "/veterinary",
    sectionId: "clinics",
    apiServiceType: "veterinary",
    description: "Expert veterinary care and consultations",
  },
] as const;

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<{ firstName: string; lastName: string; avatarUrl: string }>({
    firstName: "",
    lastName: "",
    avatarUrl: "",
  });
  const [amenitiesByService, setAmenitiesByService] = useState<Record<string, string[]>>({});

  const serviceParam = new URLSearchParams(location.search).get("service")?.toLowerCase();
  const normalizedServiceParam = serviceParam === "veterinary" ? "vet" : serviceParam;

  useEffect(() => {
    const isSignedIn = typeof window !== "undefined" && localStorage.getItem("pawstay.authenticated") === "true";
    setIsLoggedIn(isSignedIn);

    if (isSignedIn) {
      authApi.getProfile().then((profile: any) => {
        if (profile?.user) {
          setUser({
            firstName: profile.user.first_name || "",
            lastName: profile.user.last_name || "",
            avatarUrl: profile.user.avatar_url || "",
          });
        }
      }).catch(() => {/* silent */});
    }
  }, [location.pathname]);

  useEffect(() => {
    let isActive = true;

    const loadAmenities = async () => {
      const settled = await Promise.allSettled(
        SERVICE_NAV_ITEMS.map(async (item) => {
          const data = await fetchAmenities(item.apiServiceType);
          const names = (Array.isArray(data) ? data : [])
            .map((amenity: any) => amenity?.amenity)
            .filter((name: any): name is string => typeof name === "string" && name.trim().length > 0);
          return [item.key, names] as const;
        }),
      );

      if (!isActive) return;

      const next: Record<string, string[]> = {};
      settled.forEach((result, index) => {
        if (result.status === "fulfilled") {
          const [key, names] = result.value;
          next[key] = names;
          return;
        }

        next[SERVICE_NAV_ITEMS[index].key] = [];
      });

      setAmenitiesByService(next);
    };

    loadAmenities();

    return () => {
      isActive = false;
    };
  }, []);

  const isServiceActive = (item: (typeof SERVICE_NAV_ITEMS)[number]) => {
    const onServiceRoute = location.pathname === item.path || location.pathname.startsWith(`${item.path}/`);
    const matchesQueryFilter = normalizedServiceParam === item.key;
    return onServiceRoute || matchesQueryFilter;
  };

  const getAmenityFilterLink = (item: (typeof SERVICE_NAV_ITEMS)[number], amenity: string) => {
    const params = new URLSearchParams();
    params.set("amenities", amenity);
    return `${item.path}?${params.toString()}#${item.sectionId}`;
  };

  // Listen for avatar updates from Profile
  useEffect(() => {
    const handleAvatarUpdate = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.avatarUrl) {
        setUser((prev) => ({ ...prev, avatarUrl: detail.avatarUrl }));
      }
    };
    window.addEventListener("pawstay:avatar-updated", handleAvatarUpdate);
    return () => window.removeEventListener("pawstay:avatar-updated", handleAvatarUpdate);
  }, []);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-lg">
      <div className="container flex h-16 items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-1 group">
          <img src="/PawStay%20Logo.jpg" alt="PawStay" className="h-10 w-10 rounded-xl object-cover" />
          <span className="font-display text-xl font-bold text-foreground">
            PawStay
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-8">
          {SERVICE_NAV_ITEMS.map((item) => {
            const isActive = isServiceActive(item);
            const previewAmenities = amenitiesByService[item.key] ?? [];
            return (
              <Tooltip key={item.key}>
                <TooltipTrigger asChild>
                  <Link
                    to={`${item.path}?service=${item.key}`}
                    className={cn(
                      "relative text-sm font-medium transition-colors hover:text-orange-400",
                      isActive ? "text-orange-600" : "text-muted-foreground",
                    )}
                    aria-current={isActive ? "page" : undefined}
                  >
                    <span className={cn(isActive && "font-semibold")}>{item.label}</span>
                    <span
                      className={cn(
                        "absolute left-0 -bottom-1 h-0.5 w-full rounded-full transition-opacity",
                        isActive ? "bg-orange-500 opacity-100" : "bg-orange-500 opacity-0",
                      )}
                    />
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-[300px] p-0">
                  <div className="relative">
                    <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-3 h-3 bg-card rotate-45 border border-border shadow-sm" />
                    <div className="bg-card rounded-lg p-4 shadow-md border border-border overflow-hidden">
                      <p className="text-sm font-medium text-foreground">{item.description}</p>
                      <div className="border-t border-border/50 my-2" />
                      <div className="mt-1">
                        {previewAmenities.length > 0 ? (
                          <>
                            <div className="max-h-64 overflow-auto space-y-1">
                              {previewAmenities.slice(0, 6).map((amenity) => (
                                <Link
                                  key={`${item.key}-${amenity}`}
                                  to={getAmenityFilterLink(item, amenity)}
                                  className="flex items-center justify-start w-full rounded px-2 py-2 text-sm text-foreground hover:bg-orange-50 transition-colors"
                                >
                                  <span className="flex-1">{amenity}</span>
                                </Link>
                              ))}
                            </div>
                            {previewAmenities.length > 6 && (
                              <div className="mt-3 px-2 py-2 text-center">
                                <Link
                                  to={`${item.path}#${item.sectionId}`}
                                  className="text-sm font-medium text-orange-600 hover:underline decoration-orange-200"
                                >
                                  See all amenities →
                                </Link>
                              </div>
                            )}
                          </>
                        ) : (
                          <p className="text-xs text-muted-foreground">No amenities available yet</p>
                        )}
                      </div>
                    </div>
                  </div>
                </TooltipContent>
              </Tooltip>
            );
          })}
          <Link to="/about" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            About
          </Link>
          <Link to="/faq" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
            <HelpCircle className="h-4 w-4" />
            Help
          </Link>
        </nav>
        <div className="hidden md:flex items-center gap-4">

       {/* Desktop Actions */}
        {isLoggedIn && (
          <div className="hidden md:flex items-center gap-3">
            <NotificationBell />
            <Link to="/favorites">
              <Button variant="ghost" size="icon" className="text-muted-foreground">
                <Heart className="h-5 w-5" />
              </Button>
            </Link>
          </div>
        )}
          
          {isLoggedIn ? (
            <Link to="/profile">
              <Avatar className="h-9 w-9 cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all">
                {user.avatarUrl && <AvatarImage src={user.avatarUrl} className="object-cover" />}
                <AvatarFallback className="bg-gradient-hero text-sm text-white">
                  {(user.firstName?.[0] || "")}{(user.lastName?.[0] || "")}
                </AvatarFallback>
              </Avatar>
            </Link>
          ) : (
            <Link to="/signin">
              <Button variant="outline" size="sm">
                <User className="h-4 w-4 mr-2" />
                Sign In
              </Button>
            </Link>
          )}
          
          <Link
            to={
              isLoggedIn
                ? "/list-property"
                : "/signin?intent=partner&mode=signup&redirect=/list-property"
            }
          >
            <Button variant="hero" size="sm">
              List Your Property
            </Button>
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden border-t border-border bg-background animate-slide-up">
          <nav className="container py-4 flex flex-col gap-3">
            {SERVICE_NAV_ITEMS.map((item) => {
              const isActive = isServiceActive(item);
              return (
                <Link
                  key={item.key}
                  to={`${item.path}?service=${item.key}`}
                  className={cn(
                    "py-2 text-sm font-medium",
                    isActive ? "text-primary" : "text-foreground",
                  )}
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.label}
                </Link>
              );
            })}
            <Link to="/about" className="py-2 text-sm font-medium text-foreground" onClick={() => setIsMenuOpen(false)}>About</Link>
            <Link to="/faq" className="py-2 text-sm font-medium text-foreground flex items-center gap-1" onClick={() => setIsMenuOpen(false)}>
              <HelpCircle className="h-4 w-4" /> Help Center
            </Link>
            <hr className="border-border my-2" />
            {isLoggedIn && (
              <Link to="/notifications" className="py-2 text-sm font-medium text-foreground flex items-center gap-2" onClick={() => setIsMenuOpen(false)}>
                <Bell className="h-4 w-4" />
                Notifications
              </Link>
            )}
            {isLoggedIn ? (
              <Link to="/profile" onClick={() => setIsMenuOpen(false)}>
                <Button variant="outline" className="w-full gap-2">
                  <Avatar className="h-6 w-6">
                    {user.avatarUrl && <AvatarImage src={user.avatarUrl} className="object-cover" />}
                    <AvatarFallback className="bg-gradient-hero text-xs text-white">
                      {(user.firstName?.[0] || "")}{(user.lastName?.[0] || "")}
                    </AvatarFallback>
                  </Avatar>
                  My Profile
                </Button>
              </Link>
            ) : (
              <Link to="/signin" onClick={() => setIsMenuOpen(false)}>
                <Button variant="outline" className="w-full">Sign In</Button>
              </Link>
            )}
            <Link
              to={
                isLoggedIn
                  ? "/list-property"
                  : "/signin?intent=partner&mode=signup&redirect=/list-property"
              }
              onClick={() => setIsMenuOpen(false)}
            >
              <Button variant="hero" className="w-full">List Your Property</Button>
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;

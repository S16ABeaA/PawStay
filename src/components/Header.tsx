import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X, PawPrint, User, Heart, Bell } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { authApi } from "@/services/authApi";
import NotificationBell from "@/components/NotificationBell";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<{ firstName: string; lastName: string; avatarUrl: string }>({
    firstName: "",
    lastName: "",
    avatarUrl: "",
  });

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

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-lg">
      <div className="container flex h-16 items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 group">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-hero shadow-soft group-hover:shadow-glow transition-shadow">
            <PawPrint className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="font-display text-xl font-bold text-foreground">
            PawStay
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-8">
          <Link to="/hotels" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            Pet Hotels
          </Link>
          <Link to="/grooming" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            Grooming
          </Link>
          <Link to="/veterinary" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            Veterinary
          </Link>
          <Link to="/about" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            About
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
            <Link to="/hotels" className="py-2 text-sm font-medium text-foreground" onClick={() => setIsMenuOpen(false)}>Pet Hotels</Link>
            <Link to="/grooming" className="py-2 text-sm font-medium text-foreground" onClick={() => setIsMenuOpen(false)}>Grooming</Link>
            <Link to="/veterinary" className="py-2 text-sm font-medium text-foreground" onClick={() => setIsMenuOpen(false)}>Veterinary</Link>
            <Link to="/about" className="py-2 text-sm font-medium text-foreground" onClick={() => setIsMenuOpen(false)}>About</Link>
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

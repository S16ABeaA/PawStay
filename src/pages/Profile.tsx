import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Camera, 
  Shield, 
  Settings, 
  LogOut,
  Heart,
  Calendar,
  PawPrint,
  ChevronRight,
  Sun,
  Moon
} from "lucide-react";
import { useTheme } from "next-themes";
import { useToast } from "@/hooks/use-toast";

import { authApi } from "../services/authApi";

const formatPhoneInput = (value: string) => value.replace(/[^\d\s\-+()]/g, "");
const isValidPhoneNumber = (phone: string) => {
  if (!phone) return true; // empty is ok (optional)
  const digitsOnly = phone.replace(/\D/g, "");
  return digitsOnly.length >= 7 && digitsOnly.length <= 15;
};
import { petApi } from "@/services/petApi";

type ProfilePet = {
  id: string;
  name: string;
  species: string;
  breed: string;
  photo_url?: string | null;
};

const Profile = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();

  // Notification preferences (persisted in localStorage)
  const [emailNotif, setEmailNotif] = useState(() => {
    const saved = localStorage.getItem("pawstay.pref.emailNotif");
    return saved !== null ? saved === "true" : true;
  });
  const [smsNotif, setSmsNotif] = useState(() => {
    const saved = localStorage.getItem("pawstay.pref.smsNotif");
    return saved !== null ? saved === "true" : false;
  });
  const [marketingNotif, setMarketingNotif] = useState(() => {
    const saved = localStorage.getItem("pawstay.pref.marketingNotif");
    return saved !== null ? saved === "true" : true;
  });

  const togglePref = (key: string, value: boolean, setter: (v: boolean) => void) => {
    setter(value);
    localStorage.setItem(`pawstay.pref.${key}`, String(value));
    toast({ title: "Preference Updated", description: `Setting has been ${value ? "enabled" : "disabled"}.` });
  };
  
  // Simulated user data - in real app, this would come from auth context
  // const [user, setUser] = useState({
  //   firstName: "John",
  //   lastName: "Doe",
  //   email: "john.doe@example.com",
  //   phone: "+1 234 567 8900",
  //   address: "123 Pet Street, San Francisco, CA",
  //   avatar: "",
  //   isAdmin: true, // Simulated admin role
  // });

  const [user, setUser] = useState<any>(null);
  const [pets, setPets] = useState<ProfilePet[]>([]);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const profile = await authApi.getProfile();
        console.log("[FRONTEND] Profile response:", profile);

        if (!profile?.user) {
          navigate("/signin");
        }

        setUser({
          firstName: profile.user.first_name,
          lastName: profile.user.last_name,
          email: profile.user.email,
          phone: profile.user.phone || "",
          address: profile.user.address || "",
          avatar: profile.user.avatar_url || "",
          isAdmin: profile.user.role === "admin",
          isSuperAdmin: profile.user.role === "super_admin",
        });

        // Fetch this user's pets for the profile overview
        try {
          const petRes = await petApi.list();
          const mapped: ProfilePet[] = (petRes.pets ?? []).map((p: any) => ({
            id: p.id,
            name: p.name,
            species: p.species,
            breed: p.breed,
            photo_url: p.photo_url,
          }));
          setPets(mapped);
        } catch (petErr) {
          console.error("Failed to load pets for profile:", petErr);
        }
      } catch (err) {
        console.error("Failed to fetch profile:", err);
        toast({ title: "Error", description: "Failed to load profile. Please try again." });
        navigate("/signin");
      }
    };

    fetchProfile();
  }, []);

  const [isEditing, setIsEditing] = useState(false);

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setUser({ ...user, avatar: base64 });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    if (!user.firstName.trim() || !user.lastName.trim()) {
      toast({ title: "Validation Error", description: "First name and last name are required.", variant: "destructive" });
      return;
    }
    if (user.phone && !isValidPhoneNumber(user.phone)) {
      toast({ title: "Invalid Phone Number", description: "Please enter a valid phone number (digits, spaces, dashes, and parentheses only, at least 7 digits).", variant: "destructive" });
      return;
    }
    try {
      const res = await authApi.updateProfile({
        first_name: user.firstName,
        last_name: user.lastName,
        phone: user.phone,
        address: user.address,
        avatar_url: user.avatar,
      });
      // Update local state with the response
      setUser({
        ...user,
        firstName: res.user.first_name,
        lastName: res.user.last_name,
        phone: res.user.phone,
        address: res.user.address,
        avatar: res.user.avatar_url,
        email: res.user.email,
      });
      setIsEditing(false);
      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully.",
      });
    } catch (err: any) {
      console.error("Failed to update profile:", err);
      toast({
        title: "Error",
        description: err?.error || "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleLogout =  async() => {
    try{
      await authApi.signOut();
      localStorage.removeItem("pawstay.authenticated");
      toast({
        title: "Signed Out",
        description: "You have been signed out successfully.",
      });
      setUser(null);
      navigate("/signin");
    }catch(err){
      toast({ 
        title: "Error", 
        description: err.message || "Failed to sign out. Please try again." 
      });
      return;
    }
  };

  const handleSwitchToAdmin = () => {
    navigate("/admin");
  };
  if(!user){
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading profile...</p>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="py-8 md:py-12">
        <div className="container max-w-4xl">
          {/* Profile Header */}
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6 mb-8">
            <div className="relative">
              <Avatar className="h-24 w-24 border-4 border-background shadow-elevated">
                <AvatarImage src={user.avatar} />
                <AvatarFallback className="bg-gradient-hero text-2xl text-white">
                  {user.firstName[0]}{user.lastName[0]}
                </AvatarFallback>
              </Avatar>
              <button className="absolute bottom-0 right-0 h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-soft hover:bg-primary/90 transition-colors">
                <label className="cursor-pointer flex items-center justify-center w-full h-full">
                  <Camera className="h-4 w-4" />
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarUpload}
                  />
                </label>
              </button>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground">
                  {user.firstName} {user.lastName}
                </h1>
                {user.isAdmin && (
                  <Badge variant="secondary" className="bg-primary/10 text-primary">
                    <Shield className="h-3 w-3 mr-1" />
                    Admin
                  </Badge>
                )}
              </div>
              <p className="text-muted-foreground">{user.email}</p>
            </div>
            <div className="flex gap-2">
              {isEditing ? (
                <>
                  <Button variant="outline" onClick={() => setIsEditing(false)}>
                    Cancel
                  </Button>
                  <Button variant="hero" onClick={handleSave}>
                    Save Changes
                  </Button>
                </>
              ) : (
                <Button variant="outline" onClick={() => setIsEditing(true)}>
                  <Settings className="h-4 w-4 mr-2" />
                  Edit Profile
                </Button>
              )}
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Main Profile Info */}
            <div className="md:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5 text-primary" />
                    Personal Information
                  </CardTitle>
                  <CardDescription>
                    Manage your personal details and contact information
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name</Label>
                      <Input
                        id="firstName"
                        value={user.firstName}
                        onChange={(e) => setUser({ ...user, firstName: e.target.value })}
                        disabled={!isEditing}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        id="lastName"
                        value={user.lastName}
                        onChange={(e) => setUser({ ...user, lastName: e.target.value })}
                        disabled={!isEditing}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        value={user.email}
                        onChange={(e) => setUser({ ...user, email: e.target.value })}
                        disabled={!isEditing}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="phone"
                        type="tel"
                        value={user.phone}
                        onChange={(e) => setUser({ ...user, phone: formatPhoneInput(e.target.value) })}
                        disabled={!isEditing}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="address">Address</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="address"
                        value={user.address}
                        onChange={(e) => setUser({ ...user, address: e.target.value })}
                        disabled={!isEditing}
                        className="pl-10"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* My Pets Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PawPrint className="h-5 w-5 text-primary" />
                    My Pets
                  </CardTitle>
                  <CardDescription>
                    Manage your pet profiles for easier bookings
                  </CardDescription>
                </CardHeader>
                <CardContent>
                   {pets.length === 0 ? (
                     <div className="flex flex-col items-center justify-center py-8 text-center">
                       <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                         <PawPrint className="h-8 w-8 text-muted-foreground" />
                       </div>
                       <p className="text-muted-foreground mb-4">No pets added yet</p>
                       <Link to="/my-pets">
                         <Button variant="outline">
                           Add Your First Pet
                         </Button>
                       </Link>
                    </div>
                   ) : (
                     <div className="space-y-3">
                       {pets.map((pet) => (
                         <div key={pet.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                           <Avatar className="h-12 w-12 border-2 border-background">
                               <AvatarImage src={pet.photo_url || undefined} className="object-cover" />
                             <AvatarFallback className="bg-gradient-hero text-white text-sm">
                               {pet.name[0]}
                             </AvatarFallback>
                           </Avatar>
                           <div className="flex-1 min-w-0">
                             <p className="text-sm font-medium truncate">{pet.name}</p>
                             <p className="text-xs text-muted-foreground">{pet.breed}</p>
                             </div>
                         </div>
                       ))}
                       <Link to="/my-pets">
                         <Button variant="outline" className="w-full mt-2">
                           Manage Pets
                         </Button>
                       </Link>
                     </div>
                   )}
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Admin Switch Card */}
              {user.isAdmin && (
                <Card className="border-primary/20 bg-primary/5">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Shield className="h-5 w-5 text-primary" />
                      Admin Access
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      You have admin privileges. Switch to the management interface to manage your properties.
                    </p>
                    <Button 
                      variant="hero" 
                      className="w-full"
                      onClick={handleSwitchToAdmin}
                    >
                      Go to Admin Panel
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* Quick Links */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Quick Links</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Link to="/favorites">
                    <Button variant="ghost" className="w-full justify-start">
                      <Heart className="h-4 w-4 mr-3 text-muted-foreground" />
                      My Favorites
                    </Button>
                  </Link>
                  <Link to="/my-bookings">
                    <Button variant="ghost" className="w-full justify-start">
                      <Calendar className="h-4 w-4 mr-3 text-muted-foreground" />
                      My Bookings
                    </Button>
                  </Link>
                  <Separator className="my-2" />
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={handleLogout}
                  >
                    <LogOut className="h-4 w-4 mr-3" />
                    Sign Out
                  </Button>
                </CardContent>
              </Card>

              {/* Account Settings */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Account Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Dark / Light Mode */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {theme === "dark" ? (
                        <Moon className="h-4 w-4 text-primary" />
                      ) : (
                        <Sun className="h-4 w-4 text-primary" />
                      )}
                      <div>
                        <p className="text-sm font-medium">Dark Mode</p>
                        <p className="text-xs text-muted-foreground">
                          {theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={theme === "dark"}
                      onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Email Notifications</p>
                      <p className="text-xs text-muted-foreground">Receive booking updates</p>
                    </div>
                    <Switch
                      checked={emailNotif}
                      onCheckedChange={(v) => togglePref("emailNotif", v, setEmailNotif)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">SMS Notifications</p>
                      <p className="text-xs text-muted-foreground">Get text reminders</p>
                    </div>
                    <Switch
                      checked={smsNotif}
                      onCheckedChange={(v) => togglePref("smsNotif", v, setSmsNotif)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Marketing Emails</p>
                      <p className="text-xs text-muted-foreground">Deals and promotions</p>
                    </div>
                    <Switch
                      checked={marketingNotif}
                      onCheckedChange={(v) => togglePref("marketingNotif", v, setMarketingNotif)}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Profile;

import { useEffect, useRef, useState } from "react";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  const [addressParts, setAddressParts] = useState({
    street: "",
    barangay: "",
    city: "",
    province: "",
    zip: "",
  });
  const [originalAddressParts, setOriginalAddressParts] = useState({
    street: "",
    barangay: "",
    city: "",
    province: "",
    zip: "",
  });

  const parseAddress = (address: string) => {
    // Expected format: "street | barangay | city | province | zip"
    const parts = address.split(" | ").map((s) => s.trim());
    return {
      street: parts[0] || "",
      barangay: parts[1] || "",
      city: parts[2] || "",
      province: parts[3] || "",
      zip: parts[4] || "",
    };
  };

  const combineAddress = (parts: typeof addressParts) => {
    const filled = [parts.street, parts.barangay, parts.city, parts.province, parts.zip].filter(Boolean);
    return filled.length > 0 ? filled.join(" | ") : "";
  };

  const [isEditing, setIsEditing] = useState(false);
  const [originalUser, setOriginalUser] = useState<any>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const profile = await authApi.getProfile();
        console.log("[FRONTEND] Profile response:", profile);

        if (!profile?.user) {
          navigate("/signin");
        }
        const formatted = {
          firstName: profile.user.first_name,
          lastName: profile.user.last_name,
          email: profile.user.email,
          isVerified: Boolean(profile.user.is_verified ?? profile.user.email_confirmed_at),
          phone: profile.user.phone || "",
          address: profile.user.address || "",
          avatar: profile.user.avatar_url || "",
          isAdmin: profile.user.role === "proprietor",
          isSuperAdmin: profile.user.role === "super_admin",
        };
        setUser(formatted);
        setOriginalUser({ ...formatted });

        const parsed = parseAddress(formatted.address);
        setAddressParts(parsed);
        setOriginalAddressParts({ ...parsed });
        // setUser({
        //   ...formatted, 
        //   firstName: profile.user.first_name,
        //   lastName: profile.user.last_name,
        //   email: profile.user.email,
        //   phone: profile.user.phone || "",
        //   address: profile.user.address || "",
        //   avatar: profile.user.avatar_url || "",
        //   isAdmin: profile.user.role === "admin",
        //   isSuperAdmin: profile.user.role === "super_admin",
        // });

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

  const handleEdit = () => {
    setOriginalUser({ ...user });
    setFieldErrors({});
    setIsEditing(true);
  };

  const handleCancel = () => {
    if (originalUser) setUser(originalUser);
    setAddressParts({ ...originalAddressParts });
    setFieldErrors({});
    setIsEditing(false);
  };

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const validateFields = () => {
    const errors: Record<string, string> = {};

    if (!user.firstName.trim()) {
      errors.firstName = "First name is required.";
    }
    if (!user.lastName.trim()) {
      errors.lastName = "Last name is required.";
    }

    // Phone: optional, but if provided must be a valid PH number
    // Accepts 09XXXXXXXXX, +639XXXXXXXXX, or 639XXXXXXXXX
    if (user.phone && !/^(\+?63|0)9\d{9}$/.test(user.phone.trim().replace(/[\s\-]/g, ""))) {
      errors.phone = "Enter a valid PH mobile number (e.g. 09171234567).";
    }

    // Address: optional, but if partially filled check minimum
    const hasAnyAddress = Object.values(user.addressParts || addressParts).some((v: any) => v.trim());
    if (hasAnyAddress) {
      if (!addressParts.street.trim()) errors.street = "Street is required if adding an address.";
      if (!addressParts.city.trim()) errors.city = "City is required if adding an address.";
      if (!addressParts.province.trim()) errors.province = "Province is required if adding an address.";
      if (addressParts.zip && !/^\d{4}$/.test(addressParts.zip.trim())) {
        errors.zip = "Enter a valid 4-digit PH zip code.";
      }
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async () => {
    if (!validateFields()) return;

    const combinedAddress = combineAddress(addressParts);

    try {
      const result = await authApi.updateProfile({
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        address: combinedAddress,
      });

      if (result?.user) {
        const newAddress = result.user.address || "";
        const newParts = parseAddress(newAddress);
        setUser((prev: any) => ({
          ...prev,
          firstName: result.user.first_name,
          lastName: result.user.last_name,
          phone: result.user.phone || "",
          address: newAddress,
        }));
        setAddressParts(newParts);
        setOriginalAddressParts({ ...newParts });
      }

      setIsEditing(false);
      setOriginalUser(null);
      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully.",
      });
    } catch (err: any) {
      console.error("Failed to update profile:", err);
      toast({
        title: "Error",
        description: err?.error || err?.message || "Failed to update profile. Please try again.",
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

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [isAvatarDialogOpen, setIsAvatarDialogOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isViewAvatarOpen, setIsViewAvatarOpen] = useState(false);

  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      toast({ title: "Invalid file", description: "Please upload a JPEG, PNG or WebP image." });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "File too large", description: "Maximum file size is 5MB." });
      return;
    }

    // Show preview
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
    setIsAvatarDialogOpen(true);

    // Reset input so the same file can be re-selected
    if (avatarInputRef.current) avatarInputRef.current.value = "";
  };

  const handleAvatarConfirm = async () => {
    if (!avatarFile) return;
    setIsUploading(true);
    try {
      const result = await authApi.uploadAvatar(avatarFile);
      setUser((prev: any) => ({ ...prev, avatar: result.avatar_url }));
      window.dispatchEvent(new CustomEvent("pawstay:avatar-updated", { detail: { avatarUrl: result.avatar_url } }));
      toast({ title: "Avatar Updated", description: "Your profile picture has been updated." });
      setIsAvatarDialogOpen(false);
    } catch (err: any) {
      console.error("Failed to upload avatar:", err);
      toast({ title: "Error", description: err?.error || "Failed to upload avatar. Please try again." });
    } finally {
      setIsUploading(false);
    }
  };

  const handleAvatarCancel = () => {
    if (avatarPreview) URL.revokeObjectURL(avatarPreview);
    setAvatarPreview(null);
    setAvatarFile(null);
    setIsAvatarDialogOpen(false);
  };

  const handleSwitchToAdmin = () => {
    if (user?.isSuperAdmin) {
      navigate("/superadmin");
    } else {
      navigate("/admin");
    }
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
              <Avatar
                className="h-24 w-24 border-4 border-background shadow-elevated cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => setIsViewAvatarOpen(true)}
              >
                <AvatarImage src={user.avatar} />
                <AvatarFallback className="bg-gradient-hero text-2xl text-white">
                  {user.firstName[0]}{user.lastName[0]}
                </AvatarFallback>
              </Avatar>
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleAvatarSelect}
              />
              <button
                onClick={() => avatarInputRef.current?.click()}
                className="absolute bottom-0 right-0 h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-soft hover:bg-primary/90 transition-colors"
              >
                <Camera className="h-4 w-4" />
              </button>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground">
                  {user.firstName} {user.lastName}
                </h1>
                {user.isSuperAdmin && (
                  <Badge variant="secondary" className="bg-violet-100 text-violet-700 dark:bg-violet-600/20 dark:text-violet-400">
                    <Shield className="h-3 w-3 mr-1" />
                    Super Admin
                  </Badge>
                )}
                {user.isAdmin && !user.isSuperAdmin && (
                  <Badge variant="secondary" className="bg-primary/10 text-primary">
                    <Shield className="h-3 w-3 mr-1" />
                    Admin
                  </Badge>
                )}
                <Badge
                  variant="outline"
                  className={user.isVerified ? "border-emerald-300 text-emerald-700" : "border-amber-300 text-amber-700"}
                >
                  {user.isVerified ? "Verified" : "Unverified"}
                </Badge>
              </div>
              <p className="text-muted-foreground">{user.email}</p>
            </div>
            <div className="flex gap-2">
              {isEditing ? (
                <>
                  <Button variant="outline" onClick={handleCancel}>
                    Cancel
                  </Button>
                  <Button variant="hero" onClick={handleSave}>
                    Save Changes
                  </Button>
                </>
              ) : (
                <Button variant="outline" onClick={handleEdit}>
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
                        className={fieldErrors.firstName ? "border-destructive" : ""}
                      />
                      {fieldErrors.firstName && (
                        <p className="text-xs text-destructive">{fieldErrors.firstName}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        id="lastName"
                        value={user.lastName}
                        onChange={(e) => setUser({ ...user, lastName: e.target.value })}
                        disabled={!isEditing}
                        className={fieldErrors.lastName ? "border-destructive" : ""}
                      />
                      {fieldErrors.lastName && (
                        <p className="text-xs text-destructive">{fieldErrors.lastName}</p>
                      )}
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
                        disabled
                        // ={!isEditing}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      {!isEditing && !user.phone ? (
                        <div
                          onClick={handleEdit}
                          className="flex items-center h-10 w-full rounded-md border border-dashed border-muted-foreground/30 bg-muted/20 pl-10 pr-3 text-sm text-muted-foreground cursor-pointer hover:border-primary/50 hover:bg-muted/30 transition-colors"
                        >
                          + Add phone number
                        </div>
                      ) : (
                        <Input
                          id="phone"
                          type="tel"
                          value={user.phone}
                          placeholder="e.g. 09171234567"
                          onChange={(e) => setUser({ ...user, phone: e.target.value })}
                          disabled={!isEditing}
                          className={`pl-10${fieldErrors.phone ? " border-destructive" : ""}`}
                        />
                      )}
                    </div>
                    {fieldErrors.phone && (
                      <p className="text-xs text-destructive">{fieldErrors.phone}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>Address</Label>
                    {!isEditing && !user.address ? (
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <div
                          onClick={handleEdit}
                          className="flex items-center h-10 w-full rounded-md border border-dashed border-muted-foreground/30 bg-muted/20 pl-10 pr-3 text-sm text-muted-foreground cursor-pointer hover:border-primary/50 hover:bg-muted/30 transition-colors"
                        >
                          + Add address
                        </div>
                      </div>
                    ) : isEditing ? (
                      <div className="space-y-3 rounded-lg border border-border p-4 bg-muted/10">
                        <div className="space-y-1">
                          <Label htmlFor="street" className="text-xs text-muted-foreground">Street / House No.</Label>
                          <Input
                            id="street"
                            value={addressParts.street}
                            placeholder="e.g. 123 Rizal Street"
                            onChange={(e) => setAddressParts({ ...addressParts, street: e.target.value })}
                            className={fieldErrors.street ? "border-destructive" : ""}
                          />
                          {fieldErrors.street && <p className="text-xs text-destructive">{fieldErrors.street}</p>}
                        </div>
                        <div className="space-y-1">
                          <Label htmlFor="barangay" className="text-xs text-muted-foreground">Barangay</Label>
                          <Input
                            id="barangay"
                            value={addressParts.barangay}
                            placeholder="e.g. Brgy. San Antonio"
                            onChange={(e) => setAddressParts({ ...addressParts, barangay: e.target.value })}
                          />
                        </div>
                        <div className="grid sm:grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <Label htmlFor="city" className="text-xs text-muted-foreground">City / Municipality</Label>
                            <Input
                              id="city"
                              value={addressParts.city}
                              placeholder="e.g. Makati City"
                              onChange={(e) => setAddressParts({ ...addressParts, city: e.target.value })}
                              className={fieldErrors.city ? "border-destructive" : ""}
                            />
                            {fieldErrors.city && <p className="text-xs text-destructive">{fieldErrors.city}</p>}
                          </div>
                          <div className="space-y-1">
                            <Label htmlFor="province" className="text-xs text-muted-foreground">Province</Label>
                            <Input
                              id="province"
                              value={addressParts.province}
                              placeholder="e.g. Metro Manila"
                              onChange={(e) => setAddressParts({ ...addressParts, province: e.target.value })}
                              className={fieldErrors.province ? "border-destructive" : ""}
                            />
                            {fieldErrors.province && <p className="text-xs text-destructive">{fieldErrors.province}</p>}
                          </div>
                        </div>
                        <div className="w-1/3">
                          <div className="space-y-1">
                            <Label htmlFor="zip" className="text-xs text-muted-foreground">Zip Code</Label>
                            <Input
                              id="zip"
                              value={addressParts.zip}
                              placeholder="e.g. 1200"
                              maxLength={4}
                              onChange={(e) => setAddressParts({ ...addressParts, zip: e.target.value.replace(/\D/g, "") })}
                              className={fieldErrors.zip ? "border-destructive" : ""}
                            />
                            {fieldErrors.zip && <p className="text-xs text-destructive">{fieldErrors.zip}</p>}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          value={[
                            addressParts.street,
                            addressParts.barangay,
                            addressParts.city,
                            addressParts.province,
                            addressParts.zip,
                          ].filter(Boolean).join(", ")}
                          disabled
                          className="pl-10"
                        />
                      </div>
                    )}
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
              {/* Super Admin Switch Card */}
              {user.isSuperAdmin && (
                <Card className="border-violet-500/30 bg-violet-500/5">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Shield className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                      Super Admin Access
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      You have full platform control. Access the Super Admin dashboard to manage users, properties, analytics, and platform settings.
                    </p>
                    <Button
                      className="w-full bg-violet-600 hover:bg-violet-700 text-white"
                      onClick={handleSwitchToAdmin}
                    >
                      Go to Super Admin Panel
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* Admin Switch Card */}
              {user.isAdmin && !user.isSuperAdmin && (
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

      {/* Avatar Preview Dialog */}
      <Dialog open={isAvatarDialogOpen} onOpenChange={(open) => { if (!open) handleAvatarCancel(); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Update Profile Picture</DialogTitle>
            <DialogDescription>
              Preview your new profile picture before saving.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-center py-4">
            <Avatar className="h-32 w-32 border-4 border-background shadow-elevated">
              {avatarPreview && <AvatarImage src={avatarPreview} className="object-cover" />}
              <AvatarFallback className="bg-gradient-hero text-3xl text-white">
                {user?.firstName?.[0]}{user?.lastName?.[0]}
              </AvatarFallback>
            </Avatar>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={handleAvatarCancel} disabled={isUploading}>
              Cancel
            </Button>
            <Button variant="hero" onClick={handleAvatarConfirm} disabled={isUploading}>
              {isUploading ? "Uploading..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Avatar Full-Size Dialog */}
      <Dialog open={isViewAvatarOpen} onOpenChange={setIsViewAvatarOpen}>
        <DialogContent className="sm:max-w-lg flex flex-col items-center">
          <DialogHeader>
            <DialogTitle>Profile Picture</DialogTitle>
          </DialogHeader>
          <div className="flex justify-center py-4">
            {user?.avatar ? (
              <img
                src={user.avatar}
                alt={`${user.firstName} ${user.lastName}`}
                className="max-h-[60vh] max-w-full rounded-xl object-contain"
              />
            ) : (
              <Avatar className="h-48 w-48 border-4 border-background shadow-elevated">
                <AvatarFallback className="bg-gradient-hero text-5xl text-white">
                  {user?.firstName?.[0]}{user?.lastName?.[0]}
                </AvatarFallback>
              </Avatar>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Profile;

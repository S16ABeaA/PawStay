import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { settingsApi, SettingsData } from "@/services/settingsApi";
import { Building2, Bell, CreditCard, Shield, Clock, Upload, X, QrCode, Smartphone, Wallet, Banknote, Loader2, FileText, CheckCircle2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useAdminProperty } from "@/hooks/useAdminProperty";

// Property Setup Options
const bookingRuleOptions = [
  { name: "Advance booking required", description: "Set minimum notice period" },
  { name: "Same-day booking allowed", description: "Accept last-minute bookings" },
  { name: "Minimum stay requirements", description: "Set minimum nights/days" },
  { name: "Maximum stay limits", description: "Set maximum stay duration" },
  { name: "Deposit required", description: "Require payment to secure booking" },
  { name: "Full payment upfront", description: "Require full payment at booking" },
];

const complianceOptions = [
  { name: "Health certificate required", description: "Vet health check certificate" },
  { name: "Vaccination records required", description: "Proof of up-to-date vaccinations", required: true },
  { name: "Parasite prevention proof", description: "Flea/tick/heartworm prevention" },
  { name: "Microchip identification", description: "Pet must have microchip ID" },
  { name: "Breed-specific restrictions apply", description: "Certain breeds not accepted" },
  { name: "Age restrictions apply", description: "Minimum/maximum pet age" }
];

const vaccinationOptions = [
  { name: "Rabies vaccination required" },
  { name: "DHPP/FVRCP vaccination required" },
  { name: "Bordetella vaccination required" },
  { name: "Flea prevention required" },
  { name: "Tick prevention required" },
  { name: "Heartworm prevention required" },
  { name: "Proof of vaccination at check-in" },
];

const vetAvailabilityOptions = [
  { name: "Licensed veterinarian on-call 24/7" },
  { name: "Partnership with veterinary clinic" },
  { name: "Daily health checks for all animals" },
  { name: "Medication administration available" },
  { name: "Emergency care available" },
  { name: "Preventive care services available" },
  { name: "Dental services available" },
];

const sanitationOptions = [
  { name: "Full facility sanitization daily" },
  { name: "Separate isolation area for sick animals" },
  { name: "Medical-grade disinfectants used" },
  { name: "Individual bedding laundered daily" },
  { name: "Sick animals isolated from healthy animals" },
  { name: "Staff hand-washing between animal interactions" },
  { name: "Separate areas for different species" },
];

const AdminSettings = () => {
  const { toast } = useToast();
  const { selectedPropertyId, loading: propLoading } = useAdminProperty();

  const [loading, setLoading] = useState(true);
  const [business, setBusiness] = useState<SettingsData["business"]>({
    name: "",
    phone: "",
    website: "",
    description: "",
    address: "",
    capacity: 0,
  });
  const [notifications, setNotifications] = useState<SettingsData["notifications"]>({
    newBookings: true,
    bookingReminders: true,
    newReviews: true,
    marketingUpdates: false,
  });
  const [availability, setAvailability] = useState<SettingsData["availability"]>({
    maxCapacity: 0,
    minStay: 1,
    checkInTime: "09:00",
    checkOutTime: "17:00",
    sameDayBookings: true,
  });

  // Payment settings state
  const [acceptedMethods, setAcceptedMethods] = useState<string[]>([]);
  const [qrCodeGCash, setQrCodeGCash] = useState<string | null>(null);
  const [qrCodePayMaya, setQrCodePayMaya] = useState<string | null>(null);
  const gcashInputRef = useRef<HTMLInputElement>(null);
  const paymayaInputRef = useRef<HTMLInputElement>(null);

  // Property setup state - restructured for checkbox/select inputs
  const [propertySetup, setPropertySetup] = useState({
    unvaccinatedPolicy: false,
    unvaccinatedPolicyDetails: "",
    breedRestrictions: false,
    breedRestrictionsDetails: "",
    aggressivePolicy: false,
    aggressivePolicyDetails: "",
    bookingRules: [] as string[],
    complianceRequirements: [] as string[],
    vaccinationRequirements: [] as string[],
    emergencyProcedures: "",
    vetAvailability: [] as string[],
    isolationSanitationProtocols: [] as string[],
  });

  useEffect(() => {
    if (propLoading) return;

    let isActive = true;

    const loadSettings = async () => {
      try {
        setLoading(true);
        const data = await settingsApi.getSettings(selectedPropertyId);
        if (!isActive) return;

        setBusiness(data.business);
        setNotifications(data.notifications);
        setAvailability(data.availability);
        setAcceptedMethods(data.payment.acceptedMethods || []);
        setQrCodeGCash(data.payment.gcashQrUrl || null);
        setQrCodePayMaya(data.payment.paymayaQrUrl || null);
        
        // Deserialize property setup data
        if (data.propertySetup) {
          setPropertySetup({
            unvaccinatedPolicy: data.propertySetup.unvaccinatedPolicy || false,
            unvaccinatedPolicyDetails: data.propertySetup.unvaccinatedPolicyDetails || "",
            breedRestrictions: data.propertySetup.breedRestrictions || false,
            breedRestrictionsDetails: data.propertySetup.breedRestrictionsDetails || "",
            aggressivePolicy: data.propertySetup.aggressivePolicy || false,
            aggressivePolicyDetails: data.propertySetup.aggressivePolicyDetails || "",
            bookingRules: Array.isArray(data.propertySetup.bookingRules) ? data.propertySetup.bookingRules : [],
            complianceRequirements: Array.isArray(data.propertySetup.complianceRequirements) ? data.propertySetup.complianceRequirements : [],
            vaccinationRequirements: Array.isArray(data.propertySetup.vaccinationRequirements) ? data.propertySetup.vaccinationRequirements : [],
            emergencyProcedures: data.propertySetup.emergencyProcedures || "",
            vetAvailability: Array.isArray(data.propertySetup.vetAvailability) ? data.propertySetup.vetAvailability : [],
            isolationSanitationProtocols: Array.isArray(data.propertySetup.isolationSanitationProtocols) ? data.propertySetup.isolationSanitationProtocols : [],
          });
        }
      } catch (err) {
        console.error("Failed to load settings", err);
        toast({
          title: "Failed to load settings",
          description: "Please try again in a moment.",
          variant: "destructive",
        });
      } finally {
        if (isActive) setLoading(false);
      }
    };

    loadSettings();
    return () => {
      isActive = false;
    };
  }, [selectedPropertyId, propLoading, toast]);

  const toggleMethod = (method: string) => {
    setAcceptedMethods((prev) =>
      prev.includes(method) ? prev.filter((m) => m !== method) : [...prev, method]
    );
  };

  const handleQRUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (val: string | null) => void
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setter(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveBusiness = async () => {
    try {
      await settingsApi.updateBusiness({
        name: business.name,
        phone: business.phone,
        website: business.website,
        description: business.description,
        address: business.address,
        property_id: selectedPropertyId || undefined,
      });
      toast({
        title: "Business info saved",
        description: "Your business details have been updated.",
      });
    } catch (err) {
      console.error("Failed to update business", err);
      toast({
        title: "Update failed",
        description: "Unable to save business details.",
        variant: "destructive",
      });
    }
  };

  const handleSaveNotifications = async () => {
    try {
      await settingsApi.updateNotifications(notifications);
      toast({
        title: "Preferences saved",
        description: "Your notification preferences have been updated.",
      });
    } catch (err) {
      console.error("Failed to update notifications", err);
      toast({
        title: "Update failed",
        description: "Unable to save notification preferences.",
        variant: "destructive",
      });
    }
  };

  const handleSaveAvailability = async () => {
    try {
      await settingsApi.updateAvailability({ ...availability, property_id: selectedPropertyId || undefined });
      toast({
        title: "Availability saved",
        description: "Your availability settings have been updated.",
      });
    } catch (err) {
      console.error("Failed to update availability", err);
      toast({
        title: "Update failed",
        description: "Unable to save availability settings.",
        variant: "destructive",
      });
    }
  };

  const handleSavePayment = async () => {
    try {
      await settingsApi.updatePayment({
        acceptedMethods,
        gcashQrUrl: qrCodeGCash,
        paymayaQrUrl: qrCodePayMaya,
        property_id: selectedPropertyId || undefined,
      });
      toast({
        title: "Payment settings saved",
        description: "Your payment methods and QR codes have been updated.",
      });
    } catch (err) {
      console.error("Failed to update payment", err);
      toast({
        title: "Update failed",
        description: "Unable to save payment settings.",
        variant: "destructive",
      });
    }
  };

  const handleSavePropertySetup = async () => {
    try {
      await settingsApi.updatePropertySetup({
        unvaccinatedPolicy: propertySetup.unvaccinatedPolicy,
        unvaccinatedPolicyDetails: propertySetup.unvaccinatedPolicyDetails,
        breedRestrictions: propertySetup.breedRestrictions,
        breedRestrictionsDetails: propertySetup.breedRestrictionsDetails,
        aggressivePolicy: propertySetup.aggressivePolicy,
        aggressivePolicyDetails: propertySetup.aggressivePolicyDetails,
        bookingRules: propertySetup.bookingRules,
        complianceRequirements: propertySetup.complianceRequirements,
        vaccinationRequirements: propertySetup.vaccinationRequirements,
        emergencyProcedures: propertySetup.emergencyProcedures,
        vetAvailability: propertySetup.vetAvailability,
        isolationSanitationProtocols: propertySetup.isolationSanitationProtocols,
        property_id: selectedPropertyId || undefined,
      } as any);
      toast({
        title: "Property setup saved",
        description: "Your property policies and requirements have been updated.",
      });
    } catch (err) {
      console.error("Failed to update property setup", err);
      toast({
        title: "Update failed",
        description: "Unable to save property setup.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <AdminLayout title="Settings" subtitle="Manage your business preferences">
        <div className="flex h-96 flex-col items-center justify-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Loading settings...</span>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Settings" subtitle="Manage your business preferences">
      <Tabs defaultValue="business" className="space-y-6">
        <TabsList>
          <TabsTrigger value="business" className="gap-2">
            <Building2 className="h-4 w-4" />
            Business
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2">
            <Bell className="h-4 w-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="availability" className="gap-2">
            <Clock className="h-4 w-4" />
            Availability
          </TabsTrigger>
          <TabsTrigger value="payment" className="gap-2">
            <QrCode className="h-4 w-4" />
            Payment & QR
          </TabsTrigger>
          <TabsTrigger value="property-setup" className="gap-2">
            <FileText className="h-4 w-4" />
            Property Setup
          </TabsTrigger>
          <TabsTrigger value="billing" className="gap-2">
            <CreditCard className="h-4 w-4" />
            Billing
          </TabsTrigger>
        </TabsList>

        <TabsContent value="business">
          <Card>
            <CardHeader>
              <CardTitle>Business Information</CardTitle>
              <CardDescription>Update your business details visible to customers</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="businessName">Business Name</Label>
                  <Input
                    id="businessName"
                    value={business.name}
                    onChange={(e) => setBusiness((prev) => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    value={business.phone}
                    onChange={(e) => setBusiness((prev) => ({ ...prev, phone: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    value={business.website}
                    onChange={(e) => setBusiness((prev) => ({ ...prev, website: e.target.value }))}
                  />
                </div>
                <div className="md:col-span-2 space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    value={business.address}
                    onChange={(e) => setBusiness((prev) => ({ ...prev, address: e.target.value }))}
                  />
                </div>
                <div className="md:col-span-2 space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    rows={4}
                    value={business.description}
                    onChange={(e) => setBusiness((prev) => ({ ...prev, description: e.target.value }))}
                  />
                </div>
              </div>
              <Button variant="hero" onClick={handleSaveBusiness}>Save Changes</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>Choose how you want to receive updates</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">New Bookings</p>
                    <p className="text-sm text-muted-foreground">Get notified when you receive a new booking</p>
                  </div>
                  <Switch
                    checked={notifications.newBookings}
                    onCheckedChange={(checked) =>
                      setNotifications((prev) => ({ ...prev, newBookings: checked }))
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Booking Reminders</p>
                    <p className="text-sm text-muted-foreground">Remind about upcoming check-ins and check-outs</p>
                  </div>
                  <Switch
                    checked={notifications.bookingReminders}
                    onCheckedChange={(checked) =>
                      setNotifications((prev) => ({ ...prev, bookingReminders: checked }))
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">New Reviews</p>
                    <p className="text-sm text-muted-foreground">Get notified when customers leave reviews</p>
                  </div>
                  <Switch
                    checked={notifications.newReviews}
                    onCheckedChange={(checked) =>
                      setNotifications((prev) => ({ ...prev, newReviews: checked }))
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Marketing Updates</p>
                    <p className="text-sm text-muted-foreground">Tips and promotions from PawStay</p>
                  </div>
                  <Switch
                    checked={notifications.marketingUpdates}
                    onCheckedChange={(checked) =>
                      setNotifications((prev) => ({ ...prev, marketingUpdates: checked }))
                    }
                  />
                </div>
              </div>
              <Button variant="hero" onClick={handleSaveNotifications}>Save Preferences</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="availability">
          <Card>
            <CardHeader>
              <CardTitle>Availability Settings</CardTitle>
              <CardDescription>Set your business hours and capacity</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Maximum Capacity</Label>
                  <Input
                    type="number"
                    value={availability.maxCapacity.toString()}
                    onChange={(e) =>
                      setAvailability((prev) => ({
                        ...prev,
                        maxCapacity: Number(e.target.value || 0),
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Minimum Stay (nights)</Label>
                  <Input
                    type="number"
                    value={availability.minStay.toString()}
                    onChange={(e) =>
                      setAvailability((prev) => ({
                        ...prev,
                        minStay: Number(e.target.value || 0),
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Check-in Time</Label>
                  <Input
                    type="time"
                    value={availability.checkInTime}
                    onChange={(e) =>
                      setAvailability((prev) => ({ ...prev, checkInTime: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Check-out Time</Label>
                  <Input
                    type="time"
                    value={availability.checkOutTime}
                    onChange={(e) =>
                      setAvailability((prev) => ({ ...prev, checkOutTime: e.target.value }))
                    }
                  />
                </div>
              </div>
              <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/50">
                <div>
                  <p className="font-medium">Accept Same-Day Bookings</p>
                  <p className="text-sm text-muted-foreground">Allow customers to book for today</p>
                </div>
                <Switch
                  checked={availability.sameDayBookings}
                  onCheckedChange={(checked) =>
                    setAvailability((prev) => ({ ...prev, sameDayBookings: checked }))
                  }
                />
              </div>
              <Button variant="hero" onClick={handleSaveAvailability}>Save Settings</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payment">
          <div className="space-y-6">
            {/* Accepted Payment Methods */}
            <Card>
              <CardHeader>
                <CardTitle>Accepted Payment Methods</CardTitle>
                <CardDescription>Select which payment methods your customers can use when booking</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  {[
                    { name: "GCash", icon: Smartphone, disabled: false },
                    { name: "PayMaya", icon: Smartphone, disabled: false },
                    { name: "Cash", icon: Banknote, disabled: false },
                    { name: "Credit/Debit", icon: CreditCard, disabled: false },
                    { name: "Bank Transfer", icon: Wallet, disabled: true },
                  ].map((method) => (
                    <button
                      key={method.name}
                      type="button"
                      disabled={method.disabled}
                      onClick={() => !method.disabled && toggleMethod(method.name)}
                      className={`relative p-4 border-2 rounded-xl transition-all flex flex-col items-center gap-2 ${
                        method.disabled
                          ? "border-border bg-muted/30 opacity-50 cursor-not-allowed"
                          : acceptedMethods.includes(method.name)
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/30 cursor-pointer"
                      }`}
                    >
                      {method.disabled && (
                        <Badge className="absolute -top-2 -right-2 text-[10px] px-1.5 py-0.5 bg-muted-foreground text-white">Soon</Badge>
                      )}
                      <method.icon className="h-6 w-6" />
                      <span className="text-sm font-medium">{method.name}</span>
                      {acceptedMethods.includes(method.name) && !method.disabled && (
                        <Badge variant="secondary" className="text-[10px]">Active</Badge>
                      )}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-4">
                  Unselected methods will appear grayed out on the booking page. Customers won't be able to select them.
                </p>
              </CardContent>
            </Card>

            {/* QR Code Management */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <QrCode className="h-5 w-5" />
                  QR Code Management
                </CardTitle>
                <CardDescription>Upload or update your QR code images for GCash and PayMaya payments</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-8">
                  {/* GCash QR */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Smartphone className="h-5 w-5 text-blue-600" />
                      <h3 className="font-semibold text-base">GCash QR Code</h3>
                      {!acceptedMethods.includes("GCash") && (
                        <Badge variant="outline" className="text-xs text-muted-foreground">Method not active</Badge>
                      )}
                    </div>
                    <div className="flex flex-col items-center">
                      {qrCodeGCash ? (
                        <div className="relative">
                          <img src={qrCodeGCash} alt="GCash QR Code" className="w-48 h-48 object-contain rounded-lg border border-border bg-white p-2" />
                          <button
                            type="button"
                            className="absolute -top-2 -right-2 bg-destructive text-white rounded-full w-7 h-7 flex items-center justify-center hover:bg-destructive/80 shadow-md"
                            onClick={() => setQrCodeGCash(null)}
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <label
                          className="flex flex-col items-center justify-center w-48 h-48 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all"
                          onClick={() => gcashInputRef.current?.click()}
                        >
                          <Upload className="h-10 w-10 text-muted-foreground mb-2" />
                          <span className="text-sm text-muted-foreground text-center">Upload GCash<br />QR Code</span>
                          <span className="text-xs text-muted-foreground mt-1">PNG, JPG</span>
                        </label>
                      )}
                      <input
                        ref={gcashInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleQRUpload(e, setQrCodeGCash)}
                      />
                      {qrCodeGCash && (
                        <Button variant="outline" size="sm" className="mt-3" onClick={() => gcashInputRef.current?.click()}>
                          Replace Image
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* PayMaya QR */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Smartphone className="h-5 w-5 text-green-600" />
                      <h3 className="font-semibold text-base">PayMaya QR Code</h3>
                      {!acceptedMethods.includes("PayMaya") && (
                        <Badge variant="outline" className="text-xs text-muted-foreground">Method not active</Badge>
                      )}
                    </div>
                    <div className="flex flex-col items-center">
                      {qrCodePayMaya ? (
                        <div className="relative">
                          <img src={qrCodePayMaya} alt="PayMaya QR Code" className="w-48 h-48 object-contain rounded-lg border border-border bg-white p-2" />
                          <button
                            type="button"
                            className="absolute -top-2 -right-2 bg-destructive text-white rounded-full w-7 h-7 flex items-center justify-center hover:bg-destructive/80 shadow-md"
                            onClick={() => setQrCodePayMaya(null)}
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <label
                          className="flex flex-col items-center justify-center w-48 h-48 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all"
                          onClick={() => paymayaInputRef.current?.click()}
                        >
                          <Upload className="h-10 w-10 text-muted-foreground mb-2" />
                          <span className="text-sm text-muted-foreground text-center">Upload PayMaya<br />QR Code</span>
                          <span className="text-xs text-muted-foreground mt-1">PNG, JPG</span>
                        </label>
                      )}
                      <input
                        ref={paymayaInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleQRUpload(e, setQrCodePayMaya)}
                      />
                      {qrCodePayMaya && (
                        <Button variant="outline" size="sm" className="mt-3" onClick={() => paymayaInputRef.current?.click()}>
                          Replace Image
                        </Button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-2 mt-6 p-4 rounded-lg bg-primary/5 border border-primary/20">
                  <Shield className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-primary">QR Code Display</p>
                    <p className="text-xs text-muted-foreground">These QR codes will be shown to customers during the payment step of the booking process. Make sure they are clear and up-to-date.</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Button variant="hero" onClick={handleSavePayment} className="w-full md:w-auto">
              Save Payment Settings
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="property-setup">
          <div className="max-w-4xl mx-auto space-y-6">
            <Card className="bg-card rounded-2xl shadow-elevated">
              <CardHeader className="pb-4">
                <CardTitle className="text-2xl">Property Setup & Requirements</CardTitle>
                <CardDescription>Define your policies, rules, and requirements for pet boarding</CardDescription>
              </CardHeader>
              <Separator className="mb-6" />
              <CardContent className="space-y-8">
                {/* Policies Section - Dropdowns */}
                <div className="bg-secondary/30 rounded-xl p-6">
                  <h3 className="text-lg font-semibold mb-6">Policies</h3>
                  <div className="space-y-6">
                    {/* Unvaccinated Pet Policy */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Unvaccinated Pet Policy</Label>
                      <select
                        className="w-full px-3 py-2 border rounded-md bg-background"
                        value={propertySetup.unvaccinatedPolicy ? "Yes" : "No"}
                        onChange={(e) => {
                          if (e.target.value === "No") {
                            setPropertySetup((prev) => ({ ...prev, unvaccinatedPolicy: false, unvaccinatedPolicyDetails: "" }));
                          } else {
                            setPropertySetup((prev) => ({ ...prev, unvaccinatedPolicy: true }));
                          }
                        }}
                      >
                        <option value="No">Accept unvaccinated pets</option>
                        <option value="Yes">Vaccination required</option>
                      </select>
                      {propertySetup.unvaccinatedPolicy && (
                        <Input
                          placeholder="Describe vaccination requirements (e.g., Rabies and DHPP required, proof at check-in)"
                          value={propertySetup.unvaccinatedPolicyDetails}
                          onChange={(e) => setPropertySetup((prev) => ({ ...prev, unvaccinatedPolicyDetails: e.target.value }))}
                          className="mt-2"
                        />
                      )}
                    </div>

                    {/* Breed Restrictions */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Breed Restrictions</Label>
                      <select
                        className="w-full px-3 py-2 border rounded-md bg-background"
                        value={propertySetup.breedRestrictions ? "Yes" : "No"}
                        onChange={(e) => {
                          if (e.target.value === "No") {
                            setPropertySetup((prev) => ({ ...prev, breedRestrictions: false, breedRestrictionsDetails: "" }));
                          } else {
                            setPropertySetup((prev) => ({ ...prev, breedRestrictions: true }));
                          }
                        }}
                      >
                        <option value="No">No restrictions</option>
                        <option value="Yes">Has restrictions</option>
                      </select>
                      {propertySetup.breedRestrictions && (
                        <Input
                          placeholder="e.g., No pit bulls, no aggressive breeds"
                          value={propertySetup.breedRestrictionsDetails}
                          onChange={(e) => setPropertySetup((prev) => ({ ...prev, breedRestrictionsDetails: e.target.value }))}
                          className="mt-2"
                        />
                      )}
                    </div>

                    {/* Aggressive Pet Policy */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Aggressive Pet Policy</Label>
                      <select
                        className="w-full px-3 py-2 border rounded-md bg-background"
                        value={propertySetup.aggressivePolicy ? "Yes" : "No"}
                        onChange={(e) => {
                          if (e.target.value === "No") {
                            setPropertySetup((prev) => ({ ...prev, aggressivePolicy: false, aggressivePolicyDetails: "" }));
                          } else {
                            setPropertySetup((prev) => ({ ...prev, aggressivePolicy: true }));
                          }
                        }}
                      >
                        <option value="No">Accept all pets</option>
                        <option value="Yes">Has policy</option>
                      </select>
                      {propertySetup.aggressivePolicy && (
                        <Input
                          placeholder="Describe your policy for aggressive or anxious pets"
                          value={propertySetup.aggressivePolicyDetails}
                          onChange={(e) => setPropertySetup((prev) => ({ ...prev, aggressivePolicyDetails: e.target.value }))}
                          className="mt-2"
                        />
                      )}
                    </div>
                  </div>
                </div>

                {/* Booking Rules - Checkboxes */}
                <div className="bg-secondary/30 rounded-xl p-6">
                  <h3 className="text-lg font-semibold mb-6">Booking Rules</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {bookingRuleOptions.map((rule) => (
                      <div
                        key={rule.name}
                        className="flex items-center justify-between p-3 bg-background rounded-lg border cursor-pointer hover:bg-secondary/30 transition-colors"
                        onClick={() => {
                          const newRules = propertySetup.bookingRules.includes(rule.name)
                            ? propertySetup.bookingRules.filter(r => r !== rule.name)
                            : [...propertySetup.bookingRules, rule.name];
                          setPropertySetup((prev) => ({ ...prev, bookingRules: newRules }));
                        }}
                      >
                        <div>
                          <Label className="text-sm font-medium">{rule.name}</Label>
                          <p className="text-xs text-muted-foreground">{rule.description}</p>
                        </div>
                        <input
                          type="checkbox"
                          className="w-5 h-5"
                          checked={propertySetup.bookingRules.includes(rule.name)}
                          onChange={() => {}}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Compliance Requirements - Checkboxes */}
                <div className="bg-secondary/30 rounded-xl p-6">
                  <h3 className="text-lg font-semibold mb-6">Compliance Requirements</h3>
                  <div className="space-y-4">
                    {complianceOptions.map((requirement) => (
                      <div
                        key={requirement.name}
                        className="flex items-start gap-3 p-3 bg-background rounded-lg border cursor-pointer hover:bg-secondary/30 transition-colors"
                        onClick={() => {
                          const newRequirements = propertySetup.complianceRequirements.includes(requirement.name)
                            ? propertySetup.complianceRequirements.filter(r => r !== requirement.name)
                            : [...propertySetup.complianceRequirements, requirement.name];
                          setPropertySetup((prev) => ({ ...prev, complianceRequirements: newRequirements }));
                        }}
                      >
                        <input
                          type="checkbox"
                          className="w-4 h-4 mt-1"
                          checked={propertySetup.complianceRequirements.includes(requirement.name)}
                          onChange={() => {}}
                          onClick={(e) => e.stopPropagation()}
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <Label className="text-sm font-medium">{requirement.name}</Label>
                            {requirement.required && <span className="text-red-500 text-xs">*</span>}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">{requirement.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Vaccination & Parasite Requirements - Checkboxes */}
                <div className="bg-secondary/30 rounded-xl p-6">
                  <h3 className="text-lg font-semibold mb-6">Vaccination & Parasite Requirements</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {vaccinationOptions.map((option) => (
                      <div
                        key={option.name}
                        className="flex items-center gap-3 p-3 bg-background rounded-lg border cursor-pointer hover:bg-secondary/30 transition-colors"
                        onClick={() => {
                          const newVaccinations = propertySetup.vaccinationRequirements.includes(option.name)
                            ? propertySetup.vaccinationRequirements.filter(v => v !== option.name)
                            : [...propertySetup.vaccinationRequirements, option.name];
                          setPropertySetup((prev) => ({ ...prev, vaccinationRequirements: newVaccinations }));
                        }}
                      >
                        <input
                          type="checkbox"
                          className="w-4 h-4"
                          checked={propertySetup.vaccinationRequirements.includes(option.name)}
                          onChange={() => {}}
                          onClick={(e) => e.stopPropagation()}
                        />
                        <Label className="text-sm font-medium flex-1">{option.name}</Label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Emergency Procedures - Text Field */}
                <div className="bg-secondary/30 rounded-xl p-6">
                  <Label className="text-lg font-semibold mb-3 block">Emergency Procedures</Label>
                  <p className="text-sm text-muted-foreground mb-4">Outline emergency response and safety protocols</p>
                  <Input
                    id="emergencyProcedures"
                    placeholder="e.g., Emergency vet: Animal Medical Center (555-0123). 24/7 on-call vet. Staff trained in pet CPR. Evacuation plan in place."
                    value={propertySetup.emergencyProcedures}
                    onChange={(e) => setPropertySetup((prev) => ({ ...prev, emergencyProcedures: e.target.value }))}
                  />
                </div>

                {/* Veterinary Availability - Checkboxes */}
                <div className="bg-secondary/30 rounded-xl p-6">
                  <h3 className="text-lg font-semibold mb-6">Veterinary Availability</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {vetAvailabilityOptions.map((option) => (
                      <div
                        key={option.name}
                        className="flex items-center gap-3 p-3 bg-background rounded-lg border cursor-pointer hover:bg-secondary/30 transition-colors"
                        onClick={() => {
                          const newVetServices = propertySetup.vetAvailability.includes(option.name)
                            ? propertySetup.vetAvailability.filter(v => v !== option.name)
                            : [...propertySetup.vetAvailability, option.name];
                          setPropertySetup((prev) => ({ ...prev, vetAvailability: newVetServices }));
                        }}
                      >
                        <input
                          type="checkbox"
                          className="w-4 h-4"
                          checked={propertySetup.vetAvailability.includes(option.name)}
                          onChange={() => {}}
                          onClick={(e) => e.stopPropagation()}
                        />
                        <Label className="text-sm font-medium flex-1">{option.name}</Label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Isolation & Sanitation Protocols - Checkboxes */}
                <div className="bg-secondary/30 rounded-xl p-6">
                  <h3 className="text-lg font-semibold mb-6">Isolation & Sanitation Protocols</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {sanitationOptions.map((option) => (
                      <div
                        key={option.name}
                        className="flex items-center gap-3 p-3 bg-background rounded-lg border cursor-pointer hover:bg-secondary/30 transition-colors"
                        onClick={() => {
                          const newProtocols = propertySetup.isolationSanitationProtocols.includes(option.name)
                            ? propertySetup.isolationSanitationProtocols.filter(p => p !== option.name)
                            : [...propertySetup.isolationSanitationProtocols, option.name];
                          setPropertySetup((prev) => ({ ...prev, isolationSanitationProtocols: newProtocols }));
                        }}
                      >
                        <input
                          type="checkbox"
                          className="w-4 h-4"
                          checked={propertySetup.isolationSanitationProtocols.includes(option.name)}
                          onChange={() => {}}
                          onClick={(e) => e.stopPropagation()}
                        />
                        <Label className="text-sm font-medium flex-1">{option.name}</Label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Save Buttons */}
                <div className="flex gap-3 pt-4">
                  <Button variant="hero" size="lg" onClick={handleSavePropertySetup} className="gap-2">
                    <CheckCircle2 className="h-4 w-4" />
                    Save Property Setup
                  </Button>
                  <Button variant="outline" size="lg" onClick={() => {
                    setPropertySetup({
                      unvaccinatedPolicy: false,
                      unvaccinatedPolicyDetails: "",
                      breedRestrictions: false,
                      breedRestrictionsDetails: "",
                      aggressivePolicy: false,
                      aggressivePolicyDetails: "",
                      bookingRules: [],
                      complianceRequirements: [],
                      vaccinationRequirements: [],
                      emergencyProcedures: "",
                      vetAvailability: [],
                      isolationSanitationProtocols: [],
                    });
                  }}>
                    Clear All Fields
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="billing">
          <Card>
            <CardHeader>
              <CardTitle>Billing & Payments</CardTitle>
              <CardDescription>Manage your payment methods and view earnings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-4 rounded-lg bg-secondary/50">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="font-medium">Current Balance</p>
                    <p className="text-2xl font-bold text-foreground">₱3,450.00</p>
                  </div>
                  <Button>Withdraw</Button>
                </div>
                <p className="text-sm text-muted-foreground">Next automatic payout: Feb 1, 2026</p>
              </div>
              
              <div>
                <Label className="mb-2 block">Bank Account</Label>
                <div className="flex items-center gap-3 p-4 rounded-lg border border-border">
                  <CreditCard className="h-5 w-5 text-muted-foreground" />
                  <div className="flex-1">
                    <p className="font-medium">**** **** **** 4567</p>
                    <p className="text-sm text-muted-foreground">Chase Bank</p>
                  </div>
                  <Button variant="outline" size="sm">Change</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </AdminLayout>
  );
};

export default AdminSettings;
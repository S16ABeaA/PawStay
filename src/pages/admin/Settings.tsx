import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Building2, Bell, CreditCard, Shield, Clock, Upload, X, QrCode, Smartphone, Wallet, Banknote, Wifi, WifiOff, Loader2 } from "lucide-react";
import { useState, useRef, useEffect, useCallback } from "react";
import { settingsApi, type SettingsData } from "@/services/settingsApi";

const AdminSettings = () => {
  const { toast } = useToast();

  // ─── Loading & connection state ───
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [backendStatus, setBackendStatus] = useState<"checking" | "connected" | "disconnected">("checking");
  const [backendMessage, setBackendMessage] = useState("");
  const [propertyId, setPropertyId] = useState<string | null>(null);

  // ─── Business state ───
  const [businessName, setBusinessName] = useState("");
  const [phone, setPhone] = useState("");
  const [website, setWebsite] = useState("");
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");

  // ─── Notification state ───
  const [newBookings, setNewBookings] = useState(true);
  const [bookingReminders, setBookingReminders] = useState(true);
  const [newReviews, setNewReviews] = useState(true);
  const [marketingUpdates, setMarketingUpdates] = useState(false);

  // ─── Availability state ───
  const [maxCapacity, setMaxCapacity] = useState(0);
  const [minStay, setMinStay] = useState(1);
  const [checkInTime, setCheckInTime] = useState("09:00");
  const [checkOutTime, setCheckOutTime] = useState("17:00");
  const [sameDayBookings, setSameDayBookings] = useState(true);

  // ─── Payment state ───
  const [acceptedMethods, setAcceptedMethods] = useState<string[]>([]);
  const [qrCodeGCash, setQrCodeGCash] = useState<string | null>(null);
  const [qrCodePayMaya, setQrCodePayMaya] = useState<string | null>(null);
  const gcashInputRef = useRef<HTMLInputElement>(null);
  const paymayaInputRef = useRef<HTMLInputElement>(null);

  // ─── Populate state from API response ───
  const populateSettings = useCallback((data: SettingsData) => {
    setPropertyId(data.propertyId);

    // Business
    setBusinessName(data.business.name || "");
    setPhone(data.business.phone || "");
    setWebsite(data.business.website || "");
    setDescription(data.business.description || "");
    setAddress(data.business.address || "");

    // Notifications
    setNewBookings(data.notifications.newBookings ?? true);
    setBookingReminders(data.notifications.bookingReminders ?? true);
    setNewReviews(data.notifications.newReviews ?? true);
    setMarketingUpdates(data.notifications.marketingUpdates ?? false);

    // Availability
    setMaxCapacity(data.availability.maxCapacity || 0);
    setMinStay(data.availability.minStay || 1);
    setCheckInTime(data.availability.checkInTime || "09:00");
    setCheckOutTime(data.availability.checkOutTime || "17:00");
    setSameDayBookings(data.availability.sameDayBookings ?? true);

    // Payment
    setAcceptedMethods(data.payment.acceptedMethods || []);
    setQrCodeGCash(data.payment.gcashQrUrl || null);
    setQrCodePayMaya(data.payment.paymayaQrUrl || null);
  }, []);

  // ─── Load settings on mount ───
  useEffect(() => {
    const loadSettings = async () => {
      setLoading(true);
      setBackendStatus("checking");
      try {
        const data = await settingsApi.getSettings();
        setBackendStatus("connected");
        setBackendMessage("Connected — settings loaded from database");
        populateSettings(data);
      } catch (err: any) {
        setBackendStatus("disconnected");
        setBackendMessage(err?.error || err?.message || "Could not load settings");
        // Try a simple health check to differentiate auth vs server issues
        try {
          const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5001";
          const healthRes = await fetch(`${API_BASE}`, { method: "GET" });
          if (healthRes.ok) {
            setBackendStatus("connected");
            setBackendMessage("Backend online, but settings could not load (are you logged in as a property owner?)");
          }
        } catch {
          // server truly unreachable
        }
      } finally {
        setLoading(false);
      }
    };
    loadSettings();
  }, [populateSettings]);

  // ─── Handlers ───
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
      reader.onloadend = () => setter(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSaveBusiness = async () => {
    setSaving(true);
    try {
      await settingsApi.updateBusiness({ name: businessName, phone, website, description, address });
      toast({ title: "Business info saved", description: "Your business details have been updated." });
    } catch (err: any) {
      toast({ title: "Error", description: err?.error || "Failed to save business info.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveNotifications = async () => {
    setSaving(true);
    try {
      await settingsApi.updateNotifications({ newBookings, bookingReminders, newReviews, marketingUpdates });
      toast({ title: "Notification preferences saved", description: "Your preferences have been updated." });
    } catch (err: any) {
      toast({ title: "Error", description: err?.error || "Failed to save notification preferences.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAvailability = async () => {
    setSaving(true);
    try {
      await settingsApi.updateAvailability({ maxCapacity, minStay, checkInTime, checkOutTime, sameDayBookings });
      toast({ title: "Availability saved", description: "Your availability settings have been updated." });
    } catch (err: any) {
      toast({ title: "Error", description: err?.error || "Failed to save availability settings.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleSavePayment = async () => {
    setSaving(true);
    try {
      await settingsApi.updatePayment({ acceptedMethods, gcashQrUrl: qrCodeGCash, paymayaQrUrl: qrCodePayMaya });
      toast({ title: "Payment settings saved", description: "Your payment methods and QR codes have been updated." });
    } catch (err: any) {
      toast({ title: "Error", description: err?.error || "Failed to save payment settings.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  // ─── Loading skeleton ───
  if (loading) {
    return (
      <AdminLayout title="Settings" subtitle="Manage your business preferences">
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground text-sm">Loading settings…</p>
          </div>
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
          <TabsTrigger value="billing" className="gap-2">
            <CreditCard className="h-4 w-4" />
            Billing
          </TabsTrigger>
        </TabsList>

        {/* ═══════════════════ BUSINESS TAB ═══════════════════ */}
        <TabsContent value="business">
          {/* Backend Connection Status */}
          <Card className="mb-6">
            <CardContent className="py-4">
              <div className="flex items-center gap-3">
                {backendStatus === "checking" ? (
                  <Loader2 className="h-5 w-5 text-muted-foreground animate-spin" />
                ) : backendStatus === "connected" ? (
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-500/10">
                    <Wifi className="h-4 w-4 text-green-600" />
                  </div>
                ) : (
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-500/10">
                    <WifiOff className="h-4 w-4 text-red-500" />
                  </div>
                )}
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-sm">
                      {backendStatus === "checking"
                        ? "Checking backend..."
                        : backendStatus === "connected"
                          ? "Backend Connected"
                          : "Backend Disconnected"}
                    </p>
                    <Badge
                      variant={
                        backendStatus === "connected"
                          ? "default"
                          : backendStatus === "checking"
                            ? "secondary"
                            : "destructive"
                      }
                      className="text-[10px]"
                    >
                      {backendStatus === "checking" ? "Checking" : backendStatus === "connected" ? "Online" : "Offline"}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{backendMessage || "Verifying connection..."}</p>
                  {propertyId && (
                    <p className="text-xs text-muted-foreground mt-0.5">Property ID: {propertyId}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Business Information</CardTitle>
              <CardDescription>Update your business details visible to customers</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {!propertyId && backendStatus === "connected" && (
                <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/30 text-sm text-yellow-800 dark:text-yellow-200">
                  No property found for your account. Submit a property listing first, then come back here to manage settings.
                </div>
              )}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="businessName">Business Name</Label>
                  <Input id="businessName" value={businessName} onChange={(e) => setBusinessName(e.target.value)} placeholder="Enter business name" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Enter phone number" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="website">Website</Label>
                  <Input id="website" value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="www.example.com" />
                </div>
                <div className="md:col-span-2 space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Input id="address" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Enter address" />
                </div>
                <div className="md:col-span-2 space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea id="description" rows={4} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe your business…" />
                </div>
              </div>
              <Button variant="hero" onClick={handleSaveBusiness} disabled={saving || !propertyId}>
                {saving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving…</> : "Save Changes"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══════════════════ NOTIFICATIONS TAB ═══════════════════ */}
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
                  <Switch checked={newBookings} onCheckedChange={setNewBookings} />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Booking Reminders</p>
                    <p className="text-sm text-muted-foreground">Remind about upcoming check-ins and check-outs</p>
                  </div>
                  <Switch checked={bookingReminders} onCheckedChange={setBookingReminders} />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">New Reviews</p>
                    <p className="text-sm text-muted-foreground">Get notified when customers leave reviews</p>
                  </div>
                  <Switch checked={newReviews} onCheckedChange={setNewReviews} />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Marketing Updates</p>
                    <p className="text-sm text-muted-foreground">Tips and promotions from PawStay</p>
                  </div>
                  <Switch checked={marketingUpdates} onCheckedChange={setMarketingUpdates} />
                </div>
              </div>
              <Button variant="hero" onClick={handleSaveNotifications} disabled={saving}>
                {saving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving…</> : "Save Preferences"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══════════════════ AVAILABILITY TAB ═══════════════════ */}
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
                  <Input type="number" value={maxCapacity} onChange={(e) => setMaxCapacity(Number(e.target.value))} />
                </div>
                <div className="space-y-2">
                  <Label>Minimum Stay (nights)</Label>
                  <Input type="number" value={minStay} onChange={(e) => setMinStay(Number(e.target.value))} />
                </div>
                <div className="space-y-2">
                  <Label>Check-in Time</Label>
                  <Input type="time" value={checkInTime} onChange={(e) => setCheckInTime(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Check-out Time</Label>
                  <Input type="time" value={checkOutTime} onChange={(e) => setCheckOutTime(e.target.value)} />
                </div>
              </div>
              <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/50">
                <div>
                  <p className="font-medium">Accept Same-Day Bookings</p>
                  <p className="text-sm text-muted-foreground">Allow customers to book for today</p>
                </div>
                <Switch checked={sameDayBookings} onCheckedChange={setSameDayBookings} />
              </div>
              <Button variant="hero" onClick={handleSaveAvailability} disabled={saving || !propertyId}>
                {saving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving…</> : "Save Settings"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══════════════════ PAYMENT TAB ═══════════════════ */}
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

            <Button variant="hero" onClick={handleSavePayment} disabled={saving || !propertyId} className="w-full md:w-auto">
              {saving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving…</> : "Save Payment Settings"}
            </Button>
          </div>
        </TabsContent>

        {/* ═══════════════════ BILLING TAB (Coming Soon) ═══════════════════ */}
        <TabsContent value="billing">
          <Card>
            <CardHeader>
              <CardTitle>Billing & Payments</CardTitle>
              <CardDescription>Manage your payment methods and view earnings</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mb-4">
                <CreditCard className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">Coming Soon</h3>
              <p className="text-muted-foreground max-w-md">
                We're working on billing and payment features. You'll be able to manage your earnings, payouts, and bank accounts here soon.
              </p>
              <Badge variant="secondary" className="mt-4">Under Development</Badge>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </AdminLayout>
  );
};

export default AdminSettings;

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
import { settingsApi, SettingsData } from "@/services/settingsApi";
import { Building2, Bell, CreditCard, Shield, Clock, Upload, X, QrCode, Smartphone, Wallet, Banknote } from "lucide-react";
import { PetLoader } from "@/components/ui/PetLoader";
import { useEffect, useRef, useState } from "react";
import { useAdminProperty } from "@/hooks/useAdminProperty";

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

  if (loading) {
    return (
      <AdminLayout title="Settings" subtitle="Manage your business preferences">
        <div className="flex items-center justify-center h-96">
          <PetLoader />
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
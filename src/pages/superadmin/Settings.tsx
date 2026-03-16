import SuperAdminLayout from "@/components/superadmin/SuperAdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Globe, Bell, Shield, Mail, Loader2, Upload, X, CreditCard } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { authHelper } from "@/helpers/authHelper";
import { PropertyService } from "@/utils/propertyService";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_BACKEND_URL || "http://localhost:5001";

interface QREntry {
  label: string;
  key: "gcash_qr" | "paymaya_qr";
  color: string;
}

const QR_METHODS: QREntry[] = [
  { label: "GCash", key: "gcash_qr", color: "#0070ba" },
  { label: "PayMaya", key: "paymaya_qr", color: "#38a169" },
];

const SuperAdminSettings = () => {
  const { toast } = useToast();

  // General settings
  const [platformName, setPlatformName] = useState<string>("PawStay");
  const [supportEmail, setSupportEmail] = useState<string>("support@pawstay.com");
  const [platformFee, setPlatformFee] = useState<number>(10);
  const [minBookingAmount, setMinBookingAmount] = useState<number>(25);

  // QR codes per payment method
  const [qrCodes, setQrCodes] = useState<Record<string, string | null>>({
    gcash_qr: null,
    paymaya_qr: null,
  });
  const [qrUploading, setQrUploading] = useState<Record<string, boolean>>({});

  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let mounted = true;
    const fetchSettings = async () => {
      try {
        setLoading(true);
        const data = await authHelper.get(`${API_BASE_URL}/api/platform-settings`);
        if (mounted && data.settings) {
          if (data.settings.name) setPlatformName(data.settings.name);
          if (data.settings.commission_percent !== undefined) setPlatformFee(Number(data.settings.commission_percent));
          setQrCodes({
            gcash_qr: data.settings.gcash_qr || null,
            paymaya_qr: data.settings.paymaya_qr || null,
          });
        }
      } catch (error) {
        console.error("Failed to load platform settings", error);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchSettings();
    return () => { mounted = false; };
  }, []);

  const handleQRUpload = async (key: string, file: File) => {
    setQrUploading(prev => ({ ...prev, [key]: true }));
    try {
      const ext = file.name.split(".").pop();
      const url = await PropertyService.uploadFile(file, "property-images", `platform/qr-${key}-${Date.now()}.${ext}`);
      if (url) {
        setQrCodes(prev => ({ ...prev, [key]: url }));
        toast({ title: "QR code uploaded", description: `${key.replace("_qr", "").toUpperCase()} QR uploaded successfully.` });
      } else {
        toast({ title: "Upload failed", description: "Could not upload QR code image.", variant: "destructive" });
      }
    } finally {
      setQrUploading(prev => ({ ...prev, [key]: false }));
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await authHelper.put(`${API_BASE_URL}/api/platform-settings`, {
        name: platformName,
        commission_percent: platformFee,
        gcash_qr: qrCodes.gcash_qr,
        paymaya_qr: qrCodes.paymaya_qr,
      });
      toast({
        title: "Settings saved",
        description: `Platform settings updated — ${platformName} (${platformFee}% commission).`,
      });
    } catch (error: any) {
      console.error("Failed to save platform settings", error);
      toast({
        title: "Error",
        description: error?.message || "Failed to save settings.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SuperAdminLayout title="Settings" subtitle="Platform configuration and preferences">
        <div className="flex flex-col items-center justify-center gap-3 py-16">
          <Loader2 className="h-8 w-8 animate-spin text-[#808080]" />
          <span className="text-sm text-[#808080]">Loading settings...</span>
        </div>
      </SuperAdminLayout>
    );
  }

  return (
    <SuperAdminLayout title="Settings" subtitle="Platform configuration and preferences">
      <Tabs defaultValue="general" className="space-y-6 sa-slide-in">
        <TabsList className="bg-[#292929] border border-white/[0.07]">
          <TabsTrigger value="general" className="gap-2 text-[#808080] data-[state=active]:bg-[#ffa31a] data-[state=active]:text-[#1b1b1b] data-[state=active]:font-semibold">
            <Globe className="h-4 w-4" />
            General
          </TabsTrigger>
          <TabsTrigger value="payments" className="gap-2 text-[#808080] data-[state=active]:bg-[#ffa31a] data-[state=active]:text-[#1b1b1b] data-[state=active]:font-semibold">
            <CreditCard className="h-4 w-4" />
            Payment QR Codes
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2 text-[#808080] data-[state=active]:bg-[#ffa31a] data-[state=active]:text-[#1b1b1b] data-[state=active]:font-semibold">
            <Bell className="h-4 w-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-2 text-[#808080] data-[state=active]:bg-[#ffa31a] data-[state=active]:text-[#1b1b1b] data-[state=active]:font-semibold">
            <Shield className="h-4 w-4" />
            Security
          </TabsTrigger>
          <TabsTrigger value="email" className="gap-2 text-[#808080] data-[state=active]:bg-[#ffa31a] data-[state=active]:text-[#1b1b1b] data-[state=active]:font-semibold">
            <Mail className="h-4 w-4" />
            Email
          </TabsTrigger>
        </TabsList>

        {/* ── General Tab ── */}
        <TabsContent value="general">
          <Card className="bg-[#292929] border-white/[0.07] sa-card mb-4">
            <CardHeader>
              <CardTitle className="text-white">Website Info</CardTitle>
              <CardDescription className="text-[#808080]">Quick view of the platform name and commission</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-auto">
                <table className="w-full text-sm text-left table-auto">
                  <thead>
                    <tr className="text-[#808080]">
                      <th className="px-4 py-2">Name</th>
                      <th className="px-4 py-2">Commission (%)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="bg-[#292929] border-t border-white/[0.06]">
                      <td className="px-4 py-3 text-white">{platformName}</td>
                      <td className="px-4 py-3 text-white">{platformFee}%</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#292929] border-white/[0.07] sa-card">
            <CardHeader>
              <CardTitle className="text-white">Platform Settings</CardTitle>
              <CardDescription className="text-[#808080]">General platform configuration</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-white/80">Platform Name</Label>
                  <Input
                    value={platformName}
                    onChange={(e) => setPlatformName(e.target.value)}
                    className="bg-[#292929] border-white/[0.09] text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-white/80">Support Email</Label>
                  <Input
                    value={supportEmail}
                    onChange={(e) => setSupportEmail(e.target.value)}
                    className="bg-[#292929] border-white/[0.09] text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-white/80">Platform Fee (%)</Label>
                  <Input
                    type="number"
                    value={String(platformFee)}
                    onChange={(e) => setPlatformFee(Number(e.target.value || 0))}
                    className="bg-[#292929] border-white/[0.09] text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-white/80">Minimum Booking Amount</Label>
                  <Input
                    type="number"
                    value={String(minBookingAmount)}
                    onChange={(e) => setMinBookingAmount(Number(e.target.value || 0))}
                    className="bg-[#292929] border-white/[0.09] text-white"
                  />
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t border-white/[0.06]">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-white">Maintenance Mode</p>
                    <p className="text-sm text-[#808080]">Take the platform offline for maintenance</p>
                  </div>
                  <Switch />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-white">New Registrations</p>
                    <p className="text-sm text-[#808080]">Allow new users to sign up</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-white">Property Applications</p>
                    <p className="text-sm text-[#808080]">Accept new property listing applications</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </div>

              <Button
                onClick={handleSave}
                disabled={saving}
                className="bg-[#ffa31a] hover:bg-[#ffa31a]/90 text-[#1b1b1b]"
              >
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Payment QR Codes Tab ── */}
        <TabsContent value="payments">
          <Card className="bg-[#292929] border-white/[0.07] sa-card">
            <CardHeader>
              <CardTitle className="text-white">Platform Payment QR Codes</CardTitle>
              <CardDescription className="text-[#808080]">
                Upload QR codes for each payment method. These will be shown to customers during checkout when a property hasn't set up their own QR code.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              <div className="grid sm:grid-cols-2 gap-8">
                {QR_METHODS.map(({ label, key }) => (
                  <div key={key} className="space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: key === "gcash_qr" ? "#0070ba" : "#38a169" }} />
                      <Label className="text-white font-medium">{label} QR Code</Label>
                    </div>

                    {qrCodes[key] ? (
                      <div className="relative w-fit">
                        <img
                          src={qrCodes[key]!}
                          alt={`${label} QR Code`}
                          className="w-40 h-40 object-contain rounded-xl border border-white/10 bg-white p-2 shadow"
                        />
                        <button
                          type="button"
                          onClick={() => setQrCodes(prev => ({ ...prev, [key]: null }))}
                          className="absolute -top-2 -right-2 bg-destructive text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-destructive/80 shadow-md"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => fileInputRefs.current[key]?.click()}
                        disabled={qrUploading[key]}
                        className="flex flex-col items-center justify-center w-40 h-40 border-2 border-dashed border-white/20 rounded-xl cursor-pointer hover:border-[#ffa31a]/50 hover:bg-[#ffa31a]/5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {qrUploading[key] ? (
                          <Loader2 className="h-6 w-6 text-[#808080] animate-spin" />
                        ) : (
                          <>
                            <Upload className="h-6 w-6 text-[#808080] mb-2" />
                            <span className="text-xs text-[#808080] text-center">Upload {label} QR</span>
                          </>
                        )}
                      </button>
                    )}

                    <input
                      ref={el => { fileInputRefs.current[key] = el; }}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleQRUpload(key, file);
                        e.target.value = "";
                      }}
                    />

                    <p className="text-xs text-[#606060]">
                      {qrCodes[key] ? "Click × to remove and re-upload" : "PNG or JPG, max 5MB"}
                    </p>
                  </div>
                ))}
              </div>

              <div className="pt-4 border-t border-white/[0.06]">
                <Button
                  onClick={handleSave}
                  disabled={saving}
                  className="bg-[#ffa31a] hover:bg-[#ffa31a]/90 text-[#1b1b1b]"
                >
                  {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {saving ? "Saving..." : "Save QR Codes"}
                </Button>
                <p className="text-xs text-[#606060] mt-2">
                  Saving will persist all QR code URLs to the database.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Notifications Tab ── */}
        <TabsContent value="notifications">
          <Card className="bg-[#292929] border-white/[0.07] sa-card">
            <CardHeader>
              <CardTitle className="text-white">Notification Settings</CardTitle>
              <CardDescription className="text-[#808080]">Configure admin notification preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-white">New Property Applications</p>
                  <p className="text-sm text-[#808080]">Get notified when new properties apply</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-white">High-Value Bookings</p>
                  <p className="text-sm text-slate-400">Alert for bookings over ₱500</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-white">Negative Reviews</p>
                  <p className="text-sm text-[#808080]">Alert for reviews with 2 stars or less</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-white">Weekly Reports</p>
                  <p className="text-sm text-[#808080]">Receive weekly performance summary</p>
                </div>
                <Switch defaultChecked />
              </div>
              <Button
                onClick={handleSave}
                disabled={saving}
                className="bg-[#ffa31a] hover:bg-[#ffa31a]/90 text-[#1b1b1b] mt-4"
              >
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {saving ? "Saving..." : "Save Preferences"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Security Tab ── */}
        <TabsContent value="security">
          <Card className="bg-[#292929] border-white/[0.07] sa-card">
            <CardHeader>
              <CardTitle className="text-white">Security Settings</CardTitle>
              <CardDescription className="text-[#808080]">Platform security configuration</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-white">Two-Factor Authentication</p>
                  <p className="text-sm text-[#808080]">Require 2FA for all admin accounts</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-white">Session Timeout</p>
                  <p className="text-sm text-[#808080]">Auto-logout after 30 minutes of inactivity</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-white">Login Alerts</p>
                  <p className="text-sm text-[#808080]">Email notification on new device login</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="pt-4 border-t border-white/[0.06]">
                <Button variant="destructive">Force Logout All Users</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Email Tab ── */}
        <TabsContent value="email">
          <Card className="bg-[#292929] border-white/[0.07] sa-card">
            <CardHeader>
              <CardTitle className="text-white">Email Configuration</CardTitle>
              <CardDescription className="text-[#808080]">Configure email sending settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-white/80">SMTP Host</Label>
                  <Input defaultValue="smtp.sendgrid.net" className="bg-[#292929] border-white/[0.09] text-white" />
                </div>
                <div className="space-y-2">
                  <Label className="text-white/80">SMTP Port</Label>
                  <Input defaultValue="587" className="bg-[#292929] border-white/[0.09] text-white" />
                </div>
                <div className="space-y-2">
                  <Label className="text-white/80">From Email</Label>
                  <Input defaultValue="noreply@pawstay.com" className="bg-[#292929] border-white/[0.09] text-white" />
                </div>
                <div className="space-y-2">
                  <Label className="text-white/80">From Name</Label>
                  <Input defaultValue="PawStay" className="bg-[#292929] border-white/[0.09] text-white" />
                </div>
              </div>
              <Button
                onClick={handleSave}
                disabled={saving}
                className="bg-[#ffa31a] hover:bg-[#ffa31a]/90 text-[#1b1b1b] mt-4"
              >
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {saving ? "Saving..." : "Save Email Settings"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </SuperAdminLayout>
  );
};

export default SuperAdminSettings;

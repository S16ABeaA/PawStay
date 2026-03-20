import { useEffect, useRef, useState, type ChangeEvent } from "react";
import SuperAdminLayout from "@/components/superadmin/SuperAdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Globe, Bell, Shield, Mail, Upload, X } from "lucide-react";
import { bookingApi } from "@/services/bookingApi";

const SuperAdminSettings = () => {
  const { toast } = useToast();
  const [paymentChannels, setPaymentChannels] = useState({
    gcash: { imageUrl: "", description: "" },
    paymaya: { imageUrl: "", description: "" },
    bankTransfer: { imageUrl: "", number: "", provider: "" },
    card: { number: "", provider: "" },
    cashCheque: { description: "To be settled personally between owner and proprietor." },
  });
  const [savingChannels, setSavingChannels] = useState(false);
  const gcashInputRef = useRef<HTMLInputElement>(null);
  const paymayaInputRef = useRef<HTMLInputElement>(null);
  const bankTransferInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const loadPaymentChannels = async () => {
      try {
        const res = await bookingApi.getSettlementPaymentChannels();
        setPaymentChannels({
          gcash: {
            imageUrl: res?.paymentChannels?.gcash?.imageUrl || "",
            description: res?.paymentChannels?.gcash?.description || "",
          },
          paymaya: {
            imageUrl: res?.paymentChannels?.paymaya?.imageUrl || "",
            description: res?.paymentChannels?.paymaya?.description || "",
          },
          bankTransfer: {
            imageUrl: res?.paymentChannels?.bankTransfer?.imageUrl || "",
            number: res?.paymentChannels?.bankTransfer?.number || "",
            provider: res?.paymentChannels?.bankTransfer?.provider || "",
          },
          card: {
            number: res?.paymentChannels?.card?.number || "",
            provider: res?.paymentChannels?.card?.provider || "",
          },
          cashCheque: {
            description:
              res?.paymentChannels?.cashCheque?.description ||
              "To be settled personally between owner and proprietor.",
          },
        });
      } catch (err) {
        console.error("Failed to load settlement payment channels", err);
      }
    };

    loadPaymentChannels();
  }, []);

  const handleSave = () => {
    toast({
      title: "Settings saved",
      description: "Platform settings have been updated successfully.",
    });
  };

  const handleImageUpload = (e: ChangeEvent<HTMLInputElement>, target: "gcash" | "paymaya" | "bankTransfer") => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setPaymentChannels((prev) => ({
        ...prev,
        [target]: {
          ...prev[target],
          imageUrl: String(reader.result || ""),
        },
      }));
    };
    reader.readAsDataURL(file);
  };

  const savePaymentChannels = async () => {
    try {
      setSavingChannels(true);
      const res = await bookingApi.updateSettlementPaymentChannels({
        paymentChannels: {
          gcash: {
            imageUrl: paymentChannels.gcash.imageUrl || null,
            description: paymentChannels.gcash.description,
          },
          paymaya: {
            imageUrl: paymentChannels.paymaya.imageUrl || null,
            description: paymentChannels.paymaya.description,
          },
          bankTransfer: {
            imageUrl: paymentChannels.bankTransfer.imageUrl || null,
            number: paymentChannels.bankTransfer.number,
            provider: paymentChannels.bankTransfer.provider,
          },
          card: {
            number: paymentChannels.card.number,
            provider: paymentChannels.card.provider,
          },
          cashCheque: {
            description: paymentChannels.cashCheque.description,
          },
        },
      });

      setPaymentChannels({
        gcash: {
          imageUrl: res?.paymentChannels?.gcash?.imageUrl || "",
          description: res?.paymentChannels?.gcash?.description || "",
        },
        paymaya: {
          imageUrl: res?.paymentChannels?.paymaya?.imageUrl || "",
          description: res?.paymentChannels?.paymaya?.description || "",
        },
        bankTransfer: {
          imageUrl: res?.paymentChannels?.bankTransfer?.imageUrl || "",
          number: res?.paymentChannels?.bankTransfer?.number || "",
          provider: res?.paymentChannels?.bankTransfer?.provider || "",
        },
        card: {
          number: res?.paymentChannels?.card?.number || "",
          provider: res?.paymentChannels?.card?.provider || "",
        },
        cashCheque: {
          description:
            res?.paymentChannels?.cashCheque?.description ||
            "To be settled personally between owner and proprietor.",
        },
      });

      toast({
        title: "Payment accounts saved",
        description: "Settlement payment images are now updated for proprietors.",
      });
    } catch (err: any) {
      console.error("Failed to save settlement payment channels", err);
      toast({
        title: "Save failed",
        description: err?.error || err?.message || "Could not save payment account images.",
        variant: "destructive",
      });
    } finally {
      setSavingChannels(false);
    }
  };

  return (
    <SuperAdminLayout title="Settings" subtitle="Platform configuration and preferences">
      <Tabs defaultValue="general" className="space-y-6 sa-slide-in">
        <TabsList className="bg-[#292929] border border-white/[0.07]">
          <TabsTrigger value="general" className="gap-2 text-[#808080] data-[state=active]:bg-[#ffa31a] data-[state=active]:text-[#1b1b1b] data-[state=active]:font-semibold">
            <Globe className="h-4 w-4" />
            General
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

        <TabsContent value="general">
          <Card className="bg-[#292929] border-white/[0.07] sa-card">
            <CardHeader>
              <CardTitle className="text-white">Platform Settings</CardTitle>
              <CardDescription className="text-[#808080]">
                General platform configuration
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-white/80">Platform Name</Label>
                  <Input
                    defaultValue="PawStay"
                    className="bg-[#292929] border-white/[0.09] text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-white/80">Support Email</Label>
                  <Input
                    defaultValue="support@pawstay.com"
                    className="bg-[#292929] border-white/[0.09] text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-white/80">Platform Fee (%)</Label>
                  <Input
                    type="number"
                    defaultValue="10"
                    className="bg-[#292929] border-white/[0.09] text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-white/80">Minimum Booking Amount</Label>
                  <Input
                    type="number"
                    defaultValue="25"
                    className="bg-[#292929] border-white/[0.09] text-white"
                  />
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t border-white/[0.06]">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-white">Maintenance Mode</p>
                    <p className="text-sm text-[#808080]">
                      Take the platform offline for maintenance
                    </p>
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
                    <p className="text-sm text-[#808080]">
                      Accept new property listing applications
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </div>

              <Button
                onClick={handleSave}
                className="bg-[#ffa31a] hover:bg-[#ffa31a]/90 text-[#1b1b1b]"
              >
                Save Changes
              </Button>

              <div className="space-y-4 pt-4 border-t border-white/[0.06]">
                <div>
                  <p className="font-medium text-white">Settlement Payment Accounts</p>
                  <p className="text-sm text-[#808080]">Add descriptions and images for settlement channels shown to proprietors.</p>
                </div>

                <div className="grid md:grid-cols-2 gap-5">
                  <div>
                    <p className="text-xs text-[#808080] mb-2">GCash Account Image</p>
                    {paymentChannels.gcash.imageUrl ? (
                      <div className="relative w-44 h-44 rounded-lg border border-white/[0.12] bg-white p-2">
                        <img src={paymentChannels.gcash.imageUrl} alt="GCash payment account" className="w-full h-full object-contain rounded" />
                        <Button
                          size="icon"
                          variant="ghost"
                          className="absolute -top-2 -right-2 h-7 w-7 bg-black/60 text-white hover:bg-black/80"
                          onClick={() => setPaymentChannels((prev) => ({ ...prev, gcash: { ...prev.gcash, imageUrl: "" } }))}
                        >
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        className="w-44 h-44 rounded-lg border-2 border-dashed border-white/[0.14] flex flex-col items-center justify-center gap-2 text-[#808080] hover:text-white hover:border-[#ffa31a]/70"
                        onClick={() => gcashInputRef.current?.click()}
                      >
                        <Upload className="h-4 w-4" />
                        <span className="text-xs">Upload Image</span>
                      </button>
                    )}
                    <input ref={gcashInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, "gcash")} />
                    <Input
                      value={paymentChannels.gcash.description}
                      onChange={(e) => setPaymentChannels((prev) => ({ ...prev, gcash: { ...prev.gcash, description: (e.target as HTMLInputElement).value } }))}
                      placeholder="GCash description (optional)"
                      className="mt-2 bg-[#292929] border-white/[0.09] text-white"
                    />
                  </div>

                  <div>
                    <p className="text-xs text-[#808080] mb-2">PayMaya Account Image</p>
                    {paymentChannels.paymaya.imageUrl ? (
                      <div className="relative w-44 h-44 rounded-lg border border-white/[0.12] bg-white p-2">
                        <img src={paymentChannels.paymaya.imageUrl} alt="PayMaya payment account" className="w-full h-full object-contain rounded" />
                        <Button
                          size="icon"
                          variant="ghost"
                          className="absolute -top-2 -right-2 h-7 w-7 bg-black/60 text-white hover:bg-black/80"
                          onClick={() => setPaymentChannels((prev) => ({ ...prev, paymaya: { ...prev.paymaya, imageUrl: "" } }))}
                        >
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        className="w-44 h-44 rounded-lg border-2 border-dashed border-white/[0.14] flex flex-col items-center justify-center gap-2 text-[#808080] hover:text-white hover:border-[#ffa31a]/70"
                        onClick={() => paymayaInputRef.current?.click()}
                      >
                        <Upload className="h-4 w-4" />
                        <span className="text-xs">Upload Image</span>
                      </button>
                    )}
                    <input ref={paymayaInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, "paymaya")} />
                    <Input
                      value={paymentChannels.paymaya.description}
                      onChange={(e) => setPaymentChannels((prev) => ({ ...prev, paymaya: { ...prev.paymaya, description: (e.target as HTMLInputElement).value } }))}
                      placeholder="PayMaya description (optional)"
                      className="mt-2 bg-[#292929] border-white/[0.09] text-white"
                    />
                  </div>

                  <div>
                    <p className="text-xs text-[#808080] mb-2">Bank Transfer (Description and/or Image)</p>
                    {paymentChannels.bankTransfer.imageUrl ? (
                      <div className="relative w-44 h-44 rounded-lg border border-white/[0.12] bg-white p-2">
                        <img src={paymentChannels.bankTransfer.imageUrl} alt="Bank transfer account" className="w-full h-full object-contain rounded" />
                        <Button
                          size="icon"
                          variant="ghost"
                          className="absolute -top-2 -right-2 h-7 w-7 bg-black/60 text-white hover:bg-black/80"
                          onClick={() => setPaymentChannels((prev) => ({ ...prev, bankTransfer: { ...prev.bankTransfer, imageUrl: "" } }))}
                        >
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        className="w-44 h-44 rounded-lg border-2 border-dashed border-white/[0.14] flex flex-col items-center justify-center gap-2 text-[#808080] hover:text-white hover:border-[#ffa31a]/70"
                        onClick={() => bankTransferInputRef.current?.click()}
                      >
                        <Upload className="h-4 w-4" />
                        <span className="text-xs">Upload Image</span>
                      </button>
                    )}
                    <input ref={bankTransferInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, "bankTransfer")} />
                    <Input
                      value={paymentChannels.bankTransfer.number}
                      onChange={(e) => setPaymentChannels((prev) => ({ ...prev, bankTransfer: { ...prev.bankTransfer, number: (e.target as HTMLInputElement).value } }))}
                      placeholder="Bank transfer number"
                      className="mt-2 bg-[#292929] border-white/[0.09] text-white"
                    />
                    <Input
                      value={paymentChannels.bankTransfer.provider}
                      onChange={(e) => setPaymentChannels((prev) => ({ ...prev, bankTransfer: { ...prev.bankTransfer, provider: (e.target as HTMLInputElement).value } }))}
                      placeholder="Bank transfer provider"
                      className="mt-2 bg-[#292929] border-white/[0.09] text-white"
                    />
                  </div>

                  <div>
                    <p className="text-xs text-[#808080] mb-2">Card</p>
                    <Input
                      value={paymentChannels.card.number}
                      onChange={(e) => setPaymentChannels((prev) => ({ ...prev, card: { ...prev.card, number: (e.target as HTMLInputElement).value } }))}
                      placeholder="Card number"
                      className="bg-[#292929] border-white/[0.09] text-white"
                    />
                    <Input
                      value={paymentChannels.card.provider}
                      onChange={(e) => setPaymentChannels((prev) => ({ ...prev, card: { ...prev.card, provider: (e.target as HTMLInputElement).value } }))}
                      placeholder="Card provider"
                      className="mt-2 bg-[#292929] border-white/[0.09] text-white"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <p className="text-xs text-[#808080] mb-2">Cash/Cheque (No Image)</p>
                    <Input
                      value={paymentChannels.cashCheque.description}
                      onChange={(e) => setPaymentChannels((prev) => ({ ...prev, cashCheque: { description: (e.target as HTMLInputElement).value } }))}
                      placeholder="To be settled personally between owner and proprietor."
                      className="bg-[#292929] border-white/[0.09] text-white"
                    />
                  </div>
                </div>

                <Button onClick={savePaymentChannels} disabled={savingChannels} className="bg-[#ffa31a] hover:bg-[#ffa31a]/90 text-[#1b1b1b]">
                  {savingChannels ? "Saving..." : "Save Payment Accounts"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card className="bg-[#292929] border-white/[0.07] sa-card">
            <CardHeader>
              <CardTitle className="text-white">Notification Settings</CardTitle>
              <CardDescription className="text-[#808080]">
                Configure admin notification preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-white">New Property Applications</p>
                  <p className="text-sm text-[#808080]">
                    Get notified when new properties apply
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-white">High-Value Bookings</p>
                  <p className="text-sm text-slate-400">
                    Alert for bookings over ₱500
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-white">Negative Reviews</p>
                  <p className="text-sm text-[#808080]">
                    Alert for reviews with 2 stars or less
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-white">Weekly Reports</p>
                  <p className="text-sm text-[#808080]">
                    Receive weekly performance summary
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
              <Button
                onClick={handleSave}
                className="bg-[#ffa31a] hover:bg-[#ffa31a]/90 text-[#1b1b1b] mt-4"
              >
                Save Preferences
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card className="bg-[#292929] border-white/[0.07] sa-card">
            <CardHeader>
              <CardTitle className="text-white">Security Settings</CardTitle>
              <CardDescription className="text-[#808080]">
                Platform security configuration
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-white">Two-Factor Authentication</p>
                  <p className="text-sm text-[#808080]">
                    Require 2FA for all admin accounts
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-white">Session Timeout</p>
                  <p className="text-sm text-[#808080]">
                    Auto-logout after 30 minutes of inactivity
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-white">Login Alerts</p>
                  <p className="text-sm text-[#808080]">
                    Email notification on new device login
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="pt-4 border-t border-white/[0.06]">
                <Button variant="destructive">Force Logout All Users</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="email">
          <Card className="bg-[#292929] border-white/[0.07] sa-card">
            <CardHeader>
              <CardTitle className="text-white">Email Configuration</CardTitle>
              <CardDescription className="text-[#808080]">
                Configure email sending settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-white/80">SMTP Host</Label>
                  <Input
                    defaultValue="smtp.sendgrid.net"
                    className="bg-[#292929] border-white/[0.09] text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-white/80">SMTP Port</Label>
                  <Input
                    defaultValue="587"
                    className="bg-[#292929] border-white/[0.09] text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-white/80">From Email</Label>
                  <Input
                    defaultValue="noreply@pawstay.com"
                    className="bg-[#292929] border-white/[0.09] text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-white/80">From Name</Label>
                  <Input
                    defaultValue="PawStay"
                    className="bg-[#292929] border-white/[0.09] text-white"
                  />
                </div>
              </div>
              <Button
                onClick={handleSave}
                className="bg-[#ffa31a] hover:bg-[#ffa31a]/90 text-[#1b1b1b] mt-4"
              >
                Save Email Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </SuperAdminLayout>
  );
};

export default SuperAdminSettings;

import SuperAdminLayout from "@/components/superadmin/SuperAdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Globe, Bell, Shield, Palette, Mail } from "lucide-react";
import { useState } from "react";

const SuperAdminSettings = () => {
  const { toast } = useToast();

  // controlled settings
  const [platformName, setPlatformName] = useState<string>("PawStay");
  const [supportEmail, setSupportEmail] = useState<string>("support@pawstay.com");
  const [platformFee, setPlatformFee] = useState<number>(10);
  const [minBookingAmount, setMinBookingAmount] = useState<number>(25);

  const handleSave = () => {
    toast({
      title: "Settings saved",
      description: `Platform settings updated — ${platformName} (${platformFee}% commission).`,
    });
    // TODO: persist to backend
    console.log("Save platform settings", { platformName, supportEmail, platformFee, minBookingAmount });
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
          {/* Website Info Table */}
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
              <CardDescription className="text-[#808080]">
                General platform configuration
              </CardDescription>
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

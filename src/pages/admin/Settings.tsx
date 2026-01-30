import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Building2, Bell, CreditCard, Shield, Clock } from "lucide-react";

const AdminSettings = () => {
  const { toast } = useToast();

  const handleSave = () => {
    toast({
      title: "Settings saved",
      description: "Your changes have been saved successfully.",
    });
  };

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
                  <Input id="businessName" defaultValue="Happy Paws Pet Hotel" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input id="phone" defaultValue="(555) 123-4567" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" defaultValue="contact@happypaws.com" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="website">Website</Label>
                  <Input id="website" defaultValue="www.happypaws.com" />
                </div>
                <div className="md:col-span-2 space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Input id="address" defaultValue="123 Pet Street, San Francisco, CA 94102" />
                </div>
                <div className="md:col-span-2 space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    rows={4}
                    defaultValue="A premium pet hotel offering boarding, grooming, and daycare services with love and care."
                  />
                </div>
              </div>
              <Button variant="hero" onClick={handleSave}>Save Changes</Button>
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
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Booking Reminders</p>
                    <p className="text-sm text-muted-foreground">Remind about upcoming check-ins and check-outs</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">New Reviews</p>
                    <p className="text-sm text-muted-foreground">Get notified when customers leave reviews</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Marketing Updates</p>
                    <p className="text-sm text-muted-foreground">Tips and promotions from PawStay</p>
                  </div>
                  <Switch />
                </div>
              </div>
              <Button variant="hero" onClick={handleSave}>Save Preferences</Button>
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
                  <Input type="number" defaultValue="25" />
                </div>
                <div className="space-y-2">
                  <Label>Minimum Stay (nights)</Label>
                  <Input type="number" defaultValue="1" />
                </div>
                <div className="space-y-2">
                  <Label>Check-in Time</Label>
                  <Input type="time" defaultValue="09:00" />
                </div>
                <div className="space-y-2">
                  <Label>Check-out Time</Label>
                  <Input type="time" defaultValue="17:00" />
                </div>
              </div>
              <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/50">
                <div>
                  <p className="font-medium">Accept Same-Day Bookings</p>
                  <p className="text-sm text-muted-foreground">Allow customers to book for today</p>
                </div>
                <Switch defaultChecked />
              </div>
              <Button variant="hero" onClick={handleSave}>Save Settings</Button>
            </CardContent>
          </Card>
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
                    <p className="text-2xl font-bold text-foreground">$3,450.00</p>
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

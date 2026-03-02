import SuperAdminLayout from "@/components/superadmin/SuperAdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DollarSign, TrendingUp, CreditCard, ArrowUpRight, ArrowDownRight, Download, Filter, Building2 } from "lucide-react";

const revenueStats = [
  { label: "Total Revenue", value: "₱284,520", change: "+18.2%", trend: "up", icon: DollarSign },
  { label: "Platform Fees", value: "₱28,452", change: "+15.8%", trend: "up", icon: TrendingUp },
  { label: "Pending Payouts", value: "₱12,340", change: "-5.2%", trend: "down", icon: CreditCard },
  { label: "Active Properties", value: "156", change: "+8", trend: "up", icon: Building2 },
];

const transactions = [
  { id: "TXN-001", property: "Paws Paradise Hotel", type: "Booking", amount: 450, fee: 45, date: "2024-01-15", status: "Completed", amountDisplay: "₱450", feeDisplay: "₱45" },
  { id: "TXN-002", property: "Happy Tails Resort", type: "Booking", amount: 320, fee: 32, date: "2024-01-15", status: "Completed", amountDisplay: "₱320", feeDisplay: "₱32" },
  { id: "TXN-003", property: "Pet Haven Grooming", type: "Service", amount: 85, fee: 8.50, date: "2024-01-14", status: "Completed", amountDisplay: "₱85", feeDisplay: "₱8.50" },
  { id: "TXN-004", property: "VetCare Plus", type: "Service", amount: 150, fee: 15, date: "2024-01-14", status: "Pending", amountDisplay: "₱150", feeDisplay: "₱15" },
  { id: "TXN-005", property: "Luxury Pet Suites", type: "Booking", amount: 890, fee: 89, date: "2024-01-13", status: "Completed", amountDisplay: "₱890", feeDisplay: "₱89" },
  { id: "TXN-006", property: "City Paws Hotel", type: "Booking", amount: 275, fee: 27.50, date: "2024-01-13", status: "Refunded", amountDisplay: "₱275", feeDisplay: "₱27.50" },
  { id: "TXN-007", property: "Pampered Pets Spa", type: "Service", amount: 120, fee: 12, date: "2024-01-12", status: "Completed", amountDisplay: "₱120", feeDisplay: "₱12" },
  { id: "TXN-008", property: "Cozy Kennels", type: "Booking", amount: 180, fee: 18, date: "2024-01-12", status: "Completed", amountDisplay: "₱180", feeDisplay: "₱18" },
];

const payouts = [
  { id: "PAY-001", property: "Paws Paradise Hotel", amount: 4250, amountDisplay: "₱4,250", status: "Processing", date: "2024-01-16" },
  { id: "PAY-002", property: "Happy Tails Resort", amount: 3180, amountDisplay: "₱3,180", status: "Scheduled", date: "2024-01-17" },
  { id: "PAY-003", property: "Luxury Pet Suites", amount: 8920, amountDisplay: "₱8,920", status: "Scheduled", date: "2024-01-17" },
  { id: "PAY-004", property: "Pet Haven Grooming", amount: 1560, amountDisplay: "₱1,560", status: "Processing", date: "2024-01-16" },
];

const SuperAdminRevenue = () => {
  return (
    <SuperAdminLayout title="Revenue & Payouts" subtitle="Track platform revenue and manage property payouts">
      {/* Stats Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8 sa-stagger">
        {revenueStats.map((stat) => (
          <Card key={stat.label} className="bg-[#292929] border-white/[0.07] sa-card sa-slide-in">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 rounded-lg bg-[#ffa31a]/20">
                  <stat.icon className="h-5 w-5 text-[#ffa31a]" />
                </div>
                <Badge 
                  variant="outline" 
                  className={stat.trend === "up" ? "text-emerald-400 border-emerald-400/30" : "text-red-400 border-red-400/30"}
                >
                  {stat.trend === "up" ? <ArrowUpRight className="h-3 w-3 mr-1" /> : <ArrowDownRight className="h-3 w-3 mr-1" />}
                  {stat.change}
                </Badge>
              </div>
              <p className="text-2xl font-bold text-white tabular-nums">{stat.value}</p>
              <p className="text-sm text-[#808080]">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6 sa-slide-in" style={{ animationDelay: '120ms' }}>
        {/* Transactions Table */}
        <Card className="lg:col-span-2 bg-[#292929] border-white/[0.07] sa-card">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-white">Recent Transactions</CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="border-white/[0.1] text-white/80 hover:bg-white/[0.06]">
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </Button>
              <Button variant="outline" size="sm" className="border-white/[0.1] text-white/80 hover:bg-white/[0.06]">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3 mb-4">
              <Input 
                placeholder="Search transactions..." 
                className="bg-[#292929] border-white/[0.09] text-white placeholder:text-[#808080]"
              />
              <Select defaultValue="all">
                <SelectTrigger className="w-40 bg-[#292929] border-white/[0.09] text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#292929] border-white/10 text-white">
                  <SelectItem value="all" className="text-white focus:bg-white/[0.06] focus:text-white">All Types</SelectItem>
                  <SelectItem value="booking" className="text-white focus:bg-white/[0.06] focus:text-white">Bookings</SelectItem>
                  <SelectItem value="service" className="text-white focus:bg-white/[0.06] focus:text-white">Services</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Table>
              <TableHeader>
                <TableRow className="border-white/[0.06] hover:bg-transparent">
                  <TableHead className="text-[#808080]">Transaction</TableHead>
                  <TableHead className="text-[#808080]">Property</TableHead>
                  <TableHead className="text-[#808080]">Amount</TableHead>
                  <TableHead className="text-[#808080]">Fee</TableHead>
                  <TableHead className="text-[#808080]">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((txn) => (
                  <TableRow key={txn.id} className="border-white/[0.06] hover:bg-white/[0.04]">
                    <TableCell>
                      <div>
                        <p className="font-medium text-white">{txn.id}</p>
                        <p className="text-xs text-[#808080]">{txn.date}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="text-white/80">{txn.property}</p>
                        <p className="text-xs text-[#808080]">{txn.type}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-white font-medium">{txn.amountDisplay || `₱${txn.amount}`}</TableCell>
                    <TableCell className="text-emerald-400">{txn.feeDisplay || `₱${txn.fee}`}</TableCell>
                    <TableCell>
                      <Badge 
                        variant="outline"
                        className={
                          txn.status === "Completed" ? "text-emerald-400 border-emerald-400/30" :
                          txn.status === "Pending" ? "text-amber-400 border-amber-400/30" :
                          "text-red-400 border-red-400/30"
                        }
                      >
                        {txn.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Pending Payouts */}
        <Card className="bg-[#292929] border-white/[0.07] sa-card">
          <CardHeader>
            <CardTitle className="text-white">Pending Payouts</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {payouts.map((payout) => (
              <div key={payout.id} className="p-4 rounded-lg bg-black/20 border border-white/[0.08]">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-medium text-white">{payout.property}</p>
                    <p className="text-xs text-[#808080]">{payout.id}</p>
                  </div>
                  <Badge 
                    variant="outline"
                    className={payout.status === "Processing" ? "text-blue-400 border-blue-400/30" : "text-amber-400 border-amber-400/30"}
                  >
                    {payout.status}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-xl font-bold text-white">{payout.amountDisplay || `₱${payout.amount.toLocaleString()}`}</p>
                  <p className="text-sm text-slate-400">{payout.date}</p>
                </div>
                <div className="flex gap-2 mt-3">
                  <Button size="sm" className="flex-1 bg-[#ffa31a] hover:bg-[#ffa31a]/90 text-[#1b1b1b]">
                    Process
                  </Button>
                  <Button size="sm" variant="outline" className="border-white/[0.1] text-white/80 hover:bg-white/[0.06]">
                    View
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </SuperAdminLayout>
  );
};

export default SuperAdminRevenue;

import { useEffect, useState } from "react";
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
import { bookingApi } from "@/services/bookingApi";

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
  const [totalRevenue, setTotalRevenue] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [serviceTypeBreakdown, setServiceTypeBreakdown] = useState<Array<{ serviceType: string; revenue: number; count: number }>>([]);
  const [propertyBreakdown, setPropertyBreakdown] = useState<Array<{ propertyId: string; propertyName: string; revenue: number; count: number }>>([]);
  const [locationBreakdown, setLocationBreakdown] = useState<Array<{ city: string; revenue: number; count: number }>>([]);
  const [timePeriodBreakdown, setTimePeriodBreakdown] = useState<{
    daily: { revenue: number; count: number; period: string };
    weekly: { revenue: number; count: number; period: string };
    monthly: { revenue: number; count: number; period: string };
  } | null>(null);
  const [periodComparison, setPeriodComparison] = useState<{
    monthly: { current: number; previous: number; percentageChange: number; period: string };
    quarterly: { current: number; previous: number; percentageChange: number; period: string };
    yearly: { current: number; previous: number; percentageChange: number; period: string };
  } | null>(null);

  useEffect(() => {
    const fetchRevenueData = async () => {
      try {
        setLoading(true);
        
        // Fetch all revenue data in parallel
        const [totalRes, serviceRes, propertyRes, locationRes, timePeriodRes, comparisonRes] = await Promise.all([
          bookingApi.getTotalRevenue(),
          bookingApi.getRevenueByServiceType(),
          bookingApi.getRevenueByProperty(),
          bookingApi.getRevenueByLocation(),
          bookingApi.getRevenueByTimePeriod(),
          bookingApi.getRevenuePeriodComparison(),
        ]);

        setTotalRevenue(totalRes.totalRevenue);
        setServiceTypeBreakdown(serviceRes.breakdown);
        setPropertyBreakdown(propertyRes.breakdown);
        setLocationBreakdown(locationRes.breakdown);
        setTimePeriodBreakdown(timePeriodRes);
        setPeriodComparison(comparisonRes);
      } catch (error) {
        console.error("Error fetching revenue data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRevenueData();
  }, []);

  // Format currency for display
  const formatCurrency = (amount: number) => {
    return `₱${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Update stats with real data
  const stats = [
    { 
      label: "Total Revenue (Service Fees)", 
      value: loading ? "Loading..." : (totalRevenue !== null ? formatCurrency(totalRevenue) : "₱0.00"),
      change: "+18.2%", 
      trend: "up", 
      icon: DollarSign 
    },
    { label: "Platform Fees", value: "₱28,452", change: "+15.8%", trend: "up", icon: TrendingUp },
    { label: "Pending Payouts", value: "₱12,340", change: "-5.2%", trend: "down", icon: CreditCard },
    { label: "Active Properties", value: "156", change: "+8", trend: "up", icon: Building2 },
  ];

  return (
    <SuperAdminLayout title="Revenue & Payouts" subtitle="Track platform revenue and manage property payouts">
      {/* Stats Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8 sa-stagger">
        {stats.map((stat) => (
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

      {/* Revenue by Time Period */}
      <div className="mt-8 sa-slide-in" style={{ animationDelay: '200ms' }}>
        <Card className="bg-[#292929] border-white/[0.07] sa-card">
          <CardHeader>
            <CardTitle className="text-white">Revenue by Time Period</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              {loading ? (
                <p className="text-white/60 col-span-3">Loading...</p>
              ) : timePeriodBreakdown ? (
                <>
                  {/* Daily */}
                  <div className="p-4 bg-gradient-to-br from-blue-500/10 to-blue-600/5 rounded-lg border border-blue-500/20">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm text-blue-300 font-medium">{timePeriodBreakdown.daily.period}</p>
                      <Badge variant="outline" className="text-blue-400 border-blue-400/30 text-xs">
                        {timePeriodBreakdown.daily.count} bookings
                      </Badge>
                    </div>
                    <p className="text-2xl font-bold text-white">{formatCurrency(timePeriodBreakdown.daily.revenue)}</p>
                    <p className="text-xs text-blue-300/60 mt-1">Service fees collected</p>
                  </div>

                  {/* Weekly */}
                  <div className="p-4 bg-gradient-to-br from-purple-500/10 to-purple-600/5 rounded-lg border border-purple-500/20">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm text-purple-300 font-medium">{timePeriodBreakdown.weekly.period}</p>
                      <Badge variant="outline" className="text-purple-400 border-purple-400/30 text-xs">
                        {timePeriodBreakdown.weekly.count} bookings
                      </Badge>
                    </div>
                    <p className="text-2xl font-bold text-white">{formatCurrency(timePeriodBreakdown.weekly.revenue)}</p>
                    <p className="text-xs text-purple-300/60 mt-1">Service fees collected</p>
                  </div>

                  {/* Monthly */}
                  <div className="p-4 bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 rounded-lg border border-emerald-500/20">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm text-emerald-300 font-medium">{timePeriodBreakdown.monthly.period}</p>
                      <Badge variant="outline" className="text-emerald-400 border-emerald-400/30 text-xs">
                        {timePeriodBreakdown.monthly.count} bookings
                      </Badge>
                    </div>
                    <p className="text-2xl font-bold text-white">{formatCurrency(timePeriodBreakdown.monthly.revenue)}</p>
                    <p className="text-xs text-emerald-300/60 mt-1">Service fees collected</p>
                  </div>
                </>
              ) : (
                <p className="text-white/60 col-span-3">No data available</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Period-over-Period Comparison */}
      <div className="mt-8 sa-slide-in" style={{ animationDelay: '220ms' }}>
        <Card className="bg-[#292929] border-white/[0.07] sa-card">
          <CardHeader>
            <CardTitle className="text-white">Growth Comparison</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              {loading ? (
                <p className="text-white/60 col-span-3">Loading...</p>
              ) : periodComparison ? (
                <>
                  {/* Monthly Comparison */}
                  <div className="p-4 border border-white/[0.08] rounded-lg bg-black/20">
                    <div className="mb-3">
                      <p className="text-sm text-white/60 font-medium">Monthly</p>
                      <p className="text-xs text-white/40">Current vs Previous</p>
                    </div>
                    <div className="space-y-2 mb-3">
                      <div>
                        <p className="text-xs text-white/50">Current Month</p>
                        <p className="text-lg font-bold text-white">{formatCurrency(periodComparison.monthly.current)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-white/50">Previous Month</p>
                        <p className="text-sm text-white/70">{formatCurrency(periodComparison.monthly.previous)}</p>
                      </div>
                    </div>
                    <div className={`flex items-center gap-2 p-2 rounded ${periodComparison.monthly.percentageChange >= 0 ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-red-500/10 border border-red-500/20'}`}>
                      {periodComparison.monthly.percentageChange >= 0 ? (
                        <>
                          <ArrowUpRight className={`h-4 w-4 text-emerald-400`} />
                          <span className="text-sm font-bold text-emerald-400">{periodComparison.monthly.percentageChange.toFixed(1)}%</span>
                        </>
                      ) : (
                        <>
                          <ArrowDownRight className={`h-4 w-4 text-red-400`} />
                          <span className="text-sm font-bold text-red-400">{periodComparison.monthly.percentageChange.toFixed(1)}%</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Quarterly Comparison */}
                  <div className="p-4 border border-white/[0.08] rounded-lg bg-black/20">
                    <div className="mb-3">
                      <p className="text-sm text-white/60 font-medium">Quarterly</p>
                      <p className="text-xs text-white/40">Current vs Previous</p>
                    </div>
                    <div className="space-y-2 mb-3">
                      <div>
                        <p className="text-xs text-white/50">Current Quarter</p>
                        <p className="text-lg font-bold text-white">{formatCurrency(periodComparison.quarterly.current)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-white/50">Previous Quarter</p>
                        <p className="text-sm text-white/70">{formatCurrency(periodComparison.quarterly.previous)}</p>
                      </div>
                    </div>
                    <div className={`flex items-center gap-2 p-2 rounded ${periodComparison.quarterly.percentageChange >= 0 ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-red-500/10 border border-red-500/20'}`}>
                      {periodComparison.quarterly.percentageChange >= 0 ? (
                        <>
                          <ArrowUpRight className={`h-4 w-4 text-emerald-400`} />
                          <span className="text-sm font-bold text-emerald-400">{periodComparison.quarterly.percentageChange.toFixed(1)}%</span>
                        </>
                      ) : (
                        <>
                          <ArrowDownRight className={`h-4 w-4 text-red-400`} />
                          <span className="text-sm font-bold text-red-400">{periodComparison.quarterly.percentageChange.toFixed(1)}%</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Yearly Comparison */}
                  <div className="p-4 border border-white/[0.08] rounded-lg bg-black/20">
                    <div className="mb-3">
                      <p className="text-sm text-white/60 font-medium">Yearly</p>
                      <p className="text-xs text-white/40">Current vs Previous</p>
                    </div>
                    <div className="space-y-2 mb-3">
                      <div>
                        <p className="text-xs text-white/50">Current Year</p>
                        <p className="text-lg font-bold text-white">{formatCurrency(periodComparison.yearly.current)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-white/50">Previous Year</p>
                        <p className="text-sm text-white/70">{formatCurrency(periodComparison.yearly.previous)}</p>
                      </div>
                    </div>
                    <div className={`flex items-center gap-2 p-2 rounded ${periodComparison.yearly.percentageChange >= 0 ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-red-500/10 border border-red-500/20'}`}>
                      {periodComparison.yearly.percentageChange >= 0 ? (
                        <>
                          <ArrowUpRight className={`h-4 w-4 text-emerald-400`} />
                          <span className="text-sm font-bold text-emerald-400">{periodComparison.yearly.percentageChange.toFixed(1)}%</span>
                        </>
                      ) : (
                        <>
                          <ArrowDownRight className={`h-4 w-4 text-red-400`} />
                          <span className="text-sm font-bold text-red-400">{periodComparison.yearly.percentageChange.toFixed(1)}%</span>
                        </>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <p className="text-white/60 col-span-3">No data available</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Breakdown by Service Type */}
      <div className="grid lg:grid-cols-2 gap-6 mt-8 sa-slide-in" style={{ animationDelay: '240ms' }}>
        <Card className="bg-[#292929] border-white/[0.07] sa-card">
          <CardHeader>
            <CardTitle className="text-white">Revenue by Service Type</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {loading ? (
                <p className="text-white/60">Loading...</p>
              ) : serviceTypeBreakdown.length > 0 ? (
                serviceTypeBreakdown.map((item) => (
                  <div key={item.serviceType} className="flex items-center justify-between p-3 bg-black/20 rounded-lg">
                    <div className="flex-1">
                      <p className="text-white font-medium capitalize">{item.serviceType || "Unknown"}</p>
                      <p className="text-sm text-[#808080]">{item.count} bookings</p>
                    </div>
                    <p className="text-white font-bold text-lg">{formatCurrency(item.revenue)}</p>
                  </div>
                ))
              ) : (
                <p className="text-white/60">No data available</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Average Booking Value by Service Type */}
        <Card className="bg-[#292929] border-white/[0.07] sa-card">
          <CardHeader>
            <CardTitle className="text-white">Average Service Fee per Booking</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {loading ? (
                <p className="text-white/60">Loading...</p>
              ) : serviceTypeBreakdown.length > 0 ? (
                serviceTypeBreakdown.map((item) => {
                  const averageValue = item.count > 0 ? item.revenue / item.count : 0;
                  return (
                    <div key={`avg-${item.serviceType}`} className="flex items-center justify-between p-3 bg-black/20 rounded-lg">
                      <div className="flex-1">
                        <p className="text-white font-medium capitalize">{item.serviceType || "Unknown"}</p>
                        <p className="text-sm text-[#808080]">Average from {item.count} bookings</p>
                      </div>
                      <div className="text-right">
                        <p className="text-white font-bold text-lg">{formatCurrency(averageValue)}</p>
                        <p className="text-xs text-[#808080]">per booking</p>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-white/60">No data available</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Breakdown by Property */}
      <div className="mt-8 sa-slide-in" style={{ animationDelay: '280ms' }}>
        <Card className="bg-[#292929] border-white/[0.07] sa-card">
          <CardHeader>
            <CardTitle className="text-white">Revenue by Property</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {loading ? (
                <p className="text-white/60">Loading...</p>
              ) : propertyBreakdown.length > 0 ? (
                propertyBreakdown.slice(0, 10).map((item) => (
                  <div key={item.propertyId} className="flex items-center justify-between p-3 bg-black/20 rounded-lg">
                    <div className="flex-1">
                      <p className="text-white font-medium truncate">{item.propertyName}</p>
                      <p className="text-sm text-[#808080]">{item.count} bookings</p>
                    </div>
                    <p className="text-white font-bold text-lg">{formatCurrency(item.revenue)}</p>
                  </div>
                ))
              ) : (
                <p className="text-white/60">No data available</p>
              )}
              {propertyBreakdown.length > 10 && (
                <p className="text-center text-white/60 text-sm py-2">+{propertyBreakdown.length - 10} more properties</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Breakdown by Location */}
      <div className="mt-8 sa-slide-in" style={{ animationDelay: '320ms' }}>
        <Card className="bg-[#292929] border-white/[0.07] sa-card">
          <CardHeader>
            <CardTitle className="text-white">Revenue by Location</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {loading ? (
                <p className="text-white/60">Loading...</p>
              ) : locationBreakdown.length > 0 ? (
                locationBreakdown.map((item) => (
                  <div key={item.city} className="flex items-center justify-between p-3 bg-black/20 rounded-lg">
                    <div className="flex-1">
                      <p className="text-white font-medium">{item.city}</p>
                      <p className="text-sm text-[#808080]">{item.count} bookings</p>
                    </div>
                    <p className="text-white font-bold text-lg">{formatCurrency(item.revenue)}</p>
                  </div>
                ))
              ) : (
                <p className="text-white/60">No data available</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </SuperAdminLayout>
  );
};

export default SuperAdminRevenue;

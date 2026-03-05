import { useEffect, useState, useMemo } from "react";
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
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { bookingApi } from "@/services/bookingApi";

const revenueStats = [
  { label: "Total Revenue", value: "₱284,520", change: "+18.2%", trend: "up", icon: DollarSign },
  { label: "Platform Fees", value: "₱28,452", change: "+15.8%", trend: "up", icon: TrendingUp },
  { label: "Pending Payouts", value: "₱12,340", change: "-5.2%", trend: "down", icon: CreditCard },
  { label: "Active Properties", value: "156", change: "+8", trend: "up", icon: Building2 },
];

// transactions will be fetched for superadmin via bookingApi.getAdminCalendar()

const payouts = [
  { id: "PAY-001", property: "Paws Paradise Hotel", amount: 4250, amountDisplay: "₱4,250", status: "Processing", date: "2024-01-16" },
  { id: "PAY-002", property: "Happy Tails Resort", amount: 3180, amountDisplay: "₱3,180", status: "Scheduled", date: "2024-01-17" },
  { id: "PAY-003", property: "Luxury Pet Suites", amount: 8920, amountDisplay: "₱8,920", status: "Scheduled", date: "2024-01-17" },
  { id: "PAY-004", property: "Pet Haven Grooming", amount: 1560, amountDisplay: "₱1,560", status: "Processing", date: "2024-01-16" },
];

  // Transactions state (populated from admin calendar endpoint)
  // (moved into component to obey Hooks rules)

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
  const [range, setRange] = useState<string>("this_period");
  const [periodComparison, setPeriodComparison] = useState<{
    monthly: { current: number; previous: number; percentageChange: number; period: string };
    quarterly: { current: number; previous: number; percentageChange: number; period: string };
    yearly: { current: number; previous: number; percentageChange: number; period: string };
  } | null>(null);
  const [monthlySeries, setMonthlySeries] = useState<Array<{ year: number; month: number; label: string; revenue: number }>>([]);
  // Transactions state (populated from admin calendar endpoint)
  const [transactions, setTransactions] = useState<Array<any>>([]);
  const [txnServiceTypes, setTxnServiceTypes] = useState<string[]>([]);
  const [txnFilterType, setTxnFilterType] = useState<string>("all");
  const [txnSearch, setTxnSearch] = useState<string>("");

  useEffect(() => {
    const fetchRevenueData = async () => {
      try {
        setLoading(true);
        
        // Fetch all revenue data in parallel
        const [totalRes, serviceRes, propertyRes, locationRes, timePeriodRes, comparisonRes, monthlyRes] = await Promise.all([
          bookingApi.getTotalRevenue(),
          bookingApi.getRevenueByServiceType(),
          bookingApi.getRevenueByProperty(),
          bookingApi.getRevenueByLocation(),
          bookingApi.getRevenueByTimePeriod(),
            bookingApi.getRevenuePeriodComparison(),
            bookingApi.getRevenueMonthlySeries(),
        ]);

        setTotalRevenue(totalRes.totalRevenue);
        setServiceTypeBreakdown(serviceRes.breakdown);
        setPropertyBreakdown(propertyRes.breakdown);
        setLocationBreakdown(locationRes.breakdown);
        setTimePeriodBreakdown(timePeriodRes);
        setPeriodComparison(comparisonRes);
        setMonthlySeries((monthlyRes as any)?.series || []);
        // fetch recent transactions (admin calendar) for the transactions table
        try {
          const calRes = await bookingApi.getAdminCalendar();
          const incoming = (calRes?.bookings || []) as any[];
          // normalize to transaction-like rows
          const mapped = incoming.map((b: any) => ({
            id: b.id,
            property: b.property_name || (b.property_id || "") as string,
            type: b.service_type || (b.service_name ? "Service" : "Booking"),
            amount: b.total_price ?? 0,
            fee: b.service_fee ?? 0,
            date: b.checkin || (b.created_at ? b.created_at.slice(0,10) : ''),
            status: b.payment_status === 'paid' ? 'Completed' : (b.payment_status === 'refunded' ? 'Refunded' : (b.status || 'Pending')),
            amountDisplay: b.total_price != null ? `₱${Number(b.total_price).toLocaleString('en-US')}` : '₱0',
            feeDisplay: b.service_fee != null ? `₱${Number(b.service_fee).toLocaleString('en-US')}` : '₱0',
            raw: b,
          }));
          setTransactions(mapped);
          setTxnServiceTypes(Array.isArray(calRes?.serviceTypes) ? calRes.serviceTypes : []);
        } catch (e) {
          console.error('Failed to fetch admin calendar for transactions', e);
        }
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

  // Export a breakdown array to CSV and trigger download
  const exportCSV = (rows: any[], filename = "export.csv") => {
    if (!rows || rows.length === 0) return;
    const keys = Object.keys(rows[0]);
    const csv = [keys.join(','), ...rows.map(r => keys.map(k => {
      const v = (r as any)[k];
      if (typeof v === 'string') return `"${v.replace(/"/g, '""')}"`;
      return v ?? '';
    }).join(','))].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Export all visible breakdowns as separate CSV files
  const exportAll = () => {
    if (!loading) {
      if (serviceTypeBreakdown && serviceTypeBreakdown.length > 0) exportCSV(serviceTypeBreakdown, 'revenue_by_service_type.csv');
      if (propertyBreakdown && propertyBreakdown.length > 0) exportCSV(propertyBreakdown, 'revenue_by_property.csv');
      if (monthlySeries && monthlySeries.length > 0) exportCSV(monthlySeries, 'revenue_monthly_series.csv');
      const timeChartData = timePeriodBreakdown
        ? [
            { period: timePeriodBreakdown.daily.period, revenue: timePeriodBreakdown.daily.revenue },
            { period: timePeriodBreakdown.weekly.period, revenue: timePeriodBreakdown.weekly.revenue },
            { period: timePeriodBreakdown.monthly.period, revenue: timePeriodBreakdown.monthly.revenue },
          ]
        : [];
      if (timeChartData.length > 0) exportCSV(timeChartData, 'revenue_time_period.csv');
    }
  };

  // Compute useful derived metrics for stat cards
  const totalBookings = (serviceTypeBreakdown && serviceTypeBreakdown.length > 0)
    ? serviceTypeBreakdown.reduce((s, i) => s + (i.count || 0), 0)
    : (propertyBreakdown && propertyBreakdown.length > 0)
      ? propertyBreakdown.reduce((s, i) => s + (i.count || 0), 0)
      : 0;

  const avgServiceFee = (totalBookings > 0 && totalRevenue) ? (totalRevenue / totalBookings) : 0;

  const activeProperties = propertyBreakdown && propertyBreakdown.length ? propertyBreakdown.length : 0;

  // Update stats with real data (more actionable metrics)
  const stats = [
    {
      label: "Total Revenue (Service Fees)",
      value: loading ? "Loading..." : (totalRevenue !== null ? formatCurrency(totalRevenue) : "₱0.00"),
      previous: periodComparison?.monthly?.previous ?? null,
      change: periodComparison?.monthly?.percentageChange !== undefined ? `${periodComparison!.monthly.percentageChange.toFixed(1)}%` : undefined,
      trend: periodComparison?.monthly?.percentageChange && periodComparison.monthly.percentageChange >= 0 ? "up" : "down",
      icon: DollarSign,
    },
    {
      label: "Total Bookings",
      value: loading ? "Loading..." : `${totalBookings}`,
      change: undefined,
      trend: "up",
      icon: TrendingUp,
    },
    {
      label: "Avg Service Fee / Booking",
      value: loading ? "Loading..." : formatCurrency(avgServiceFee),
      change: undefined,
      trend: "up",
      icon: CreditCard,
    },
    {
      label: "Active Properties",
      value: loading ? "Loading..." : `${activeProperties}`,
      change: undefined,
      trend: "up",
      icon: Building2,
    },
  ];

  // Prepare small chart data from the time period breakdown (daily/weekly/monthly)
  const timeChartData = timePeriodBreakdown
    ? [
        { period: timePeriodBreakdown.daily.period, revenue: timePeriodBreakdown.daily.revenue },
        { period: timePeriodBreakdown.weekly.period, revenue: timePeriodBreakdown.weekly.revenue },
        { period: timePeriodBreakdown.monthly.period, revenue: timePeriodBreakdown.monthly.revenue },
      ]
    : [];

  // Filtered transactions based on search and selected service type
  const filteredTransactions = useMemo(() => {
    const q = txnSearch.trim().toLowerCase();
    return transactions.filter((t) => {
      if (txnFilterType && txnFilterType !== 'all' && String(t.type).toLowerCase() !== String(txnFilterType).toLowerCase()) return false;
      if (!q) return true;
      return [t.id, t.property, t.type, t.raw?.owner_name, t.raw?.service_name]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q));
    });
  }, [transactions, txnFilterType, txnSearch]);

  return (
    <SuperAdminLayout title="Revenue & Payouts" subtitle="Track platform revenue and manage property payouts">
      <div className="flex justify-end mb-4">
        <Button variant="outline" size="sm" className="gap-2 border-white/10 text-[#808080] hover:bg-white/5 hover:text-white" onClick={exportAll} disabled={loading}>
          <Download className="h-4 w-4" />
          Export All
        </Button>
      </div>
      {/* Stats Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8 sa-stagger">
        {stats.map((stat) => (
          <Card key={stat.label} className="bg-[#292929] border-white/[0.07] sa-card sa-slide-in">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 rounded-lg bg-[#ffa31a]/20">
                  <stat.icon className="h-5 w-5 text-[#ffa31a]" />
                </div>
                {stat.change ? (
                  <Badge
                    variant="outline"
                    className={stat.trend === "up" ? "text-emerald-400 border-emerald-400/30" : "text-red-400 border-red-400/30"}
                  >
                    {stat.trend === "up" ? <ArrowUpRight className="h-3 w-3 mr-1" /> : <ArrowDownRight className="h-3 w-3 mr-1" />}
                    {stat.change}
                  </Badge>
                ) : null}
              </div>
              <p className="text-2xl font-bold text-white tabular-nums">{stat.value}</p>
              {stat.previous !== undefined && stat.previous !== null && (
                <p className="text-xs text-white/60 mt-1">Previous: {formatCurrency(stat.previous)}</p>
              )}
              <p className="text-sm text-[#808080]">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6 sa-slide-in" style={{ animationDelay: '120ms' }}>
        {/* Transactions Table */}
        <Card className="lg:col-span-2 bg-[#292929] border-white/[0.07] sa-card">
          <CardHeader className="relative">
            <CardTitle className="text-white">Recent Transactions</CardTitle>
            <div className="absolute right-4 top-3 flex items-center gap-2">
              <Select defaultValue={txnFilterType} onValueChange={(v) => setTxnFilterType(v)}>
                <SelectTrigger className="w-44 bg-[#292929] border-white/[0.09] text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#292929] border-white/10 text-white">
                  <SelectItem value="all" className="text-white">All Types</SelectItem>
                  <SelectItem value="boarding" className="text-white">Boarding</SelectItem>
                  <SelectItem value="grooming" className="text-white">Grooming</SelectItem>
                  <SelectItem value="veterinary" className="text-white">Veterinary</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" className="border-white/[0.1] text-white/80 hover:bg-white/[0.06]" onClick={() => { setTxnFilterType('all'); setTxnSearch(''); }}>
                <Filter className="h-4 w-4 mr-2" />
                Clear
              </Button>
              <Button variant="outline" size="sm" className="border-white/[0.1] text-white/80 hover:bg-white/[0.06]" onClick={() => exportCSV(filteredTransactions, 'transactions.csv')} disabled={loading || filteredTransactions.length === 0}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3 mb-4">
              <Input
                value={txnSearch}
                onChange={(e) => setTxnSearch((e.target as HTMLInputElement).value)}
                placeholder="Search transactions by id, property, owner or service..."
                className="bg-[#292929] border-white/[0.09] text-white placeholder:text-[#808080] w-full"
              />
            </div>
            <div className="overflow-auto max-h-72 w-full">
              <Table className="w-full">
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
                {filteredTransactions.map((txn) => (
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
            </div>
          </CardContent>
        </Card>

        {/* Pending Payouts */}
        {/* <Card className="bg-[#292929] border-white/[0.07] sa-card">
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
        </Card> */}
      </div>

      {/* Revenue by Time Period */}
      <div className="mt-8 sa-slide-in" style={{ animationDelay: '200ms' }}>
        <Card className="bg-[#292929] border-white/[0.07] sa-card">
          <CardHeader className="relative">
            <CardTitle className="text-white">Revenue by Time Period</CardTitle>
            <div className="absolute right-4 top-3 flex items-center gap-2">
              <Select defaultValue={range} onValueChange={(v) => setRange(v)}>
                <SelectTrigger className="w-44 bg-[#292929] border-white/[0.09] text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#292929] border-white/10 text-white">
                  <SelectItem value="this_period" className="text-white">This Period</SelectItem>
                  <SelectItem value="last_7" className="text-white">Last 7 days</SelectItem>
                  <SelectItem value="last_30" className="text-white">Last 30 days</SelectItem>
                  <SelectItem value="ytd" className="text-white">Year to date</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" className="gap-2 border-white/10 text-[#808080] hover:bg-white/5 hover:text-white" onClick={() => exportCSV(timeChartData, 'revenue_time_period.csv')} disabled={loading || timeChartData.length === 0}>
                <Download className="h-4 w-4" />
                Export
              </Button>
            </div>
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
            {/* Small bar chart for daily/weekly/monthly */}
            {timeChartData.length > 0 && (
              <div className="mt-6" style={{ height: 180 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={timeChartData}>
                    <XAxis dataKey="period" stroke="#9CA3AF" />
                    <YAxis stroke="#9CA3AF" />
                    <Tooltip formatter={(value: any) => (typeof value === 'number' ? formatCurrency(value) : value)} />
                    <Bar dataKey="revenue" fill="#10B981" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
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

            {/* Monthly Revenue Trend (historical series) */}
            <div className="mt-8 sa-slide-in" style={{ animationDelay: '240ms' }}>
              <Card className="bg-[#292929] border-white/[0.07] sa-card">
                <CardHeader className="relative">
                  <CardTitle className="text-white">Monthly Revenue Trend</CardTitle>
                  <div className="absolute right-4 top-3 flex items-center gap-2">
                    <Button variant="outline" size="sm" className="gap-2 border-white/10 text-[#808080] hover:bg-white/5 hover:text-white" onClick={() => exportCSV(monthlySeries, 'revenue_monthly_series.csv')} disabled={loading || monthlySeries.length === 0}>
                      <Download className="h-4 w-4" />
                      Export
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <p className="text-white/60">Loading...</p>
                  ) : monthlySeries.length > 0 ? (
                    <div style={{ height: 280 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={monthlySeries.map(m => ({ label: m.label, revenue: m.revenue }))}>
                          <XAxis dataKey="label" stroke="#9CA3AF" />
                          <YAxis stroke="#9CA3AF" />
                          <Tooltip formatter={(value: any) => (typeof value === 'number' ? formatCurrency(value) : value)} />
                          <Bar dataKey="revenue" fill="#60A5FA" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <p className="text-white/60">No monthly data available</p>
                  )}
                </CardContent>
              </Card>
            </div>

      {/* Revenue Breakdown by Service Type */}
      <div className="grid lg:grid-cols-2 gap-6 mt-8 sa-slide-in" style={{ animationDelay: '240ms' }}>
        <Card className="bg-[#292929] border-white/[0.07] sa-card">
            <CardHeader className="relative">
                  <CardTitle className="text-white">Revenue by Service Type</CardTitle>
                  <div className="absolute right-4 top-3 flex items-center gap-2">
                    <Button variant="outline" size="sm" className="gap-2 border-white/10 text-[#808080] hover:bg-white/5 hover:text-white" onClick={() => exportCSV(serviceTypeBreakdown, 'revenue_by_service_type.csv')} disabled={loading || serviceTypeBreakdown.length === 0}>
                      <Download className="h-4 w-4" />
                      Export
                    </Button>
                  </div>
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
          <CardHeader className="relative">
            <CardTitle className="text-white">Revenue by Property</CardTitle>
            <div className="absolute right-4 top-3 flex items-center gap-2">
              <Button variant="outline" size="sm" className="gap-2 border-white/10 text-[#808080] hover:bg-white/5 hover:text-white" onClick={() => exportCSV(propertyBreakdown, 'revenue_by_property.csv')} disabled={loading || propertyBreakdown.length === 0}>
                <Download className="h-4 w-4" />
                Export
              </Button>
            </div>
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

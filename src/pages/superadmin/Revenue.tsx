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
import { DollarSign, TrendingUp, CreditCard, ArrowUpRight, ArrowDownRight, Download, Filter, Building2, AlertCircle, Clock, FileText, User, PawPrint, Calendar, ChevronRight, CheckCircle2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PetLoader } from "@/components/ui/PetLoader";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import { bookingApi } from "@/services/bookingApi";
import { useToast } from "@/hooks/use-toast";

// Custom tooltip for monthly receivables chart
const ReceivablesTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload || payload.length === 0) return null;

  // helper to find value by dataKey or name
  const findValue = (key: string) => {
    const p = payload.find((x: any) => x.dataKey === key || String(x.name).toLowerCase().includes(key));
    return p ? Number(p.value || 0) : 0;
  };

  const generated = findValue('generated');
  const settled = findValue('settled');
  const outstanding = findValue('outstanding');

  // friendly month label
  let monthLabel = String(label);
  try {
    const parts = String(label).split('-');
    if (parts.length >= 2) {
      const d = new Date(Number(parts[0]), Number(parts[1]) - 1, 1);
      monthLabel = d.toLocaleString('en-US', { month: 'short', year: 'numeric' });
    }
  } catch (e) {}

  const fmt = (v: number) => `₱${Number(v).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const colors = {
    generated: '#ffa31a',
    settled: '#10b981',
    outstanding: '#ef4444',
  };

  const Row = ({ color, label, value }: { color: string; label: string; value: number }) => (
    <div className="flex items-center justify-between mt-1">
      <div className="flex items-center gap-2">
        <span style={{ width: 10, height: 10, backgroundColor: color, display: 'inline-block', borderRadius: 2 }} />
        <div className="text-[#808080] text-sm">{label}</div>
      </div>
      <div style={{ color }} className="font-semibold">{fmt(value)}</div>
    </div>
  );

  return (
    <div className="p-3 rounded-md bg-[#292929] border border-white/[0.06] text-white text-sm">
      <div className="font-medium mb-2">{monthLabel}</div>
      <Row color={colors.generated} label="Generated" value={generated} />
      <Row color={colors.settled} label="Settled" value={settled} />
      <Row color={colors.outstanding} label="Outstanding" value={outstanding} />
    </div>
  );
};

// (Static placeholder arrays removed — all data is fetched from the API)

const SuperAdminRevenue = () => {
  const { toast } = useToast();
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
  const [monthlySeries, setMonthlySeries] = useState<Array<{ year: number; month: number; label: string; revenue: number }>>([]);
  // Monthly receivables state (settlement-aware)
  const [monthlyRecv, setMonthlyRecv] = useState<Array<{ month: string; label: string; generated: number; settled: number; outstanding: number }>>([]);
  const [recvTotals, setRecvTotals] = useState<{ generated: number; settled: number; outstanding: number } | null>(null);
  // Payables state (service-fee based)
  const [recvLoading, setRecvLoading] = useState(true);
  const [recvSummary, setRecvSummary] = useState<any | null>(null);
  const [recvProperties, setRecvProperties] = useState<any[]>([]);
  const [recvStatusFilter, setRecvStatusFilter] = useState("all");
  const [recvSortBy, setRecvSortBy] = useState("amount_desc");
  const [recvSearch, setRecvSearch] = useState("");
  const [selectedProperty, setSelectedProperty] = useState<any | null>(null);
  // Settlement recording dialog
  const [showSettleDialog, setShowSettleDialog] = useState(false);
  const [settleForm, setSettleForm] = useState({ amount: "", method: "cash", referenceNo: "", notes: "" });
  const [settleSubmitting, setSettleSubmitting] = useState(false);
  // Settlement history for selected property
  const [propSettlements, setPropSettlements] = useState<any[]>([]);
  const [propSettlementsLoading, setPropSettlementsLoading] = useState(false);
  // Transactions state (populated from admin calendar endpoint)
  const [transactions, setTransactions] = useState<Array<any>>([]);
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
        // Fetch monthly receivables (settlement-aware)
        try {
          const recvRes = await bookingApi.getMonthlyReceivables({ months: 12 });
          setMonthlyRecv(recvRes?.series || []);
          setRecvTotals(recvRes?.totals || null);
        } catch (e) {
          console.error('Failed to fetch monthly receivables', e);
        }
        // fetch recent transactions (admin calendar) for the transactions table
        try {
          const calRes = await bookingApi.getAdminCalendar();
          const incoming = (calRes?.bookings || []) as any[];
          // normalize to transaction-like rows
          const mapped = incoming.map((b: any) => ({
            id: b.id,
            property: b.property_name || (b.property_id || "") as string,
            type: b.service_type || (b.service_name ? "Service" : "Booking"),
            ownerName: b.owner_name || "",
            serviceName: b.service_name || "",
            amount: b.total_price ?? 0,
            fee: b.service_fee ?? 0,
            date: b.checkin || (b.created_at ? b.created_at.slice(0,10) : ''),
            status: b.payment_status === 'paid' ? 'Completed'
              : b.payment_status === 'refunded' ? 'Refunded'
              : b.payment_status === 'partially_refunded' ? 'Partial Refund'
              : 'Unpaid',
            amountDisplay: b.total_price != null ? `₱${Number(b.total_price).toLocaleString('en-PH', { minimumFractionDigits: 2 })}` : '₱0.00',
            feeDisplay: b.service_fee != null ? `₱${Number(b.service_fee).toLocaleString('en-PH', { minimumFractionDigits: 2 })}` : '₱0.00',
          }));
          setTransactions(mapped);
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

  // Payables helpers
  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  const daysSince = (d: string) => {
    const diff = Date.now() - new Date(d).getTime();
    return Math.max(0, Math.floor(diff / 86_400_000));
  };

  const statusColor = (s: string) => {
    switch (s) {
      case "confirmed":
        return "text-emerald-400 border-emerald-400/30";
      case "pending":
        return "text-amber-400 border-amber-400/30";
      case "cancelled":
        return "text-red-400 border-red-400/30";
      default:
        return "text-white/60 border-white/20";
    }
  };

  const paymentColor = (ps: string) => {
    switch (ps) {
      case "paid":
        return "text-emerald-400 border-emerald-400/30";
      case "refunded":
        return "text-red-400 border-red-400/30";
      case "partially_refunded":
        return "text-amber-400 border-amber-400/30";
      default:
        return "text-orange-400 border-orange-400/30";
    }
  };

  const exportPayablesCSV = (properties: any[]) => {
    if (!properties || properties.length === 0) return;
    const rows = properties.flatMap((p) =>
      (p.bookings || []).map((b: any) => ({
        property: p.propertyName,
        owner: p.ownerName,
        booking_id: b.id,
        checkin: b.checkin,
        checkout: b.checkout ?? "",
        service_type: b.serviceType ?? "",
        service_fee: b.serviceFee,
        status: b.status,
        payment_status: b.paymentStatus,
        payment_method: b.paymentMethod ?? "",
        pet: b.petName ?? "",
      }))
    );
    if (!rows.length) return;
    const keys = Object.keys(rows[0]);
    const csv = [
      keys.join(","),
      ...rows.map((r) =>
        keys
          .map((k) => {
            const v = (r as any)[k];
            return typeof v === "string" ? `"${v.replace(/"/g, '""')}"` : v ?? "";
          })
          .join(",")
      ),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "accounts_receivables.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const fetchPayables = async () => {
    try {
      setRecvLoading(true);
      const res = await bookingApi.getReceivables({ status: recvStatusFilter, sort: recvSortBy, search: recvSearch?.trim() || undefined });
      setRecvSummary(res.summary);
      setRecvProperties(res.properties || []);
    } catch (err) {
      console.error("Failed to fetch receivables:", err);
    } finally {
      setRecvLoading(false);
    }
  };

  // Fetch settlement history when a property is selected
  const fetchPropertySettlements = async (propertyId: string) => {
    try {
      setPropSettlementsLoading(true);
      const res = await bookingApi.getPropertySettlements(propertyId);
      setPropSettlements(res?.settlements || []);
    } catch (err) {
      console.error("Failed to fetch property settlements:", err);
      setPropSettlements([]);
    } finally {
      setPropSettlementsLoading(false);
    }
  };

  // Handle "Record Settlement" submission
  const handleRecordSettlement = async () => {
    if (!selectedProperty || !settleForm.amount || parseFloat(settleForm.amount) <= 0) return;
    try {
      setSettleSubmitting(true);
      await bookingApi.createSettlement({
        proprietorId: selectedProperty.ownerId,
        propertyId: selectedProperty.propertyId,
        amount: parseFloat(settleForm.amount),
        method: settleForm.method as any,
        referenceNo: settleForm.referenceNo || undefined,
        notes: settleForm.notes || undefined,
      });
      // Reset form and refresh data
      setSettleForm({ amount: "", method: "cash", referenceNo: "", notes: "" });
      setShowSettleDialog(false);
      toast({ title: "Settlement Recorded", description: `₱${parseFloat(settleForm.amount).toLocaleString('en-PH', { minimumFractionDigits: 2 })} settlement has been recorded successfully.` });
      // Refresh both payables and property settlement history
      fetchPayables();
      fetchPropertySettlements(selectedProperty.propertyId);
      // Also refresh monthly receivables
      try {
        const recvRes = await bookingApi.getMonthlyReceivables({ months: 12 });
        setMonthlyRecv(recvRes?.series || []);
        setRecvTotals(recvRes?.totals || null);
      } catch (_) {}
    } catch (err: any) {
      console.error("Failed to record settlement:", err);
      toast({ title: "Settlement Failed", description: err?.error || err?.message || "Failed to record settlement. Please try again.", variant: "destructive" });
    } finally {
      setSettleSubmitting(false);
    }
  };

  useEffect(() => {
    const t = setTimeout(() => fetchPayables(), recvSearch ? 400 : 0);
    return () => clearTimeout(t);
  }, [recvStatusFilter, recvSortBy, recvSearch]);

  // Format currency for display
  const formatCurrency = (amount: number) => {
    return `₱${amount.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Export a breakdown array to CSV and trigger download
  const exportCSV = (rows: any[], filename = "export.csv") => {
    if (!rows || rows.length === 0) return;
    // Exclude internal `raw` field from CSV output
    const keys = Object.keys(rows[0]).filter(k => k !== 'raw');
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

  // Export all visible breakdowns as staggered CSV downloads
  const exportAll = async () => {
    if (loading) return;
    const delay = (ms: number) => new Promise(r => setTimeout(r, ms));
    if (serviceTypeBreakdown && serviceTypeBreakdown.length > 0) { exportCSV(serviceTypeBreakdown, 'revenue_by_service_type.csv'); await delay(300); }
    if (propertyBreakdown && propertyBreakdown.length > 0) { exportCSV(propertyBreakdown, 'revenue_by_property.csv'); await delay(300); }
    if (monthlySeries && monthlySeries.length > 0) { exportCSV(monthlySeries, 'revenue_monthly_series.csv'); await delay(300); }
    const timeChartData = timePeriodBreakdown
      ? [
          { period: timePeriodBreakdown.daily.period, revenue: timePeriodBreakdown.daily.revenue },
          { period: timePeriodBreakdown.weekly.period, revenue: timePeriodBreakdown.weekly.revenue },
          { period: timePeriodBreakdown.monthly.period, revenue: timePeriodBreakdown.monthly.revenue },
        ]
      : [];
    if (timeChartData.length > 0) exportCSV(timeChartData, 'revenue_time_period.csv');
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
      return [t.id, t.property, t.type, t.ownerName, t.serviceName]
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
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
          <Card key={stat.label} className="bg-[#292929] border-white/[0.07] sa-card sa-slide-in">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 rounded-lg bg-[#ffa31a]/20">
                  <Icon className="h-5 w-5 text-[#ffa31a]" />
                </div>
                {/* {stat.change ? (
                  <Badge
                    variant="outline"
                    className={stat.trend === "up" ? "text-emerald-400 border-emerald-400/30" : "text-red-400 border-red-400/30"}
                  >
                    {stat.trend === "up" ? <ArrowUpRight className="h-3 w-3 mr-1" /> : <ArrowDownRight className="h-3 w-3 mr-1" />}
                    {stat.change}
                  </Badge>
                ) : null} */}
              </div>
              <p className="text-2xl font-bold text-white tabular-nums">{stat.value}</p>
              <p className="text-sm text-[#808080]">{stat.label}</p>
            </CardContent>
          </Card>
        );
        })}
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
                {filteredTransactions.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-white/40 py-8">
                      {txnSearch || txnFilterType !== 'all' ? 'No transactions match your filters.' : 'No transactions found.'}
                    </TableCell>
                  </TableRow>
                )}
                {filteredTransactions.map((txn) => (
                  <TableRow key={txn.id} className="border-white/[0.06] hover:bg-white/[0.04]">
                    <TableCell>
                      <div>
                        <p className="font-medium text-white font-mono text-sm">{String(txn.id).slice(0, 8)}…</p>
                        <p className="text-xs text-[#808080]">{txn.date}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="text-white/80">{txn.property}</p>
                        <p className="text-xs text-[#808080] capitalize">{txn.type}</p>
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

        {/* Accounts Payables */}
        <div className="mt-6 lg:col-span-2">
          {/* Export */}
          <div className="flex justify-end mb-4">
            <Button
              variant="outline"
              size="sm"
              className="gap-2 border-white/10 text-[#808080] hover:bg-white/5 hover:text-white"
              onClick={() => exportPayablesCSV(recvProperties)}
              disabled={recvLoading || recvProperties.length === 0}
            >
              <Download className="h-4 w-4" />
              Export Receivables CSV
            </Button>
          </div>

          {/* Stat Cards */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 sa-stagger">
            {recvLoading
              ? Array.from({ length: 4 }).map((_, i) => <div key={i} className="p-5 rounded-2xl border border-white/[0.07] bg-[#292929]" />)
              : [
                  { label: "Total Receivables", value: recvSummary ? formatCurrency(recvSummary.totalPayables ?? recvSummary.totalOutstanding ?? 0) : "₱0.00", icon: DollarSign, accent: "text-orange-400", bg: "bg-orange-500/20" },
                  { label: "Total Settled", value: recvSummary ? formatCurrency(recvSummary.totalSettled ?? 0) : "₱0.00", icon: CheckCircle2, accent: "text-emerald-400", bg: "bg-emerald-500/20" },
                  { label: "Outstanding", value: recvSummary ? formatCurrency(recvSummary.outstandingPayables ?? recvSummary.totalOutstanding ?? 0) : "₱0.00", icon: CreditCard, accent: "text-[#ffa31a]", bg: "bg-[#ffa31a]/20" },
                  { label: "Properties w/ Balance", value: recvSummary ? String(recvSummary.propertiesWithBalance) : "0", icon: Building2, accent: "text-blue-400", bg: "bg-blue-500/20" },
                ].map((s) => {
                  const Icon = s.icon;
                  return (
                  <Card key={s.label} className="bg-[#292929] border-white/[0.07] sa-card sa-slide-in">
                    <CardContent className="p-5">
                      <div className="flex items-center justify-between mb-3">
                        <div className={`p-2 rounded-lg ${s.bg}`}>
                          <Icon className={`h-5 w-5 ${s.accent}`} />
                        </div>
                      </div>
                      <p className="text-2xl font-bold text-white tabular-nums">{s.value}</p>
                      <p className="text-sm text-[#808080]">{s.label}</p>
                    </CardContent>
                  </Card>
                )})}
          </div>

          {/* Property Payables Table */}
          <Card className="bg-[#292929] border-white/[0.07] sa-card sa-slide-in">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2"><FileText className="h-5 w-5 text-[#ffa31a]" />Receivables by Property</CardTitle>
            </CardHeader>
            <div className="flex gap-3 mb-4 px-6">
                <div className="relative flex-1">
                  <Input
                    value={recvSearch}
                    onChange={(e) => setRecvSearch((e.target as HTMLInputElement).value)}
                    placeholder="Search by property or owner name…"
                    className="bg-[#292929] border-white/[0.09] text-white placeholder:text-[#808080] w-full"
                  />
                </div>

                <Select value={recvStatusFilter} onValueChange={setRecvStatusFilter}>
                  <SelectTrigger className="w-full sm:w-44 bg-[#292929] border-white/[0.09] text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#292929] border-white/10 text-white">
                    <SelectItem value="all" className="text-white">All Finalized</SelectItem>
                    <SelectItem value="completed" className="text-white">Completed</SelectItem>
                    <SelectItem value="checked_out" className="text-white">Checked Out</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={recvSortBy} onValueChange={setRecvSortBy}>
                  <SelectTrigger className="w-full sm:w-48 bg-[#292929] border-white/[0.09] text-white">
                    <ArrowUpRight className="h-4 w-4 mr-2 text-[#808080]" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#292929] border-white/10 text-white">
                    <SelectItem value="amount_desc" className="text-white">Highest Amount</SelectItem>
                    <SelectItem value="amount_asc" className="text-white">Lowest Amount</SelectItem>
                    <SelectItem value="oldest" className="text-white">Oldest Finalized</SelectItem>
                    <SelectItem value="name" className="text-white">Property Name</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            <CardContent>
              {recvLoading ? (
                <div className="flex justify-center py-12">
                  <PetLoader text="Loading payables…" />
                </div>
              ) : recvProperties.length === 0 ? (
                <div className="text-center py-12">
                  <AlertCircle className="h-10 w-10 text-[#808080] mx-auto mb-3" />
                  <p className="text-white/60">No payables found.</p>
                  <p className="text-sm text-[#808080] mt-1">No finalized bookings match your filters.</p>
                </div>
              ) : (
                <div className="overflow-auto max-h-[600px]">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-white/[0.06] hover:bg-transparent">
                        <TableHead className="text-[#808080]">Property</TableHead>
                        <TableHead className="text-[#808080]">Owner</TableHead>
                        <TableHead className="text-[#808080] text-right">Total Owed</TableHead>
                        <TableHead className="text-[#808080] text-right">Settled</TableHead>
                        <TableHead className="text-[#808080] text-right">Outstanding</TableHead>
                        <TableHead className="text-[#808080] text-center">Bookings</TableHead>
                        <TableHead className="text-[#808080]">Oldest Finalized</TableHead>
                        <TableHead className="text-[#808080] text-center">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {recvProperties.map((p) => {
                        const days = (p.oldestFinalized || p.oldestUnpaid) ? daysSince(p.oldestFinalized || p.oldestUnpaid) : 0;
                        const agingColor = days > 60 ? "text-red-400" : days > 30 ? "text-amber-400" : "text-white/60";
                        return (
                          <TableRow key={p.propertyId} className="border-white/[0.06] hover:bg-white/[0.04] cursor-pointer" onClick={() => { setSelectedProperty(p); fetchPropertySettlements(p.propertyId); }}>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <div className="h-8 w-8 rounded-lg bg-[#ffa31a]/20 flex items-center justify-center flex-shrink-0">
                                  <Building2 className="h-4 w-4 text-[#ffa31a]" />
                                </div>
                                <span className="text-white font-medium truncate max-w-[200px]">{p.propertyName}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div>
                                <p className="text-white/80 text-sm">{p.ownerName}</p>
                                <p className="text-xs text-[#808080] truncate max-w-[160px]">{p.ownerEmail}</p>
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <span className="text-white font-bold text-lg tabular-nums">{formatCurrency(p.totalPayable ?? p.totalReceivable ?? p.totalServiceFee ?? 0)}</span>
                            </TableCell>
                            <TableCell className="text-right">
                              <span className="text-emerald-400 font-medium tabular-nums">{formatCurrency(p.totalSettled ?? 0)}</span>
                            </TableCell>
                            <TableCell className="text-right">
                              <span className="text-[#ffa31a] font-bold tabular-nums">{formatCurrency(p.outstandingPayable ?? (p.totalPayable - (p.totalSettled ?? 0)))}</span>
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge variant="outline" className="text-white/80 border-white/20">{p.bookingCount ?? p.unpaidCount ?? 0}</Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1.5">
                                <Clock className={`h-3.5 w-3.5 ${agingColor}`} />
                                <span className={`text-sm ${agingColor}`}>{(p.oldestFinalized || p.oldestUnpaid) ? `${days}d ago` : "—"}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-center">
                              <Button variant="ghost" size="sm" className="text-[#ffa31a] hover:text-[#ffa31a]/80 hover:bg-white/[0.05] gap-1" onClick={(e) => { e.stopPropagation(); setSelectedProperty(p); fetchPropertySettlements(p.propertyId); }}>
                                Details
                                <ChevronRight className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Detail Modal */}
          {selectedProperty && (
            <Dialog open={!!selectedProperty} onOpenChange={(open) => { if (!open) setSelectedProperty(null); }}>
              <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto bg-[#1b1b1b] border-white/[0.08] text-white">
                <DialogHeader>
                  <DialogTitle className="text-xl flex items-center gap-2"><Building2 className="h-5 w-5 text-[#ffa31a]" />{selectedProperty.propertyName}</DialogTitle>
                </DialogHeader>

                <div className="grid grid-cols-4 gap-3 mt-2">
                  <div className="p-3 rounded-lg bg-[#292929] border border-white/[0.07]">
                    <p className="text-xs text-[#808080]">Total Owed</p>
                    <p className="text-lg font-bold text-orange-400 tabular-nums">{formatCurrency(selectedProperty.totalPayable ?? selectedProperty.totalReceivable ?? selectedProperty.totalServiceFee ?? 0)}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-[#292929] border border-white/[0.07]">
                    <p className="text-xs text-[#808080]">Total Settled</p>
                    <p className="text-lg font-bold text-emerald-400 tabular-nums">{formatCurrency(selectedProperty.totalSettled ?? 0)}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-[#292929] border border-white/[0.07]">
                    <p className="text-xs text-[#808080]">Outstanding</p>
                    <p className="text-lg font-bold text-[#ffa31a] tabular-nums">{formatCurrency(selectedProperty.outstandingPayable ?? (selectedProperty.totalPayable - (selectedProperty.totalSettled ?? 0)))}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-[#292929] border border-white/[0.07]">
                    <p className="text-xs text-[#808080]">Bookings</p>
                    <p className="text-lg font-bold text-white">{selectedProperty.bookingCount ?? selectedProperty.unpaidCount ?? 0}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3 mt-3 p-3 rounded-lg bg-[#292929] border border-white/[0.07]">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-[#ffa31a]/20 flex items-center justify-center"><User className="h-4 w-4 text-[#ffa31a]" /></div>
                    <div>
                      <p className="text-sm font-medium text-white">{selectedProperty.ownerName}</p>
                      <p className="text-xs text-[#808080]">{selectedProperty.ownerEmail}</p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
                    onClick={() => { setSettleForm({ amount: String(selectedProperty.outstandingPayable ?? (selectedProperty.totalPayable - (selectedProperty.totalSettled ?? 0))), method: "cash", referenceNo: "", notes: "" }); setShowSettleDialog(true); }}
                    disabled={(selectedProperty.outstandingPayable ?? (selectedProperty.totalPayable - (selectedProperty.totalSettled ?? 0))) <= 0}
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Record Settlement
                  </Button>
                </div>

                {/* Record Settlement Form (inline collapsible) */}
                {showSettleDialog && (
                  <div className="mt-3 p-4 rounded-lg bg-emerald-900/20 border border-emerald-500/20">
                    <h4 className="text-sm font-semibold text-emerald-400 mb-3">Record Settlement Payment</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-[#808080] mb-1 block">Amount (₱)</label>
                        <Input
                          type="number"
                          step="0.01"
                          min="0.01"
                          max={selectedProperty.outstandingPayable ?? (selectedProperty.totalPayable - (selectedProperty.totalSettled ?? 0))}
                          value={settleForm.amount}
                          onChange={(e) => setSettleForm(f => ({ ...f, amount: (e.target as HTMLInputElement).value }))}
                          className="bg-[#1b1b1b] border-white/10 text-white"
                          placeholder="0.00"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-[#808080] mb-1 block">Method</label>
                        <Select value={settleForm.method} onValueChange={(v) => setSettleForm(f => ({ ...f, method: v }))}>
                          <SelectTrigger className="bg-[#1b1b1b] border-white/10 text-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-[#292929] border-white/10 text-white">
                            <SelectItem value="cash" className="text-white">Cash</SelectItem>
                            <SelectItem value="gcash" className="text-white">GCash</SelectItem>
                            <SelectItem value="bank_transfer" className="text-white">Bank Transfer</SelectItem>
                            <SelectItem value="card" className="text-white">Card</SelectItem>
                            <SelectItem value="check" className="text-white">Check</SelectItem>
                            <SelectItem value="offset" className="text-white">Offset</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="text-xs text-[#808080] mb-1 block">Reference No.</label>
                        <Input
                          value={settleForm.referenceNo}
                          onChange={(e) => setSettleForm(f => ({ ...f, referenceNo: (e.target as HTMLInputElement).value }))}
                          className="bg-[#1b1b1b] border-white/10 text-white"
                          placeholder="Optional"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-[#808080] mb-1 block">Notes</label>
                        <Input
                          value={settleForm.notes}
                          onChange={(e) => setSettleForm(f => ({ ...f, notes: (e.target as HTMLInputElement).value }))}
                          className="bg-[#1b1b1b] border-white/10 text-white"
                          placeholder="Optional"
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-3">
                      <Button
                        size="sm"
                        className="bg-emerald-600 hover:bg-emerald-700 text-white"
                        onClick={handleRecordSettlement}
                        disabled={settleSubmitting || !settleForm.amount || parseFloat(settleForm.amount) <= 0}
                      >
                        {settleSubmitting ? "Processing…" : "Confirm Settlement"}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-[#808080] hover:text-white"
                        onClick={() => setShowSettleDialog(false)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}

                {/* Settlement History */}
                <div className="mt-4">
                  <h4 className="text-sm font-semibold text-white/80 mb-3 flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    Settlement History
                    {propSettlementsLoading && <span className="text-xs text-[#808080]">Loading…</span>}
                  </h4>
                  {propSettlements.length === 0 && !propSettlementsLoading ? (
                    <p className="text-sm text-[#808080] pl-1">No settlements recorded yet.</p>
                  ) : (
                    <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
                      {propSettlements.map((s: any) => (
                        <div key={s.id} className="p-2.5 rounded-lg bg-[#292929] border border-emerald-500/10 flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2 min-w-0">
                            <Badge variant="outline" className={s.status === 'completed' ? 'text-emerald-400 border-emerald-400/30' : s.status === 'reversed' ? 'text-red-400 border-red-400/30' : 'text-amber-400 border-amber-400/30'}>{s.status}</Badge>
                            <span className="text-white font-bold tabular-nums">{formatCurrency(s.amount)}</span>
                            <span className="text-xs text-[#808080] capitalize">{String(s.settlement_method || '').replace('_', ' ')}</span>
                            {s.reference_no && <span className="text-xs text-[#808080] font-mono">#{s.reference_no}</span>}
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="text-xs text-[#808080]">{formatDate(s.settled_at)}</p>
                            <p className="text-[10px] text-[#808080]/60">by {s.createdByName}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="mt-4">
                  <h4 className="text-sm font-semibold text-white/80 mb-3">Finalized Bookings</h4>
                  <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
                    {selectedProperty.bookings.map((b: any) => (
                      <div key={b.id} className="p-3 rounded-lg bg-[#292929] border border-white/[0.07] hover:border-white/[0.12] transition-colors">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono text-[#808080]">{String(b.id).slice(0,8)}…</span>
                            <Badge variant="outline" className={statusColor(b.status)}>{b.status}</Badge>
                            <Badge variant="outline" className={paymentColor(b.paymentStatus)}>{b.paymentStatus === "partially_refunded" ? "Partial Refund" : b.paymentStatus}</Badge>
                          </div>
                          <span className="text-white font-bold tabular-nums whitespace-nowrap">{formatCurrency(b.serviceFee ?? 0)}</span>
                        </div>

                        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
                          <div className="flex items-center gap-1.5 text-[#808080]"><Calendar className="h-3 w-3" /><span>{formatDate(b.checkin)}{b.checkout ? ` – ${formatDate(b.checkout)}` : ""}</span></div>
                          {b.serviceType && <div className="flex items-center gap-1.5 text-[#808080]"><FileText className="h-3 w-3" /><span className="capitalize">{b.serviceType}</span></div>}
                          {b.petName && <div className="flex items-center gap-1.5 text-[#808080]"><PawPrint className="h-3 w-3" /><span>{b.petName}{b.petType ? ` (${b.petType})` : ""}</span></div>}
                          {b.paymentMethod && <div className="flex items-center gap-1.5 text-[#808080]"><CreditCard className="h-3 w-3" /><span className="capitalize">{String(b.paymentMethod).replace("_"," ")}</span></div>}
                        </div>

                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/[0.06] text-xs text-[#808080]">
                          <span>Fee: {formatCurrency(b.serviceFee)} · Settled: {formatCurrency(b.settledAmount ?? 0)} · Outstanding: <span className={(b.outstandingAmount ?? b.serviceFee) > 0 ? 'text-[#ffa31a]' : 'text-emerald-400'}>{formatCurrency(b.outstandingAmount ?? b.serviceFee)}</span></span>
                          <span>Booked {formatDate(b.createdAt)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* Monthly Receivables Chart */}
      <div className="mt-8 sa-slide-in" style={{ animationDelay: '180ms' }}>
        <Card className="bg-[#292929] border-white/[0.07] sa-card">
          <CardHeader>
            <CardTitle className="text-white">Monthly Receivables</CardTitle>
            <p className="text-xs text-[#808080]">Platform fees generated vs. settled vs. outstanding per month</p>
          </CardHeader>
          <CardContent>
            {monthlyRecv.length === 0 ? (
              <div className="text-center py-12 text-[#808080]">No receivable data available</div>
            ) : (
              <div className="h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyRecv} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                    <XAxis dataKey="label" stroke="#808080" tick={{ fill: '#808080', fontSize: 11 }} />
                    <YAxis stroke="#808080" tick={{ fill: '#808080', fontSize: 11 }} tickFormatter={(v: number) => `₱${(v / 1000).toFixed(0)}k`} />
                    <Tooltip content={<ReceivablesTooltip />} />
                    <Legend formatter={(name) => String(name)} />
                    <Bar dataKey="generated" fill="#ffa31a" name="Generated" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="settled" fill="#10b981" name="Settled" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="outstanding" fill="#ef4444" name="Outstanding" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
            {recvTotals && (
              <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-white/[0.07]">
                <div className="text-center">
                  <p className="text-xs text-[#808080]">All-Time Generated</p>
                  <p className="text-lg font-bold text-[#ffa31a] tabular-nums">{formatCurrency(recvTotals.generated)}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-[#808080]">All-Time Settled</p>
                  <p className="text-lg font-bold text-emerald-400 tabular-nums">{formatCurrency(recvTotals.settled)}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-[#808080]">All-Time Outstanding</p>
                  <p className="text-lg font-bold text-red-400 tabular-nums">{formatCurrency(recvTotals.outstanding)}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Revenue by Time Period */}
      <div className="mt-8 sa-slide-in" style={{ animationDelay: '200ms' }}>
        <Card className="bg-[#292929] border-white/[0.07] sa-card">
          <CardHeader className="relative">
            <CardTitle className="text-white">Revenue by Time Period</CardTitle>
            <div className="absolute right-4 top-3 flex items-center gap-2">
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

      {/* Revenue Breakdown by Location */}
      <div className="mt-8 sa-slide-in" style={{ animationDelay: '320ms' }}>
        <Card className="bg-[#292929] border-white/[0.07] sa-card">
          <CardHeader className="relative">
              <CardTitle className="text-white">Revenue by Location</CardTitle>
              <div className="absolute right-4 top-3 flex items-center gap-2">
                <Button variant="outline" size="sm" className="gap-2 border-white/10 text-[#808080] hover:bg-white/5 hover:text-white" onClick={() => exportCSV(locationBreakdown, 'revenue_by_location.csv')} disabled={loading || locationBreakdown.length === 0}>
                  <Download className="h-4 w-4" />
                  Export
                </Button>
              </div>
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

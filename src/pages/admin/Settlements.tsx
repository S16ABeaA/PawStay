import { useEffect, useMemo, useState } from "react";
import { bookingApi } from "@/services/bookingApi";
import AdminLayout from "@/components/admin/AdminLayout";
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
import { useToast } from "@/hooks/use-toast";
import { CreditCard, Landmark, Smartphone, Wallet, CheckCircle2, Clock3, Loader2 } from "lucide-react";

const formatCurrency = (amount: number) =>
  `PHP ${Number(amount || 0).toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const formatDate = (value?: string) => {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const statusClass = (status: string) => {
  switch (status) {
    case "completed":
      return "text-emerald-600 border-emerald-300 bg-emerald-50";
    case "pending":
      return "text-amber-700 border-amber-300 bg-amber-50";
    case "failed":
    case "reversed":
      return "text-red-600 border-red-300 bg-red-50";
    default:
      return "text-muted-foreground border-border bg-muted";
  }
};

const paymentOptions = [
  {
    title: "GCash",
    value: "0917-000-0000",
    note: "Use as placeholder account until final wallet details are provided.",
    icon: Smartphone,
  },
  {
    title: "Bank Transfer",
    value: "Bank Name / 0000-0000-0000",
    note: "Deposit to this placeholder bank number.",
    icon: Landmark,
  },
  {
    title: "PayMaya",
    value: "0998-000-0000",
    note: "Use this placeholder PayMaya account for payment testing.",
    icon: Wallet,
  },
  {
    title: "Card / Over-the-Counter",
    value: "Reference at Superadmin Review",
    note: "Include the payment reference in your settlement submission.",
    icon: CreditCard,
  },
];

const AdminSettlements = () => {
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [summary, setSummary] = useState<any | null>(null);
  const [properties, setProperties] = useState<any[]>([]);
  const [settlements, setSettlements] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>("");
  const [form, setForm] = useState({
    amount: "",
    method: "gcash",
    referenceNo: "",
    notes: "",
  });

  const selectedProperty = useMemo(
    () => properties.find((p) => p.propertyId === selectedPropertyId) || null,
    [properties, selectedPropertyId]
  );

  const loadReceivables = async () => {
    const res = await bookingApi.getMySettlementReceivables();
    setSummary(res?.summary || null);
    setProperties(res?.properties || []);
    setSelectedPropertyId((current) => {
      if (current && (res?.properties || []).some((p: any) => p.propertyId === current)) {
        return current;
      }
      return res?.properties?.[0]?.propertyId || "";
    });
  };

  const loadSettlements = async (propertyId?: string) => {
    const query: any = { limit: 200 };
    if (propertyId) query.propertyId = propertyId;
    if (statusFilter !== "all") query.status = statusFilter;
    const res = await bookingApi.getMySettlements(query);
    setSettlements(res?.settlements || []);
  };

  const refreshAll = async (keepPropertyId?: string) => {
    try {
      setLoading(true);
      await loadReceivables();
      await loadSettlements(keepPropertyId || selectedPropertyId || undefined);
    } catch (error) {
      console.error("Failed to load settlements dashboard", error);
      toast({
        title: "Failed to load settlements",
        description: "Please refresh and try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshAll();
  }, []);

  useEffect(() => {
    loadSettlements(selectedPropertyId || undefined).catch((error) => {
      console.error("Failed to load settlement history", error);
    });
  }, [selectedPropertyId, statusFilter]);

  const handleSubmit = async () => {
    if (!selectedPropertyId) {
      toast({ title: "Select a property", description: "Choose a property before submitting." });
      return;
    }

    const amount = parseFloat(form.amount);
    if (!amount || amount <= 0) {
      toast({ title: "Invalid amount", description: "Enter a valid settlement amount.", variant: "destructive" });
      return;
    }

    try {
      setSubmitting(true);
      await bookingApi.submitMySettlement({
        propertyId: selectedPropertyId,
        amount,
        method: form.method,
        referenceNo: form.referenceNo || undefined,
        notes: form.notes || undefined,
      });

      toast({
        title: "Settlement submitted",
        description: "Your payment was submitted for superadmin review.",
      });

      setForm({ amount: "", method: "gcash", referenceNo: "", notes: "" });
      await refreshAll(selectedPropertyId);
    } catch (error: any) {
      console.error("Failed to submit settlement", error);
      toast({
        title: "Submission failed",
        description: error?.error || error?.message || "Unable to submit settlement.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AdminLayout
      title="Settlements"
      subtitle="Track receivables, review your settlement history, and submit payment proof for approval."
    >
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Total Receivables</p>
            <p className="text-2xl font-bold">{formatCurrency(summary?.totalPayables || 0)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Total Settled</p>
            <p className="text-2xl font-bold text-emerald-600">{formatCurrency(summary?.totalSettled || 0)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Outstanding</p>
            <p className="text-2xl font-bold text-amber-600">{formatCurrency(summary?.outstandingPayables || 0)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Properties With Balance</p>
            <p className="text-2xl font-bold">{summary?.propertiesWithBalance || 0}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">Payment Channels (Placeholders)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
            {paymentOptions.map((option) => {
              const Icon = option.icon;
              return (
                <div key={option.title} className="rounded-lg border border-border p-3 bg-secondary/20">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="rounded-md bg-primary/10 p-2">
                      <Icon className="h-4 w-4 text-primary" />
                    </div>
                    <p className="font-semibold">{option.title}</p>
                  </div>
                  <p className="text-sm font-medium">{option.value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{option.note}</p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Current Receivables By Property</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Property</TableHead>
                    <TableHead className="text-right">Total Owed</TableHead>
                    <TableHead className="text-right">Settled</TableHead>
                    <TableHead className="text-right">Outstanding</TableHead>
                    <TableHead className="text-center">Bookings</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                        <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2" />
                        Loading receivables...
                      </TableCell>
                    </TableRow>
                  ) : properties.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                        No receivables found for your properties.
                      </TableCell>
                    </TableRow>
                  ) : (
                    properties.map((p) => (
                      <TableRow
                        key={p.propertyId}
                        className={`cursor-pointer ${selectedPropertyId === p.propertyId ? "bg-primary/5" : ""}`}
                        onClick={() => setSelectedPropertyId(p.propertyId)}
                      >
                        <TableCell>
                          <p className="font-medium">{p.propertyName}</p>
                          <p className="text-xs text-muted-foreground">Oldest: {formatDate(p.oldestFinalized)}</p>
                        </TableCell>
                        <TableCell className="text-right font-medium">{formatCurrency(p.totalPayable || 0)}</TableCell>
                        <TableCell className="text-right text-emerald-600 font-medium">{formatCurrency(p.totalSettled || 0)}</TableCell>
                        <TableCell className="text-right text-amber-600 font-semibold">{formatCurrency(p.outstandingPayable || 0)}</TableCell>
                        <TableCell className="text-center">{p.bookingCount || 0}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Settle Now</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-sm text-muted-foreground">
              {selectedProperty ? (
                <>
                  <p className="font-medium text-foreground">{selectedProperty.propertyName}</p>
                  <p>Outstanding: <span className="font-semibold text-amber-600">{formatCurrency(selectedProperty.outstandingPayable || 0)}</span></p>
                </>
              ) : (
                <p>Select a property from the table to submit settlement.</p>
              )}
            </div>

            <div>
              <label className="text-xs text-muted-foreground">Amount Paid</label>
              <Input
                type="number"
                min="0.01"
                step="0.01"
                value={form.amount}
                onChange={(e) => setForm((f) => ({ ...f, amount: (e.target as HTMLInputElement).value }))}
                placeholder="0.00"
              />
            </div>

            <div>
              <label className="text-xs text-muted-foreground">Method</label>
              <Select value={form.method} onValueChange={(value) => setForm((f) => ({ ...f, method: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gcash">GCash</SelectItem>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  <SelectItem value="card">Card</SelectItem>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="check">Check</SelectItem>
                  <SelectItem value="offset">Offset</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-xs text-muted-foreground">Reference Number</label>
              <Input
                value={form.referenceNo}
                onChange={(e) => setForm((f) => ({ ...f, referenceNo: (e.target as HTMLInputElement).value }))}
                placeholder="Optional"
              />
            </div>

            <div>
              <label className="text-xs text-muted-foreground">Notes</label>
              <Input
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: (e.target as HTMLInputElement).value }))}
                placeholder="Optional"
              />
            </div>

            <Button className="w-full" onClick={handleSubmit} disabled={submitting || !selectedPropertyId}>
              {submitting ? "Submitting..." : "Submit For Superadmin Review"}
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Settlement History</CardTitle>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="pending">Pending Review</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="failed">Rejected / Failed</SelectItem>
              <SelectItem value="reversed">Reversed</SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 max-h-[360px] overflow-auto pr-1">
            {settlements.length === 0 ? (
              <p className="text-sm text-muted-foreground">No settlements found for your current filters.</p>
            ) : (
              settlements.map((s) => (
                <div key={s.id} className="rounded-lg border border-border p-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline" className={statusClass(s.status)}>{s.status}</Badge>
                      <span className="font-semibold">{formatCurrency(s.amount)}</span>
                      <span className="text-sm text-muted-foreground">{s.propertyName}</span>
                      {s.reference_no && <span className="text-xs text-muted-foreground">Ref: {s.reference_no}</span>}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{s.notes || "No notes"}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm">{formatDate(s.settled_at)}</p>
                    <p className="text-xs text-muted-foreground">{s.status === "pending" ? "Awaiting review" : s.reviewedByName || "Reviewed"}</p>
                    <div className="mt-1 flex items-center justify-end gap-1 text-xs text-muted-foreground">
                      {s.status === "completed" ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> : <Clock3 className="h-3.5 w-3.5" />}
                      {String(s.settlement_method || "").replace("_", " ") || "method not set"}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </AdminLayout>
  );
};

export default AdminSettlements;

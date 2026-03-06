import SuperAdminLayout from "@/components/superadmin/SuperAdminLayout";
import { PetLoader } from "@/components/ui/PetLoader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  MessageSquare,
  Clock,
  CheckCircle2,
  AlertCircle,
  Search,
  Send,
  User,
  Building2,
  Loader2,
  Inbox,
  RefreshCw,
  Headphones,
  ChevronRight,
  Hash,
  Calendar,
  ArrowRight,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { supportApi, type SupportTicket, type TicketDetail, type TicketStats } from "@/services/supportApi";
import { useToast } from "@/hooks/use-toast";

/* ─── helpers ─── */
const priorityBadge = (p: string) => {
  switch (p) {
    case "Urgent": return "text-red-400 border-red-400/30 bg-red-400/[0.08]";
    case "High": return "text-orange-400 border-orange-400/30 bg-orange-400/[0.08]";
    case "Medium": return "text-amber-400 border-amber-400/30 bg-amber-400/[0.08]";
    default: return "text-[#808080] border-[#808080]/30 bg-[#808080]/[0.08]";
  }
};

const statusDot = (s: string) => {
  switch (s) {
    case "Open": return "bg-blue-400";
    case "Pending": return "bg-amber-400";
    case "In Progress": return "bg-purple-400";
    case "Resolved": return "bg-emerald-400";
    case "Closed": return "bg-slate-400";
    default: return "bg-[#808080]";
  }
};

const statusBadge = (s: string) => {
  switch (s) {
    case "Open": return "text-blue-400 border-blue-400/30 bg-blue-400/[0.08]";
    case "Pending": return "text-amber-400 border-amber-400/30 bg-amber-400/[0.08]";
    case "In Progress": return "text-purple-400 border-purple-400/30 bg-purple-400/[0.08]";
    case "Resolved": return "text-emerald-400 border-emerald-400/30 bg-emerald-400/[0.08]";
    case "Closed": return "text-slate-400 border-slate-400/30 bg-slate-400/[0.08]";
    default: return "text-[#808080] border-[#808080]/30 bg-[#808080]/[0.08]";
  }
};

const timeAgo = (dateStr: string) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
};

const formatDate = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

const userInitials = (name: string) => {
  const parts = name.split(" ").filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return (parts[0]?.[0] ?? "?").toUpperCase();
};

const SuperAdminSupport = () => {
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  /* ─── state ─── */
  const [stats, setStats] = useState<TicketStats | null>(null);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<TicketDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  /* ─── load stats + tickets ─── */
  const loadData = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true); else setLoading(true);
      const [statsData, ticketsData] = await Promise.all([
        supportApi.getStats(),
        supportApi.getTickets({ status: statusFilter !== "all" ? statusFilter : undefined, search: searchQuery || undefined }),
      ]);
      setStats(statsData);
      setTickets(ticketsData);
    } catch {
      toast({ title: "Error", description: "Failed to load support data", variant: "destructive" });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { loadData(); }, [statusFilter]);

  useEffect(() => {
    const timer = setTimeout(() => loadData(), 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  /* ─── open ticket detail ─── */
  const openTicket = async (id: string) => {
    try {
      setDetailLoading(true);
      const detail = await supportApi.getTicket(id);
      setSelectedTicket(detail);
    } catch {
      toast({ title: "Error", description: "Could not load ticket", variant: "destructive" });
    } finally {
      setDetailLoading(false);
    }
  };

  useEffect(() => {
    if (tickets.length > 0 && !selectedTicket) openTicket(tickets[0].id);
  }, [tickets]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [selectedTicket?.messages]);

  /* ─── send reply ─── */
  const handleSendReply = async () => {
    if (!replyText.trim() || !selectedTicket) return;
    try {
      setSending(true);
      const msg = await supportApi.sendMessage(selectedTicket.id, replyText.trim());
      setSelectedTicket((prev) =>
        prev ? { ...prev, messages: [...prev.messages, msg], status: prev.status === "Open" || prev.status === "Pending" ? "In Progress" : prev.status } : prev
      );
      setReplyText("");
      supportApi.getStats().then(setStats).catch(() => {});
    } catch {
      toast({ title: "Error", description: "Failed to send reply", variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  /* ─── update status ─── */
  const handleStatusChange = async (newStatus: string) => {
    if (!selectedTicket) return;
    try {
      await supportApi.updateStatus(selectedTicket.id, newStatus);
      setSelectedTicket((prev) => prev ? { ...prev, status: newStatus } : prev);
      setTickets((prev) =>
        prev.map((t) => t.id === selectedTicket.id ? { ...t, status: newStatus } : t)
      );
      toast({ title: "Status Updated", description: `Ticket set to ${newStatus}` });
      supportApi.getStats().then(setStats).catch(() => {});
    } catch {
      toast({ title: "Error", description: "Failed to update status", variant: "destructive" });
    }
  };

  /* ─── stat cards config ─── */
  const statCards = stats
    ? [
        { label: "Open Tickets",     value: stats.open,     icon: MessageSquare, accent: "text-blue-400",    bg: "bg-blue-400/10",    border: "border-blue-400/20"    },
        { label: "Pending Response", value: stats.pending,  icon: Clock,         accent: "text-amber-400",   bg: "bg-amber-400/10",   border: "border-amber-400/20"   },
        { label: "Resolved",        value: stats.resolved,  icon: CheckCircle2,  accent: "text-emerald-400", bg: "bg-emerald-400/10", border: "border-emerald-400/20" },
        { label: "Urgent",          value: stats.urgent,    icon: AlertCircle,   accent: "text-red-400",     bg: "bg-red-400/10",     border: "border-red-400/20"     },
      ]
    : [];

  /* ─── date separators for messages ─── */
  const getDateLabel = (dateStr: string) => {
    const d = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(); yesterday.setDate(today.getDate() - 1);
    if (d.toDateString() === today.toDateString()) return "Today";
    if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  return (
    <SuperAdminLayout title="Support Center" subtitle="Manage customer and property owner support tickets">

      {/* ── Stat Cards ── */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8 sa-stagger">
        {loading && !stats
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="p-5 rounded-2xl bg-[#292929] border border-white/[0.07]">
                <div className="flex items-start justify-between mb-4">
                  <div className="h-10 w-10 rounded-xl bg-white/[0.04] animate-pulse" />
                </div>
                <div className="h-8 w-14 bg-white/[0.04] rounded-lg animate-pulse mb-2" />
                <div className="h-4 w-24 bg-white/[0.04] rounded animate-pulse" />
              </div>
            ))
          : statCards.map((stat) => (
              <div
                key={stat.label}
                className="group p-5 rounded-2xl bg-[#292929] border border-white/[0.07] hover:border-[#ffa31a]/30 hover:bg-[#ffa31a]/[0.03] transition-all duration-200 sa-slide-in"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-2.5 rounded-xl ${stat.bg} border ${stat.border}`}>
                    <stat.icon className={`h-5 w-5 ${stat.accent}`} />
                  </div>
                  {stat.value > 0 && (
                    <span className={`w-2.5 h-2.5 rounded-full ${stat.bg.replace("/10", "")} sa-pulse-dot`} />
                  )}
                </div>
                <p className="text-3xl font-bold text-white tracking-tight tabular-nums">{stat.value}</p>
                <p className="text-sm text-[#808080] mt-1">{stat.label}</p>
              </div>
            ))}
      </div>

      {/* ── Main Grid ── */}
      <div className="grid lg:grid-cols-5 gap-6 sa-slide-in" style={{ animationDelay: "120ms" }}>

        {/* ─── Tickets List ─── */}
        <div className="lg:col-span-2 rounded-2xl bg-[#292929] border border-white/[0.07] flex flex-col overflow-hidden">
          {/* List Header */}
          <div className="p-4 border-b border-white/[0.06]">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-semibold text-white">Tickets</h3>
                {tickets.length > 0 && (
                  <span className="text-xs text-[#808080] bg-white/[0.06] px-2 py-0.5 rounded-full tabular-nums">
                    {tickets.length}
                  </span>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-[#808080] hover:text-[#ffa31a] h-8 px-2.5"
                onClick={() => loadData(true)}
                disabled={refreshing}
              >
                <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${refreshing ? "animate-spin" : ""}`} />
                {refreshing ? "" : "Refresh"}
              </Button>
            </div>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#808080]" />
                <Input
                  placeholder="Search tickets..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 bg-[#1b1b1b] border-white/[0.07] text-white placeholder:text-[#808080] rounded-xl h-9 focus-visible:ring-[#ffa31a]/30"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[7.5rem] bg-[#1b1b1b] border-white/[0.07] text-white rounded-xl h-9 focus:ring-[#ffa31a]/30">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#1b1b1b] border-white/[0.1]">
                  <SelectItem value="all" className="text-white focus:bg-white/[0.06] focus:text-white">All Status</SelectItem>
                  <SelectItem value="Open" className="text-white focus:bg-white/[0.06] focus:text-white">
                    <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-blue-400" />Open</span>
                  </SelectItem>
                  <SelectItem value="Pending" className="text-white focus:bg-white/[0.06] focus:text-white">
                    <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-amber-400" />Pending</span>
                  </SelectItem>
                  <SelectItem value="In Progress" className="text-white focus:bg-white/[0.06] focus:text-white">
                    <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-purple-400" />In Progress</span>
                  </SelectItem>
                  <SelectItem value="Resolved" className="text-white focus:bg-white/[0.06] focus:text-white">
                    <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-emerald-400" />Resolved</span>
                  </SelectItem>
                  <SelectItem value="Closed" className="text-white focus:bg-white/[0.06] focus:text-white">
                    <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-slate-400" />Closed</span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* List Body */}
          <div className="flex-1 overflow-y-auto max-h-[600px]">
            {loading ? (
              <div className="p-4 space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="p-3 rounded-xl bg-white/[0.02] animate-pulse">
                    <div className="flex items-center gap-2 mb-2.5">
                      <div className="w-8 h-8 rounded-lg bg-white/[0.04]" />
                      <div className="flex-1 space-y-1.5">
                        <div className="h-3.5 w-3/4 bg-white/[0.04] rounded" />
                        <div className="h-3 w-1/2 bg-white/[0.04] rounded" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : tickets.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 px-6">
                <div className="p-4 rounded-2xl bg-white/[0.03] mb-4">
                  <Inbox className="h-8 w-8 text-[#808080]/40" />
                </div>
                <p className="text-[#808080] font-medium mb-1">No tickets found</p>
                <p className="text-xs text-[#808080]/60 text-center">Try adjusting your search or filter criteria</p>
              </div>
            ) : (
              <div className="p-2 space-y-1">
                {tickets.map((ticket) => {
                  const isActive = selectedTicket?.id === ticket.id;
                  return (
                    <button
                      key={ticket.id}
                      onClick={() => openTicket(ticket.id)}
                      className={`w-full p-3 rounded-xl text-left transition-all duration-150 group ${
                        isActive
                          ? "bg-[#ffa31a]/[0.1] border border-[#ffa31a]/20"
                          : "border border-transparent hover:bg-white/[0.04] hover:border-white/[0.06]"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {/* Avatar */}
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold ${
                          ticket.user_type === "Customer"
                            ? "bg-blue-400/10 border border-blue-400/20 text-blue-400"
                            : "bg-purple-400/10 border border-purple-400/20 text-purple-400"
                        }`}>
                          {ticket.user_type === "Customer"
                            ? <User className="h-4 w-4" />
                            : <Building2 className="h-4 w-4" />}
                        </div>
                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <p className={`text-sm font-medium line-clamp-1 ${isActive ? "text-[#ffa31a]" : "text-white"}`}>
                              {ticket.subject}
                            </p>
                            <span className="text-[10px] text-[#808080] shrink-0 tabular-nums">{timeAgo(ticket.created_at)}</span>
                          </div>
                          <p className="text-xs text-[#808080] truncate mb-2">{ticket.user_name || ticket.user_email}</p>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className={`text-[10px] px-1.5 py-0 h-[18px] ${priorityBadge(ticket.priority)}`}>
                              {ticket.priority}
                            </Badge>
                            <span className="flex items-center gap-1.5">
                              <span className={`w-1.5 h-1.5 rounded-full ${statusDot(ticket.status)} ${
                                ticket.status === "Open" || ticket.status === "Pending" ? "sa-pulse-dot" : ""
                              }`} />
                              <span className="text-[10px] text-[#808080]">{ticket.status}</span>
                            </span>
                            <span className="flex items-center gap-1 text-[10px] text-[#808080] ml-auto">
                              <MessageSquare className="h-3 w-3" />
                              {ticket.message_count}
                            </span>
                          </div>
                        </div>
                        {/* Arrow */}
                        <ChevronRight className={`h-4 w-4 shrink-0 mt-1 transition-colors ${
                          isActive ? "text-[#ffa31a]" : "text-transparent group-hover:text-[#808080]"
                        }`} />
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ─── Ticket Detail ─── */}
        <div className="lg:col-span-3 rounded-2xl bg-[#292929] border border-white/[0.07] flex flex-col overflow-hidden min-h-[500px]">
          {detailLoading ? (
            <div className="flex-1 flex flex-col items-center justify-center">
              <PetLoader text="Loading conversation..." className="py-20" />
            </div>
          ) : !selectedTicket ? (
            <div className="flex-1 flex flex-col items-center justify-center py-20">
              <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/[0.06] mb-5">
                <MessageSquare className="h-10 w-10 text-[#808080]/30" />
              </div>
              <p className="font-medium text-[#808080] mb-1">No ticket selected</p>
              <p className="text-xs text-[#808080]/60">Choose a ticket from the list to view the conversation</p>
            </div>
          ) : (
            <>
              {/* ── Detail Header ── */}
              <div className="px-5 py-4 border-b border-white/[0.06] shrink-0 bg-[#292929]">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    {/* Ticket number + badges */}
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className="inline-flex items-center gap-1 text-xs text-[#808080] font-mono bg-white/[0.04] px-2 py-0.5 rounded-md">
                        <Hash className="h-3 w-3" />
                        {selectedTicket.ticket_number}
                      </span>
                      <Badge variant="outline" className={`text-[10px] px-1.5 py-0 h-[18px] ${priorityBadge(selectedTicket.priority)}`}>
                        {selectedTicket.priority}
                      </Badge>
                      <Badge variant="outline" className={`text-[10px] px-1.5 py-0 h-[18px] ${statusBadge(selectedTicket.status)}`}>
                        {selectedTicket.status}
                      </Badge>
                    </div>
                    {/* Subject */}
                    <h3 className="text-lg font-semibold text-white leading-snug mb-2 line-clamp-2">{selectedTicket.subject}</h3>
                    {/* User info row */}
                    <div className="flex items-center gap-3">
                      <div className={`w-7 h-7 rounded-md flex items-center justify-center text-[10px] font-bold ${
                        selectedTicket.user_type === "Customer"
                          ? "bg-blue-400/10 border border-blue-400/20 text-blue-400"
                          : "bg-purple-400/10 border border-purple-400/20 text-purple-400"
                      }`}>
                        {userInitials(selectedTicket.user_name)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm text-white/90 font-medium truncate">{selectedTicket.user_name}</p>
                        <p className="text-xs text-[#808080] truncate">{selectedTicket.user_email}</p>
                      </div>
                      <span className="hidden sm:flex items-center gap-1.5 text-xs text-[#808080] ml-auto shrink-0">
                        <Calendar className="h-3 w-3" />
                        {formatDate(selectedTicket.created_at)}
                      </span>
                    </div>
                  </div>
                  {/* Status changer */}
                  <div className="shrink-0">
                    <Select value={selectedTicket.status} onValueChange={handleStatusChange}>
                      <SelectTrigger className="w-[8.5rem] bg-[#1b1b1b] border-white/[0.07] text-white rounded-xl h-9 text-xs focus:ring-[#ffa31a]/30">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-[#1b1b1b] border-white/[0.1]">
                        {["Open", "Pending", "In Progress", "Resolved", "Closed"].map((s) => (
                          <SelectItem key={s} value={s} className="text-white focus:bg-white/[0.06] focus:text-white">
                            <span className="flex items-center gap-2">
                              <span className={`w-2 h-2 rounded-full ${statusDot(s)}`} />
                              {s}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* ── Messages ── */}
              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-1 max-h-[420px] bg-[#242424]">
                {selectedTicket.messages.map((msg, idx) => {
                  const prevMsg = selectedTicket.messages[idx - 1];
                  const showDateSep = !prevMsg
                    || new Date(msg.created_at).toDateString() !== new Date(prevMsg.created_at).toDateString();

                  return (
                    <div key={msg.id}>
                      {/* Date separator */}
                      {showDateSep && (
                        <div className="flex items-center gap-3 py-3">
                          <div className="flex-1 h-px bg-white/[0.06]" />
                          <span className="text-[10px] text-[#808080] font-medium uppercase tracking-wider">
                            {getDateLabel(msg.created_at)}
                          </span>
                          <div className="flex-1 h-px bg-white/[0.06]" />
                        </div>
                      )}
                      {/* Message bubble */}
                      <div className={`flex gap-2.5 mb-3 ${msg.is_staff ? "flex-row-reverse" : ""}`}>
                        {/* Avatar */}
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                          msg.is_staff
                            ? "bg-[#ffa31a]/15 border border-[#ffa31a]/25"
                            : "bg-white/[0.06] border border-white/[0.08]"
                        }`}>
                          {msg.is_staff
                            ? <Headphones className="h-3.5 w-3.5 text-[#ffa31a]" />
                            : <span className="text-[10px] font-bold text-white/70">{userInitials(msg.sender_name)}</span>}
                        </div>
                        {/* Bubble */}
                        <div className={`max-w-[75%] ${msg.is_staff ? "items-end" : "items-start"}`}>
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`text-[11px] font-medium ${msg.is_staff ? "text-[#ffa31a]/80" : "text-white/60"}`}>
                              {msg.sender_name}
                            </span>
                            {msg.is_staff && (
                              <span className="text-[9px] bg-[#ffa31a]/15 text-[#ffa31a] px-1.5 py-px rounded font-medium">Staff</span>
                            )}
                          </div>
                          <div className={`px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
                            msg.is_staff
                              ? "bg-[#ffa31a] text-[#1b1b1b] rounded-2xl rounded-tr-md"
                              : "bg-white/[0.06] text-white/90 rounded-2xl rounded-tl-md"
                          }`}>
                            {msg.message}
                          </div>
                          <p className={`text-[10px] text-[#808080]/60 mt-1 ${msg.is_staff ? "text-right" : ""}`}>
                            {timeAgo(msg.created_at)}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* ── Reply Area ── */}
              <div className="px-5 py-4 border-t border-white/[0.06] shrink-0 bg-[#292929]">
                <div className="flex gap-3">
                  <div className="relative flex-1">
                    <Textarea
                      placeholder="Write a reply..."
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      className="bg-[#1b1b1b] border-white/[0.07] text-white placeholder:text-[#808080]/60 rounded-xl min-h-[80px] max-h-[160px] resize-none pr-4 focus-visible:ring-[#ffa31a]/30"
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleSendReply();
                        }
                      }}
                    />
                    <span className="absolute bottom-2.5 right-3 text-[10px] text-[#808080]/40 pointer-events-none">
                      Enter to send
                    </span>
                  </div>
                  <Button
                    className="bg-[#ffa31a] hover:bg-[#ffa31a]/90 text-[#1b1b1b] font-semibold rounded-xl h-auto self-end px-5 py-3 transition-all duration-200 hover:shadow-[0_0_20px_rgba(255,163,26,0.15)] disabled:opacity-40"
                    disabled={!replyText.trim() || sending}
                    onClick={handleSendReply}
                  >
                    {sending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </SuperAdminLayout>
  );
};

export default SuperAdminSupport;

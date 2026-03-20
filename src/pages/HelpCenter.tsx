import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  HelpCircle,
  Plus,
  MessageSquare,
  Clock,
  Send,
  ArrowLeft,
  Loader2,
  Inbox,
  CheckCircle2,
  PawPrint,
  BookOpen,
  CreditCard,
  CalendarX2,
  ShieldCheck,
  ChevronRight,
  Headphones,
  Sparkles,
} from "lucide-react";
import { supportApi, type SupportTicket, type TicketDetail } from "@/services/supportApi";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

/* ─── helpers ─── */
const priorityColor = (p: string) => {
  switch (p) {
    case "Urgent":
      return "bg-red-50 text-red-600 border-red-200";
    case "High":
      return "bg-orange-50 text-orange-600 border-orange-200";
    case "Medium":
      return "bg-amber-50 text-amber-600 border-amber-200";
    default:
      return "bg-slate-50 text-slate-500 border-slate-200";
  }
};

const statusColor = (s: string) => {
  switch (s) {
    case "Open":
      return "bg-blue-50 text-blue-600 border-blue-200";
    case "Pending":
      return "bg-amber-50 text-amber-600 border-amber-200";
    case "In Progress":
      return "bg-purple-50 text-purple-600 border-purple-200";
    case "Resolved":
      return "bg-emerald-50 text-emerald-600 border-emerald-200";
    case "Closed":
      return "bg-slate-100 text-slate-500 border-slate-200";
    default:
      return "bg-slate-50 text-slate-500 border-slate-200";
  }
};

const statusDot = (s: string) => {
  switch (s) {
    case "Open":
      return "bg-blue-500";
    case "Pending":
      return "bg-amber-500";
    case "In Progress":
      return "bg-purple-500";
    case "Resolved":
      return "bg-emerald-500";
    case "Closed":
      return "bg-slate-400";
    default:
      return "bg-slate-400";
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
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
};

/* ─── Quick-help topic cards ─── */
const quickTopics = [
  {
    icon: CalendarX2,
    title: "Booking Issues",
    desc: "Cancellations, reschedules & refunds",
    subject: "Booking Issue",
  },
  {
    icon: CreditCard,
    title: "Payments",
    desc: "Billing, charges & payment methods",
    subject: "Payment Question",
  },
  {
    icon: PawPrint,
    title: "Pet Services",
    desc: "Hotels, grooming & veterinary help",
    subject: "Pet Service Inquiry",
  },
  {
    icon: ShieldCheck,
    title: "Account & Security",
    desc: "Login, profile & privacy settings",
    subject: "Account & Security",
  },
];

const HelpCenter = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const isLoggedIn =
    typeof window !== "undefined" &&
    localStorage.getItem("pawstay.authenticated") === "true";

  // State
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<TicketDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [replyText, setReplyText] = useState("");

  // New ticket dialog
  const [showNewTicket, setShowNewTicket] = useState(false);
  const [newSubject, setNewSubject] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [newPriority, setNewPriority] = useState("Medium");
  const [creating, setCreating] = useState(false);

  // View mode
  const [view, setView] = useState<"list" | "chat">("list");

  /* ─── load tickets ─── */
  const loadTickets = async () => {
    try {
      setLoading(true);
      const data = await supportApi.getTickets();
      setTickets(data);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isLoggedIn) loadTickets();
    else setLoading(false);
  }, []);

  /* ─── select ticket ─── */
  const openTicket = async (id: string) => {
    try {
      setDetailLoading(true);
      const detail = await supportApi.getTicket(id);
      setSelectedTicket(detail);
      setView("chat");
    } catch {
      toast({
        title: "Error",
        description: "Could not load ticket",
        variant: "destructive",
      });
    } finally {
      setDetailLoading(false);
    }
  };

  /* ─── scroll to bottom ─── */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [selectedTicket?.messages]);

  /* ─── create ticket ─── */
  const handleCreateTicket = async () => {
    if (!newSubject.trim() || !newMessage.trim()) return;
    try {
      setCreating(true);
      const ticket = await supportApi.createTicket({
        subject: newSubject.trim(),
        message: newMessage.trim(),
        priority: newPriority,
      });
      toast({
        title: "Ticket Created",
        description: `Ticket ${ticket.ticket_number} has been submitted`,
      });
      setShowNewTicket(false);
      setNewSubject("");
      setNewMessage("");
      setNewPriority("Medium");
      await loadTickets();
      openTicket(ticket.id);
    } catch {
      toast({
        title: "Error",
        description: "Failed to create ticket",
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  };

  /* ─── send message ─── */
  const handleSendMessage = async () => {
    if (!replyText.trim() || !selectedTicket) return;
    try {
      setSendingMessage(true);
      const msg = await supportApi.sendMessage(
        selectedTicket.id,
        replyText.trim()
      );
      setSelectedTicket((prev) =>
        prev ? { ...prev, messages: [...prev.messages, msg] } : prev
      );
      setReplyText("");
    } catch {
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    } finally {
      setSendingMessage(false);
    }
  };

  /* ─── open new ticket with pre-filled subject ─── */
  const openQuickTicket = (subject: string) => {
    setNewSubject(subject);
    setNewMessage("");
    setNewPriority("Medium");
    setShowNewTicket(true);
  };

  /* ─────────────────────────────
   * NOT LOGGED IN
   * ──────────────────────────── */
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1">
          {/* Hero */}
          <section className="relative overflow-hidden py-20 md:py-28">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
            <div className="absolute top-10 left-10 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
            <div className="absolute bottom-10 right-10 w-48 h-48 bg-accent/5 rounded-full blur-3xl" />
            <div className="container relative text-center max-w-2xl mx-auto px-4">
              <div className="inline-flex items-center gap-2 bg-primary/10 text-primary rounded-full px-4 py-1.5 text-sm font-medium mb-6">
                <Headphones className="h-4 w-4" />
                PawStay Support
              </div>
              <h1 className="text-3xl md:text-4xl font-bold mb-4 tracking-tight">
                How can we help you?
              </h1>
              <p className="text-muted-foreground text-lg mb-8 leading-relaxed">
                Sign in to create support tickets, chat with our team, and get
                instant help with your bookings and services.
              </p>
              <Button
                variant="hero"
                size="lg"
                className="shadow-glow"
                onClick={() => navigate("/signin")}
              >
                Sign In to Get Support
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </section>

          {/* Topic Cards */}
          <section className="container max-w-4xl mx-auto px-4 pb-20">
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {quickTopics.map((t) => (
                <Card
                  key={t.title}
                  className="group border-border/60 hover:border-primary/20 hover:shadow-card transition-all duration-300 cursor-default"
                >
                  <CardContent className="p-5 text-center">
                    <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/15 transition-colors">
                      <t.icon className="h-5 w-5 text-primary" />
                    </div>
                    <h3 className="font-semibold text-sm mb-1">{t.title}</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {t.desc}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        </main>
        <Footer />
      </div>
    );
  }

  /* ─────────────────────────────
   * LOGGED IN — MAIN PAGE
   * ──────────────────────────── */
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1">
        {/* ─── LIST VIEW ─── */}
        {view === "list" && (
          <>
            {/* Hero banner */}
            <section className="relative overflow-hidden border-b border-border/50">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
              <div className="absolute -top-20 -left-20 w-72 h-72 bg-primary/5 rounded-full blur-3xl" />
              <div className="absolute -bottom-20 -right-20 w-56 h-56 bg-accent/5 rounded-full blur-3xl" />
              <div className="container relative max-w-5xl mx-auto px-4 py-12 md:py-16">
                <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
                  <div>
                    <div className="inline-flex items-center gap-2 bg-primary/10 text-primary rounded-full px-3.5 py-1 text-xs font-semibold uppercase tracking-wider mb-4">
                      <Headphones className="h-3.5 w-3.5" />
                      Support Center
                    </div>
                    <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2">
                      How can we help?
                    </h1>
                    <p className="text-muted-foreground max-w-md">
                      Browse your support tickets or start a new conversation with
                      our team.
                    </p>
                  </div>
                  <Button
                    variant="hero"
                    size="lg"
                    className="shadow-glow md:shrink-0"
                    onClick={() => setShowNewTicket(true)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    New Ticket
                  </Button>
                </div>
              </div>
            </section>

            <div className="container max-w-5xl mx-auto px-4 py-8">
              {/* Quick-help topics */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
                {quickTopics.map((t) => (
                  <button
                    key={t.title}
                    onClick={() => openQuickTicket(t.subject)}
                    className="group flex flex-col items-center text-center p-4 rounded-xl border border-border/60 bg-card hover:border-primary/25 hover:shadow-soft transition-all duration-300"
                  >
                    <div className="w-10 h-10 mb-2.5 rounded-lg bg-gradient-hero/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <t.icon className="h-4.5 w-4.5 text-primary" />
                    </div>
                    <span className="text-sm font-medium mb-0.5">{t.title}</span>
                    <span className="text-[11px] text-muted-foreground leading-snug">
                      {t.desc}
                    </span>
                  </button>
                ))}
              </div>

              {/* Ticket list */}
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <BookOpen className="h-4.5 w-4.5 text-primary" />
                  Your Tickets
                  {tickets.length > 0 && (
                    <span className="text-xs font-normal bg-muted text-muted-foreground rounded-full px-2 py-0.5">
                      {tickets.length}
                    </span>
                  )}
                </h2>
              </div>

              {loading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3">
                  <Loader2 className="h-7 w-7 animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground">
                    Loading your tickets...
                  </p>
                </div>
              ) : tickets.length === 0 ? (
                <Card className="border-dashed border-2 border-border/60">
                  <CardContent className="py-16 text-center">
                    <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-primary/10 flex items-center justify-center">
                      <Inbox className="h-7 w-7 text-primary/60" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">No tickets yet</h3>
                    <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                      Need help with something? Create a support ticket and our
                      team will respond as quickly as possible.
                    </p>
                    <Button
                      variant="hero"
                      onClick={() => setShowNewTicket(true)}
                      className="shadow-glow"
                    >
                      <Sparkles className="h-4 w-4 mr-2" />
                      Create Your First Ticket
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-2.5">
                  {tickets.map((ticket, idx) => (
                    <Card
                      key={ticket.id}
                      className="group cursor-pointer border-border/60 hover:border-primary/20 hover:shadow-card transition-all duration-300"
                      style={{
                        animationDelay: `${idx * 40}ms`,
                        animation: "fadeSlideUp 0.35s ease-out both",
                      }}
                      onClick={() => openTicket(ticket.id)}
                    >
                      <CardContent className="p-0">
                        <div className="flex items-center gap-4 p-4 md:p-5">
                          {/* Status dot indicator */}
                          <div className="hidden sm:flex flex-col items-center gap-1 shrink-0">
                            <div
                              className={`w-2.5 h-2.5 rounded-full ${statusDot(ticket.status)} ${
                                ticket.status === "Open" || ticket.status === "In Progress"
                                  ? "animate-pulse"
                                  : ""
                              }`}
                            />
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-[11px] text-muted-foreground font-mono tracking-wide">
                                {ticket.ticket_number}
                              </span>
                              <Badge
                                variant="outline"
                                className={`text-[10px] px-1.5 py-0 h-4.5 font-medium ${statusColor(ticket.status)}`}
                              >
                                {ticket.status}
                              </Badge>
                              <Badge
                                variant="outline"
                                className={`text-[10px] px-1.5 py-0 h-4.5 font-medium ${priorityColor(ticket.priority)}`}
                              >
                                {ticket.priority}
                              </Badge>
                            </div>
                            <h3 className="font-medium text-[15px] truncate group-hover:text-primary transition-colors">
                              {ticket.subject}
                            </h3>
                            <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {timeAgo(ticket.created_at)}
                              </span>
                              <span className="flex items-center gap-1">
                                <MessageSquare className="h-3 w-3" />
                                {ticket.message_count}{" "}
                                {ticket.message_count === 1 ? "message" : "messages"}
                              </span>
                            </div>
                          </div>

                          {/* Right side */}
                          <div className="shrink-0 flex items-center gap-3">
                            {(ticket.status === "Resolved" ||
                              ticket.status === "Closed") && (
                              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                            )}
                            <ChevronRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {/* ─── CHAT VIEW ─── */}
        {view === "chat" && (
          <div className="flex flex-col h-[calc(100vh-64px)]">
            {/* Chat header */}
            <div className="border-b border-border/50 bg-background/90 backdrop-blur-sm shrink-0">
              <div className="container max-w-4xl mx-auto px-4 py-3">
                <div className="flex items-center gap-3">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="shrink-0 -ml-2 hover:bg-muted"
                    onClick={() => {
                      setView("list");
                      setSelectedTicket(null);
                      loadTickets();
                    }}
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </Button>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h2 className="font-semibold text-sm truncate">
                        {selectedTicket?.subject || "Loading..."}
                      </h2>
                    </div>
                    {selectedTicket && (
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[11px] text-muted-foreground font-mono">
                          {selectedTicket.ticket_number}
                        </span>
                        <div
                          className={`w-1.5 h-1.5 rounded-full ${statusDot(selectedTicket.status)}`}
                        />
                        <span className="text-[11px] text-muted-foreground">
                          {selectedTicket.status}
                        </span>
                      </div>
                    )}
                  </div>

                  {selectedTicket && (
                    <div className="hidden sm:flex items-center gap-1.5 shrink-0">
                      <Badge
                        variant="outline"
                        className={`text-[10px] font-medium ${priorityColor(selectedTicket.priority)}`}
                      >
                        {selectedTicket.priority}
                      </Badge>
                      <Badge
                        variant="outline"
                        className={`text-[10px] font-medium ${statusColor(selectedTicket.status)}`}
                      >
                        {selectedTicket.status}
                      </Badge>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Messages area */}
            <div
              ref={chatContainerRef}
              className="flex-1 overflow-y-auto bg-muted/30"
            >
              <div className="container max-w-4xl mx-auto px-4 py-6 space-y-4">
                {detailLoading ? (
                  <div className="flex flex-col items-center justify-center py-20 gap-3">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    <p className="text-sm text-muted-foreground">
                      Loading conversation...
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Conversation start indicator */}
                    {selectedTicket && (
                      <div className="flex justify-center mb-6">
                        <div className="inline-flex items-center gap-2 bg-background border border-border/60 rounded-full px-4 py-1.5 text-[11px] text-muted-foreground shadow-sm">
                          <MessageSquare className="h-3 w-3" />
                          Conversation started{" "}
                          {new Date(selectedTicket.created_at).toLocaleDateString(
                            "en-US",
                            {
                              month: "long",
                              day: "numeric",
                              year: "numeric",
                            }
                          )}
                        </div>
                      </div>
                    )}

                    {selectedTicket?.messages.map((msg, idx) => {
                      const isMe = !msg.is_staff;
                      return (
                        <div
                          key={msg.id}
                          className={`flex items-end gap-2.5 ${isMe ? "justify-end" : "justify-start"}`}
                          style={{
                            animationDelay: `${idx * 30}ms`,
                            animation: "fadeSlideUp 0.25s ease-out both",
                          }}
                        >
                          {/* Staff avatar */}
                          {!isMe && (
                            <Avatar className="h-7 w-7 shrink-0 shadow-sm">
                              <AvatarFallback className="bg-gradient-hero text-[10px] text-white font-semibold">
                                <Headphones className="h-3.5 w-3.5" />
                              </AvatarFallback>
                            </Avatar>
                          )}

                          <div
                            className={`max-w-[75%] md:max-w-[65%] ${
                              isMe ? "order-first" : ""
                            }`}
                          >
                            {/* Sender label */}
                            <div
                              className={`flex items-center gap-1.5 mb-1 ${
                                isMe ? "justify-end" : "justify-start"
                              }`}
                            >
                              <span className="text-[11px] font-medium text-muted-foreground">
                                {isMe ? "You" : `${msg.sender_name}`}
                              </span>
                              {!isMe && (
                                <span className="text-[9px] bg-primary/10 text-primary font-semibold px-1.5 py-0.5 rounded-full">
                                  SUPPORT
                                </span>
                              )}
                            </div>

                            {/* Bubble */}
                            <div
                              className={`px-4 py-2.5 text-sm leading-relaxed ${
                                isMe
                                  ? "bg-primary text-primary-foreground rounded-2xl rounded-br-md shadow-sm"
                                  : "bg-card border border-border/60 text-card-foreground rounded-2xl rounded-bl-md shadow-sm"
                              }`}
                            >
                              <p className="whitespace-pre-wrap">{msg.message}</p>
                            </div>

                            {/* Timestamp */}
                            <p
                              className={`text-[10px] text-muted-foreground/60 mt-1 ${
                                isMe ? "text-right" : "text-left"
                              }`}
                            >
                              {timeAgo(msg.created_at)}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </>
                )}
              </div>
            </div>

            {/* Reply input */}
            {selectedTicket && selectedTicket.status !== "Closed" && (
              <div className="border-t border-border/50 bg-background shrink-0">
                <div className="container max-w-4xl mx-auto px-4 py-3">
                  <div className="flex items-end gap-2.5">
                    <div className="flex-1 relative">
                      <Textarea
                        placeholder="Type your message..."
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        className="min-h-[48px] max-h-36 resize-none pr-4 rounded-xl border-border/60 focus:border-primary/40 bg-muted/40"
                        rows={1}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage();
                          }
                        }}
                      />
                    </div>
                    <Button
                      variant="hero"
                      size="icon"
                      className="shrink-0 h-12 w-12 rounded-xl shadow-glow"
                      disabled={!replyText.trim() || sendingMessage}
                      onClick={handleSendMessage}
                    >
                      {sendingMessage ? (
                        <Loader2 className="h-4.5 w-4.5 animate-spin" />
                      ) : (
                        <Send className="h-4.5 w-4.5" />
                      )}
                    </Button>
                  </div>
                  <p className="text-[10px] text-muted-foreground/50 mt-1.5 text-center">
                    Press Enter to send · Shift + Enter for new line
                  </p>
                </div>
              </div>
            )}

            {selectedTicket?.status === "Closed" && (
              <div className="border-t border-border/50 bg-muted/30 shrink-0">
                <div className="container max-w-4xl mx-auto px-4 py-4 text-center">
                  <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    This ticket has been closed.
                    <Button
                      variant="link"
                      className="text-primary p-0 h-auto font-medium"
                      onClick={() => setShowNewTicket(true)}
                    >
                      Create a new ticket
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer only on list view */}
      {view === "list" && <Footer />}

      {/* ─── NEW TICKET DIALOG ─── */}
      <Dialog open={showNewTicket} onOpenChange={setShowNewTicket}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center mb-2">
              <HelpCircle className="h-5 w-5 text-primary" />
            </div>
            <DialogTitle className="text-lg">Create Support Ticket</DialogTitle>
            <DialogDescription>
              Describe your issue and our team will get back to you as soon as
              possible.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-1">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Subject</label>
              <Input
                placeholder="Brief description of your issue"
                value={newSubject}
                onChange={(e) => setNewSubject(e.target.value)}
                className="border-border/60"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Priority</label>
              <Select value={newPriority} onValueChange={setNewPriority}>
                <SelectTrigger className="border-border/60">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Low">
                    <span className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-slate-400" /> Low
                    </span>
                  </SelectItem>
                  <SelectItem value="Medium">
                    <span className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-amber-500" />{" "}
                      Medium
                    </span>
                  </SelectItem>
                  <SelectItem value="High">
                    <span className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-orange-500" />{" "}
                      High
                    </span>
                  </SelectItem>
                  <SelectItem value="Urgent">
                    <span className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-red-500" />{" "}
                      Urgent
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">
                Describe your issue
              </label>
              <Textarea
                placeholder="Tell us what happened and how we can help..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                className="min-h-[120px] border-border/60"
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setShowNewTicket(false)}
              className="border-border/60"
            >
              Cancel
            </Button>
            <Button
              variant="hero"
              disabled={!newSubject.trim() || !newMessage.trim() || creating}
              onClick={handleCreateTicket}
            >
              {creating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Submit Ticket
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default HelpCenter;

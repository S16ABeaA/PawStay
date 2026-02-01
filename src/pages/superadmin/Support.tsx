import SuperAdminLayout from "@/components/superadmin/SuperAdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  Filter
} from "lucide-react";
import { useState } from "react";

const ticketStats = [
  { label: "Open Tickets", value: 24, icon: MessageSquare, color: "text-blue-400" },
  { label: "Pending Response", value: 8, icon: Clock, color: "text-amber-400" },
  { label: "Resolved Today", value: 15, icon: CheckCircle2, color: "text-emerald-400" },
  { label: "Urgent", value: 3, icon: AlertCircle, color: "text-red-400" },
];

const tickets = [
  { 
    id: "TKT-1234", 
    subject: "Booking cancellation not processed", 
    from: "john.doe@email.com",
    userType: "Customer",
    priority: "High",
    status: "Open",
    created: "2 hours ago",
    lastReply: "1 hour ago",
    messages: 3
  },
  { 
    id: "TKT-1233", 
    subject: "Unable to update service pricing", 
    from: "pawsparadise@hotel.com",
    userType: "Property",
    priority: "Medium",
    status: "Pending",
    created: "5 hours ago",
    lastReply: "3 hours ago",
    messages: 5
  },
  { 
    id: "TKT-1232", 
    subject: "Payment not received for last month", 
    from: "happytails@resort.com",
    userType: "Property",
    priority: "High",
    status: "Open",
    created: "1 day ago",
    lastReply: "6 hours ago",
    messages: 8
  },
  { 
    id: "TKT-1231", 
    subject: "How to add multiple pet profiles?", 
    from: "sarah.pet@email.com",
    userType: "Customer",
    priority: "Low",
    status: "Resolved",
    created: "1 day ago",
    lastReply: "12 hours ago",
    messages: 4
  },
  { 
    id: "TKT-1230", 
    subject: "Request for featured listing", 
    from: "luxurysuites@pet.com",
    userType: "Property",
    priority: "Medium",
    status: "Open",
    created: "2 days ago",
    lastReply: "1 day ago",
    messages: 2
  },
  { 
    id: "TKT-1229", 
    subject: "Refund not showing in account", 
    from: "mike.owner@email.com",
    userType: "Customer",
    priority: "High",
    status: "Pending",
    created: "2 days ago",
    lastReply: "1 day ago",
    messages: 6
  },
];

const selectedTicketMessages = [
  { sender: "john.doe@email.com", type: "customer", message: "I cancelled my booking 3 days ago but the refund hasn't been processed yet. The booking ID is BK-2024-1234.", time: "2 hours ago" },
  { sender: "Support Team", type: "agent", message: "Hi John, thank you for reaching out. I'm looking into your booking cancellation now. Can you confirm the email address associated with your payment method?", time: "1.5 hours ago" },
  { sender: "john.doe@email.com", type: "customer", message: "Yes, it's the same email: john.doe@email.com. I paid via credit card.", time: "1 hour ago" },
];

const SuperAdminSupport = () => {
  const [selectedTicket, setSelectedTicket] = useState(tickets[0]);
  const [replyText, setReplyText] = useState("");

  return (
    <SuperAdminLayout title="Support Center" subtitle="Manage customer and property owner support tickets">
      {/* Stats */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {ticketStats.map((stat) => (
          <Card key={stat.label} className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-4 flex items-center gap-4">
              <div className={`p-3 rounded-lg bg-slate-900 ${stat.color}`}>
                <stat.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stat.value}</p>
                <p className="text-sm text-slate-400">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        {/* Tickets List */}
        <Card className="lg:col-span-2 bg-slate-800/50 border-slate-700">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-white">Tickets</CardTitle>
              <Button variant="outline" size="sm" className="border-slate-600 text-slate-300 hover:bg-slate-700">
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </Button>
            </div>
            <div className="flex gap-2 mt-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <Input 
                  placeholder="Search tickets..." 
                  className="pl-9 bg-slate-900 border-slate-600 text-white placeholder:text-slate-500"
                />
              </div>
              <Select defaultValue="all">
                <SelectTrigger className="w-28 bg-slate-900 border-slate-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-slate-700">
              {tickets.map((ticket) => (
                <button
                  key={ticket.id}
                  onClick={() => setSelectedTicket(ticket)}
                  className={`w-full p-4 text-left hover:bg-slate-700/50 transition-colors ${
                    selectedTicket.id === ticket.id ? "bg-slate-700/50" : ""
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant="outline"
                        className={
                          ticket.priority === "High" ? "text-red-400 border-red-400/30" :
                          ticket.priority === "Medium" ? "text-amber-400 border-amber-400/30" :
                          "text-slate-400 border-slate-400/30"
                        }
                      >
                        {ticket.priority}
                      </Badge>
                      <Badge 
                        variant="outline"
                        className={
                          ticket.status === "Open" ? "text-blue-400 border-blue-400/30" :
                          ticket.status === "Pending" ? "text-amber-400 border-amber-400/30" :
                          "text-emerald-400 border-emerald-400/30"
                        }
                      >
                        {ticket.status}
                      </Badge>
                    </div>
                    <span className="text-xs text-slate-500">{ticket.created}</span>
                  </div>
                  <p className="font-medium text-white mb-1 line-clamp-1">{ticket.subject}</p>
                  <div className="flex items-center gap-2 text-sm text-slate-400">
                    {ticket.userType === "Customer" ? (
                      <User className="h-3 w-3" />
                    ) : (
                      <Building2 className="h-3 w-3" />
                    )}
                    <span className="truncate">{ticket.from}</span>
                    <span className="text-slate-600">•</span>
                    <MessageSquare className="h-3 w-3" />
                    <span>{ticket.messages}</span>
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Ticket Detail */}
        <Card className="lg:col-span-3 bg-slate-800/50 border-slate-700">
          <CardHeader className="border-b border-slate-700">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm text-slate-500">{selectedTicket.id}</span>
                  <Badge 
                    variant="outline"
                    className={
                      selectedTicket.priority === "High" ? "text-red-400 border-red-400/30" :
                      selectedTicket.priority === "Medium" ? "text-amber-400 border-amber-400/30" :
                      "text-slate-400 border-slate-400/30"
                    }
                  >
                    {selectedTicket.priority}
                  </Badge>
                  <Badge 
                    variant="outline"
                    className={
                      selectedTicket.status === "Open" ? "text-blue-400 border-blue-400/30" :
                      selectedTicket.status === "Pending" ? "text-amber-400 border-amber-400/30" :
                      "text-emerald-400 border-emerald-400/30"
                    }
                  >
                    {selectedTicket.status}
                  </Badge>
                </div>
                <CardTitle className="text-white">{selectedTicket.subject}</CardTitle>
                <p className="text-sm text-slate-400 mt-1">From: {selectedTicket.from}</p>
              </div>
              <div className="flex gap-2">
                <Select defaultValue={selectedTicket.status.toLowerCase()}>
                  <SelectTrigger className="w-32 bg-slate-900 border-slate-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {/* Messages */}
            <div className="p-4 space-y-4 max-h-80 overflow-y-auto">
              {selectedTicketMessages.map((msg, idx) => (
                <div 
                  key={idx} 
                  className={`flex ${msg.type === "agent" ? "justify-end" : "justify-start"}`}
                >
                  <div className={`max-w-[80%] p-3 rounded-lg ${
                    msg.type === "agent" 
                      ? "bg-violet-600 text-white" 
                      : "bg-slate-700 text-slate-200"
                  }`}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium opacity-80">{msg.sender}</span>
                      <span className="text-xs opacity-60">{msg.time}</span>
                    </div>
                    <p className="text-sm">{msg.message}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Reply Box */}
            <div className="p-4 border-t border-slate-700">
              <Tabs defaultValue="reply">
                <TabsList className="bg-slate-900 mb-3">
                  <TabsTrigger value="reply" className="data-[state=active]:bg-slate-700">Reply</TabsTrigger>
                  <TabsTrigger value="internal" className="data-[state=active]:bg-slate-700">Internal Note</TabsTrigger>
                </TabsList>
                <TabsContent value="reply" className="mt-0">
                  <div className="space-y-3">
                    <Textarea 
                      placeholder="Type your reply..." 
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      className="bg-slate-900 border-slate-600 text-white placeholder:text-slate-500 min-h-24"
                    />
                    <div className="flex justify-between items-center">
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="border-slate-600 text-slate-300 hover:bg-slate-700">
                          Use Template
                        </Button>
                        <Button variant="outline" size="sm" className="border-slate-600 text-slate-300 hover:bg-slate-700">
                          Attach File
                        </Button>
                      </div>
                      <Button className="bg-violet-600 hover:bg-violet-700">
                        <Send className="h-4 w-4 mr-2" />
                        Send Reply
                      </Button>
                    </div>
                  </div>
                </TabsContent>
                <TabsContent value="internal" className="mt-0">
                  <div className="space-y-3">
                    <Textarea 
                      placeholder="Add an internal note (not visible to the user)..." 
                      className="bg-slate-900 border-slate-600 text-white placeholder:text-slate-500 min-h-24"
                    />
                    <div className="flex justify-end">
                      <Button variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-700">
                        Add Note
                      </Button>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </CardContent>
        </Card>
      </div>
    </SuperAdminLayout>
  );
};

export default SuperAdminSupport;

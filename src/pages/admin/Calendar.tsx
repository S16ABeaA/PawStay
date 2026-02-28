import { useState, useMemo, useRef } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Calendar as CalendarIcon,
  Plus,
  ChevronLeft,
  ChevronRight,
  List,
  LayoutGrid,
  Clock,
  Trash2,
  Edit,
  ExternalLink,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// FullCalendar imports
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import listPlugin from "@fullcalendar/list";
import googleCalendarPlugin from "@fullcalendar/google-calendar";
import type { EventClickArg, DateSelectArg, EventInput } from "@fullcalendar/core";

import {
  GOOGLE_CALENDAR_API_KEY,
  DEFAULT_GOOGLE_CALENDAR_IDS,
} from "@/services/googleCalendarService";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end?: string;
  allDay?: boolean;
  color?: string;
  extendedProps: {
    pet?: string;
    owner?: string;
    service?: string;
    status?: string;
    notes?: string;
    room?: string;
  };
}

// ---------------------------------------------------------------------------
// Seed data (mirrors existing bookings data)
// ---------------------------------------------------------------------------

const SERVICE_COLORS: Record<string, string> = {
  Boarding: "#8B5CF6",  // violet
  Grooming: "#F59E0B",  // amber
  Daycare: "#10B981",   // emerald
  Veterinary: "#EF4444", // red
  Other: "#6B7280",     // gray
};

const initialEvents: CalendarEvent[] = [
  {
    id: "BK001",
    title: "Max – Boarding",
    start: "2026-01-30",
    end: "2026-02-02",
    color: SERVICE_COLORS.Boarding,
    extendedProps: { pet: "Max", owner: "John Smith", service: "Boarding", status: "confirmed", room: "Suite A", notes: "" },
  },
  {
    id: "BK002",
    title: "Bella – Grooming",
    start: "2026-01-30T10:00:00",
    end: "2026-01-30T11:30:00",
    color: SERVICE_COLORS.Grooming,
    extendedProps: { pet: "Bella", owner: "Sarah Johnson", service: "Grooming", status: "pending", notes: "" },
  },
  {
    id: "BK003",
    title: "Charlie – Boarding",
    start: "2026-01-31",
    end: "2026-02-05",
    color: SERVICE_COLORS.Boarding,
    extendedProps: { pet: "Charlie", owner: "Mike Brown", service: "Boarding", status: "confirmed", room: "Standard 3", notes: "" },
  },
  {
    id: "BK004",
    title: "Luna – Daycare",
    start: "2026-01-31T08:00:00",
    end: "2026-01-31T18:00:00",
    color: SERVICE_COLORS.Daycare,
    extendedProps: { pet: "Luna", owner: "Emily Davis", service: "Daycare", status: "pending", notes: "" },
  },
  {
    id: "BK005",
    title: "Cooper – Boarding",
    start: "2026-02-01",
    end: "2026-02-03",
    color: SERVICE_COLORS.Boarding,
    extendedProps: { pet: "Cooper", owner: "Alex Wilson", service: "Boarding", status: "confirmed", room: "Suite B", notes: "" },
  },
  {
    id: "BK006",
    title: "Bailey – Grooming",
    start: "2026-02-01T14:00:00",
    end: "2026-02-01T15:00:00",
    color: SERVICE_COLORS.Grooming,
    extendedProps: { pet: "Bailey", owner: "Lisa Chen", service: "Grooming", status: "cancelled", notes: "" },
  },
  {
    id: "BK007",
    title: "Rocky – Boarding",
    start: "2026-02-02",
    end: "2026-02-07",
    color: SERVICE_COLORS.Boarding,
    extendedProps: { pet: "Rocky", owner: "Tom Harris", service: "Boarding", status: "confirmed", room: "Standard 1", notes: "" },
  },
  // Some future events around "today" (Feb 28 2026)
  {
    id: "BK008",
    title: "Buddy – Daycare",
    start: "2026-02-28T09:00:00",
    end: "2026-02-28T17:00:00",
    color: SERVICE_COLORS.Daycare,
    extendedProps: { pet: "Buddy", owner: "Rachel Green", service: "Daycare", status: "confirmed", notes: "Needs special diet" },
  },
  {
    id: "BK009",
    title: "Daisy – Grooming",
    start: "2026-02-28T11:00:00",
    end: "2026-02-28T12:30:00",
    color: SERVICE_COLORS.Grooming,
    extendedProps: { pet: "Daisy", owner: "Mark Thompson", service: "Grooming", status: "confirmed", notes: "Full groom + nail trim" },
  },
  {
    id: "BK010",
    title: "Duke – Boarding",
    start: "2026-02-27",
    end: "2026-03-04",
    color: SERVICE_COLORS.Boarding,
    extendedProps: { pet: "Duke", owner: "Jessica Lee", service: "Boarding", status: "confirmed", room: "Suite C", notes: "" },
  },
  {
    id: "BK011",
    title: "Milo – Veterinary",
    start: "2026-03-01T10:00:00",
    end: "2026-03-01T10:45:00",
    color: SERVICE_COLORS.Veterinary,
    extendedProps: { pet: "Milo", owner: "David Park", service: "Veterinary", status: "pending", notes: "Annual vaccination" },
  },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const AdminCalendar = () => {
  const calendarRef = useRef<FullCalendar>(null);
  const { toast } = useToast();
  const [events, setEvents] = useState<CalendarEvent[]>(initialEvents);
  const [currentView, setCurrentView] = useState("dayGridMonth");
  const [titleText, setTitleText] = useState("");

  // Event detail / edit dialog
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  // New event dialog
  const [newEventOpen, setNewEventOpen] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: "",
    pet: "",
    owner: "",
    service: "Boarding",
    start: "",
    end: "",
    allDay: false,
    notes: "",
    room: "",
  });

  // Google Calendar toggle
  const [showGoogleCal, setShowGoogleCal] = useState(!!GOOGLE_CALENDAR_API_KEY);

  // Status filter
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Filtered events
  const filteredEvents = useMemo(() => {
    if (statusFilter === "all") return events;
    return events.filter((e) => e.extendedProps.status === statusFilter);
  }, [events, statusFilter]);

  // FullCalendar event sources
  const eventSources = useMemo(() => {
    const sources: any[] = [{ events: filteredEvents as EventInput[] }];

    if (showGoogleCal && GOOGLE_CALENDAR_API_KEY) {
      DEFAULT_GOOGLE_CALENDAR_IDS.forEach((id) => {
        sources.push({
          googleCalendarId: id,
          className: "gcal-event",
          color: "#4285F4",
          textColor: "#fff",
        });
      });
    }

    return sources;
  }, [filteredEvents, showGoogleCal]);

  // -----------------------------------------------------------------------
  // Handlers
  // -----------------------------------------------------------------------

  const handleDateSelect = (selectInfo: DateSelectArg) => {
    setNewEvent({
      title: "",
      pet: "",
      owner: "",
      service: "Boarding",
      start: selectInfo.startStr,
      end: selectInfo.endStr,
      allDay: selectInfo.allDay,
      notes: "",
      room: "",
    });
    setNewEventOpen(true);
  };

  const handleEventClick = (clickInfo: EventClickArg) => {
    // Google Calendar events open in a new tab
    if (clickInfo.event.source?.internalEventSource?.meta?.googleCalendarId) {
      const url = clickInfo.event.url;
      if (url) {
        clickInfo.jsEvent.preventDefault();
        window.open(url, "_blank");
      }
      return;
    }

    const evt = events.find((e) => e.id === clickInfo.event.id);
    if (evt) {
      setSelectedEvent(evt);
      setDetailOpen(true);
    }
  };

  const handleCreateEvent = () => {
    if (!newEvent.pet || !newEvent.owner) {
      toast({
        title: "Missing fields",
        description: "Please enter at least pet name and owner.",
        variant: "destructive",
      });
      return;
    }

    const id = `BK${String(events.length + 1).padStart(3, "0")}`;
    const title = `${newEvent.pet} – ${newEvent.service}`;
    const color = SERVICE_COLORS[newEvent.service] ?? SERVICE_COLORS.Other;

    const created: CalendarEvent = {
      id,
      title,
      start: newEvent.start,
      end: newEvent.end || undefined,
      allDay: newEvent.allDay,
      color,
      extendedProps: {
        pet: newEvent.pet,
        owner: newEvent.owner,
        service: newEvent.service,
        status: "pending",
        notes: newEvent.notes,
        room: newEvent.room,
      },
    };

    setEvents((prev) => [...prev, created]);
    setNewEventOpen(false);
    toast({ title: "Event Created", description: `${title} has been added to the calendar.` });
  };

  const handleDeleteEvent = (id: string) => {
    setEvents((prev) => prev.filter((e) => e.id !== id));
    setDetailOpen(false);
    toast({ title: "Event Deleted", description: "The booking has been removed from the calendar.", variant: "destructive" });
  };

  const handleConfirmEvent = (id: string) => {
    setEvents((prev) =>
      prev.map((e) =>
        e.id === id
          ? { ...e, extendedProps: { ...e.extendedProps, status: "confirmed" } }
          : e
      )
    );
    setSelectedEvent((prev) =>
      prev ? { ...prev, extendedProps: { ...prev.extendedProps, status: "confirmed" } } : null
    );
    toast({ title: "Booking Confirmed", description: `Booking ${id} has been confirmed.` });
  };

  // Calendar API helpers
  const goToday = () => calendarRef.current?.getApi().today();
  const goPrev = () => calendarRef.current?.getApi().prev();
  const goNext = () => calendarRef.current?.getApi().next();
  const changeView = (view: string) => {
    calendarRef.current?.getApi().changeView(view);
    setCurrentView(view);
  };

  const handleDatesSet = (arg: any) => {
    setTitleText(arg.view.title);
    setCurrentView(arg.view.type);
  };

  // Event drag & resize
  const handleEventDrop = (info: any) => {
    setEvents((prev) =>
      prev.map((e) =>
        e.id === info.event.id
          ? {
              ...e,
              start: info.event.startStr,
              end: info.event.endStr ?? e.end,
              allDay: info.event.allDay,
            }
          : e
      )
    );
    toast({ title: "Event Moved", description: `${info.event.title} has been rescheduled.` });
  };

  const handleEventResize = (info: any) => {
    setEvents((prev) =>
      prev.map((e) =>
        e.id === info.event.id
          ? { ...e, end: info.event.endStr }
          : e
      )
    );
    toast({ title: "Duration Updated", description: `${info.event.title} duration changed.` });
  };

  // -----------------------------------------------------------------------
  // Stats
  // -----------------------------------------------------------------------

  const todayStr = new Date().toISOString().split("T")[0];
  const todayEvents = events.filter((e) => e.start.startsWith(todayStr));
  const pendingCount = events.filter((e) => e.extendedProps.status === "pending").length;
  const confirmedCount = events.filter((e) => e.extendedProps.status === "confirmed").length;

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------

  return (
    <AdminLayout title="Calendar" subtitle="Manage your bookings and schedule at a glance.">
      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <CalendarIcon className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{todayEvents.length}</p>
              <p className="text-xs text-muted-foreground">Today's Events</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
              <Clock className="h-5 w-5 text-amber-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{pendingCount}</p>
              <p className="text-xs text-muted-foreground">Pending</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <CalendarIcon className="h-5 w-5 text-emerald-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{confirmedCount}</p>
              <p className="text-xs text-muted-foreground">Confirmed</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Toolbar */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            {/* Left: nav + title */}
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={goPrev}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={goToday}>
                Today
              </Button>
              <Button variant="outline" size="icon" onClick={goNext}>
                <ChevronRight className="h-4 w-4" />
              </Button>
              <h2 className="text-lg font-semibold ml-2">{titleText}</h2>
            </div>

            {/* Right: view switch, filter, add */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Status filter */}
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="Filter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>

              {/* View buttons */}
              <div className="flex border rounded-lg overflow-hidden">
                <Button
                  variant={currentView === "dayGridMonth" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => changeView("dayGridMonth")}
                  className="rounded-none"
                >
                  <LayoutGrid className="h-4 w-4 mr-1" />
                  Month
                </Button>
                <Button
                  variant={currentView === "timeGridWeek" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => changeView("timeGridWeek")}
                  className="rounded-none"
                >
                  <CalendarIcon className="h-4 w-4 mr-1" />
                  Week
                </Button>
                <Button
                  variant={currentView === "timeGridDay" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => changeView("timeGridDay")}
                  className="rounded-none"
                >
                  <Clock className="h-4 w-4 mr-1" />
                  Day
                </Button>
                <Button
                  variant={currentView === "listWeek" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => changeView("listWeek")}
                  className="rounded-none"
                >
                  <List className="h-4 w-4 mr-1" />
                  List
                </Button>
              </div>

              {/* Google Calendar toggle */}
              {GOOGLE_CALENDAR_API_KEY && (
                <Button
                  variant={showGoogleCal ? "default" : "outline"}
                  size="sm"
                  onClick={() => setShowGoogleCal(!showGoogleCal)}
                >
                  <ExternalLink className="h-4 w-4 mr-1" />
                  Google Cal
                </Button>
              )}

              {/* Add event */}
              <Button size="sm" onClick={() => {
                setNewEvent({
                  title: "",
                  pet: "",
                  owner: "",
                  service: "Boarding",
                  start: new Date().toISOString().slice(0, 16),
                  end: "",
                  allDay: false,
                  notes: "",
                  room: "",
                });
                setNewEventOpen(true);
              }}>
                <Plus className="h-4 w-4 mr-1" />
                New Event
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Calendar */}
      <Card>
        <CardContent className="p-2 md:p-4">
          <FullCalendar
            ref={calendarRef}
            plugins={[
              dayGridPlugin,
              timeGridPlugin,
              interactionPlugin,
              listPlugin,
              ...(GOOGLE_CALENDAR_API_KEY ? [googleCalendarPlugin] : []),
            ]}
            initialView="dayGridMonth"
            headerToolbar={false} // Using custom toolbar above
            editable
            selectable
            selectMirror
            dayMaxEvents={3}
            weekends
            nowIndicator
            eventSources={eventSources}
            {...(GOOGLE_CALENDAR_API_KEY
              ? { googleCalendarApiKey: GOOGLE_CALENDAR_API_KEY }
              : {})}
            select={handleDateSelect}
            eventClick={handleEventClick}
            eventDrop={handleEventDrop}
            eventResize={handleEventResize}
            datesSet={handleDatesSet}
            height="auto"
            eventDisplay="block"
            eventTimeFormat={{
              hour: "numeric",
              minute: "2-digit",
              meridiem: "short",
            }}
            slotMinTime="07:00:00"
            slotMaxTime="21:00:00"
          />
        </CardContent>
      </Card>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 mt-4">
        {Object.entries(SERVICE_COLORS).map(([service, color]) => (
          <div key={service} className="flex items-center gap-2 text-sm">
            <span
              className="inline-block w-3 h-3 rounded-full"
              style={{ backgroundColor: color }}
            />
            <span className="text-muted-foreground">{service}</span>
          </div>
        ))}
        {GOOGLE_CALENDAR_API_KEY && (
          <div className="flex items-center gap-2 text-sm">
            <span className="inline-block w-3 h-3 rounded-full bg-[#4285F4]" />
            <span className="text-muted-foreground">Google Calendar</span>
          </div>
        )}
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* Event Detail Dialog                                                */}
      {/* ----------------------------------------------------------------- */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5 text-primary" />
              Booking Details
            </DialogTitle>
            <DialogDescription>View and manage this booking.</DialogDescription>
          </DialogHeader>
          {selectedEvent && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-muted-foreground">Pet</p>
                  <p className="font-medium">{selectedEvent.extendedProps.pet}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Owner</p>
                  <p className="font-medium">{selectedEvent.extendedProps.owner}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Service</p>
                  <p className="font-medium">{selectedEvent.extendedProps.service}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Status</p>
                  <Badge
                    variant={
                      selectedEvent.extendedProps.status === "confirmed"
                        ? "default"
                        : selectedEvent.extendedProps.status === "cancelled"
                        ? "destructive"
                        : "secondary"
                    }
                  >
                    {selectedEvent.extendedProps.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Start</p>
                  <p className="font-medium text-sm">
                    {new Date(selectedEvent.start).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">End</p>
                  <p className="font-medium text-sm">
                    {selectedEvent.end
                      ? new Date(selectedEvent.end).toLocaleString()
                      : "—"}
                  </p>
                </div>
                {selectedEvent.extendedProps.room && (
                  <div className="col-span-2">
                    <p className="text-xs text-muted-foreground">Room</p>
                    <p className="font-medium">{selectedEvent.extendedProps.room}</p>
                  </div>
                )}
                {selectedEvent.extendedProps.notes && (
                  <div className="col-span-2">
                    <p className="text-xs text-muted-foreground">Notes</p>
                    <p className="text-sm">{selectedEvent.extendedProps.notes}</p>
                  </div>
                )}
              </div>

              <DialogFooter className="flex gap-2 sm:gap-0">
                {selectedEvent.extendedProps.status === "pending" && (
                  <Button size="sm" onClick={() => handleConfirmEvent(selectedEvent.id)}>
                    Confirm
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleDeleteEvent(selectedEvent.id)}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ----------------------------------------------------------------- */}
      {/* New Event Dialog                                                   */}
      {/* ----------------------------------------------------------------- */}
      <Dialog open={newEventOpen} onOpenChange={setNewEventOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-primary" />
              New Booking
            </DialogTitle>
            <DialogDescription>
              Add a new booking to the calendar. You can also click and drag on
              the calendar to pre-fill the dates.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="pet">Pet Name *</Label>
                <Input
                  id="pet"
                  placeholder="e.g. Max"
                  value={newEvent.pet}
                  onChange={(e) => setNewEvent({ ...newEvent, pet: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="owner">Owner *</Label>
                <Input
                  id="owner"
                  placeholder="e.g. John Smith"
                  value={newEvent.owner}
                  onChange={(e) => setNewEvent({ ...newEvent, owner: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="service">Service</Label>
                <Select
                  value={newEvent.service}
                  onValueChange={(v) => setNewEvent({ ...newEvent, service: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.keys(SERVICE_COLORS).map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="room">Room / Area</Label>
                <Input
                  id="room"
                  placeholder="e.g. Suite A"
                  value={newEvent.room}
                  onChange={(e) => setNewEvent({ ...newEvent, room: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start">Start *</Label>
                <Input
                  id="start"
                  type="datetime-local"
                  value={newEvent.start}
                  onChange={(e) => setNewEvent({ ...newEvent, start: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end">End</Label>
                <Input
                  id="end"
                  type="datetime-local"
                  value={newEvent.end}
                  onChange={(e) => setNewEvent({ ...newEvent, end: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                placeholder="Any special instructions..."
                value={newEvent.notes}
                onChange={(e) => setNewEvent({ ...newEvent, notes: e.target.value })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setNewEventOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateEvent}>Create Booking</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminCalendar;

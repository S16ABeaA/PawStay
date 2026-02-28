import { useState, useMemo, useRef, useEffect, useCallback } from "react";
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
  Loader2,
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

import {
  bookingApi,
  type AdminCalendarBooking,
  type AdminCalendarProperty,
} from "@/services/bookingApi";

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
    propertyName?: string;
    propertyId?: string;
    totalPrice?: number | null;
    paymentStatus?: string;
  };
}

// ---------------------------------------------------------------------------
// Colour map for service categories
// ---------------------------------------------------------------------------

const SERVICE_COLORS: Record<string, string> = {
  boarding: "#8B5CF6",    // violet
  grooming: "#F59E0B",    // amber
  daycare: "#10B981",     // emerald
  veterinary: "#EF4444",  // red
  transport: "#3B82F6",   // blue
  other: "#6B7280",       // gray
};

/** Map a booking row to a FullCalendar event */
function bookingToEvent(b: AdminCalendarBooking): CalendarEvent {
  const svc = (b.service_type ?? "other").toLowerCase();
  const color = SERVICE_COLORS[svc] ?? SERVICE_COLORS.other;
  const label = b.pet_name ?? "Pet";
  const serviceLabel = b.service_name ?? b.service_type ?? "Booking";

  // Boarding → multi-day (allDay), others → timed
  const isBoarding = !!b.checkout;
  const start = isBoarding
    ? b.checkin
    : b.time_slot
      ? `${b.checkin}T${b.time_slot}`
      : b.checkin;

  let end: string | undefined;
  if (isBoarding) {
    end = b.checkout ?? undefined;
  } else if (b.time_slot) {
    // Default 1-hour appointment
    const [h, m] = b.time_slot.split(":").map(Number);
    const endH = String(h + 1).padStart(2, "0");
    end = `${b.checkin}T${endH}:${String(m ?? 0).padStart(2, "0")}:00`;
  }

  return {
    id: b.id,
    title: `${label} – ${serviceLabel}`,
    start,
    end,
    allDay: isBoarding,
    color,
    extendedProps: {
      pet: b.pet_name ?? undefined,
      owner: b.owner_name ?? undefined,
      service: serviceLabel,
      status: b.status,
      notes: b.notes ?? undefined,
      room: b.room_name ?? undefined,
      propertyName: b.property_name ?? undefined,
      propertyId: b.property_id,
      totalPrice: b.total_price,
      paymentStatus: b.payment_status,
    },
  };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const AdminCalendar = () => {
  const calendarRef = useRef<FullCalendar>(null);
  const { toast } = useToast();

  // Data from API
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [properties, setProperties] = useState<AdminCalendarProperty[]>([]);
  const [serviceTypes, setServiceTypes] = useState<string[]>([]);

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

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [propertyFilter, setPropertyFilter] = useState<string>("all");
  const [serviceTypeFilter, setServiceTypeFilter] = useState<string>("all");

  // -----------------------------------------------------------------------
  // Fetch data from API
  // -----------------------------------------------------------------------

  const fetchCalendarData = useCallback(async () => {
    try {
      setLoading(true);
      const params: Record<string, string> = {};
      if (propertyFilter !== "all") params.property_id = propertyFilter;
      if (serviceTypeFilter !== "all") params.service_type = serviceTypeFilter;
      if (statusFilter !== "all") params.status = statusFilter;

      const data = await bookingApi.getAdminCalendar(params);
      setProperties(data.properties);
      setServiceTypes(data.serviceTypes);
      setEvents(data.bookings.map(bookingToEvent));
    } catch (err: any) {
      console.error("Failed to fetch calendar data:", err);
      toast({
        title: "Error",
        description: "Failed to load calendar data.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [propertyFilter, serviceTypeFilter, statusFilter, toast]);

  useEffect(() => {
    fetchCalendarData();
  }, [fetchCalendarData]);

  // FullCalendar event sources (filters are server-side, so just use events directly)
  const eventSources = useMemo(() => {
    const sources: any[] = [{ events: events as EventInput[] }];

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
  }, [events, showGoogleCal]);

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
    const color = SERVICE_COLORS[newEvent.service.toLowerCase()] ?? SERVICE_COLORS.other;

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
              {/* Property filter */}
              {properties.length > 0 && (
                <Select value={propertyFilter} onValueChange={setPropertyFilter}>
                  <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="Property" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Properties</SelectItem>
                    {properties.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {/* Service type filter */}
              {serviceTypes.length > 0 && (
                <Select value={serviceTypeFilter} onValueChange={setServiceTypeFilter}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Service" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Services</SelectItem>
                    {serviceTypes.map((st) => (
                      <SelectItem key={st} value={st.toLowerCase()}>
                        {st}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {/* Status filter */}
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                  <SelectItem value="checked_in">Checked In</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
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
        <CardContent className="p-2 md:p-4 relative">
          {loading && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/60 rounded-lg">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}
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
            <span className="text-muted-foreground capitalize">{service}</span>
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
                {selectedEvent.extendedProps.propertyName && (
                  <div className="col-span-2">
                    <p className="text-xs text-muted-foreground">Property</p>
                    <p className="font-medium">{selectedEvent.extendedProps.propertyName}</p>
                  </div>
                )}
                <div>
                  <p className="text-xs text-muted-foreground">Pet</p>
                  <p className="font-medium">{selectedEvent.extendedProps.pet ?? "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Owner</p>
                  <p className="font-medium">{selectedEvent.extendedProps.owner ?? "—"}</p>
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
                {selectedEvent.extendedProps.totalPrice != null && (
                  <div>
                    <p className="text-xs text-muted-foreground">Total Price</p>
                    <p className="font-medium">₱{Number(selectedEvent.extendedProps.totalPrice).toLocaleString()}</p>
                  </div>
                )}
                {selectedEvent.extendedProps.paymentStatus && (
                  <div>
                    <p className="text-xs text-muted-foreground">Payment</p>
                    <Badge variant={selectedEvent.extendedProps.paymentStatus === "paid" ? "default" : "secondary"}>
                      {selectedEvent.extendedProps.paymentStatus}
                    </Badge>
                  </div>
                )}
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

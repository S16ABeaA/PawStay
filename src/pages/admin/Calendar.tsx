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
  UserPlus,
  CheckCircle2,
  MapPin,
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
  type PropertyService,
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
  veterinary: "#EF4444",  // red
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
  const [propertyServices, setPropertyServices] = useState<PropertyService[]>([]);

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
    service: "boarding",
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
      setPropertyServices(data.propertyServices ?? []);
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

  // If there are properties and no property is selected, default to the first property
  useEffect(() => {
    if (properties.length > 0 && propertyFilter === "all") {
      setPropertyFilter(properties[0].id);
    }
  }, [properties, propertyFilter]);

  const currentPropertyName = useMemo(
    () => properties.find((p) => p.id === propertyFilter)?.name ?? "",
    [properties, propertyFilter]
  );

  // Map property_type values to service category keys used in SERVICE_COLORS
  const PROPERTY_TYPE_TO_SERVICE: Record<string, string> = {
    hotel: "boarding",
    grooming: "grooming",
    veterinary: "veterinary",
  };

  // Services available for the currently selected property
  const availableServices = useMemo(() => {
    const selectedProp = properties.find((p) => p.id === propertyFilter);
    if (!selectedProp || !selectedProp.property_type?.length) {
      // Fallback: show all service types
      return Object.keys(SERVICE_COLORS);
    }
    const mapped = selectedProp.property_type
      .map((pt) => PROPERTY_TYPE_TO_SERVICE[pt])
      .filter((s): s is string => !!s && s in SERVICE_COLORS);
    return mapped.length > 0 ? mapped : Object.keys(SERVICE_COLORS);
  }, [properties, propertyFilter]);

  // Auto-update newEvent.service when available services change
  useEffect(() => {
    if (availableServices.length > 0 && !availableServices.includes(newEvent.service)) {
      setNewEvent((prev) => ({ ...prev, service: availableServices[0] }));
    }
  }, [availableServices]);

  // Property services (rooms/service items) for the selected property, filtered by chosen service type
  const SERVICE_TO_CATEGORY: Record<string, string> = {
    boarding: "Boarding",
    grooming: "Grooming",
    veterinary: "Veterinary",
  };

  const filteredPropertyServices = useMemo(() => {
    if (!propertyFilter || propertyFilter === "all") return [];
    let filtered = propertyServices.filter((ps) => ps.property_id === propertyFilter);
    // If a service type is selected in the new event form, narrow to that category
    const cat = SERVICE_TO_CATEGORY[newEvent.service.toLowerCase()];
    if (cat) {
      const catFiltered = filtered.filter((ps) => ps.category === cat);
      if (catFiltered.length > 0) filtered = catFiltered;
    }
    return filtered;
  }, [propertyFilter, propertyServices, newEvent.service]);

  // Auto-clear room when property or service changes and the current room is no longer valid
  useEffect(() => {
    if (newEvent.room && filteredPropertyServices.length > 0) {
      const still = filteredPropertyServices.some((ps) => ps.id === newEvent.room);
      if (!still) setNewEvent((prev) => ({ ...prev, room: "" }));
    }
  }, [filteredPropertyServices]);

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
    // Prevent selecting past dates (safety net in case selectAllow isn't applied)
    const startDate = new Date(selectInfo.start);
    const now = new Date();
    if (selectInfo.allDay) {
      now.setHours(0, 0, 0, 0);
      startDate.setHours(0, 0, 0, 0);
      if (startDate.getTime() < now.getTime()) {
        toast({ title: "Invalid date", description: "Cannot select past dates.", variant: "destructive" });
        return;
      }
    } else {
      if (startDate.getTime() < now.getTime()) {
        toast({ title: "Invalid time", description: "Cannot select past times.", variant: "destructive" });
        return;
      }
    }

    setNewEvent({
      title: "",
      pet: "",
      owner: "",
      service: availableServices[0] || "boarding",
      start: selectInfo.startStr,
      end: selectInfo.endStr,
      allDay: selectInfo.allDay,
      notes: "",
      room: "",
    });
    setNewEventOpen(true);
  };

  const handleDateClick = (clickInfo: any) => {
    const startDate = new Date(clickInfo.date);
    const now = new Date();
    // treat date click as all-day selection
    now.setHours(0, 0, 0, 0);
    startDate.setHours(0, 0, 0, 0);
    if (startDate.getTime() < now.getTime()) {
      toast({ title: "Invalid date", description: "Cannot select past dates.", variant: "destructive" });
      return;
    }

    setNewEvent({
      title: "",
      pet: "",
      owner: "",
      service: availableServices[0] || "boarding",
      start: clickInfo.dateStr,
      end: "",
      allDay: true,
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

  const handleCreateEvent = async () => {
    if (!newEvent.pet || !newEvent.owner) {
      toast({
        title: "Missing fields",
        description: "Please enter at least pet name and owner.",
        variant: "destructive",
      });
      return;
    }

    // Must have a property selected
    if (!propertyFilter || propertyFilter === "all") {
      toast({
        title: "No property selected",
        description: "Please select a property before creating a booking.",
        variant: "destructive",
      });
      return;
    }

    if (!newEvent.start) {
      toast({
        title: "Missing date",
        description: "Please select a start date.",
        variant: "destructive",
      });
      return;
    }

    // Client-side validation: prevent creating events in the past
    const now = new Date();
    const startDt = new Date(newEvent.start);
    if (isNaN(startDt.getTime())) {
      toast({ title: "Invalid date", description: "Start date is invalid.", variant: "destructive" });
      return;
    }
    // For all-day/boarding compare by date only
    if (newEvent.allDay || newEvent.service.toLowerCase() === "boarding") {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const startDay = new Date(startDt);
      startDay.setHours(0, 0, 0, 0);
      if (startDay.getTime() < today.getTime()) {
        toast({ title: "Invalid date", description: "Start date cannot be in the past.", variant: "destructive" });
        return;
      }
    } else {
      // For appointments, disallow start datetime before now
      if (startDt.getTime() < now.getTime()) {
        toast({ title: "Invalid time", description: "Appointment time cannot be in the past.", variant: "destructive" });
        return;
      }
    }

    try {
      // Determine checkin/checkout/time_slot from the start/end values
      const isAllDay = newEvent.allDay;
      let checkin: string;
      let checkout: string | null = null;
      let timeSlot: string | null = null;

      if (isAllDay || newEvent.service.toLowerCase() === "boarding") {
        // Boarding: checkin = start date, checkout = end date
        checkin = newEvent.start.slice(0, 10); // YYYY-MM-DD
        checkout = newEvent.end ? newEvent.end.slice(0, 10) : null;
      } else {
        // Appointment: checkin = date, time_slot = time
        checkin = newEvent.start.slice(0, 10);
        if (newEvent.start.includes("T")) {
          timeSlot = newEvent.start.slice(11, 16); // HH:MM
        }
      }

      // Resolve the selected property service (room/service item)
      const selectedPs = filteredPropertyServices.find((ps) => ps.id === newEvent.room);
      const serviceId = selectedPs?.id || null;
      const roomName = selectedPs?.name || (newEvent.room && newEvent.room !== "none" ? newEvent.room : undefined);
      const serviceName = selectedPs?.name || newEvent.service;
      const serviceCategory = newEvent.service.toLowerCase();
      const price = selectedPs?.price ?? undefined;

      const result = await bookingApi.createWalkin({
        property_id: propertyFilter,
        checkin,
        checkout,
        time_slot: timeSlot,
        pet_name: newEvent.pet,
        service_id: serviceId,
        service_name: serviceName,
        service_type: serviceCategory,
        owner_name: newEvent.owner,
        notes: newEvent.notes || undefined,
        room_name: roomName,
        total_price: price ? Number(price) : undefined,
        status: "confirmed",
      });

      setNewEventOpen(false);
      toast({
        title: "Walk-in Created",
        description: `${newEvent.pet} – ${newEvent.service} has been saved.`,
      });

      // Refresh calendar data from server
      fetchCalendarData();
    } catch (err: any) {
      console.error("Failed to create walk-in:", err);
      const message =
        err?.error || err?.message || "Failed to save walk-in booking.";
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    }
  };

  const handleDeleteEvent = async (id: string) => {
    try {
      await bookingApi.deleteBooking(id);
      setEvents((prev) => prev.filter((e) => e.id !== id));
      setDetailOpen(false);
      toast({ title: "Event Deleted", description: "The booking has been removed from the calendar.", variant: "destructive" });
    } catch (err: any) {
      const message = err?.message || "Failed to delete booking.";
      toast({ title: "Error", description: message, variant: "destructive" });
    }
  };

  const handleConfirmEvent = async (id: string) => {
    try {
      await bookingApi.updateBookingStatus(id, "confirmed");
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
    } catch (err: any) {
      const message = err?.message || "Failed to confirm booking.";
      toast({ title: "Error", description: message, variant: "destructive" });
    }
  };

  const handleUpdateStatus = async (id: string, status: string, label: string) => {
    try {
      await bookingApi.updateBookingStatus(id, status);
      setEvents((prev) =>
        prev.map((e) =>
          e.id === id
            ? { ...e, extendedProps: { ...e.extendedProps, status } }
            : e
        )
      );
      setSelectedEvent((prev) =>
        prev ? { ...prev, extendedProps: { ...prev.extendedProps, status } } : null
      );
      toast({ title: label, description: `Booking status updated to ${status}.` });
    } catch (err: any) {
      const message = err?.message || `Failed to update status to ${status}.`;
      toast({ title: "Error", description: message, variant: "destructive" });
    }
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
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
        <Card className="border-l-4 border-l-primary">
          <CardContent className="flex items-center gap-5 p-5">
            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <CalendarIcon className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-3xl font-bold tracking-tight">{todayEvents.length}</p>
              <p className="text-sm text-muted-foreground">Today's Events</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-amber-500">
          <CardContent className="flex items-center gap-5 p-5">
            <div className="h-12 w-12 rounded-xl bg-amber-500/10 flex items-center justify-center">
              <Clock className="h-6 w-6 text-amber-500" />
            </div>
            <div>
              <p className="text-3xl font-bold tracking-tight">{pendingCount}</p>
              <p className="text-sm text-muted-foreground">Pending</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-emerald-500">
          <CardContent className="flex items-center gap-5 p-5">
            <div className="h-12 w-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
              <CheckCircle2 className="h-6 w-6 text-emerald-500" />
            </div>
            <div>
              <p className="text-3xl font-bold tracking-tight">{confirmedCount}</p>
              <p className="text-sm text-muted-foreground">Confirmed</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Toolbar */}
      <Card className="mb-6">
        <CardContent className="p-5">
          {/* Row 1: Navigation + Title + Actions */}
          <div className="flex items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex items-center gap-1 flex-shrink-0">
                <Button variant="outline" size="icon" onClick={goPrev}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={goToday}>
                  Today
                </Button>
                <Button variant="outline" size="icon" onClick={goNext}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              <div className="ml-1 min-w-0">
                <h2 className="text-xl font-semibold leading-tight truncate">{titleText}</h2>
                {currentPropertyName && (
                  <p className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5">
                    <MapPin className="h-3 w-3 flex-shrink-0" />
                    <span className="truncate">{currentPropertyName}</span>
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setNewEvent({
                    title: "",
                    pet: "",
                    owner: "",
                    service: availableServices[0] || "boarding",
                    start: new Date().toISOString().slice(0, 16),
                    end: "",
                    allDay: false,
                    notes: "Walk-in customer",
                    room: "",
                  });
                  setNewEventOpen(true);
                }}
              >
                <UserPlus className="h-4 w-4 mr-1" />
                Walk-in
              </Button>
              <Button size="sm" onClick={() => {
                setNewEvent({
                  title: "",
                  pet: "",
                  owner: "",
                  service: availableServices[0] || "boarding",
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

          {/* Row 2: Filters + View Switcher */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Property filter */}
            {properties.length > 0 && (
              <Select value={propertyFilter} onValueChange={setPropertyFilter}>
                <SelectTrigger className="w-[170px] h-9">
                  <SelectValue placeholder="Property" />
                </SelectTrigger>
                <SelectContent>
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
                <SelectTrigger className="w-[150px] h-9">
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
              <SelectTrigger className="w-[140px] h-9">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex-1" />

            {/* View buttons */}
            <div className="flex border rounded-lg overflow-hidden flex-shrink-0">
              <Button
                variant={currentView === "dayGridMonth" ? "default" : "ghost"}
                size="sm"
                onClick={() => changeView("dayGridMonth")}
                className="rounded-none h-9 px-3"
              >
                <LayoutGrid className="h-4 w-4 mr-1" />
                Month
              </Button>
              <Button
                variant={currentView === "timeGridWeek" ? "default" : "ghost"}
                size="sm"
                onClick={() => changeView("timeGridWeek")}
                className="rounded-none h-9 px-3"
              >
                <CalendarIcon className="h-4 w-4 mr-1" />
                Week
              </Button>
              <Button
                variant={currentView === "timeGridDay" ? "default" : "ghost"}
                size="sm"
                onClick={() => changeView("timeGridDay")}
                className="rounded-none h-9 px-3"
              >
                <Clock className="h-4 w-4 mr-1" />
                Day
              </Button>
              <Button
                variant={currentView === "listWeek" ? "default" : "ghost"}
                size="sm"
                onClick={() => changeView("listWeek")}
                className="rounded-none h-9 px-3"
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
                className="h-9"
                onClick={() => setShowGoogleCal(!showGoogleCal)}
              >
                <ExternalLink className="h-4 w-4 mr-1" />
                Google Cal
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Calendar */}
      <Card>
        <CardContent className="p-3 md:p-5 relative">
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
            headerToolbar={false}
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
            selectAllow={(selectInfo) => {
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              const start = new Date(selectInfo.start);
              start.setHours(0, 0, 0, 0);
              return start >= today;
            }}
            dateClick={handleDateClick}
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
          {/* Legend */}
          <div className="flex flex-wrap items-center gap-5 mt-4 pt-4 border-t">
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
        </CardContent>
      </Card>

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
            <div className="space-y-5">
              {/* Status banner */}
              <div
                className="rounded-lg px-4 py-2.5 flex items-center justify-between"
                style={{
                  backgroundColor:
                    selectedEvent.extendedProps.status === "confirmed"
                      ? "rgb(16 185 129 / 0.1)"
                      : selectedEvent.extendedProps.status === "cancelled"
                      ? "rgb(239 68 68 / 0.1)"
                      : "rgb(245 158 11 / 0.1)",
                }}
              >
                <Badge
                  variant={
                    selectedEvent.extendedProps.status === "confirmed"
                      ? "default"
                      : selectedEvent.extendedProps.status === "cancelled"
                      ? "destructive"
                      : "secondary"
                  }
                  className="text-xs"
                >
                  {selectedEvent.extendedProps.status}
                </Badge>
                <span className="text-xs text-muted-foreground font-mono">{selectedEvent.id}</span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {selectedEvent.extendedProps.propertyName && (
                  <div className="col-span-2">
                    <p className="text-xs text-muted-foreground mb-1">Property</p>
                    <p className="font-medium flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                      {selectedEvent.extendedProps.propertyName}
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Pet</p>
                  <p className="font-medium">{selectedEvent.extendedProps.pet ?? "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Owner</p>
                  <p className="font-medium">{selectedEvent.extendedProps.owner ?? "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Service</p>
                  <div className="flex items-center gap-2">
                    <span
                      className="inline-block w-2.5 h-2.5 rounded-full"
                      style={{
                        backgroundColor:
                          SERVICE_COLORS[(selectedEvent.extendedProps.service ?? "").toLowerCase()] ??
                          SERVICE_COLORS.other,
                      }}
                    />
                    <p className="font-medium">{selectedEvent.extendedProps.service}</p>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Start</p>
                  <p className="font-medium text-sm">
                    {new Date(selectedEvent.start).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">End</p>
                  <p className="font-medium text-sm">
                    {selectedEvent.end
                      ? new Date(selectedEvent.end).toLocaleString()
                      : "—"}
                  </p>
                </div>
                {selectedEvent.extendedProps.totalPrice != null && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Total Price</p>
                    <p className="font-semibold text-lg">₱{Number(selectedEvent.extendedProps.totalPrice).toLocaleString()}</p>
                  </div>
                )}
                {selectedEvent.extendedProps.paymentStatus && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Payment</p>
                    <Badge variant={selectedEvent.extendedProps.paymentStatus === "paid" ? "default" : "secondary"}>
                      {selectedEvent.extendedProps.paymentStatus}
                    </Badge>
                  </div>
                )}
                {selectedEvent.extendedProps.room && (
                  <div className="col-span-2">
                    <p className="text-xs text-muted-foreground mb-1">Room</p>
                    <p className="font-medium">{selectedEvent.extendedProps.room}</p>
                  </div>
                )}
                {selectedEvent.extendedProps.notes && (
                  <div className="col-span-2">
                    <p className="text-xs text-muted-foreground mb-1">Notes</p>
                    <p className="text-sm bg-muted/50 rounded-md p-2.5">{selectedEvent.extendedProps.notes}</p>
                  </div>
                )}
              </div>

              <DialogFooter className="flex flex-wrap gap-2 sm:gap-2 pt-2 border-t">
                {selectedEvent.extendedProps.status === "pending" && (
                  <Button size="sm" onClick={() => handleConfirmEvent(selectedEvent.id)}>
                    <CheckCircle2 className="h-4 w-4 mr-1" />
                    Confirm
                  </Button>
                )}

                <div className="flex-1" />
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
                    {availableServices.map((s) => (
                      <SelectItem key={s} value={s} textValue={s.charAt(0).toUpperCase() + s.slice(1)}>
                        <span className="flex items-center gap-2">
                          <span
                            className="inline-block w-2.5 h-2.5 rounded-full"
                            style={{ backgroundColor: SERVICE_COLORS[s] }}
                          />
                          {s.charAt(0).toUpperCase() + s.slice(1)}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="room">Room / Service</Label>
                {filteredPropertyServices.length > 0 ? (
                  <Select
                    value={newEvent.room}
                    onValueChange={(v) => setNewEvent({ ...newEvent, room: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a room or service" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">— None —</SelectItem>
                      {filteredPropertyServices.map((ps) => (
                        <SelectItem key={ps.id} value={ps.id}>
                          {ps.name}{ps.price ? ` — ₱${Number(ps.price).toLocaleString()}` : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    id="room"
                    placeholder="e.g. Suite A"
                    value={newEvent.room}
                    onChange={(e) => setNewEvent({ ...newEvent, room: e.target.value })}
                  />
                )}
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

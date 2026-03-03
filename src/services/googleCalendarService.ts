/**
 * Google Calendar API integration service for PawStay Admin Calendar.
 *
 * Setup instructions:
 * 1. Go to https://console.cloud.google.com/
 * 2. Create a project (or select an existing one).
 * 3. Enable the "Google Calendar API".
 * 4. Create an API key (APIs & Services → Credentials → Create Credentials → API Key).
 * 5. Optionally restrict the API key to the Google Calendar API and your domain.
 * 6. Set the environment variable VITE_GOOGLE_CALENDAR_API_KEY in your .env file.
 * 7. Add the Google Calendar ID(s) you want to display.
 *
 * The FullCalendar Google Calendar plugin uses the *public* API key approach,
 * which works for **public** Google Calendars. For private calendars you would
 * need OAuth 2.0 – that flow is outlined but not fully implemented here.
 */

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

/** Google Calendar API key loaded from environment */
export const GOOGLE_CALENDAR_API_KEY =
  import.meta.env.VITE_GOOGLE_CALENDAR_API_KEY as string | undefined;

/** Default public Google Calendar IDs to show */
export const DEFAULT_GOOGLE_CALENDAR_IDS: string[] = [
  // US holidays as an example – replace / add your own calendar IDs
  "en.usa#holiday@group.v.calendar.google.com",
];

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface GoogleCalendarEvent {
  id: string;
  summary: string;
  description?: string;
  location?: string;
  start: { dateTime?: string; date?: string };
  end: { dateTime?: string; date?: string };
  htmlLink: string;
}

export interface GoogleCalendarListResponse {
  items: GoogleCalendarEvent[];
  nextPageToken?: string;
}

// ---------------------------------------------------------------------------
// REST helpers (for use outside FullCalendar's built-in plugin, e.g. syncing)
// ---------------------------------------------------------------------------

const BASE_URL = "https://www.googleapis.com/calendar/v3";

/**
 * Fetch events from a public Google Calendar via the REST API.
 * Useful for custom syncing or displays outside FullCalendar.
 */
export async function fetchGoogleCalendarEvents(
  calendarId: string,
  timeMin?: string,
  timeMax?: string
): Promise<GoogleCalendarEvent[]> {
  if (!GOOGLE_CALENDAR_API_KEY) {
    console.warn(
      "[GoogleCalendar] No API key configured. Set VITE_GOOGLE_CALENDAR_API_KEY in .env"
    );
    return [];
  }

  const params = new URLSearchParams({
    key: GOOGLE_CALENDAR_API_KEY,
    singleEvents: "true",
    orderBy: "startTime",
  });

  if (timeMin) params.set("timeMin", timeMin);
  if (timeMax) params.set("timeMax", timeMax);

  const url = `${BASE_URL}/calendars/${encodeURIComponent(calendarId)}/events?${params}`;

  try {
    const res = await fetch(url);
    if (!res.ok) {
      const errorBody = await res.text();
      console.error("[GoogleCalendar] API error:", res.status, errorBody);
      return [];
    }
    const data: GoogleCalendarListResponse = await res.json();
    return data.items ?? [];
  } catch (err) {
    console.error("[GoogleCalendar] Fetch error:", err);
    return [];
  }
}

/**
 * Returns the FullCalendar `googleCalendarApiKey` plugin option only when
 * a key is actually configured – otherwise returns undefined so the
 * plugin is silently skipped.
 */
export function getFullCalendarGoogleConfig() {
  if (!GOOGLE_CALENDAR_API_KEY) return null;

  return {
    googleCalendarApiKey: GOOGLE_CALENDAR_API_KEY,
    eventSources: DEFAULT_GOOGLE_CALENDAR_IDS.map((id) => ({
      googleCalendarId: id,
      className: "gcal-event",
      color: "#4285F4",
    })),
  };
}

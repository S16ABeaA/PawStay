import { type ReactNode } from "react";

type BookingIdTextProps = {
  text: string;
  className?: string;
};

const BOOKING_ID_REGEX = /(Booking\s*ID[:\s]*)([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/gi;

const renderWithBookingLinks = (value: string): ReactNode[] => {
  const input = String(value || "");
  const nodes: ReactNode[] = [];
  let last = 0;
  let idx = 0;
  let match: RegExpExecArray | null;

  const regex = new RegExp(BOOKING_ID_REGEX.source, "gi");
  while ((match = regex.exec(input)) !== null) {
    if (match.index > last) {
      nodes.push(input.slice(last, match.index));
    }

    const prefix = String(match[1] || "Booking ID: ");
    const bookingId = String(match[2] || "").trim();

    nodes.push(
      <span key={`booking-text-${bookingId}-${idx}`}>
        {prefix}
        <a
          href={`/my-bookings?bookingId=${encodeURIComponent(bookingId)}`}
          className="text-primary underline"
        >
          {bookingId}
        </a>
      </span>,
    );

    idx += 1;
    last = match.index + match[0].length;
  }

  if (last < input.length) {
    nodes.push(input.slice(last));
  }

  return nodes.length ? nodes : [input];
};

export default function BookingIdText({ text, className }: BookingIdTextProps) {
  return <span className={className}>{renderWithBookingLinks(text)}</span>;
}

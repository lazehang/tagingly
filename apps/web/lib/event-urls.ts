/** Public attendee landing + registration path (shareable, no event ID typing). */
export function eventLandingPath(eventId: string): string {
  return `/e/${eventId}`;
}

/** @deprecated Prefer eventLandingPath — kept for old bookmarks. */
export function eventRegisterQueryPath(eventId: string): string {
  return `/register?eventId=${encodeURIComponent(eventId)}`;
}

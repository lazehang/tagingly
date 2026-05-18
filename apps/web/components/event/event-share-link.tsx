"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@repo/ui/button";
import { Input } from "@repo/ui/input";
import { eventLandingPath } from "@/lib/event-urls";

type EventShareLinkProps = {
  eventId: string;
  className?: string;
};

export function EventShareLink({ eventId, className }: EventShareLinkProps) {
  const path = eventLandingPath(eventId);
  const [url, setUrl] = useState(path);
  const [copied, setCopied] = useState(false);

  const syncUrl = useCallback(() => {
    if (typeof window !== "undefined") {
      setUrl(`${window.location.origin}${path}`);
    }
  }, [path]);

  useEffect(() => {
    syncUrl();
  }, [syncUrl]);

  async function copyLink() {
    syncUrl();
    const full = typeof window !== "undefined" ? `${window.location.origin}${path}` : path;
    try {
      await navigator.clipboard.writeText(full);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className={className}>
      <p className="text-sm font-medium">Share registration page</p>
      <p className="text-xs text-muted-foreground">
        Send this link to attendees — they register without entering an event ID.
      </p>
      <div className="mt-2 flex flex-col gap-2 sm:flex-row">
        <Input
          readOnly
          value={url}
          className="font-mono text-xs"
          onFocus={(e) => e.target.select()}
        />
        <Button type="button" variant="secondary" size="sm" onClick={copyLink}>
          {copied ? "Copied" : "Copy link"}
        </Button>
      </div>
    </div>
  );
}

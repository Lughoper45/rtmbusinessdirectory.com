import { useState, useEffect, useCallback } from "react";
import { Building2, CheckCircle2, DollarSign, X } from "lucide-react";

type ActivityType = "registration" | "grant" | "launch";

interface Activity {
  id: number;
  type: ActivityType;
  name: string;
  location: string;
}

const STORAGE_KEY = "rtm-live-activity";
const DISMISS_KEY = "rtm-live-activity-dismissed";
const MAX_AGE_MS = 4 * 60 * 60 * 1000;

function formatRelativeTime(shownAt: number): string {
  const seconds = Math.floor((Date.now() - shownAt) / 1000);
  if (seconds < 45) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

function readStoredActivity(): { activity: Activity; shownAt: number } | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { activity: Activity; shownAt: number };
    if (!parsed.activity || typeof parsed.shownAt !== "number") return null;
    if (Date.now() - parsed.shownAt > MAX_AGE_MS) {
      sessionStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function persistActivity(activity: Activity, shownAt: number) {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ activity, shownAt }));
}

const LiveActivityFeed = () => {
  const [currentActivity, setCurrentActivity] = useState<Activity | null>(null);
  const [shownAt, setShownAt] = useState<number | null>(null);
  const [timeLabel, setTimeLabel] = useState("");
  const [isVisible, setIsVisible] = useState(true);
  const [isDismissed, setIsDismissed] = useState(
    () => sessionStorage.getItem(DISMISS_KEY) === "1",
  );

  const activityTemplates = [
    {
      type: "registration" as const,
      names: ["Sarah", "Mike", "Emma", "James", "Priya", "Chen", "Ahmed", "Sofia"],
      locations: ["Toronto", "Vancouver", "Calgary", "Montreal", "Ottawa", "Edmonton", "Winnipeg", "Halifax"],
    },
    {
      type: "grant" as const,
      names: ["Johnson Consulting", "Maple Leaf Bakery", "TechStart Inc", "Green Gardens", "Urban Eats", "Nordic Design", "Pacific Trades"],
      amounts: ["$15,000", "$25,000", "$45,000", "$32,000", "$18,500"],
    },
    {
      type: "launch" as const,
      names: ["Fresh Kitchen", "Code Studio", "Bloom Florist", "Peak Fitness", "Artisan Coffee", "Swift Delivery", "Bright Ideas"],
      locations: ["Toronto", "Vancouver", "Calgary", "Montreal"],
    },
  ];

  const generateActivity = useCallback((): Activity => {
    const types: ActivityType[] = ["registration", "grant", "launch"];
    const type = types[Math.floor(Math.random() * types.length)];
    const template = activityTemplates.find((t) => t.type === type)!;

    let name = "";
    let location = "";

    if (type === "registration") {
      name = template.names[Math.floor(Math.random() * template.names.length)];
      location = template.locations![Math.floor(Math.random() * template.locations!.length)];
    } else if (type === "grant") {
      name = template.names[Math.floor(Math.random() * template.names.length)];
      location = template.amounts![Math.floor(Math.random() * template.amounts!.length)];
    } else {
      name = template.names[Math.floor(Math.random() * template.names.length)];
      location = template.locations![Math.floor(Math.random() * template.locations!.length)];
    }

    return { id: Date.now(), type, name, location };
  }, []);

  const showActivity = useCallback(
    (activity: Activity) => {
      const at = Date.now();
      setCurrentActivity(activity);
      setShownAt(at);
      setTimeLabel(formatRelativeTime(at));
      setIsVisible(true);
      persistActivity(activity, at);
    },
    [],
  );

  const dismiss = () => {
    setIsDismissed(true);
    sessionStorage.setItem(DISMISS_KEY, "1");
    sessionStorage.removeItem(STORAGE_KEY);
  };

  useEffect(() => {
    if (isDismissed) return;

    const stored = readStoredActivity();
    if (stored) {
      setCurrentActivity(stored.activity);
      setShownAt(stored.shownAt);
      setTimeLabel(formatRelativeTime(stored.shownAt));
      return;
    }

    const initialTimeout = window.setTimeout(() => {
      showActivity(generateActivity());
    }, 3000);

    return () => clearTimeout(initialTimeout);
  }, [isDismissed, generateActivity, showActivity]);

  useEffect(() => {
    if (isDismissed || !currentActivity || shownAt === null) return;

    const tick = () => setTimeLabel(formatRelativeTime(shownAt));
    tick();
    const interval = window.setInterval(tick, 30_000);
    return () => clearInterval(interval);
  }, [isDismissed, currentActivity, shownAt]);

  useEffect(() => {
    if (isDismissed || !currentActivity) return;

    const rotate = () => {
      setIsVisible(false);
      window.setTimeout(() => {
        showActivity(generateActivity());
      }, 500);
    };

    const interval = window.setInterval(rotate, Math.random() * 7000 + 8000);
    return () => clearInterval(interval);
  }, [isDismissed, currentActivity, generateActivity, showActivity]);

  if (isDismissed || !currentActivity || shownAt === null) return null;

  const getIcon = (type: ActivityType) => {
    switch (type) {
      case "registration":
        return <Building2 className="h-4 w-4 text-primary" />;
      case "grant":
        return <DollarSign className="h-4 w-4 text-green-600" />;
      case "launch":
        return <CheckCircle2 className="h-4 w-4 text-accent" />;
    }
  };

  const getMessage = (activity: Activity) => {
    switch (activity.type) {
      case "registration":
        return (
          <>
            <span className="font-semibold text-foreground">{activity.name}</span>
            <span className="text-muted-foreground"> from </span>
            <span className="font-medium text-foreground">{activity.location}</span>
            <span className="text-muted-foreground"> just registered</span>
          </>
        );
      case "grant":
        return (
          <>
            <span className="font-semibold text-foreground">{activity.name}</span>
            <span className="text-muted-foreground"> received </span>
            <span className="font-semibold text-green-600">{activity.location}</span>
            <span className="text-muted-foreground"> in grants</span>
          </>
        );
      case "launch":
        return (
          <>
            <span className="font-semibold text-foreground">{activity.name}</span>
            <span className="text-muted-foreground"> launched in </span>
            <span className="font-medium text-foreground">{activity.location}</span>
          </>
        );
    }
  };

  return (
    <div
      className={`fixed bottom-6 left-4 z-40 max-w-[calc(100vw-2rem)] transition-all duration-500 sm:left-6 ${
        isVisible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
      }`}
      role="status"
      aria-live="polite"
    >
      <div className="relative max-w-xs rounded-xl border border-border bg-background p-4 pr-10 shadow-lg">
        <button
          type="button"
          onClick={dismiss}
          className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full border border-border bg-background shadow-md transition-colors hover:bg-muted"
          aria-label="Dismiss notification"
        >
          <X className="h-3.5 w-3.5 text-muted-foreground" />
        </button>

        <div className="flex items-start gap-3">
          <div className="shrink-0 rounded-lg bg-muted p-2">{getIcon(currentActivity.type)}</div>
          <div className="min-w-0 flex-1">
            <p className="text-sm leading-snug">{getMessage(currentActivity)}</p>
            <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
              </span>
              {timeLabel}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveActivityFeed;

import { useState, useEffect } from "react";
import { Building2, CheckCircle2, DollarSign, MapPin, X } from "lucide-react";

interface Activity {
  id: number;
  type: "registration" | "grant" | "launch";
  name: string;
  location: string;
  time: string;
}

const LiveActivityFeed = () => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [currentActivity, setCurrentActivity] = useState<Activity | null>(null);
  const [isVisible, setIsVisible] = useState(true);
  const [isDismissed, setIsDismissed] = useState(false);

  const activityTemplates = [
    { type: "registration", names: ["Sarah", "Mike", "Emma", "James", "Priya", "Chen", "Ahmed", "Sofia"], locations: ["Toronto", "Vancouver", "Calgary", "Montreal", "Ottawa", "Edmonton", "Winnipeg", "Halifax"] },
    { type: "grant", names: ["Johnson Consulting", "Maple Leaf Bakery", "TechStart Inc", "Green Gardens", "Urban Eats", "Nordic Design", "Pacific Trades"], amounts: ["$15,000", "$25,000", "$45,000", "$32,000", "$18,500"] },
    { type: "launch", names: ["Fresh Kitchen", "Code Studio", "Bloom Florist", "Peak Fitness", "Artisan Coffee", "Swift Delivery", "Bright Ideas"], locations: ["Toronto", "Vancouver", "Calgary", "Montreal"] },
  ];

  const generateActivity = (): Activity => {
    const types = ["registration", "grant", "launch"] as const;
    const type = types[Math.floor(Math.random() * types.length)];
    const template = activityTemplates.find(t => t.type === type)!;
    
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
    
    const times = ["just now", "1 min ago", "2 min ago", "3 min ago"];
    
    return {
      id: Date.now(),
      type,
      name,
      location,
      time: times[Math.floor(Math.random() * times.length)],
    };
  };

  useEffect(() => {
    if (isDismissed) return;

    // Show first activity after 3 seconds
    const initialTimeout = setTimeout(() => {
      const activity = generateActivity();
      setCurrentActivity(activity);
      setActivities(prev => [activity, ...prev].slice(0, 5));
    }, 3000);

    // Then show new activities every 8-15 seconds
    const interval = setInterval(() => {
      setIsVisible(false);
      
      setTimeout(() => {
        const activity = generateActivity();
        setCurrentActivity(activity);
        setActivities(prev => [activity, ...prev].slice(0, 5));
        setIsVisible(true);
      }, 500);
    }, Math.random() * 7000 + 8000);

    return () => {
      clearTimeout(initialTimeout);
      clearInterval(interval);
    };
  }, [isDismissed]);

  if (isDismissed || !currentActivity) return null;

  const getIcon = (type: string) => {
    switch (type) {
      case "registration":
        return <Building2 className="w-4 h-4 text-primary" />;
      case "grant":
        return <DollarSign className="w-4 h-4 text-green-600" />;
      case "launch":
        return <CheckCircle2 className="w-4 h-4 text-accent" />;
      default:
        return null;
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
      className={`fixed bottom-6 left-6 z-40 transition-all duration-500 ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      }`}
    >
      <div className="bg-background border border-border rounded-xl shadow-lg p-4 max-w-xs relative group">
        <button
          onClick={() => setIsDismissed(true)}
          className="absolute -top-2 -right-2 p-1 bg-background border border-border rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-muted"
        >
          <X className="w-3 h-3 text-muted-foreground" />
        </button>
        
        <div className="flex items-start gap-3">
          <div className="p-2 bg-muted rounded-lg shrink-0">
            {getIcon(currentActivity.type)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm leading-snug">
              {getMessage(currentActivity)}
            </p>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              {currentActivity.time}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveActivityFeed;

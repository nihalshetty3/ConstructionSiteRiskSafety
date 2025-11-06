import { Clock } from "lucide-react";

interface Alert {
  id: string;
  title: string;
  description: string;
  severity: "high" | "medium" | "low";
  time: string;
  location: string;
}

const alerts: Alert[] = [
  {
    id: "1",
    title: "Helmet Missing",
    description: "Worker detected without required safety helmet at Zone A",
    severity: "high",
    time: "2 minutes ago",
    location: "Building A - Zone A",
  },
  {
    id: "2",
    title: "Unsafe Zone Entry",
    description: "Unauthorized personnel detected in restricted hazard zone",
    severity: "high",
    time: "15 minutes ago",
    location: "Excavation Site - North",
  },
  {
    id: "3",
    title: "Hazard Detected",
    description: "Elevated noise levels detected exceeding safe limits",
    severity: "medium",
    time: "34 minutes ago",
    location: "Equipment Storage - Bay 3",
  },
  {
    id: "4",
    title: "PPE Compliance",
    description: "Worker safety gear inspection completed - All clear",
    severity: "low",
    time: "1 hour ago",
    location: "Main Gate - Checkpoint",
  },
  {
    id: "5",
    title: "Temperature Alert",
    description: "Heat stress warning issued for outdoor work area",
    severity: "medium",
    time: "2 hours ago",
    location: "Roof Installation - Level 3",
  },
];

function getSeverityBadge(severity: string) {
  const severityMap: Record<string, { emoji: string; bg: string; text: string }> = {
    high: { emoji: "🔴", bg: "bg-red-500/20", text: "text-red-400" },
    medium: { emoji: "🟡", bg: "bg-yellow-500/20", text: "text-yellow-400" },
    low: { emoji: "🟢", bg: "bg-green-500/20", text: "text-green-400" },
  };
  return severityMap[severity];
}

export function AlertFeed() {
  return (
    <div className="glass-card p-6 animate-fade-in" style={{ animationDelay: "200ms" }}>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-2xl font-bold text-white flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-neon-orange animate-pulse"></div>
          Live Alert Feed
        </h3>
        <span className="text-xs text-gray-400 px-3 py-1 rounded-full bg-white/5 border border-white/10">
          Real-time
        </span>
      </div>

      <div className="space-y-3 max-h-96 overflow-y-auto">
        {alerts.map((alert, index) => {
          const severity = getSeverityBadge(alert.severity);
          return (
            <div
              key={alert.id}
              className="group p-4 rounded-lg border border-white/10 hover:border-white/20 bg-white/5 hover:bg-white/10 transition-all duration-300 animate-slide-in"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="flex items-start gap-4">
                {/* Severity Badge */}
                <div
                  className={`text-xl pt-0.5 flex-shrink-0 ${severity.emoji.length > 1 ? "text-2xl" : ""}`}
                >
                  {severity.emoji}
                </div>

                {/* Alert Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h4 className="font-semibold text-white">{alert.title}</h4>
                    <span className={`text-xs font-medium px-2 py-1 rounded whitespace-nowrap flex-shrink-0 ${severity.text}`}>
                      {alert.severity === "high" ? "High" : alert.severity === "medium" ? "Medium" : "Low"}
                    </span>
                  </div>
                  <p className="text-sm text-gray-400 mb-2">{alert.description}</p>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Clock size={14} />
                      {alert.time}
                    </span>
                    <span className="hidden sm:inline">•</span>
                    <span>{alert.location}</span>
                  </div>
                </div>
              </div>

              {/* Hover action */}
              <div className="absolute bottom-0 right-0 w-0 h-0 border-l-[20px] border-t-[20px] border-l-transparent border-t-neon-orange/30 rounded-tl group-hover:border-t-neon-orange/50 transition-colors opacity-0 group-hover:opacity-100"></div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="mt-6 pt-6 border-t border-white/10 text-center">
        <button className="text-neon-cyan hover:text-neon-orange text-sm font-medium transition-colors duration-300">
          View All Alerts →
        </button>
      </div>
    </div>
  );
}

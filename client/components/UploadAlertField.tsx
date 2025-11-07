import { useState, useEffect } from "react";
import { ShieldAlert, Clock, CheckCircle, FileWarning } from "lucide-react";

// --- Interface for the alert data we'll fetch ---
interface UploadAlert {
  id: string;
  title: string;
  description: string;
  severity: "high" | "medium" | "low";
  time: string; // This will be an ISO string from the backend
  location: string;
}

// --- Interface for the API response ---
interface AlertsApiResponse {
  alerts: UploadAlert[];
}

// --- Helper function to get badge styles ---
function getSeverityBadge(severity: "high" | "medium" | "low") {
  const severityMap = {
    high: { bg: "bg-red-500/20", text: "text-red-400" },
    medium: { bg: "bg-yellow-500/20", text: "text-yellow-400" },
    low: { bg: "bg-green-500/20", text: "text-green-400" },
  };
  return severityMap[severity] || severityMap.medium;
}

// --- Helper function to format time ---
function formatTimeAgo(timestamp: string): string {
  const now = new Date();
  const time = new Date(timestamp);
  const diffMs = now.getTime() - time.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? "s" : ""} ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
}


export function UploadAlertFeed() {
  const [alerts, setAlerts] = useState<UploadAlert[]>([]);
  const [loading, setLoading] = useState(true); // Set initial loading to true

  // --- This hook fetches the data from your new backend route ---
  useEffect(() => {
    const fetchUploadAlerts = async () => {
      try {
        setLoading(true);
        // Fetch from the new route you created
        const response = await fetch('/api/uploads/alerts'); 
        const data: AlertsApiResponse = await response.json();
        
        if (data.alerts && Array.isArray(data.alerts)) {
          // Format the timestamps before setting state
          const formattedAlerts = data.alerts.map(alert => ({
            ...alert,
            time: formatTimeAgo(alert.time),
          }));
          setAlerts(formattedAlerts);
        }
      } catch (error) {
        console.error("Failed to fetch upload alerts:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUploadAlerts();
  }, []); // The empty array [] means this runs once when the component mounts

  return (
    <div className="glass-card p-6 animate-fade-in" style={{ animationDelay: "100ms" }}>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-2xl font-bold text-white flex items-center gap-2">
          <ShieldAlert className="w-7 h-7 text-neon-cyan" />
          Upload Safety Alerts
        </h3>
        <span className="text-xs text-gray-400 px-3 py-1 rounded-full bg-white/5 border border-white/10">
          From Images & Videos
        </span>
      </div>

      <div className="space-y-3 max-h-96 overflow-y-auto">
        {loading ? (
          <div className="text-center py-8 text-gray-400">
            <p>Loading alerts...</p>
          </div>
        ) : alerts.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <p>No safety alerts from uploads yet. Upload files to see results.</p>
          </div>
        ) : (
          alerts.map((alert, index) => {
            const severity = getSeverityBadge(alert.severity);
            const Icon = alert.severity === 'high' ? FileWarning : CheckCircle;

            return (
              <div
                key={alert.id}
                className="group relative p-4 rounded-lg border border-white/10 hover:border-white/20 bg-white/5 hover:bg-white/10 transition-all duration-300 animate-slide-in"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex items-start gap-4">
                  {/* Severity Icon */}
                  <div className="pt-1">
                    <Icon 
                      className={`w-5 h-5 ${alert.severity === 'high' ? 'text-red-400' : 'text-green-400'}`} 
                    />
                  </div>

                  {/* Alert Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h4 className="font-semibold text-white">{alert.title}</h4>
                      <span className={`text-xs font-medium px-2 py-1 rounded whitespace-nowmrap ${severity.text}`}>
                        {alert.severity === 'high' ? 'Violation' : 'All Clear'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-400 mb-2">{alert.description}</p>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-x-3 gap-y-1 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Clock size={14} />
                        {alert.time}
                      </span>
                      <span className="hidden sm:inline">•</span>
                      <span>{alert.location}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer */}
      <div className="mt-6 pt-6 border-t border-white/10 text-center">
        <button className="text-neon-cyan hover:text-neon-orange text-sm font-medium transition-colors duration-300">
          View All Upload Reports →
        </button>
      </div>
    </div>
  );
}
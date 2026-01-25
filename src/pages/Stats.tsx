import React, { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "react-toastify";
import {
  TrendingUp,
  Users,
  Coins,
  Zap,
  Lock,
  Unlock,
  Calendar,
} from "lucide-react";
import Chart from "react-apexcharts";
import type { ApexOptions } from "apexcharts";

interface Profile {
  id: string;
  name: string | null;
  credits: number;
  subscribed: boolean;
  registered: boolean;
}

interface EventAttendance {
  user_id: string;
  name: string | null;
  event_count: number;
}

interface SubscriptionData {
  subscribed: number;
  free: number;
}

const Stats: React.FC = () => {
  const { isAdmin } = useAuth();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [eventAttendance, setEventAttendance] = useState<EventAttendance[]>([]);
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionData>({
    subscribed: 0,
    free: 0,
  });
  const [loading, setLoading] = useState(true);
  const [attendancePeriod, setAttendancePeriod] = useState<
    "1m" | "3m" | "1y" | "all"
  >("all");

  useEffect(() => {
    if (!isAdmin) {
      toast.error("Admin access required");
      return;
    }
    loadDashboardData();
  }, [isAdmin]);

  const loadDashboardData = async () => {
    try {
      // Load profiles
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("id, name, credits, subscribed, registered");

      if (profileError) throw profileError;

      const typedProfiles = (profileData || []) as Profile[];
      setProfiles(typedProfiles);

      // Calculate subscription data
      const subscribed = typedProfiles.filter((p) => p.subscribed).length;
      const free = typedProfiles.length - subscribed;
      setSubscriptionData({ subscribed, free });

      // Load event attendance data with event dates
      const { data: attendanceData, error: attendanceError } = await supabase
        .from("event_attendees")
        .select(
          "user_id, events(title, event_date), profiles!event_attendees_user_id_fkey(name)",
        )
        .order("user_id");

      if (attendanceError) throw attendanceError;

      // Store raw attendance data for filtering
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).__rawAttendanceData = attendanceData;
    } catch (error) {
      console.error("Error loading dashboard data:", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  // Filter attendance data based on selected period
  const filteredEventAttendance = useMemo(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const attendanceData = (window as any).__rawAttendanceData || [];
    const now = new Date();
    const cutoffDate = new Date();

    // Calculate cutoff date based on period
    if (attendancePeriod === "1m") {
      cutoffDate.setMonth(cutoffDate.getMonth() - 1);
    } else if (attendancePeriod === "3m") {
      cutoffDate.setMonth(cutoffDate.getMonth() - 3);
    } else if (attendancePeriod === "1y") {
      cutoffDate.setFullYear(cutoffDate.getFullYear() - 1);
    }
    // "all" means no cutoff

    // Group by user and count events within the period
    const attendanceMap = new Map<
      string,
      { name: string | null; count: number }
    >();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (attendanceData || []).forEach((item: any) => {
      const eventDate = item.events?.event_date
        ? new Date(item.events.event_date)
        : null;

      // Filter by date if not "all time"
      if (attendancePeriod !== "all" && eventDate && eventDate < cutoffDate) {
        return;
      }

      if (!attendanceMap.has(item.user_id)) {
        attendanceMap.set(item.user_id, {
          name: item.profiles?.name || "Unknown",
          count: 0,
        });
      }
      const current = attendanceMap.get(item.user_id)!;
      current.count += 1;
    });

    return Array.from(attendanceMap.entries())
      .map(([user_id, data]) => ({
        user_id,
        name: data.name,
        event_count: data.count,
      }))
      .sort((a, b) => b.event_count - a.event_count)
      .slice(0, 10);
  }, [attendancePeriod]);

  // Calculate stats
  const topCoinsLeaderboard = useMemo(() => {
    return [...profiles]
      .filter((p) => p.credits > 0)
      .sort((a, b) => b.credits - a.credits)
      .slice(0, 10);
  }, [profiles]);

  const subscribedUsers = useMemo(() => {
    return profiles.filter((p) => p.subscribed).length;
  }, [profiles]);

  const registeredUsers = useMemo(() => {
    return profiles.filter((p) => p.registered).length;
  }, [profiles]);

  const totalCoins = useMemo(() => {
    return profiles.reduce((sum, p) => sum + p.credits, 0);
  }, [profiles]);

  // Chart data
  const subscriptionChartOptions: ApexOptions = {
    chart: { type: "donut" },
    labels: ["Subbed", "Not subbed"],
    colors: ["#10b981", "#ef4444"],
    plotOptions: {
      pie: {
        donut: {
          size: "65%",
          labels: {
            show: true,
            name: { fontSize: "12px", color: "#666" },
            value: { fontSize: "14px", fontWeight: 600, color: "#000" },
          },
        },
      },
    },
    dataLabels: {
      enabled: true,
      formatter: (val: number) => `${val.toFixed(0)}%`,
    },
    stroke: { colors: ["#ffffff"] },
  };

  const subscriptionChartSeries = [
    subscriptionData.subscribed,
    subscriptionData.free,
  ];

  const coinsDistributionOptions: ApexOptions = {
    chart: { type: "bar" },
    colors: ["#10b981"],
    dataLabels: { enabled: false },
    xaxis: {
      categories: topCoinsLeaderboard
        .map((p) => p.name || "Unknown")
        .slice(0, 10),
      labels: { style: { colors: "#666", fontSize: "11px" } },
    },
    yaxis: { labels: { style: { colors: "#666" } } },
    grid: { borderColor: "#e5e7eb" },
    tooltip: { theme: "light" },
  };

  const coinsDistributionSeries = [
    {
      name: "Coins",
      data: topCoinsLeaderboard.map((p) => p.credits),
    },
  ];

  const attendanceColors = [
    "#3b82f6",
    "#8b5cf6",
    "#ec4899",
    "#f59e0b",
    "#10b981",
    "#06b6d4",
    "#ef4444",
    "#f97316",
    "#6366f1",
    "#14b8a6",
  ];

  const attendanceChartOptions: ApexOptions = {
    chart: { type: "bar" },
    colors: attendanceColors,
    dataLabels: { enabled: false },
    xaxis: {
      categories: filteredEventAttendance.map((e) => e.name || "Unknown"),
      labels: { style: { colors: "#666", fontSize: "11px" } },
    },
    yaxis: { labels: { style: { colors: "#666" } } },
    grid: { borderColor: "#e5e7eb" },
    tooltip: { theme: "light" },
  };

  const attendanceChartSeries = [
    {
      name: "Events Attended",
      data: filteredEventAttendance.map((e) => e.event_count),
    },
  ];

  if (loading) {
    return (
      <main className="flex-1 bg-white overflow-auto sm:ml-[96px]">
        <section className="container mx-auto px-6 pt-12">
          <p className="text-center text-gray-500">Loading dashboard...</p>
        </section>
      </main>
    );
  }

  return (
    <main className="flex-1 bg-white overflow-auto sm:ml-[96px] text-gray-900">
      <section className="container mx-auto px-6 pt-12 pb-12">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-5xl font-black mb-3 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
            Admin Dashboard
          </h1>
          <p className="text-gray-600 text-lg">System overview & analytics</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* Total Users */}
          <div className="bg-gradient-to-br from-cyan-50 to-blue-50 border border-cyan-200 rounded-xl p-6 hover:border-cyan-400 transition-all">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-700 text-sm font-semibold uppercase tracking-wide">
                Total Users
              </h3>
              <Users className="w-5 h-5 text-cyan-600" />
            </div>
            <p className="text-4xl font-black text-cyan-600">
              {profiles.length}
            </p>
            <p className="text-xs text-gray-500 mt-2">Active accounts</p>
          </div>

          {/* Subscribed */}
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6 hover:border-green-400 transition-all">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-700 text-sm font-semibold uppercase tracking-wide">
                Subscribed
              </h3>
              <Unlock className="w-5 h-5 text-green-600" />
            </div>
            <p className="text-4xl font-black text-green-600">
              {subscribedUsers}
            </p>
            <p className="text-xs text-gray-500 mt-2">
              {((subscribedUsers / profiles.length) * 100).toFixed(1)}% of users
            </p>
          </div>

          {/* Registered */}
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200 rounded-xl p-6 hover:border-purple-400 transition-all">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-700 text-sm font-semibold uppercase tracking-wide">
                Registered
              </h3>
              <Calendar className="w-5 h-5 text-purple-600" />
            </div>
            <p className="text-4xl font-black text-purple-600">
              {registeredUsers}
            </p>
            <p className="text-xs text-gray-500 mt-2">Users</p>
          </div>

          {/* Total Coins */}
          <div className="bg-gradient-to-br from-yellow-50 to-orange-50 border border-yellow-200 rounded-xl p-6 hover:border-yellow-400 transition-all">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-700 text-sm font-semibold uppercase tracking-wide">
                Total Coins
              </h3>
              <Coins className="w-5 h-5 text-yellow-600" />
            </div>
            <p className="text-4xl font-black text-yellow-600">{totalCoins}</p>
            <p className="text-xs text-gray-500 mt-2">In circulation</p>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Subscription Status */}
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 rounded-xl p-6">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-gray-900">
              <Zap className="w-5 h-5 text-green-600" />
              Subscription Status
            </h2>
            <div className="flex justify-center">
              <Chart
                options={subscriptionChartOptions}
                series={subscriptionChartSeries}
                type="donut"
                width={320}
              />
            </div>
          </div>

          {/* Top Coins Distribution */}
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 rounded-xl p-6">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-gray-900">
              <TrendingUp className="w-5 h-5 text-yellow-600" />
              Top Coin Holders
            </h2>
            <Chart
              options={coinsDistributionOptions}
              series={coinsDistributionSeries}
              type="bar"
              height={350}
            />
          </div>
        </div>

        {/* Event Attendance Chart */}
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 rounded-xl p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold flex items-center gap-2 text-gray-900">
              <Calendar className="w-5 h-5 text-cyan-600" />
              Most Active Attendees
            </h2>
            <div className="flex gap-2">
              {[
                { label: "Last Month", value: "1m" },
                { label: "Last 3 Months", value: "3m" },
                { label: "Last Year", value: "1y" },
                { label: "All Time", value: "all" },
              ].map((period) => (
                <button
                  key={period.value}
                  onClick={() =>
                    setAttendancePeriod(
                      period.value as "1m" | "3m" | "1y" | "all",
                    )
                  }
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    attendancePeriod === period.value
                      ? "bg-cyan-600 text-white shadow-md"
                      : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  {period.label}
                </button>
              ))}
            </div>
          </div>
          <Chart
            options={attendanceChartOptions}
            series={attendanceChartSeries}
            type="bar"
            height={400}
          />
        </div>

        {/* Leaderboards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Top Coins */}
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 rounded-xl p-6">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-gray-900">
              <Coins className="w-5 h-5 text-yellow-600" />
              Top Coin Holders
            </h3>
            <div className="space-y-3">
              {topCoinsLeaderboard.map((user, idx) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-white hover:bg-gray-50 transition-colors border border-gray-200"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-r from-yellow-400 to-orange-400 flex items-center justify-center text-xs font-bold text-white">
                      {idx + 1}
                    </div>
                    <span className="text-sm truncate text-gray-900">
                      {user.name || "Anonymous"}
                    </span>
                  </div>
                  <span className="text-yellow-600 font-bold text-sm">
                    {user.credits}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Top Event Attendees */}
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 rounded-xl p-6">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-gray-900">
              <Calendar className="w-5 h-5 text-cyan-600" />
              Top Attendees
            </h3>
            <div className="space-y-3">
              {filteredEventAttendance.slice(0, 10).map((user, idx) => (
                <div
                  key={user.user_id}
                  className="flex items-center justify-between p-3 rounded-lg bg-white hover:bg-gray-50 transition-colors border border-gray-200"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-r from-cyan-400 to-blue-400 flex items-center justify-center text-xs font-bold text-white">
                      {idx + 1}
                    </div>
                    <span className="text-sm truncate text-gray-900">
                      {user.name || "Anonymous"}
                    </span>
                  </div>
                  <span className="text-cyan-600 font-bold text-sm">
                    {user.event_count}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Subscription Status List */}
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 rounded-xl p-6">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-gray-900">
              <Unlock className="w-5 h-5 text-green-600" />
              Subscriber Status
            </h3>
            <div className="space-y-3">
              {profiles
                .filter((p) => p.subscribed)
                .slice(0, 10)
                .map((user, idx) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-green-50 hover:bg-green-100 transition-colors border border-green-200"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-r from-green-400 to-emerald-400 flex items-center justify-center text-xs font-bold text-white">
                        ✓
                      </div>
                      <span className="text-sm truncate text-gray-900">
                        {user.name || "Anonymous"}
                      </span>
                    </div>
                    <span className="text-green-600 font-bold text-xs">
                      Active
                    </span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
};

export default Stats;

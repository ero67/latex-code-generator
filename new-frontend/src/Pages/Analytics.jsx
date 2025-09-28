import React, { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

// TODO implement events for my app specificaly
const BASE_URL =
  "http://localhost:9000/api/websites/873bc035-44f6-4b18-bf4f-afb4526d170b";
const LOGIN_API = "http://localhost:9000/api/auth/login";

function Analytics() {
  const [token, setToken] = useState("");
  const [activeUsers, setActiveUsers] = useState(null);
  const [pageviews, setPageviews] = useState(null);
  const [events, setEvents] = useState([]);
  const [metrics, setMetrics] = useState({});
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        // Authenticate
        const loginRes = await fetch(LOGIN_API, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username: "admin", password: "umami" }),
        });
        if (!loginRes.ok) throw new Error("Login failed");
        const loginData = await loginRes.json();
        const bearer = loginData.token;

        setToken(bearer);

        // Time parameters
        const now = Date.now();
        const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
        const unit = "day";
        const timezone = "UTC";

        const headers = { Authorization: `Bearer ${bearer}` };

        // Active Users (no params needed)
        const activeRes = await fetch(`${BASE_URL}/active`, { headers });
        const activeData = await activeRes.json();
        setActiveUsers(activeData?.visitors);

        // Pageviews
        const pvRes = await fetch(
          `${BASE_URL}/pageviews?startAt=${sevenDaysAgo}&endAt=${now}&unit=${unit}&timezone=${timezone}`,
          { headers }
        );
        const pvData = await pvRes.json();
        setPageviews(pvData);

        // Events
        const eventsRes = await fetch(
          `${BASE_URL}/events?startAt=${sevenDaysAgo}&endAt=${now}&unit=${unit}&timezone=${timezone}`,
          { headers }
        );
        const eventsData = await eventsRes.json();
        setEvents(eventsData?.events || []);

        // Metrics (example: browser, os, device, country, referrer)
        const metricTypes = ["browser", "os", "device", "country", "referrer"];
        const metricsObj = {};
        for (const type of metricTypes) {
          const metricsRes = await fetch(
            `${BASE_URL}/metrics?type=${type}&startAt=${sevenDaysAgo}&endAt=${now}&unit=${unit}&timezone=${timezone}`,
            { headers }
          );
          const metricsData = await metricsRes.json();
          metricsObj[type] = metricsData[type] || metricsData;
        }
        setMetrics(metricsObj);

        // Stats
        const statsRes = await fetch(
          `${BASE_URL}/stats?startAt=${sevenDaysAgo}&endAt=${now}&unit=${unit}&timezone=${timezone}`,
          { headers }
        );
        const statsData = await statsRes.json();
        setStats(statsData);

        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    }

    fetchAnalytics();
  }, []);

  // Prepare chart data
  const pageviewChartData = pageviews
    ? {
        labels: pageviews.pageviews.map((pv) => pv.x),
        datasets: [
          {
            label: "Pageviews",
            data: pageviews.pageviews.map((pv) => pv.y),
            backgroundColor: "rgba(59,130,246,0.5)",
          },
        ],
      }
    : null;

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Analytics Dashboard</h1>
      {loading && <p>Loading...</p>}
      {error && <p className="text-red-500">{error}</p>}

      {!loading && !error && (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white shadow rounded p-4">
              <div className="text-gray-500">Active Users</div>
              <div className="text-2xl font-bold">{activeUsers ?? "N/A"}</div>
            </div>
            <div className="bg-white shadow rounded p-4">
              <div className="text-gray-500">Pageviews</div>
              <div className="text-2xl font-bold">
                {stats?.pageviews?.value ?? "N/A"}
              </div>
            </div>
            <div className="bg-white shadow rounded p-4">
              <div className="text-gray-500">Visitors</div>
              <div className="text-2xl font-bold">
                {stats?.visitors?.value ?? "N/A"}
              </div>
            </div>
            <div className="bg-white shadow rounded p-4">
              <div className="text-gray-500">Bounces</div>
              <div className="text-2xl font-bold">
                {stats?.bounces?.value ?? "N/A"}
              </div>
            </div>
          </div>

          {pageviews && (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={pageviews.pageviews}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="x" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="y" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          )}

          {/* Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            {Object.entries(metrics).map(([type, arr]) => (
              <div key={type} className="bg-white shadow rounded p-4">
                <h2 className="text-lg font-semibold capitalize mb-2">
                  {type}
                </h2>
                {arr && arr.length > 0 ? (
                  <ul>
                    {arr.map((item, idx) => (
                      <li key={idx}>
                        {item.x ?? "Unknown"}:{" "}
                        <span className="font-semibold">{item.y}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p>No data</p>
                )}
              </div>
            ))}
          </div>

          {/* Events */}
          <div className="bg-white shadow rounded p-4 mb-8">
            <h2 className="text-lg font-semibold mb-2">Events</h2>
            <ul>
              {events.length === 0 && <li>No events</li>}
              {events.map((event, idx) => (
                <li key={idx}>
                  {event.name}: {event.count}
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </div>
  );
}

export default Analytics;

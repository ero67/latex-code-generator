import React, { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

// Get Umami URL from environment variable, fallback to localhost for development
const UMAMI_URL = import.meta.env.VITE_UMAMI_URL || "http://localhost:9000";
const WEBSITE_ID = import.meta.env.VITE_UMAMI_WEBSITE_ID || "90ad17e2-7260-4032-88cb-5a7a0d055389";
const BASE_URL = `${UMAMI_URL}/api/websites/${WEBSITE_ID}`;
const LOGIN_API = `${UMAMI_URL}/api/auth/login`;

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

function Analytics() {
  const [token, setToken] = useState("");
  const [activeUsers, setActiveUsers] = useState(null);
  const [pageviews, setPageviews] = useState(null);
  const [events, setEvents] = useState([]);
  const [metrics, setMetrics] = useState({});
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [timeRange, setTimeRange] = useState(7); // days
  const [eventDetails, setEventDetails] = useState([]);
  const [pages, setPages] = useState([]);

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        setLoading(true);
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
        const daysAgo = now - timeRange * 24 * 60 * 60 * 1000;
        const unit = timeRange <= 7 ? "day" : timeRange <= 30 ? "day" : "day";
        const timezone = "UTC";

        const headers = { Authorization: `Bearer ${bearer}` };

        // Active Users (no params needed)
        const activeRes = await fetch(`${BASE_URL}/active`, { headers });
        const activeData = await activeRes.json();
        setActiveUsers(activeData?.visitors);

        // Pageviews
        const pvRes = await fetch(
          `${BASE_URL}/pageviews?startAt=${daysAgo}&endAt=${now}&unit=${unit}&timezone=${timezone}`,
          { headers }
        );
        const pvData = await pvRes.json();
        setPageviews(pvData);

        // Events - GET /api/websites/:websiteId/events
        let rawEventsList = [];
        let eventsList = [];
        let eventDetailsData = [];
        
        try {
          // Fetch all events with pagination
          let page = 1;
          const pageSize = 100;
          let hasMore = true;
          
          while (hasMore) {
            const eventsRes = await fetch(
              `${BASE_URL}/events?startAt=${daysAgo}&endAt=${now}&page=${page}&pageSize=${pageSize}`,
              { headers }
            );
            
            if (eventsRes.ok) {
              const eventsData = await eventsRes.json();
              const pageData = eventsData?.data || [];
              
              if (pageData.length > 0) {
                rawEventsList = rawEventsList.concat(pageData);
                // Check if there are more pages
                hasMore = pageData.length === pageSize && eventsData.count > page * pageSize;
                page++;
              } else {
                hasMore = false;
              }
            } else {
              hasMore = false;
            }
          }
          
          // Filter out pageviews (eventType 1) and events with empty eventName
          // Only keep custom events (eventType 2) with eventName
          const customEvents = rawEventsList.filter(
            (event) => event.eventType === 2 && event.eventName && event.eventName.trim() !== ''
          );
          
          // Group events by eventName and count occurrences
          const eventCounts = {};
          customEvents.forEach((event) => {
            const eventName = event.eventName;
            if (!eventCounts[eventName]) {
              eventCounts[eventName] = {
                name: eventName,
                count: 0,
                firstSeen: event.createdAt,
              };
            }
            eventCounts[eventName].count++;
          });
          
          // Convert to array format for display
          eventsList = Object.values(eventCounts);
        } catch (err) {
          console.warn("Error fetching events from /events endpoint:", err);
        }

        setEvents(eventsList);

        // Fetch event details for each unique event using event-data/:eventId
        if (eventsList.length > 0) {
          const eventDetailsPromises = eventsList.map(async (event) => {
            try {
              // Use eventName as the eventId
              const eventName = event.name;
              if (eventName) {
                const detailRes = await fetch(
                  `${BASE_URL}/event-data/${encodeURIComponent(eventName)}?startAt=${daysAgo}&endAt=${now}`,
                  { headers }
                );
                if (detailRes.ok) {
                  const detailData = await detailRes.json();
                  return { ...event, details: detailData };
                }
              }
              return { ...event, details: null };
            } catch (err) {
              console.warn(`Error fetching details for event ${event.name}:`, err);
              return { ...event, details: null };
            }
          });
          eventDetailsData = await Promise.all(eventDetailsPromises);
        } else {
          eventDetailsData = [];
        }
        
        setEventDetails(eventDetailsData);

        // Metrics (example: browser, os, device, country, referrer)
        const metricTypes = ["browser", "os", "device", "country", "referrer"];
        const metricsObj = {};
        for (const type of metricTypes) {
          const metricsRes = await fetch(
            `${BASE_URL}/metrics?type=${type}&startAt=${daysAgo}&endAt=${now}&unit=${unit}&timezone=${timezone}`,
            { headers }
          );
          const metricsData = await metricsRes.json();
          metricsObj[type] = metricsData[type] || metricsData;
        }
        setMetrics(metricsObj);

        // Stats
        const statsRes = await fetch(
          `${BASE_URL}/stats?startAt=${daysAgo}&endAt=${now}&unit=${unit}&timezone=${timezone}`,
          { headers }
        );
        const statsData = await statsRes.json();
        setStats(statsData);

        // Pages - fetch frequently visited pages
        try {
          const pagesRes = await fetch(
            `${BASE_URL}/pages?startAt=${daysAgo}&endAt=${now}&unit=${unit}&timezone=${timezone}`,
            { headers }
          );
          if (pagesRes.ok) {
            const pagesData = await pagesRes.json();
            // Format pages data for bar chart
            const formattedPages = (pagesData.pages || pagesData || []).map((page) => ({
              name: page.x || page.url || page.pathname || 'Unknown',
              views: page.y || page.pageviews || page.views || 0,
              visitors: page.visitors || 0,
            })).sort((a, b) => b.views - a.views).slice(0, 10);
            setPages(formattedPages);
          }
        } catch (err) {
          console.warn("Error fetching pages:", err);
          setPages([]);
        }

        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    }

    fetchAnalytics();
  }, [timeRange]);

  // Calculate bounce rate
  const bounceRate = stats?.visitors?.value > 0
    ? ((stats?.bounces?.value / stats?.visitors?.value) * 100).toFixed(1)
    : 0;

  // Sort events by count
  const sortedEvents = [...events].sort((a, b) => b.count - a.count);
  const topEvents = sortedEvents.slice(0, 10);

  // Format pageviews data for better display
  const formattedPageviews = pageviews?.pageviews?.map((pv) => ({
    date: new Date(pv.x).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    views: pv.y,
    x: pv.x,
  })) || [];

  // Calculate average pageviews per day
  const avgPageviews = formattedPageviews.length > 0
    ? (formattedPageviews.reduce((sum, pv) => sum + pv.views, 0) / formattedPageviews.length).toFixed(1)
    : 0;

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Analytics Dashboard</h1>
          <p className="text-gray-600">Track your application's performance and user interactions</p>
          
          {/* Time Range Selector */}
          <div className="mt-4 flex gap-2">
            {[7, 14, 30, 90].map((days) => (
              <button
                key={days}
                onClick={() => setTimeRange(days)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  timeRange === days
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                {days} Days
              </button>
            ))}
          </div>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
            <span className="ml-4 text-gray-600">Loading analytics data...</span>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8">
            <p className="text-red-800 font-medium">Error: {error}</p>
          </div>
        )}

        {!loading && !error && (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">Active Users</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{activeUsers ?? "0"}</p>
                  </div>
                  <div className="bg-blue-100 rounded-full p-3">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">Pageviews</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{stats?.pageviews?.value ?? "0"}</p>
                    <p className="text-sm text-gray-500 mt-1">Avg: {avgPageviews}/day</p>
                  </div>
                  <div className="bg-green-100 rounded-full p-3">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-purple-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">Visitors</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{stats?.visitors?.value ?? "0"}</p>
                  </div>
                  <div className="bg-purple-100 rounded-full p-3">
                    <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-orange-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">Bounce Rate</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{bounceRate}%</p>
                    <p className="text-sm text-gray-500 mt-1">{stats?.bounces?.value ?? "0"} bounces</p>
                  </div>
                  <div className="bg-orange-100 rounded-full p-3">
                    <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Pageviews Chart */}
            {formattedPageviews.length > 0 && (
              <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Pageviews Over Time</h2>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={formattedPageviews}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis 
                      dataKey="date" 
                      stroke="#6b7280"
                      tick={{ fill: '#6b7280' }}
                    />
                    <YAxis 
                      stroke="#6b7280"
                      tick={{ fill: '#6b7280' }}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#fff', 
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                      }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="views" 
                      stroke="#3b82f6" 
                      strokeWidth={3}
                      dot={{ fill: '#3b82f6', r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Events Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              {/* Top Events */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Top Events</h2>
                {topEvents.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No events tracked yet</p>
                ) : (
                  <div className="space-y-3">
                    {topEvents.map((event, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${idx < COLORS.length ? '' : 'bg-gray-400'}`}
                            style={{ backgroundColor: idx < COLORS.length ? COLORS[idx] : '#9ca3af' }}>
                            {idx + 1}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{event.name}</p>
                            <p className="text-xs text-gray-500">Event</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xl font-bold text-gray-900">{event.count}</p>
                          <p className="text-xs text-gray-500">occurrences</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Events Chart */}
              {topEvents.length > 0 && (
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">Events Distribution</h2>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={topEvents.slice(0, 8)}
                        cx="50%"
                        cy="45%"
                        labelLine={false}
                        label={false}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="count"
                      >
                        {topEvents.slice(0, 8).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#fff', 
                          border: '1px solid #e5e7eb',
                          borderRadius: '6px',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                          padding: '6px 10px',
                          fontSize: '12px'
                        }}
                        itemStyle={{ 
                          padding: '2px 0',
                          fontSize: '12px'
                        }}
                        labelStyle={{
                          fontSize: '11px',
                          marginBottom: '4px',
                          fontWeight: '600'
                        }}
                        formatter={(value, name, props) => [
                          `${value} occurrences`,
                          props.payload.name
                        ]}
                      />
                      <Legend 
                        verticalAlign="bottom" 
                        height={36}
                        formatter={(value, entry) => (
                          <span style={{ color: entry.color, fontSize: '12px' }}>
                            {value.length > 20 ? `${value.substring(0, 20)}...` : value}
                          </span>
                        )}
                        wrapperStyle={{ paddingTop: '20px' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {Object.entries(metrics).map(([type, arr]) => {
                if (!arr || arr.length === 0) return null;
                const topItems = arr.slice(0, 5);
                const total = arr.reduce((sum, item) => sum + item.y, 0);
                
                return (
                  <div key={type} className="bg-white rounded-xl shadow-lg p-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-4 capitalize flex items-center gap-2">
                      {type === 'os' ? 'Operating System' : type === 'device' ? 'Device Type' : type}
                      <span className="text-sm font-normal text-gray-500">({total} total)</span>
                    </h2>
                    <div className="space-y-2">
                      {topItems.map((item, idx) => {
                        const percentage = ((item.y / total) * 100).toFixed(1);
                        return (
                          <div key={idx} className="space-y-1">
                            <div className="flex justify-between items-center">
                              <span className="text-sm font-medium text-gray-700">{item.x ?? "Unknown"}</span>
                              <span className="text-sm font-bold text-gray-900">{item.y}</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className="h-2 rounded-full transition-all"
                                style={{
                                  width: `${percentage}%`,
                                  backgroundColor: COLORS[idx % COLORS.length],
                                }}
                              />
                            </div>
                            <p className="text-xs text-gray-500">{percentage}%</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Event Details */}
            {eventDetails.length > 0 && (
              <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Event Details</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {eventDetails.map((event, idx) => (
                    <div key={idx} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <h3 className="font-semibold text-gray-900 mb-2">{event.name}</h3>
                      <div className="space-y-1">
                        <p className="text-sm text-gray-600">Total: <span className="font-bold text-gray-900">{event.count}</span></p>
                        {event.details && (
                          <>
                            {event.details.events?.length > 0 && (
                              <div className="mt-2 pt-2 border-t border-gray-200">
                                <p className="text-xs font-medium text-gray-500 mb-1">Breakdown:</p>
                                {event.details.events.slice(0, 3).map((detail, dIdx) => (
                                  <p key={dIdx} className="text-xs text-gray-600">
                                    {Object.entries(detail).map(([key, value]) => 
                                      key !== 'x' && key !== 'y' ? `${key}: ${value}` : null
                                    ).filter(Boolean).join(', ') || 'No additional data'}
                                  </p>
                                ))}
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Summary Stats */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl shadow-lg p-8 text-white">
              <h2 className="text-2xl font-bold mb-4">Summary</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <p className="text-blue-200 text-sm uppercase tracking-wide">Total Events</p>
                  <p className="text-3xl font-bold mt-1">{events.reduce((sum, e) => sum + e.count, 0)}</p>
                </div>
                <div>
                  <p className="text-blue-200 text-sm uppercase tracking-wide">Unique Events</p>
                  <p className="text-3xl font-bold mt-1">{events.length}</p>
                </div>
                <div>
                  <p className="text-blue-200 text-sm uppercase tracking-wide">Avg Events/Day</p>
                  <p className="text-3xl font-bold mt-1">
                    {timeRange > 0 ? (events.reduce((sum, e) => sum + e.count, 0) / timeRange).toFixed(1) : 0}
                  </p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default Analytics;

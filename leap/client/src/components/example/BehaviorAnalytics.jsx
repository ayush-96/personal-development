import React from "react";
import {
  SparklineChart,
  LineChart,
  LineSeries,
  PointSeries,
  AreaChart,
  AreaSeries,
} from "reaviz";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const mockLoginFrequency7Days = [
  { date: "2025-11-20", count: 1 },
  { date: "2025-11-21", count: 3 },
  { date: "2025-11-22", count: 2 },
  { date: "2025-11-23", count: 4 },
  { date: "2025-11-24", count: 3 },
  { date: "2025-11-25", count: 5 },
  { date: "2025-11-26", count: 2 },
];

const mockSessionDuration = [
  { sessionId: "S1001", date: "2025-11-20", duration: 12 },
  { sessionId: "S1002", date: "2025-11-21", duration: 25 },
  { sessionId: "S1003", date: "2025-11-21", duration: 8 },
  { sessionId: "S1004", date: "2025-11-22", duration: 15 },
  { sessionId: "S1005", date: "2025-11-23", duration: 32 },
  { sessionId: "S1006", date: "2025-11-24", duration: 18 },
  { sessionId: "S1007", date: "2025-11-25", duration: 40 },
  { sessionId: "S1008", date: "2025-11-26", duration: 22 },
];

const mockDialogueTurns = [
  { sessionId: "S1001", date: "2025-11-20", turns: 10 },
  { sessionId: "S1002", date: "2025-11-21", turns: 22 },
  { sessionId: "S1003", date: "2025-11-21", turns: 7 },
  { sessionId: "S1004", date: "2025-11-22", turns: 15 },
  { sessionId: "S1005", date: "2025-11-23", turns: 30 },
  { sessionId: "S1006", date: "2025-11-24", turns: 18 },
  { sessionId: "S1007", date: "2025-11-25", turns: 45 },
  { sessionId: "S1008", date: "2025-11-26", turns: 20 },
];


const loginSparkData = mockLoginFrequency7Days.map((d, idx) => ({
  id: String(idx),
  key: new Date(d.date),
  data: d.count,
}));

const sessionDurationData = mockSessionDuration.map((d) => ({
  key: new Date(d.date),
  data: d.duration,
}));

const dialogueTurnsData = mockDialogueTurns.map((d) => ({
  key: new Date(d.date),
  data: d.turns,
}));

export const StudentBehaviorAnalytics = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold">Login Frequency (Last 7 Days)</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center p-4">
          <SparklineChart
            data={loginSparkData}
            width={400}
            height={80}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold">Session Duration (Trend)</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center p-4">
          <LineChart
            data={sessionDurationData}
            width={500}
            height={250}
            series={<LineSeries symbols={<PointSeries show={true} />} />}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold">Dialogue Turns Trend</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center p-4">
          <AreaChart
            data={dialogueTurnsData}
            width={500}
            height={250}
            series={<AreaSeries />}
          />
        </CardContent>
      </Card>

    </div>
  );
};

export default StudentBehaviorAnalytics;

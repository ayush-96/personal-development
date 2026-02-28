import React from "react";
import { Treemap } from "@/components/example/Treemap";
import { Bubble } from "@/components/example/Bubblemap";
import { Wordcloud } from "@/components/example/Wordcloudmap";
import { Toptopic } from "@/components/example/Toptopic";
import { Spark } from "@/components/example/Spark";
import { StudentBehaviorAnalytics } from "@/components/example/BehaviorAnalytics";
import { QuizDiagnostic } from "@/components/example/quiz";
import { AnnouncementManager } from "@/components/AnnouncementManager";
import { useUser } from "@/contexts/UserContext";

const mockData_topic_count = {
  last3Days: [
    { key: "5G NR", data: 14 },
    { key: "OFDM", data: 9 },
    { key: "MIMO", data: 12 },
    { key: "Beamforming", data: 7 },
    { key: "Signal Processing", data: 10 },
    { key: "RF Front-End", data: 6 },
    { key: "Network Optimization", data: 8 },
    { key: "Wireless Security", data: 5 },
    { key: "Latency Reduction", data: 4 },
    { key: "Packet Scheduling", data: 6 },
  ],

  last7Days: [
    { key: "5G Core Network", data: 22 },
    { key: "RAN Architecture", data: 18 },
    { key: "4G/5G Handover", data: 12 },
    { key: "MAC Layer", data: 11 },
    { key: "IoT", data: 14 },
    { key: "Network Slicing", data: 9 },
    { key: "SDN / NFV", data: 10 },
    { key: "Protocol Stack", data: 8 },
    { key: "TCP/IP Optimization", data: 13 },
    { key: "Routing Algorithms", data: 7 },
    { key: "Wireless Interference", data: 10 },
    { key: "Optical Fiber Basics", data: 6 },
  ],

  last30Days: [
    { key: "6G Research", data: 42 },
    { key: "5G Advanced", data: 36 },
    { key: "Massive MIMO", data: 33 },
    { key: "Terahertz Communication", data: 20 },
    { key: "Satellite Internet", data: 27 },
    { key: "Optical Communication", data: 18 },
    { key: "SDN/NFV Architecture", data: 25 },
    { key: "Network Simulation", data: 16 },
    { key: "Error Correction Codes", data: 14 },
    { key: "Modulation Techniques", data: 12 },
    { key: "Network Security", data: 21 },
    { key: "MAC Scheduling Algorithms", data: 17 },
    { key: "RAN Optimization", data: 24 },
    { key: "Backhaul & Fronthaul", data: 15 },
    { key: "QoS / QoE", data: 13 },
    { key: "IoT Connectivity", data: 19 },
    { key: "Antennas & Propagation", data: 28 },
    { key: "Edge Computing in RAN", data: 22 },
    { key: "Other", data: 10 },
  ],
};

const mockData_topic_shift_trend = [
  { key: "5G NR", time: "2025-11-25T09:01" },
  { key: "MIMO", time: "2025-11-25T09:03" },
  { key: "Beamforming", time: "2025-11-25T09:05" },
  { key: "5G NR", time: "2025-11-25T09:07" },
  { key: "OFDM", time: "2025-11-25T09:09" },
  { key: "Signal Processing", time: "2025-11-25T09:12" },
  { key: "Network Optimization", time: "2025-11-25T09:15" },
  { key: "Latency Reduction", time: "2025-11-25T09:18" },
  { key: "Packet Scheduling", time: "2025-11-25T09:20" },
  { key: "Wireless Security", time: "2025-11-25T09:23" },
  { key: "5G Core Network", time: "2025-11-25T10:02" },
  { key: "RAN Architecture", time: "2025-11-25T10:05" },
  { key: "MAC Layer", time: "2025-11-25T10:07" },
  { key: "4G/5G Handover", time: "2025-11-25T10:10" },
  { key: "Protocol Stack", time: "2025-11-25T10:12" },
  { key: "TCP/IP Optimization", time: "2025-11-25T10:15" },
  { key: "Routing Algorithms", time: "2025-11-25T10:17" },
  { key: "IoT", time: "2025-11-25T10:19" },
  { key: "SDN / NFV", time: "2025-11-25T10:22" },
  { key: "Optical Fiber Basics", time: "2025-11-25T10:25" },
  { key: "6G Research", time: "2025-11-25T14:01" },
  { key: "5G Advanced", time: "2025-11-25T14:04" },
  { key: "Massive MIMO", time: "2025-11-25T14:06" },
  { key: "Terahertz Communication", time: "2025-11-25T14:09" },
  { key: "Satellite Internet", time: "2025-11-25T14:12" },
  { key: "Optical Communication", time: "2025-11-25T14:15" },
  { key: "SDN/NFV Architecture", time: "2025-11-25T14:18" },
  { key: "Network Simulation", time: "2025-11-25T14:21" },
  { key: "Error Correction Codes", time: "2025-11-25T14:24" },
  { key: "Modulation Techniques", time: "2025-11-25T14:27" },
  { key: "Network Security", time: "2025-11-25T15:02" },
  { key: "IoT Connectivity", time: "2025-11-25T15:05" },
  { key: "Antennas & Propagation", time: "2025-11-25T15:08" },
  { key: "RAN Optimization", time: "2025-11-25T15:11" },
  { key: "Backhaul & Fronthaul", time: "2025-11-25T15:14" },
  { key: "MAC Scheduling Algorithms", time: "2025-11-25T15:17" },
  { key: "Edge Computing in RAN", time: "2025-11-25T15:20" },
  { key: "QoS / QoE", time: "2025-11-25T15:23" },
];

function getSparklineDataForTopic(topicName, events) {
  // 1. 取出该 topic 所有出现时间
  const topicTimes = events
    .filter(e => e.key === topicName)
    .map(e => new Date(e.time));

  // 如果没有数据，返回空数组
  if (topicTimes.length === 0) return [];

  // 2. 确定时间范围（min → max）
  const startTime = new Date(Math.min(...topicTimes.map(d => d.getTime())));
  const endTime = new Date(Math.max(...topicTimes.map(d => d.getTime())));

  // 向前向后各延伸一点，保证 sparkline 不挤
  startTime.setMinutes(startTime.getMinutes() - 10);
  endTime.setMinutes(endTime.getMinutes() + 10);

  // 3. 生成 5-min buckets
  const buckets = [];
  const step = 5; // 5 minutes
  let current = new Date(startTime);

  while (current <= endTime) {
    buckets.push(new Date(current));
    current = new Date(current.getTime() + step * 60000);
  }

  // 4. 生成 sparkline 数据：该 topic 在 bucket 中是否出现 → data=1 or 0
  const sparkline = buckets.map((bucketTime, index) => {
    const bucketStart = bucketTime.getTime();
    const bucketEnd = bucketStart + step * 60000;

    const appeared = topicTimes.some(t => {
      const time = t.getTime();
      return time >= bucketStart && time < bucketEnd;
    });

    return {
      id: String(index),
      key: bucketTime,
      data: appeared ? 1 : 0
    };
  });

  return sparkline;
}

const mockData_topic_top = {
  top5: [
    { key: "5G NR", data: 14 },
    { key: "OFDM", data: 12 },
    { key: "MIMO", data: 10 },
    { key: "Beamforming", data: 7 },
    { key: "Signal Processing", data: 3 },
  ],
  top10: [
    { key: "5G NR", data: 21 },
    { key: "OFDM", data: 15 },
    { key: "MIMO", data: 13 },
    { key: "Beamforming", data: 10 },
    { key: "Signal Processing", data: 8 },
    { key: "RF Front-End", data: 6 },
    { key: "Network Optimization", data: 4 },
    { key: "Wireless Security", data: 2 },
    { key: "Latency Reduction", data: 1 },
    { key: "Packet Scheduling", data: 1 },
  ],
}

const mockTopicFrequency7Days = [
  {
    topic: "5G NR",
    total: 32,
    daily: [
      { date: "2025-11-20", count: 3 },
      { date: "2025-11-21", count: 5 },
      { date: "2025-11-22", count: 4 },
      { date: "2025-11-23", count: 6 },
      { date: "2025-11-24", count: 2 },
      { date: "2025-11-25", count: 7 },
      { date: "2025-11-26", count: 5 },
    ],
  },
  {
    topic: "MIMO",
    total: 19,
    daily: [
      { date: "2025-11-20", count: 2 },
      { date: "2025-11-21", count: 3 },
      { date: "2025-11-22", count: 1 },
      { date: "2025-11-23", count: 4 },
      { date: "2025-11-24", count: 3 },
      { date: "2025-11-25", count: 2 },
      { date: "2025-11-26", count: 4 },
    ],
  },
  {
    topic: "6G Research",
    total: 21,
    daily: [
      { date: "2025-11-20", count: 0 },
      { date: "2025-11-21", count: 1 },
      { date: "2025-11-22", count: 2 },
      { date: "2025-11-23", count: 3 },
      { date: "2025-11-24", count: 4 },
      { date: "2025-11-25", count: 5 },
      { date: "2025-11-26", count: 6 },
    ],
  },
  {
    topic: "Massive MIMO",
    total: 16,
    daily: [
      { date: "2025-11-20", count: 1 },
      { date: "2025-11-21", count: 2 },
      { date: "2025-11-22", count: 2 },
      { date: "2025-11-23", count: 3 },
      { date: "2025-11-24", count: 1 },
      { date: "2025-11-25", count: 4 },
      { date: "2025-11-26", count: 3 },
    ],
  },
  {
    topic: "Network Security",
    total: 20,
    daily: [
      { date: "2025-11-20", count: 2 },
      { date: "2025-11-21", count: 1 },
      { date: "2025-11-22", count: 3 },
      { date: "2025-11-23", count: 2 },
      { date: "2025-11-24", count: 4 },
      { date: "2025-11-25", count: 3 },
      { date: "2025-11-26", count: 5 },
    ],
  },
];

const mockData_topic_weakness = {
  last3Days: [
    { key: "5G NR", data: 14 },
    { key: "OFDM", data: 9 },
    { key: "MIMO", data: 12 },
    { key: "Beamforming", data: 7 },
    { key: "Signal Processing", data: 10 },
  ],

  last7Days: [
    { key: "5G Core Network", data: 22 },
    { key: "RAN Architecture", data: 18 },
    { key: "Network Slicing", data: 9 },
    { key: "SDN / NFV", data: 10 },
    { key: "Protocol Stack", data: 8 },
  ],

  last30Days: [
    { key: "Network Simulation", data: 16 },
    { key: "Error Correction Codes", data: 14 },
    { key: "Modulation Techniques", data: 12 },
    { key: "Network Security", data: 21 },
    { key: "MAC Scheduling Algorithms", data: 17 },
  ],
};

export const mockLoginFrequency7Days = [
  { date: "2025-11-20", count: 1 },
  { date: "2025-11-21", count: 3 },
  { date: "2025-11-22", count: 2 },
  { date: "2025-11-23", count: 4 },
  { date: "2025-11-24", count: 3 },
  { date: "2025-11-25", count: 5 },
  { date: "2025-11-26", count: 2 },
];

export const mockSessionDuration = [
  { sessionId: "S1001", date: "2025-11-20", duration: 12 },
  { sessionId: "S1002", date: "2025-11-21", duration: 25 },
  { sessionId: "S1003", date: "2025-11-21", duration: 8 },
  { sessionId: "S1004", date: "2025-11-22", duration: 15 },
  { sessionId: "S1005", date: "2025-11-23", duration: 32 },
  { sessionId: "S1006", date: "2025-11-24", duration: 18 },
  { sessionId: "S1007", date: "2025-11-25", duration: 40 },
  { sessionId: "S1008", date: "2025-11-26", duration: 22 },
];

export const mockDialogueTurns = [
  { sessionId: "S1001", date: "2025-11-20", turns: 10 },
  { sessionId: "S1002", date: "2025-11-21", turns: 22 },
  { sessionId: "S1003", date: "2025-11-21", turns: 7 },
  { sessionId: "S1004", date: "2025-11-22", turns: 15 },
  { sessionId: "S1005", date: "2025-11-23", turns: 30 },
  { sessionId: "S1006", date: "2025-11-24", turns: 18 },
  { sessionId: "S1007", date: "2025-11-25", turns: 45 },
  { sessionId: "S1008", date: "2025-11-26", turns: 20 },
];

export default function Dashboard() {
  const { user } = useUser();
  const isTeacher = user?.role === 'teacher';

  return (
    <div className="p-10 w-full h-full mx-auto bg-background">
      <h1 className="text-3xl font-bold mb-8 text-slate-900">Dashboard</h1>

      <div className="flex flex-col gap-4">
        {/* Announcement Manager for Teachers */}
        {isTeacher && (
          <div className="mb-6">
            <AnnouncementManager />
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Treemap data={mockData_topic_count} title="Topic Map" />
          <Bubble data={mockData_topic_count} title="Topic Map" />
          <Wordcloud data={mockData_topic_count} title="Topic Map" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Toptopic data={mockData_topic_top} title="Topic Top Weekly" />
          <Spark data={mockTopicFrequency7Days} title="Topic Shift Trend Weekly" />
          <Bubble data={mockData_topic_weakness} title="Predicted Five not-so-good TOPICS" />
        </div>
        <StudentBehaviorAnalytics />
        <QuizDiagnostic />
      </div>


    </div>
  );
}

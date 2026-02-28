import React, { useMemo, useState } from "react";
import { LineChart, LineSeries, PointSeries } from "reaviz";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

// =======================
// 1. Mock 测验数据（20 次）
// =======================

const mockQuizAttempts = [
  {
    id: 1,
    date: "2025-11-01",
    score: 68,
    totalQuestions: 20,
    correct: 14,
    incorrect: 6,
    incorrectDetails: [
      {
        questionId: "Q1",
        chosenOption: "B",
        correctOption: "D",
        distractorTag: "Formula confusion",
      },
      {
        questionId: "Q4",
        chosenOption: "C",
        correctOption: "A",
        distractorTag: "Similar wording",
      },
    ],
  },
  {
    id: 2,
    date: "2025-11-02",
    score: 72,
    totalQuestions: 20,
    correct: 15,
    incorrect: 5,
    incorrectDetails: [
      {
        questionId: "Q3",
        chosenOption: "A",
        correctOption: "C",
        distractorTag: "Concept misunderstanding",
      },
    ],
  },
  {
    id: 3,
    date: "2025-11-03",
    score: 75,
    totalQuestions: 20,
    correct: 16,
    incorrect: 4,
    incorrectDetails: [
      {
        questionId: "Q5",
        chosenOption: "D",
        correctOption: "B",
        distractorTag: "Numeric slip",
      },
    ],
  },
  {
    id: 4,
    date: "2025-11-04",
    score: 70,
    totalQuestions: 20,
    correct: 15,
    incorrect: 5,
    incorrectDetails: [],
  },
  {
    id: 5,
    date: "2025-11-05",
    score: 78,
    totalQuestions: 20,
    correct: 17,
    incorrect: 3,
    incorrectDetails: [],
  },
  {
    id: 6,
    date: "2025-11-06",
    score: 80,
    totalQuestions: 20,
    correct: 18,
    incorrect: 2,
    incorrectDetails: [],
  },
  {
    id: 7,
    date: "2025-11-07",
    score: 82,
    totalQuestions: 20,
    correct: 18,
    incorrect: 2,
    incorrectDetails: [],
  },
  {
    id: 8,
    date: "2025-11-08",
    score: 77,
    totalQuestions: 20,
    correct: 17,
    incorrect: 3,
    incorrectDetails: [],
  },
  {
    id: 9,
    date: "2025-11-09",
    score: 85,
    totalQuestions: 20,
    correct: 19,
    incorrect: 1,
    incorrectDetails: [],
  },
  {
    id: 10,
    date: "2025-11-10",
    score: 88,
    totalQuestions: 20,
    correct: 19,
    incorrect: 1,
    incorrectDetails: [],
  },
  {
    id: 11,
    date: "2025-11-11",
    score: 90,
    totalQuestions: 20,
    correct: 20,
    incorrect: 0,
    incorrectDetails: [],
  },
  {
    id: 12,
    date: "2025-11-12",
    score: 84,
    totalQuestions: 20,
    correct: 18,
    incorrect: 2,
    incorrectDetails: [],
  },
  {
    id: 13,
    date: "2025-11-13",
    score: 86,
    totalQuestions: 20,
    correct: 19,
    incorrect: 1,
    incorrectDetails: [],
  },
  {
    id: 14,
    date: "2025-11-14",
    score: 92,
    totalQuestions: 20,
    correct: 20,
    incorrect: 0,
    incorrectDetails: [],
  },
  {
    id: 15,
    date: "2025-11-15",
    score: 89,
    totalQuestions: 20,
    correct: 19,
    incorrect: 1,
    incorrectDetails: [],
  },
  {
    id: 16,
    date: "2025-11-16",
    score: 94,
    totalQuestions: 20,
    correct: 20,
    incorrect: 0,
    incorrectDetails: [],
  },
  {
    id: 17,
    date: "2025-11-17",
    score: 91,
    totalQuestions: 20,
    correct: 20,
    incorrect: 0,
    incorrectDetails: [],
  },
  {
    id: 18,
    date: "2025-11-18",
    score: 93,
    totalQuestions: 20,
    correct: 20,
    incorrect: 0,
    incorrectDetails: [],
  },
  {
    id: 19,
    date: "2025-11-19",
    score: 95,
    totalQuestions: 20,
    correct: 20,
    incorrect: 0,
    incorrectDetails: [],
  },
  {
    id: 20,
    date: "2025-11-20",
    score: 96,
    totalQuestions: 20,
    correct: 20,
    incorrect: 0,
    incorrectDetails: [],
  },
];

// =======================
// 2. 辅助函数：平均分 & 趋势数据
// =======================

// 最近 10 次的平均分
const last10Attempts = mockQuizAttempts.slice(-10);
const last10AverageScore =
  last10Attempts.reduce((sum, q) => sum + q.score, 0) /
  last10Attempts.length;

// 根据 N（5 / 10 / 20）生成趋势数据，适配 reaviz LineChart
function buildScoreTrendData(attempts, count) {
  const slice = attempts.slice(-count); // 最近 N 次
  return slice.map((q) => ({
    key: new Date(q.date), // Fixed: Use Date object for x-axis
    data: q.score,
  }));
}

// 聚合错误题目及其干扰项（只取最近几次，避免太长）
function getRecentIncorrectDetails(limitQuizzes = 5) {
  const slice = mockQuizAttempts.slice(-limitQuizzes);
  const rows = [];
  slice.forEach((quiz) => {
    quiz.incorrectDetails.forEach((detail) => {
      rows.push({
        quizId: quiz.id,
        date: quiz.date,
        questionId: detail.questionId,
        chosenOption: detail.chosenOption,
        correctOption: detail.correctOption,
        distractorTag: detail.distractorTag,
      });
    });
  });
  return rows;
}

// =======================
// 3. 小卡片包装组件
// =======================

const ChartCard = ({ title, children, extra }) => (
  <Card className="w-full">
    <CardHeader className="flex flex-row items-center justify-between">
      <CardTitle className="text-sm font-semibold">{title}</CardTitle>
      {extra}
    </CardHeader>
    <CardContent>{children}</CardContent>
  </Card>
);

// =======================
// 4. 主组件：包含趋势 + 错误诊断
// =======================

export const QuizDiagnostic = () => {
  const [range, setRange] = useState(5); // 默认最近 5 次

  const trendData = useMemo(
    () => buildScoreTrendData(mockQuizAttempts, range),
    [range]
  );

  const incorrectRows = useMemo(
    () => getRecentIncorrectDetails(5),
    []
  );

  return (
    <div className="w-full flex flex-col gap-6">
      {/* 得分趋势 + 平均分 */}
      <ChartCard
        title="Quiz Score Trend"
        extra={
          <Select
            value={String(range)}
            onValueChange={(v) => setRange(Number(v))}
          >
            <SelectTrigger className="w-32 h-8 text-xs">
              <SelectValue placeholder="Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5">Last 5</SelectItem>
              <SelectItem value="10">Last 10</SelectItem>
              <SelectItem value="20">Last 20</SelectItem>
            </SelectContent>
          </Select>
        }
      >
        <p className="text-xs text-muted-foreground mb-2">
          Average score (last 10 quizzes):{" "}
          <span className="font-medium">
            {last10AverageScore.toFixed(1)}%
          </span>
        </p>
        <div className="flex justify-center">
          <LineChart
            width={520}
            height={240}
            data={trendData}
            series={<LineSeries symbols={<PointSeries show />} />}
          />
        </div>
      </ChartCard>

      {/* 错误题目 & 干扰项（简洁版列表） */}
      <ChartCard title="Recent Incorrect Responses & Distractors">
        {incorrectRows.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            No recent incorrect responses with recorded distractors.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="border-b">
                <tr className="text-left">
                  <th className="py-1 pr-2">Quiz</th>
                  <th className="py-1 pr-2">Date</th>
                  <th className="py-1 pr-2">Question</th>
                  <th className="py-1 pr-2">Chosen</th>
                  <th className="py-1 pr-2">Correct</th>
                  <th className="py-1 pr-2">Distractor</th>
                </tr>
              </thead>
              <tbody>
                {incorrectRows.map((row, idx) => (
                  <tr key={idx} className="border-b last:border-0">
                    <td className="py-1 pr-2">#{row.quizId}</td>
                    <td className="py-1 pr-2">{row.date}</td>
                    <td className="py-1 pr-2">{row.questionId}</td>
                    <td className="py-1 pr-2">{row.chosenOption}</td>
                    <td className="py-1 pr-2">{row.correctOption}</td>
                    <td className="py-1 pr-2">{row.distractorTag}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </ChartCard>
    </div>
  );
};

export default QuizDiagnostic;

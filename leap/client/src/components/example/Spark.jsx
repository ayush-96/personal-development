import { useMemo, useState } from "react";
import { SparklineChart } from "reaviz";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

export const Spark = ({ data, title }) => {
  const [selectedTopic, setSelectedTopic] = useState(
    data?.[0]?.topic ?? ""
  );

  const sparklineData = useMemo(() => {
    const topic = data.find((d) => d.topic === selectedTopic);
    if (!topic) return [];

    return topic.daily.map((d) => ({
      id: String(d.date),
      key: new Date(d.date),
      data: d.count,
    }));
  }, [data, selectedTopic]);

  return (
    <Card className="w-full h-full">
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <CardTitle className="text-lg font-semibold">{title}</CardTitle>

        <Select
          value={selectedTopic}
          onValueChange={(value) => setSelectedTopic(value)}
        >
          <SelectTrigger className="w-40 h-8 text-xs">
            <SelectValue placeholder="Select topic" />
          </SelectTrigger>
          <SelectContent>
            {data.map((item) => (
              <SelectItem key={item.topic} value={item.topic}>
                {item.topic}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardHeader>

      <CardContent className="p-4 flex justify-center">
        <SparklineChart
          data={sparklineData}
          height={300}
          width={500}
        />
      </CardContent>
    </Card>
  );
};

export default Spark;
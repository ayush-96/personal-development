import { BarList } from 'reaviz';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Toptopic = ({ data, title }) => {
  const [range, setRange] = useState("Top 5");

  // Select data based on the active tab
  const currentData = range === "Top 5" ? data.top5 :
                      range === "Top 10" ? data.top10 : [];

  return (
    <Card className="w-full h-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-semibold">{title}</CardTitle>
      </CardHeader>
      <CardContent className="p-4 flex justify-center">
        <BarList
          width={600}
          height={500}
          data={currentData}
        />
      </CardContent>
    </Card>
  );
};

import { BubbleChart } from 'reaviz';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Bubble = ({ data, title }) => {
  const [range, setRange] = useState("3D");

  // Select data based on the active tab
  const currentData = range === "3D" ? data.last3Days :
                      range === "7D" ? data.last7Days :
                      range === "30D" ? data.last30Days : [];

  return (
    <Card className="w-full h-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-semibold">{title}</CardTitle>
        <Tabs value={range} onValueChange={setRange} className="w-auto">
          <TabsList>
            <TabsTrigger value="3D">3D</TabsTrigger>
            <TabsTrigger value="7D">7D</TabsTrigger>
            <TabsTrigger value="30D">30D</TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>
      <CardContent className="p-4 flex justify-center">
        <BubbleChart
          width={600}
          height={500}
          data={currentData}
        />
      </CardContent>
    </Card>
  );
};
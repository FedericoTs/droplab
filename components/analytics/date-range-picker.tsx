"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar } from "lucide-react";

interface DateRangePickerProps {
  onRangeChange: (startDate: string, endDate: string) => void;
  defaultDays?: number;
}

export function DateRangePicker({
  onRangeChange,
  defaultDays = 30,
}: DateRangePickerProps) {
  const getDefaultDates = () => {
    const end = new Date().toISOString().split("T")[0];
    const start = new Date(Date.now() - defaultDays * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0];
    return { start, end };
  };

  const [startDate, setStartDate] = useState(getDefaultDates().start);
  const [endDate, setEndDate] = useState(getDefaultDates().end);

  const handleApply = () => {
    onRangeChange(startDate, endDate);
  };

  const handlePreset = (days: number) => {
    const end = new Date().toISOString().split("T")[0];
    const start = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0];
    setStartDate(start);
    setEndDate(end);
    onRangeChange(start, end);
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-2">
        <Calendar className="h-4 w-4 text-slate-500" />
        <Input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="w-40"
        />
        <span className="text-sm text-slate-600">to</span>
        <Input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          className="w-40"
        />
        <Button variant="outline" size="sm" onClick={handleApply}>
          Apply
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-sm text-slate-600">Quick:</span>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handlePreset(7)}
          className="h-8"
        >
          7 days
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handlePreset(30)}
          className="h-8"
        >
          30 days
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handlePreset(90)}
          className="h-8"
        >
          90 days
        </Button>
      </div>
    </div>
  );
}

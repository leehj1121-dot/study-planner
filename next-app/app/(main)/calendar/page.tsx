"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { CalendarGrid } from "@/components/calendar-grid";
import { DayDetailPanel } from "@/components/day-detail-panel";

interface DaySummary {
  total: number;
  completed: number;
  subjects: string[];
}

interface TaskDetail {
  id: string;
  subject_name: string;
  duration: number;
  completed: boolean;
}

export default function CalendarPage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [monthData, setMonthData] = useState<Record<string, DaySummary>>({});
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [dayTasks, setDayTasks] = useState<TaskDetail[]>([]);
  const [loading, setLoading] = useState(true);

  const monthStr = `${year}-${String(month).padStart(2, "0")}`;

  const fetchMonth = useCallback(async () => {
    setLoading(true);
    const data = await fetch(`/api/tasks?month=${monthStr}`).then((r) =>
      r.json(),
    );
    setMonthData(data);
    setSelectedDate(null);
    setDayTasks([]);
    setLoading(false);
  }, [monthStr]);

  useEffect(() => {
    fetchMonth();
  }, [fetchMonth]);

  const handleSelectDate = async (date: string) => {
    setSelectedDate(date);
    const tasks = await fetch(`/api/tasks?date=${date}`).then((r) => r.json());
    setDayTasks(tasks);
  };

  const handlePrevMonth = () => {
    if (month === 1) {
      setYear(year - 1);
      setMonth(12);
    } else {
      setMonth(month - 1);
    }
  };

  const handleNextMonth = () => {
    if (month === 12) {
      setYear(year + 1);
      setMonth(1);
    } else {
      setMonth(month + 1);
    }
  };

  return (
    <div className="mx-auto max-w-md space-y-4 p-4">
      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <p className="text-muted-foreground py-8 text-center">로딩 중...</p>
          ) : (
            <CalendarGrid
              year={year}
              month={month}
              data={monthData}
              selectedDate={selectedDate}
              onSelectDate={handleSelectDate}
              onPrevMonth={handlePrevMonth}
              onNextMonth={handleNextMonth}
            />
          )}
        </CardContent>
      </Card>

      {selectedDate && (
        <Card>
          <CardContent className="pt-6">
            <DayDetailPanel date={selectedDate} tasks={dayTasks} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}

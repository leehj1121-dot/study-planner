"use client";

import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";

interface SubjectWeight {
  id: string;
  name: string;
  weight: number;
}

interface WeightSliderProps {
  subjects: SubjectWeight[];
  onChange: (id: string, weight: number) => void;
  totalPercent: number;
}

export function WeightSlider({ subjects, onChange, totalPercent }: WeightSliderProps) {
  const isValid = totalPercent === 100;

  return (
    <div className="space-y-6">
      {subjects.map((subject) => (
        <div key={subject.id} className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>{subject.name}</Label>
            <span className="text-muted-foreground text-sm font-medium">
              {subject.weight}%
            </span>
          </div>
          <Slider
            value={[subject.weight]}
            onValueChange={([value]) => onChange(subject.id, value)}
            max={100}
            step={5}
          />
        </div>
      ))}

      <div
        className={`text-right text-sm font-medium ${isValid ? "text-green-600" : "text-destructive"}`}
      >
        합계: {totalPercent}%{" "}
        {isValid ? "✓" : `(${totalPercent > 100 ? "초과" : "부족"})`}
      </div>
    </div>
  );
}

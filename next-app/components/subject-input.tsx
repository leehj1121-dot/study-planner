"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, X } from "lucide-react";

interface Subject {
  id: string;
  name: string;
}

interface SubjectInputProps {
  subjects: Subject[];
  onAdd: (name: string) => void;
  onRemove: (id: string) => void;
}

export function SubjectInput({ subjects, onAdd, onRemove }: SubjectInputProps) {
  const [input, setInput] = useState("");

  const handleAdd = () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    if (subjects.some((s) => s.name === trimmed)) return;
    onAdd(trimmed);
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAdd();
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input
          placeholder="과목명 입력 (예: 수학)"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <Button onClick={handleAdd} size="icon" disabled={!input.trim()}>
          <Plus className="size-4" />
        </Button>
      </div>

      {subjects.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {subjects.map((subject) => (
            <Badge key={subject.id} variant="secondary" className="gap-1 py-1.5 pl-3 pr-2 text-sm">
              {subject.name}
              <button
                onClick={() => onRemove(subject.id)}
                className="hover:bg-muted rounded-full p-0.5"
              >
                <X className="size-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}

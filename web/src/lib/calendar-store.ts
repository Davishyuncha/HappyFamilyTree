export interface CalendarEvent {
  id: string;
  title: string;
  date: string; // MM-DD 형식
  isLunar: boolean;
  type: "birthday" | "deathday" | "memorial" | "custom";
  personId?: string;
  memo?: string;
  recurring: boolean; // 매년 반복
}

const STORAGE_KEY = "happyfamilytree_calendar";

export function getCalendarEvents(): CalendarEvent[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as CalendarEvent[];
  } catch {
    return [];
  }
}

export function addCalendarEvent(
  event: Omit<CalendarEvent, "id">
): CalendarEvent {
  const events = getCalendarEvents();
  const newEvent: CalendarEvent = {
    ...event,
    id: `cal_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
  };
  events.push(newEvent);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
  return newEvent;
}

export function deleteCalendarEvent(id: string): void {
  const events = getCalendarEvents().filter((e) => e.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
}

// YYYY-MM-DD 또는 YYYY 형식에서 월-일 추출
export function parseMonthDay(
  dateStr: string | undefined
): { month: number; day: number } | null {
  if (!dateStr) return null;
  const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (match) {
    return { month: parseInt(match[2], 10), day: parseInt(match[3], 10) };
  }
  return null;
}

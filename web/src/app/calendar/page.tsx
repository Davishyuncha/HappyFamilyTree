"use client";

import { useState, useEffect, useMemo } from "react";
import { Person } from "@/lib/types";
import { getStoredFamilyTree } from "@/lib/store";
import {
  CalendarEvent,
  getCalendarEvents,
  addCalendarEvent,
  deleteCalendarEvent,
  parseMonthDay,
} from "@/lib/calendar-store";

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];
const TYPE_LABELS: Record<CalendarEvent["type"], string> = {
  birthday: "생일",
  deathday: "기일",
  memorial: "제사",
  custom: "기타",
};
const TYPE_COLORS: Record<CalendarEvent["type"], string> = {
  birthday: "bg-pink-100 text-pink-700 border-pink-300",
  deathday: "bg-gray-100 text-gray-700 border-gray-300",
  memorial: "bg-purple-100 text-purple-700 border-purple-300",
  custom: "bg-blue-100 text-blue-700 border-blue-300",
};
const TYPE_DOTS: Record<CalendarEvent["type"], string> = {
  birthday: "bg-pink-500",
  deathday: "bg-gray-500",
  memorial: "bg-purple-500",
  custom: "bg-blue-500",
};

export default function CalendarPage() {
  const [members, setMembers] = useState<Person[]>([]);
  const [customEvents, setCustomEvents] = useState<CalendarEvent[]>([]);
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [showForm, setShowForm] = useState(false);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  useEffect(() => {
    setMembers(getStoredFamilyTree().members);
    setCustomEvents(getCalendarEvents());
  }, []);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth(); // 0-indexed

  // 인물 데이터에서 자동 생성되는 이벤트
  const autoEvents = useMemo(() => {
    const events: CalendarEvent[] = [];
    for (const m of members) {
      const birth = parseMonthDay(m.birthDateSolar);
      if (birth) {
        events.push({
          id: `auto_birth_${m.id}`,
          title: `${m.nameKorean} 생일`,
          date: `${String(birth.month).padStart(2, "0")}-${String(birth.day).padStart(2, "0")}`,
          isLunar: false,
          type: "birthday",
          personId: m.id,
          recurring: true,
        });
      }
      const birthLunar = parseMonthDay(m.birthDateLunar);
      if (birthLunar && !birth) {
        events.push({
          id: `auto_birth_lunar_${m.id}`,
          title: `${m.nameKorean} 생일 (음)`,
          date: `${String(birthLunar.month).padStart(2, "0")}-${String(birthLunar.day).padStart(2, "0")}`,
          isLunar: true,
          type: "birthday",
          personId: m.id,
          recurring: true,
        });
      }
      const death = parseMonthDay(m.deathDateSolar);
      if (death) {
        events.push({
          id: `auto_death_${m.id}`,
          title: `${m.nameKorean} 기일`,
          date: `${String(death.month).padStart(2, "0")}-${String(death.day).padStart(2, "0")}`,
          isLunar: false,
          type: "deathday",
          personId: m.id,
          recurring: true,
        });
      }
    }
    return events;
  }, [members]);

  const allEvents = [...autoEvents, ...customEvents];

  // 해당 월의 이벤트
  function getEventsForDay(day: number): CalendarEvent[] {
    const mm = String(month + 1).padStart(2, "0");
    const dd = String(day).padStart(2, "0");
    const dateStr = `${mm}-${dd}`;
    return allEvents.filter((e) => e.date === dateStr);
  }

  // 달력 그리드 생성
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const calendarDays: (number | null)[] = [];
  for (let i = 0; i < firstDayOfMonth; i++) calendarDays.push(null);
  for (let d = 1; d <= daysInMonth; d++) calendarDays.push(d);
  while (calendarDays.length % 7 !== 0) calendarDays.push(null);

  function prevMonth() {
    setCurrentDate(new Date(year, month - 1, 1));
    setSelectedDay(null);
  }
  function nextMonth() {
    setCurrentDate(new Date(year, month + 1, 1));
    setSelectedDay(null);
  }
  function goToday() {
    setCurrentDate(new Date());
    setSelectedDay(new Date().getDate());
  }

  const today = new Date();
  const isCurrentMonth =
    today.getFullYear() === year && today.getMonth() === month;

  // 이번 달/다음 달 다가오는 이벤트
  const upcomingEvents = useMemo(() => {
    const todayMM = String(today.getMonth() + 1).padStart(2, "0");
    const todayDD = String(today.getDate()).padStart(2, "0");
    const todayStr = `${todayMM}-${todayDD}`;

    return allEvents
      .map((e) => ({ ...e, sortKey: e.date >= todayStr ? e.date : `Z${e.date}` }))
      .sort((a, b) => a.sortKey.localeCompare(b.sortKey))
      .slice(0, 10);
  }, [allEvents, today]);

  function handleDelete(id: string) {
    if (id.startsWith("auto_")) return;
    deleteCalendarEvent(id);
    setCustomEvents(getCalendarEvents());
  }

  function handleAddEvent(event: Omit<CalendarEvent, "id">) {
    addCalendarEvent(event);
    setCustomEvents(getCalendarEvents());
    setShowForm(false);
  }

  // 선택된 날의 이벤트
  const selectedDayEvents = selectedDay ? getEventsForDay(selectedDay) : [];

  return (
    <div className="min-h-[calc(100vh-44px)] bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
              가족 캘린더
            </h1>
            <p className="text-xs sm:text-sm text-gray-500">
              생일, 기일, 제사 등 가족 주요 일정
            </p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="px-3 sm:px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-medium transition-colors flex items-center gap-1.5"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <line x1="8" y1="3" x2="8" y2="13" />
              <line x1="3" y1="8" x2="13" y2="8" />
            </svg>
            일정 추가
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* 캘린더 */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              {/* 월 네비게이션 */}
              <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-100">
                <button
                  onClick={prevMonth}
                  className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-600"
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M10 3L5 8l5 5" />
                  </svg>
                </button>
                <div className="flex items-center gap-3">
                  <h2 className="text-lg sm:text-xl font-bold text-gray-900">
                    {year}년 {month + 1}월
                  </h2>
                  <button
                    onClick={goToday}
                    className="px-2.5 py-1 rounded-md bg-gray-100 hover:bg-gray-200 text-xs font-medium text-gray-600"
                  >
                    오늘
                  </button>
                </div>
                <button
                  onClick={nextMonth}
                  className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-600"
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M6 3l5 5-5 5" />
                  </svg>
                </button>
              </div>

              {/* 요일 헤더 */}
              <div className="grid grid-cols-7 border-b border-gray-100">
                {WEEKDAYS.map((day, i) => (
                  <div
                    key={day}
                    className={`text-center text-xs font-medium py-2 ${
                      i === 0
                        ? "text-red-500"
                        : i === 6
                          ? "text-blue-500"
                          : "text-gray-500"
                    }`}
                  >
                    {day}
                  </div>
                ))}
              </div>

              {/* 날짜 그리드 */}
              <div className="grid grid-cols-7">
                {calendarDays.map((day, idx) => {
                  if (day === null) {
                    return (
                      <div
                        key={`empty-${idx}`}
                        className="min-h-[60px] sm:min-h-[80px] border-b border-r border-gray-50"
                      />
                    );
                  }
                  const dayEvents = getEventsForDay(day);
                  const isToday = isCurrentMonth && today.getDate() === day;
                  const isSelected = selectedDay === day;
                  const colIdx = idx % 7;

                  return (
                    <div
                      key={day}
                      onClick={() =>
                        setSelectedDay(selectedDay === day ? null : day)
                      }
                      className={`min-h-[60px] sm:min-h-[80px] p-1 sm:p-1.5 border-b border-r border-gray-50 cursor-pointer transition-colors ${
                        isSelected
                          ? "bg-blue-50"
                          : "hover:bg-gray-50"
                      }`}
                    >
                      <div
                        className={`text-xs sm:text-sm font-medium mb-0.5 w-6 h-6 flex items-center justify-center rounded-full ${
                          isToday
                            ? "bg-blue-600 text-white"
                            : colIdx === 0
                              ? "text-red-500"
                              : colIdx === 6
                                ? "text-blue-500"
                                : "text-gray-700"
                        }`}
                      >
                        {day}
                      </div>
                      {/* 이벤트 표시 */}
                      <div className="space-y-0.5">
                        {dayEvents.slice(0, 2).map((ev) => (
                          <div
                            key={ev.id}
                            className={`text-[9px] sm:text-[10px] leading-tight px-1 py-0.5 rounded truncate ${TYPE_COLORS[ev.type]}`}
                          >
                            {ev.title}
                          </div>
                        ))}
                        {dayEvents.length > 2 && (
                          <div className="text-[9px] text-gray-400 pl-1">
                            +{dayEvents.length - 2}
                          </div>
                        )}
                      </div>
                      {/* 모바일: 점 표시 */}
                      {dayEvents.length > 0 && (
                        <div className="flex gap-0.5 mt-0.5 sm:hidden">
                          {dayEvents.slice(0, 3).map((ev) => (
                            <span
                              key={ev.id}
                              className={`w-1.5 h-1.5 rounded-full ${TYPE_DOTS[ev.type]}`}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 선택된 날짜의 이벤트 상세 */}
            {selectedDay && (
              <div className="mt-4 bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-5">
                <h3 className="text-sm font-bold text-gray-800 mb-3">
                  {month + 1}월 {selectedDay}일 일정
                </h3>
                {selectedDayEvents.length === 0 ? (
                  <p className="text-sm text-gray-400">등록된 일정이 없습니다.</p>
                ) : (
                  <div className="space-y-2">
                    {selectedDayEvents.map((ev) => (
                      <div
                        key={ev.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-gray-50 border border-gray-100"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span
                            className={`shrink-0 text-[10px] px-2 py-0.5 rounded-full border font-medium ${TYPE_COLORS[ev.type]}`}
                          >
                            {TYPE_LABELS[ev.type]}
                          </span>
                          <div className="min-w-0">
                            <div className="text-sm font-medium text-gray-800 truncate">
                              {ev.title}
                            </div>
                            {ev.isLunar && (
                              <span className="text-[10px] text-orange-500">
                                음력
                              </span>
                            )}
                            {ev.memo && (
                              <p className="text-xs text-gray-500 mt-0.5 truncate">
                                {ev.memo}
                              </p>
                            )}
                          </div>
                        </div>
                        {!ev.id.startsWith("auto_") && (
                          <button
                            onClick={() => {
                              if (confirm("이 일정을 삭제하시겠습니까?"))
                                handleDelete(ev.id);
                            }}
                            className="text-xs text-red-400 hover:text-red-600 shrink-0 ml-2"
                          >
                            삭제
                          </button>
                        )}
                        {ev.id.startsWith("auto_") && (
                          <span className="text-[10px] text-gray-300 shrink-0 ml-2">
                            자동
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 우측 패널: 다가오는 일정 */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-5">
              <h3 className="text-sm font-bold text-gray-800 mb-3">
                다가오는 일정
              </h3>
              {upcomingEvents.length === 0 ? (
                <p className="text-sm text-gray-400">등록된 일정이 없습니다.</p>
              ) : (
                <div className="space-y-2">
                  {upcomingEvents.map((ev) => {
                    const [mm, dd] = ev.date.split("-");
                    return (
                      <div
                        key={ev.id}
                        className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <div className="text-center shrink-0 w-10">
                          <div className="text-xs text-gray-400">
                            {parseInt(mm)}월
                          </div>
                          <div className="text-lg font-bold text-gray-800">
                            {parseInt(dd)}
                          </div>
                        </div>
                        <div className="min-w-0 pt-0.5">
                          <div className="text-sm font-medium text-gray-800 truncate">
                            {ev.title}
                          </div>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span
                              className={`text-[10px] px-1.5 py-0.5 rounded-full border font-medium ${TYPE_COLORS[ev.type]}`}
                            >
                              {TYPE_LABELS[ev.type]}
                            </span>
                            {ev.isLunar && (
                              <span className="text-[10px] text-orange-500">
                                음력
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 범례 */}
            <div className="mt-4 bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                범례
              </h3>
              <div className="space-y-1.5">
                {(
                  Object.entries(TYPE_LABELS) as [CalendarEvent["type"], string][]
                ).map(([key, label]) => (
                  <div key={key} className="flex items-center gap-2 text-xs">
                    <span
                      className={`w-2.5 h-2.5 rounded-full ${TYPE_DOTS[key]}`}
                    />
                    <span className="text-gray-600">{label}</span>
                    {key === "birthday" && (
                      <span className="text-gray-400">- 인물 생년에서 자동 표시</span>
                    )}
                    {key === "deathday" && (
                      <span className="text-gray-400">- 인물 몰년에서 자동 표시</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 일정 추가 모달 */}
      {showForm && (
        <EventFormModal
          members={members}
          onSubmit={handleAddEvent}
          onClose={() => setShowForm(false)}
        />
      )}
    </div>
  );
}

/* ─── 일정 추가 모달 ─── */
function EventFormModal({
  members,
  onSubmit,
  onClose,
}: {
  members: Person[];
  onSubmit: (event: Omit<CalendarEvent, "id">) => void;
  onClose: () => void;
}) {
  const [title, setTitle] = useState("");
  const [month, setMonth] = useState(String(new Date().getMonth() + 1));
  const [day, setDay] = useState(String(new Date().getDate()));
  const [isLunar, setIsLunar] = useState(false);
  const [type, setType] = useState<CalendarEvent["type"]>("memorial");
  const [personId, setPersonId] = useState("");
  const [memo, setMemo] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    const mm = String(parseInt(month)).padStart(2, "0");
    const dd = String(parseInt(day)).padStart(2, "0");
    onSubmit({
      title: title.trim(),
      date: `${mm}-${dd}`,
      isLunar,
      type,
      personId: personId || undefined,
      memo: memo.trim() || undefined,
      recurring: true,
    });
  }

  // 인물 중 남성만 (주요 인물)
  const selectableMembers = members
    .filter((m) => m.nameKorean && !m.nameKorean.includes("씨"))
    .sort((a, b) => a.generation - b.generation);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/40" />
      <div
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 pt-5 pb-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">일정 추가</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            생일, 기일, 제사 등 가족 일정을 등록합니다
          </p>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
          {/* 일정 유형 */}
          <div>
            <label className="block text-xs text-gray-500 mb-1.5">
              일정 유형
            </label>
            <div className="flex gap-2 flex-wrap">
              {(
                Object.entries(TYPE_LABELS) as [CalendarEvent["type"], string][]
              ).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setType(key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                    type === key
                      ? TYPE_COLORS[key]
                      : "bg-white text-gray-500 border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* 제목 */}
          <div>
            <label className="block text-xs text-gray-500 mb-1">
              제목 *
            </label>
            <input
              className="input"
              placeholder="예: 할아버지 제사"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          {/* 날짜 */}
          <div>
            <label className="block text-xs text-gray-500 mb-1">날짜 *</label>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min={1}
                  max={12}
                  className="input w-16 text-center"
                  value={month}
                  onChange={(e) => setMonth(e.target.value)}
                  required
                />
                <span className="text-sm text-gray-500">월</span>
              </div>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min={1}
                  max={31}
                  className="input w-16 text-center"
                  value={day}
                  onChange={(e) => setDay(e.target.value)}
                  required
                />
                <span className="text-sm text-gray-500">일</span>
              </div>
              <label className="flex items-center gap-1.5 ml-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isLunar}
                  onChange={(e) => setIsLunar(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-orange-500 focus:ring-orange-400"
                />
                <span className="text-xs text-orange-600 font-medium">
                  음력
                </span>
              </label>
            </div>
          </div>

          {/* 관련 인물 */}
          <div>
            <label className="block text-xs text-gray-500 mb-1">
              관련 인물 (선택)
            </label>
            <select
              className="input"
              value={personId}
              onChange={(e) => setPersonId(e.target.value)}
            >
              <option value="">선택 안 함</option>
              {selectableMembers.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.generation}세 {m.nameKorean}
                  {m.nameHanja ? ` (${m.nameHanja})` : ""}
                </option>
              ))}
            </select>
          </div>

          {/* 메모 */}
          <div>
            <label className="block text-xs text-gray-500 mb-1">
              메모 (선택)
            </label>
            <textarea
              className="input"
              rows={2}
              placeholder="추가 정보를 입력하세요"
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              style={{ resize: "vertical" }}
            />
          </div>

          {/* 버튼 */}
          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              className="flex-1 px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors"
            >
              등록
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium transition-colors"
            >
              취소
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

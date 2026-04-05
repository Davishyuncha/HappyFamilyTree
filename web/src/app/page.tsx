"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Person } from "@/lib/types";
import {
  getStoredFamilyTree,
  getNextId,
  addPerson,
  updatePerson,

} from "@/lib/store";
import FamilyTreeView from "@/components/FamilyTreeView";
import PersonFormModal from "@/components/PersonFormModal";

export default function Home() {
  const [members, setMembers] = useState<Person[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState<Person | undefined>(undefined);

  useEffect(() => {
    setMembers(getStoredFamilyTree().members);
  }, []);

  const familyTree = getStoredFamilyTree();
  const livingCount = members.filter((m) => m.isLiving).length;
  const totalCount = members.length;
  const generations = [...new Set(members.map((m) => m.generation))];

  function handleAdd() {
    setEditTarget(undefined);
    setShowForm(true);
  }
function handleSave(person: Person) {
  if (editTarget) {
    updatePerson(person);
  } else {
    addPerson(person);
  }

  setMembers(getStoredFamilyTree().members);
  setShowForm(false);
  setEditTarget(undefined);
}
  


  return (
    <div className="flex flex-col h-screen">
      {/* 헤더 */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-full mx-auto px-4 sm:px-6 py-3 sm:py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white font-bold text-base sm:text-lg shrink-0">
              {familyTree.originPlace.charAt(0)}
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-gray-900">
                {familyTree.clanName}
              </h1>
              <p className="text-xs sm:text-sm text-gray-500">
                본관: {familyTree.originPlace} | 시조: {familyTree.founderName}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 sm:gap-6 text-sm w-full sm:w-auto">
            <div className="flex items-center gap-3 sm:gap-6">
              <div className="text-center">
                <div className="text-base sm:text-lg font-bold text-blue-600">{totalCount}</div>
                <div className="text-gray-500 text-[10px] sm:text-sm">전체</div>
              </div>
              <div className="text-center">
                <div className="text-base sm:text-lg font-bold text-emerald-600">
                  {livingCount}
                </div>
                <div className="text-gray-500 text-[10px] sm:text-sm">생존</div>
              </div>
              <div className="text-center">
                <div className="text-base sm:text-lg font-bold text-purple-600">
                  {generations.length}
                </div>
                <div className="text-gray-500 text-[10px] sm:text-sm">세대</div>
              </div>
            </div>
            <div className="flex items-center gap-2 ml-auto sm:ml-4">
              <Link
                href="/calendar"
                className="px-3 sm:px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-xs sm:text-sm font-medium transition-colors flex items-center gap-1.5"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="hidden sm:block"
                >
                  <rect x="2" y="3" width="12" height="11" rx="1.5" />
                  <path d="M5 1v3M11 1v3M2 7h12" />
                </svg>
                캘린더
              </Link>
              <Link
                href="/plaza"
                className="px-3 sm:px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-xs sm:text-sm font-medium transition-colors flex items-center gap-1.5"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="hidden sm:block"
                >
                  <rect x="2" y="3" width="12" height="10" rx="2" />
                  <path d="M5 7h6M5 10h4" />
                </svg>
                광장
              </Link>
              <button
                onClick={handleAdd}
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
                <span className="hidden sm:inline">인물 추가</span>
                <span className="sm:hidden">추가</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* 가계도 영역 */}
      <main className="flex-1 overflow-hidden">
        <FamilyTreeView members={members} onEditPerson={(p) => { setEditTarget(p); setShowForm(true); }} />
      </main>

      {/* 인물 추가/수정 모달 */}
      {showForm && (
        <PersonFormModal
          person={editTarget}
          members={members}
          nextId={getNextId(members)}
          onSave={handleSave}
          onClose={() => {
            setShowForm(false);
            setEditTarget(undefined);
          }}
        />
      )}
    </div>
  );
}

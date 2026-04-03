"use client";

import { useState, useEffect } from "react";
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
      const updated = updatePerson(person);
      setMembers(updated);
    } else {
      const updated = addPerson(person);
      setMembers(updated);
    }
    setShowForm(false);
    setEditTarget(undefined);
  }

  return (
    <div className="flex flex-col h-screen">
      {/* 헤더 */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-full mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white font-bold text-lg">
              {familyTree.originPlace.charAt(0)}
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                {familyTree.clanName}
              </h1>
              <p className="text-sm text-gray-500">
                본관: {familyTree.originPlace} | 시조: {familyTree.founderName}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-6 text-sm">
            <div className="text-center">
              <div className="text-lg font-bold text-blue-600">{totalCount}</div>
              <div className="text-gray-500">전체 인물</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-emerald-600">
                {livingCount}
              </div>
              <div className="text-gray-500">생존 인물</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-purple-600">
                {generations.length}
              </div>
              <div className="text-gray-500">세대</div>
            </div>
            <button
              onClick={handleAdd}
              className="ml-4 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors flex items-center gap-1.5"
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
              인물 추가
            </button>
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

"use client";

import { useState } from "react";
import { Person } from "@/lib/types";
import {
  getStoredFamilyTree,
  getNextId,
  updatePerson,
} from "@/lib/store";
import PersonFormModal from "./PersonFormModal";

export default function EditPersonButton({ personId }: { personId: string }) {
  const [showForm, setShowForm] = useState(false);
  const [members, setMembers] = useState<Person[]>([]);
  const [person, setPerson] = useState<Person | undefined>(undefined);

  function handleOpen() {
    const tree = getStoredFamilyTree();
    setMembers(tree.members);
    setPerson(tree.members.find((m) => m.id === personId));
    setShowForm(true);
  }

  function handleSave(updated: Person) {
    updatePerson(updated);
    setShowForm(false);
    window.location.reload();
  }

  return (
    <>
      <button
        onClick={handleOpen}
        className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition-colors flex items-center gap-1.5"
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 14 14"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <path d="M10.5 1.5l2 2L4.5 11.5H2.5v-2l8-8z" />
        </svg>
        수정
      </button>

      {showForm && person && (
        <PersonFormModal
          person={person}
          members={members}
          nextId={getNextId(members)}
          onSave={handleSave}
          onClose={() => setShowForm(false)}
        />
      )}
    </>
  );
}

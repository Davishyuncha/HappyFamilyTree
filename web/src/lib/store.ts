import { Person, FamilyTree } from "./types";
import { familyTree as staticFamilyTree } from "./data";

const STORAGE_KEY = "happyfamilytree_members";

function loadMembers(): Person[] {
  if (typeof window === "undefined") return staticFamilyTree.members;
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {
      return staticFamilyTree.members;
    }
  }
  return staticFamilyTree.members;
}

function saveMembers(members: Person[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(members));
}

export function getStoredFamilyTree(): FamilyTree {
  return {
    ...staticFamilyTree,
    members: loadMembers(),
  };
}

export function getNextId(members: Person[]): string {
  let maxNum = 0;
  for (const m of members) {
    const match = m.id.match(/^[ps](\d+)$/);
    if (match) {
      const num = parseInt(match[1], 10);
      if (num > maxNum) maxNum = num;
    }
  }
  return `p${maxNum + 1}`;
}

export function addPerson(person: Person): Person[] {
  const members = loadMembers();
  members.push(person);

  // 부모의 childrenIds에 추가
  if (person.fatherId) {
    const father = members.find((m) => m.id === person.fatherId);
    if (father) {
      if (!father.childrenIds) father.childrenIds = [];
      if (!father.childrenIds.includes(person.id)) {
        father.childrenIds.push(person.id);
      }
    }
  }

  saveMembers(members);
  return members;
}

export function updatePerson(updated: Person): Person[] {
  const members = loadMembers();
  const idx = members.findIndex((m) => m.id === updated.id);
  if (idx === -1) return members;

  const old = members[idx];

  // 부모가 바뀌었으면 이전 부모의 childrenIds에서 제거
  if (old.fatherId && old.fatherId !== updated.fatherId) {
    const oldFather = members.find((m) => m.id === old.fatherId);
    if (oldFather?.childrenIds) {
      oldFather.childrenIds = oldFather.childrenIds.filter(
        (id) => id !== updated.id
      );
    }
  }

  // 새 부모의 childrenIds에 추가
  if (updated.fatherId && updated.fatherId !== old.fatherId) {
    const newFather = members.find((m) => m.id === updated.fatherId);
    if (newFather) {
      if (!newFather.childrenIds) newFather.childrenIds = [];
      if (!newFather.childrenIds.includes(updated.id)) {
        newFather.childrenIds.push(updated.id);
      }
    }
  }

  members[idx] = updated;
  saveMembers(members);
  return members;
}

export function resetToDefault(): Person[] {
  if (typeof window !== "undefined") {
    localStorage.removeItem(STORAGE_KEY);
  }
  return staticFamilyTree.members;
}

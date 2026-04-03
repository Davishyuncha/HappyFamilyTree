import { familyTree } from "@/lib/data";
import FamilyTreeView from "@/components/FamilyTreeView";

export default function Home() {
  const livingCount = familyTree.members.filter((m) => m.isLiving).length;
  const totalCount = familyTree.members.length;
  const generations = [...new Set(familyTree.members.map((m) => m.generation))];

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
          </div>
        </div>
      </header>

      {/* 가계도 영역 */}
      <main className="flex-1 overflow-hidden">
        <FamilyTreeView />
      </main>
    </div>
  );
}

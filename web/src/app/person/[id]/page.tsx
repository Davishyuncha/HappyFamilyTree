import { familyTree, getPerson, getSpouse, getChildren } from "@/lib/data";
import Link from "next/link";
import { notFound } from "next/navigation";
import EditPersonButton from "@/components/EditPersonButton";

export function generateStaticParams() {
  return familyTree.members.map((m) => ({ id: m.id }));
}

export default async function PersonPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const person = getPerson(id);
  if (!person) notFound();

  const spouse = getSpouse(person);
  const children = getChildren(person.id);
  const father = person.fatherId ? getPerson(person.fatherId) : undefined;
  const mother = person.motherId ? getPerson(person.motherId) : undefined;

  const borderColor = person.gender === "male" ? "border-blue-500" : "border-pink-400";
  const bgColor = person.gender === "male" ? "bg-blue-50" : "bg-pink-50";

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 상단 도구 바 */}
      <nav className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-end">
        <EditPersonButton personId={person.id} />
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-8">
        {/* 프로필 카드 */}
        <div className={`bg-white rounded-2xl shadow-sm border-t-4 ${borderColor} overflow-hidden`}>
          <div className={`${bgColor} px-8 pt-8 pb-6`}>
            <div className="flex items-start gap-6">
              {/* 아바타 */}
              <div
                className={`w-24 h-24 rounded-full ${bgColor} border-4 ${borderColor} flex items-center justify-center text-4xl shrink-0`}
              >
                {person.gender === "male" ? "\u{1F468}" : "\u{1F469}"}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <h1 className="text-3xl font-bold text-gray-900">
                    {person.nameKorean}
                  </h1>
                  {person.nameHanja && (
                    <span className="text-xl text-gray-400">
                      ({person.nameHanja})
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-600 mt-2 flex-wrap">
                  <span className="inline-flex items-center px-3 py-1 rounded-full bg-white/80 font-medium">
                    제{person.generation}세
                  </span>
                  {person.courtesyName && <span>자(字): {person.courtesyName}</span>}
                  {person.penName && <span>호(號): {person.penName}</span>}
                  {person.branch && <span>파: {person.branch}</span>}
                  {person.isLiving && (
                    <span className="inline-flex items-center gap-1 text-emerald-600">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      생존
                    </span>
                  )}
                </div>
                {person.position && (
                  <div className="mt-2">
                    <span className="inline-flex items-center px-3 py-1 rounded-full bg-indigo-100 text-indigo-700 text-sm font-medium">
                      {person.position}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="px-8 py-6 space-y-8">
            {/* 기본 정보 */}
            <section>
              <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
                기본 정보
              </h2>
              <div className="grid grid-cols-2 gap-4">
                {person.birthDateSolar && (
                  <InfoItem label="출생" value={person.birthDateSolar} />
                )}
                {person.deathDateSolar && (
                  <InfoItem label="사망" value={person.deathDateSolar} />
                )}
                {person.birthDateLunar && (
                  <InfoItem label="출생 (음력)" value={person.birthDateLunar} />
                )}
                <InfoItem
                  label="성별"
                  value={person.gender === "male" ? "남" : "여"}
                />
                <InfoItem label="세대" value={`제${person.generation}세`} />
                {person.courtesyName && (
                  <InfoItem label="자(字)" value={person.courtesyName} />
                )}
                {person.penName && (
                  <InfoItem label="호(號)" value={person.penName} />
                )}
                {person.generationChar && (
                  <InfoItem label="항렬자" value={person.generationChar} />
                )}
                {person.position && (
                  <InfoItem label="관직/직업" value={person.position} />
                )}
              </div>
            </section>

            {/* 가족 관계 */}
            <section>
              <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
                가족 관계
              </h2>
              <div className="space-y-3">
                {father && (
                  <RelationLink label="부" person={father} />
                )}
                {mother && (
                  <RelationLink label="모" person={mother} />
                )}
                {spouse && (
                  <div>
                    <RelationLink label="배우자" person={spouse} />
                    {spouse.spouseClan && (
                      <span className="ml-16 text-xs text-pink-600">{spouse.spouseClan}</span>
                    )}
                  </div>
                )}
                {children.length > 0 && (
                  <div>
                    <span className="text-sm text-gray-500 mr-3">자녀:</span>
                    <div className="inline-flex flex-wrap gap-2 mt-1">
                      {children.map((child) => (
                        <Link
                          key={child.id}
                          href={`/person/${child.id}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 hover:bg-blue-50 rounded-lg text-sm font-medium text-gray-700 hover:text-blue-700 transition-colors border border-gray-200"
                        >
                          <span className="text-xs">
                            {child.gender === "male" ? "\u{1F466}" : "\u{1F467}"}
                          </span>
                          {child.nameKorean}
                          {child.nameHanja && (
                            <span className="text-gray-400 text-xs">({child.nameHanja})</span>
                          )}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* 배우자 정보 상세 */}
            {spouse && (
              <section>
                <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
                  배우자 정보
                </h2>
                <div className="bg-pink-50 rounded-xl p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{spouse.gender === "male" ? "\u{1F468}" : "\u{1F469}"}</span>
                    <span className="font-medium text-gray-800">{spouse.nameKorean}</span>
                    {spouse.nameHanja && (
                      <span className="text-gray-400 text-sm">({spouse.nameHanja})</span>
                    )}
                  </div>
                  {spouse.spouseClan && (
                    <p className="text-sm text-gray-600">본관/성씨: {spouse.spouseClan}</p>
                  )}
                  {spouse.birthDateSolar && (
                    <p className="text-sm text-gray-600">출생: {spouse.birthDateSolar}</p>
                  )}
                  {spouse.deathDateSolar && (
                    <p className="text-sm text-gray-600">사망: {spouse.deathDateSolar}</p>
                  )}
                  {spouse.bio && (
                    <p className="text-sm text-gray-600">{spouse.bio}</p>
                  )}
                  {spouse.burialLocation && (
                    <p className="text-sm text-gray-600">묘소: {spouse.burialLocation}</p>
                  )}
                </div>
              </section>
            )}

            {/* 약력 */}
            {person.bio && (
              <section>
                <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
                  약력 / 비고
                </h2>
                <p className="text-gray-700 leading-relaxed">{person.bio}</p>
              </section>
            )}

            {/* 묘소 정보 */}
            {person.burialLocation && (
              <section>
                <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
                  묘소 정보
                </h2>
                <div className="bg-amber-50 rounded-xl p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{"⛰"}</span>
                    <span className="font-medium text-gray-800">{person.burialLocation}</span>
                  </div>
                  {person.burialDirection && (
                    <p className="text-sm text-gray-600">좌향: {person.burialDirection}</p>
                  )}
                  {person.burialJoint && (
                    <p className="text-sm text-gray-600">합장: {person.burialJoint}</p>
                  )}
                </div>
              </section>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-gray-50 rounded-xl px-4 py-3">
      <div className="text-xs text-gray-400 mb-0.5">{label}</div>
      <div className="text-sm font-medium text-gray-800">{value}</div>
    </div>
  );
}

function RelationLink({
  label,
  person,
}: {
  label: string;
  person: { id: string; nameKorean: string; nameHanja?: string; gender: string };
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-gray-500 w-12">{label}:</span>
      <Link
        href={`/person/${person.id}`}
        className="inline-flex items-center gap-2 px-3 py-2 bg-gray-50 hover:bg-blue-50 rounded-lg text-sm font-medium text-gray-700 hover:text-blue-700 transition-colors border border-gray-200"
      >
        <span>{person.gender === "male" ? "\u{1F468}" : "\u{1F469}"}</span>
        {person.nameKorean}
        {person.nameHanja && (
          <span className="text-gray-400 text-xs">({person.nameHanja})</span>
        )}
      </Link>
    </div>
  );
}

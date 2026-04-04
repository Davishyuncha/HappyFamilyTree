"use client";

import { useState, useRef } from "react";
import { Person } from "@/lib/types";
import Link from "next/link";

// 트리 노드 위치 계산용 타입
interface TreeNode {
  person: Person;
  spouse?: Person;
  x: number;
  y: number;
  children: TreeNode[];
}

const NODE_WIDTH = 200;
const NODE_HEIGHT = 130;
const HORIZONTAL_GAP = 30;
const VERTICAL_GAP = 60;
const SPOUSE_GAP = 10;

function buildTree(person: Person, allMembers: Person[]): TreeNode {
  const children = allMembers.filter((m) => m.fatherId === person.id);
  const spouseId = person.spouseIds?.[0];
  const spouse = spouseId
    ? allMembers.find((m) => m.id === spouseId)
    : undefined;
  const childNodes = children
    .filter((c) => c.gender === "male" || c.gender === "female")
    .map((child) => buildTree(child, allMembers));

  return {
    person,
    spouse,
    x: 0,
    y: 0,
    children: childNodes,
  };
}

function calculateSubtreeWidth(node: TreeNode): number {
  if (node.children.length === 0) {
    return node.spouse ? NODE_WIDTH * 2 + SPOUSE_GAP : NODE_WIDTH;
  }
  const childrenWidth = node.children.reduce(
    (sum, child) => sum + calculateSubtreeWidth(child) + HORIZONTAL_GAP,
    -HORIZONTAL_GAP
  );
  const selfWidth = node.spouse ? NODE_WIDTH * 2 + SPOUSE_GAP : NODE_WIDTH;
  return Math.max(selfWidth, childrenWidth);
}

function layoutTree(node: TreeNode, x: number, y: number): void {
  const subtreeWidth = calculateSubtreeWidth(node);
  const selfWidth = node.spouse ? NODE_WIDTH * 2 + SPOUSE_GAP : NODE_WIDTH;

  node.x = x + (subtreeWidth - selfWidth) / 2;
  node.y = y;

  let childX = x;
  for (const child of node.children) {
    const childWidth = calculateSubtreeWidth(child);
    layoutTree(child, childX, y + NODE_HEIGHT + VERTICAL_GAP);
    childX += childWidth + HORIZONTAL_GAP;
  }
}

function getAllNodes(node: TreeNode): TreeNode[] {
  const result: TreeNode[] = [node];
  for (const child of node.children) {
    result.push(...getAllNodes(child));
  }
  return result;
}

// 세대 뱃지 색상 (20세~43세)
function getGenerationColor(gen: number): string {
  const palette = [
    "#8B5CF6", "#7C3AED", "#6D28D9", "#4C1D95",
    "#3B82F6", "#2563EB", "#1D4ED8", "#1E40AF",
    "#10B981", "#059669", "#047857", "#065F46",
    "#F59E0B", "#D97706", "#B45309", "#92400E",
    "#EF4444", "#DC2626", "#B91C1C", "#991B1B",
    "#EC4899", "#DB2777", "#6366F1", "#4F46E5",
  ];
  const idx = gen - 20;
  return palette[idx % palette.length] || "#6B7280";
}

// 텍스트 줄임
function truncate(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text;
  return text.substring(0, maxLen - 1) + "…";
}

function PersonCard({
  person,
  x,
  y,
  isSpouse,
  onEdit,
  onClick,
  isSearchMatch,
}: {
  person: Person;
  x: number;
  y: number;
  isSpouse?: boolean;
  onEdit?: (person: Person) => void;
  onClick?: (person: Person) => void;
  isSearchMatch?: boolean;
}) {
  const genColor = getGenerationColor(person.generation);
  const borderColor = person.gender === "male" ? "#3B82F6" : "#EC4899";

  // 생몰년 표시
  let lifeSpan = "";
  if (person.birthDateSolar) {
    const birth = person.birthDateSolar.length >= 4
      ? person.birthDateSolar.substring(0, 4)
      : person.birthDateSolar;
    lifeSpan = birth;
    if (person.deathDateSolar) {
      const death = person.deathDateSolar.length >= 4
        ? person.deathDateSolar.substring(0, 4)
        : person.deathDateSolar;
      lifeSpan += ` ~ ${death}`;
    } else if (person.isLiving) {
      lifeSpan += " ~ 생존";
    }
  }

  return (
    <g
      transform={`translate(${x}, ${y})`}
      className="cursor-pointer"
      role="button"
      tabIndex={0}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.(person);
      }}
    >
      {/* 검색 하이라이트 */}
      {isSearchMatch && (
        <rect
          x={-6}
          y={-6}
          width={NODE_WIDTH + 12}
          height={NODE_HEIGHT + 12}
          rx={16}
          ry={16}
          fill="none"
          stroke="#F59E0B"
          strokeWidth={4}
          strokeDasharray="8 4"
        >
          <animate attributeName="stroke-dashoffset" from="0" to="24" dur="1s" repeatCount="indefinite" />
        </rect>
      )}
      {/* 카드 배경 */}
      <rect
        width={NODE_WIDTH}
        height={NODE_HEIGHT}
        rx={12}
        ry={12}
        fill="white"
        stroke={isSearchMatch ? "#F59E0B" : borderColor}
        strokeWidth={isSearchMatch ? 3.5 : 2.5}
        filter="url(#shadow)"
      />
      {/* 세대 뱃지 */}
      <rect
        x={NODE_WIDTH - 48}
        y={8}
        width={38}
        height={20}
        rx={10}
        fill={genColor}
      />
      <text
        x={NODE_WIDTH - 29}
        y={22}
        textAnchor="middle"
        fill="white"
        fontSize={11}
        fontWeight="bold"
      >
        {person.generation}세
      </text>
      {/* 성별 아이콘 / 프로필 사진 */}
      {person.profilePhoto ? (
        <>
          <defs>
            <clipPath id={`clip-${person.id}`}>
              <circle cx={24} cy={32} r={16} />
            </clipPath>
          </defs>
          <image
            href={person.profilePhoto}
            x={8}
            y={16}
            width={32}
            height={32}
            clipPath={`url(#clip-${person.id})`}
            preserveAspectRatio="xMidYMid slice"
          />
          <circle
            cx={24}
            cy={32}
            r={16}
            fill="none"
            stroke={borderColor}
            strokeWidth={1.5}
          />
        </>
      ) : (
        <>
          <circle
            cx={24}
            cy={32}
            r={16}
            fill={person.gender === "male" ? "#DBEAFE" : "#FCE7F3"}
            stroke={borderColor}
            strokeWidth={1.5}
          />
          <text x={24} y={37} textAnchor="middle" fontSize={16}>
            {person.gender === "male" ? "\u{1F468}" : "\u{1F469}"}
          </text>
        </>
      )}
      {/* 이름 */}
      <text x={50} y={28} fontSize={15} fontWeight="bold" fill="#1F2937">
        {person.nameKorean}
      </text>
      {/* 한자 이름 */}
      {person.nameHanja && (
        <text x={50} y={43} fontSize={11} fill="#6B7280">
          {person.nameHanja}
        </text>
      )}
      {/* 자/호 */}
      {(person.courtesyName || person.penName) && (
        <text x={12} y={62} fontSize={9} fill="#9CA3AF">
          {person.courtesyName ? `자: ${truncate(person.courtesyName, 10)}` : ""}
          {person.courtesyName && person.penName ? " | " : ""}
          {person.penName ? `호: ${truncate(person.penName, 10)}` : ""}
        </text>
      )}
      {/* 관직/직업 */}
      {person.position && (
        <text x={12} y={76} fontSize={9} fill="#6366F1" fontWeight="500">
          {truncate(person.position, 22)}
        </text>
      )}
      {/* 배우자 본관 */}
      {isSpouse && person.spouseClan && (
        <text x={12} y={76} fontSize={9} fill="#EC4899">
          {person.spouseClan}
        </text>
      )}
      {/* 생몰년 */}
      <text x={12} y={92} fontSize={10} fill="#9CA3AF">
        {lifeSpan}
      </text>
      {/* 묘소 표시 */}
      {person.burialLocation && (
        <text x={12} y={106} fontSize={9} fill="#78716C">
          {"⛰"} {truncate(person.burialLocation, 18)}
        </text>
      )}
      {/* 생존 표시 */}
      {person.isLiving && (
        <circle cx={NODE_WIDTH - 14} cy={NODE_HEIGHT - 14} r={5} fill="#10B981" />
      )}
      {/* 배우자 마크 */}
      {isSpouse && (
        <text x={NODE_WIDTH - 38} y={NODE_HEIGHT - 8} fontSize={9} fill="#EC4899">
          배위
        </text>
      )}
      {/* 수정 버튼 */}
      {onEdit && (
        <g
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onEdit(person);
          }}
          className="cursor-pointer"
          opacity={0.5}
          style={{ transition: "opacity 0.2s" }}
          onMouseEnter={(e) => {
            (e.currentTarget as SVGGElement).setAttribute("opacity", "1");
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as SVGGElement).setAttribute("opacity", "0.5");
          }}
        >
          <rect
            x={NODE_WIDTH - 28}
            y={NODE_HEIGHT - 28}
            width={22}
            height={22}
            rx={6}
            fill="#EEF2FF"
            stroke="#6366F1"
            strokeWidth={1}
          />
          <text
            x={NODE_WIDTH - 17}
            y={NODE_HEIGHT - 13}
            textAnchor="middle"
            fontSize={12}
            fill="#6366F1"
          >
            &#9998;
          </text>
        </g>
      )}
    </g>
  );
}

/* ─── 인물 상세 팝업 ─── */
function PersonDetailPopup({
  person,
  allMembers,
  onClose,
  onEdit,
}: {
  person: Person;
  allMembers: Person[];
  onClose: () => void;
  onEdit?: (person: Person) => void;
}) {
  const spouse = person.spouseIds?.[0]
    ? allMembers.find((m) => m.id === person.spouseIds![0])
    : undefined;
  const father = person.fatherId
    ? allMembers.find((m) => m.id === person.fatherId)
    : undefined;
  const mother = person.motherId
    ? allMembers.find((m) => m.id === person.motherId)
    : undefined;
  const children = allMembers.filter((m) => m.fatherId === person.id);
  const borderColor =
    person.gender === "male" ? "border-blue-500" : "border-pink-400";
  const bgColor =
    person.gender === "male" ? "bg-blue-50" : "bg-pink-50";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* 반투명 배경 */}
      <div className="absolute inset-0 bg-black/40" />
      {/* 팝업 카드 */}
      <div
        className={`relative bg-white rounded-2xl shadow-2xl border-t-4 ${borderColor} w-full max-w-lg max-h-[85vh] overflow-y-auto`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 닫기 버튼 */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 text-lg z-10"
        >
          &times;
        </button>

        {/* 프로필 헤더 */}
        <div className={`${bgColor} px-6 pt-6 pb-4`}>
          <div className="flex items-center gap-4">
            {person.profilePhoto ? (
              <div
                className={`w-16 h-16 rounded-full border-4 ${borderColor} overflow-hidden shrink-0`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={person.profilePhoto}
                  alt={person.nameKorean}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div
                className={`w-16 h-16 rounded-full ${bgColor} border-4 ${borderColor} flex items-center justify-center text-3xl shrink-0`}
              >
                {person.gender === "male" ? "\u{1F468}" : "\u{1F469}"}
              </div>
            )}
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-2xl font-bold text-gray-900">
                  {person.nameKorean}
                </h2>
                {person.nameHanja && (
                  <span className="text-lg text-gray-400">
                    ({person.nameHanja})
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600 mt-1 flex-wrap">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-white/70 font-medium text-xs">
                  제{person.generation}세
                </span>
                {person.isLiving && (
                  <span className="inline-flex items-center gap-1 text-emerald-600 text-xs">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    생존
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 space-y-4">
          {/* 기본 정보 */}
          <div className="grid grid-cols-2 gap-2">
            {person.courtesyName && (
              <InfoChip label="자(字)" value={person.courtesyName} />
            )}
            {person.penName && (
              <InfoChip label="호(號)" value={person.penName} />
            )}
            {person.generationChar && (
              <InfoChip label="항렬자" value={person.generationChar} />
            )}
            {person.position && (
              <InfoChip label="관직/직업" value={person.position} />
            )}
            {person.birthDateSolar && (
              <InfoChip label="출생" value={person.birthDateSolar} />
            )}
            {person.deathDateSolar && (
              <InfoChip label="사망" value={person.deathDateSolar} />
            )}
            {person.birthDateLunar && (
              <InfoChip label="출생(음력)" value={person.birthDateLunar} />
            )}
          </div>

          {/* 가족 관계 */}
          <div>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              가족 관계
            </h3>
            <div className="space-y-1.5 text-sm">
              {father && (
                <div className="flex gap-2">
                  <span className="text-gray-400 w-10 shrink-0">부:</span>
                  <span className="text-gray-800 font-medium">{father.nameKorean}{father.nameHanja ? ` (${father.nameHanja})` : ""}</span>
                </div>
              )}
              {mother && (
                <div className="flex gap-2">
                  <span className="text-gray-400 w-10 shrink-0">모:</span>
                  <span className="text-gray-800 font-medium">{mother.nameKorean}</span>
                </div>
              )}
              {spouse && (
                <div className="flex gap-2">
                  <span className="text-gray-400 w-10 shrink-0">배우자:</span>
                  <span className="text-gray-800 font-medium">
                    {spouse.nameKorean}
                    {spouse.nameHanja ? ` (${spouse.nameHanja})` : ""}
                    {spouse.spouseClan ? ` - ${spouse.spouseClan}` : ""}
                  </span>
                </div>
              )}
              {children.length > 0 && (
                <div className="flex gap-2">
                  <span className="text-gray-400 w-10 shrink-0">자녀:</span>
                  <span className="text-gray-800">
                    {children.map((c) => c.nameKorean).join(", ")}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* 묘소 정보 */}
          {person.burialLocation && (
            <div>
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                묘소 정보
              </h3>
              <div className="bg-amber-50 rounded-lg p-3 text-sm space-y-1">
                <div className="font-medium text-gray-800">
                  {"⛰"} {person.burialLocation}
                </div>
                {person.burialDirection && (
                  <div className="text-gray-600">좌향: {person.burialDirection}</div>
                )}
                {person.burialJoint && (
                  <div className="text-gray-600">합장: {person.burialJoint}</div>
                )}
              </div>
            </div>
          )}

          {/* 약력 */}
          {person.bio && (
            <div>
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                약력
              </h3>
              <p className="text-sm text-gray-700 leading-relaxed">
                {person.bio}
              </p>
            </div>
          )}

          {/* 사진 갤러리 */}
          {(() => {
            const gallery: string[] = [];
            if (person.profilePhoto) gallery.push(person.profilePhoto);
            if (person.photos) {
              for (const p of person.photos) {
                if (!gallery.includes(p)) gallery.push(p);
              }
            }
            if (gallery.length <= 1) return null;
            return (
              <div>
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                  사진 ({gallery.length}장)
                </h3>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {gallery.map((photo, idx) => (
                    <div
                      key={idx}
                      className={`w-20 h-20 rounded-lg overflow-hidden border-2 shrink-0 ${
                        idx === 0 ? "border-blue-400" : "border-gray-200"
                      }`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={photo}
                        alt={`${person.nameKorean} 사진 ${idx + 1}`}
                        className="w-full h-full object-cover cursor-pointer"
                        onClick={() => window.open(photo, "_blank")}
                      />
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}

          {/* 하단 버튼 */}
          <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
            <Link
              href={`/person/${person.id}`}
              className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              상세 페이지로 이동
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 3l4 4-4 4" />
              </svg>
            </Link>
            {onEdit && (
              <button
                onClick={() => {
                  onClose();
                  onEdit(person);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition-colors"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M10 2l2 2-7 7H3v-2l7-7z" />
                </svg>
                수정
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-gray-50 rounded-lg px-3 py-2">
      <div className="text-[10px] text-gray-400">{label}</div>
      <div className="text-sm font-medium text-gray-800">{value}</div>
    </div>
  );
}

interface FamilyTreeViewProps {
  members: Person[];
  onEditPerson?: (person: Person) => void;
}

export default function FamilyTreeView({ members, onEditPerson }: FamilyTreeViewProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const [selectedGen, setSelectedGen] = useState<number | null>(null);
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<string[]>([]);
  const [isPdfExporting, setIsPdfExporting] = useState(false);

  // 트리 빌드
  const roots = members.filter(
    (m) => !m.fatherId && !m.motherId && m.gender === "male"
  );
  const trees = roots.map((root) => buildTree(root, members));

  let offsetX = 60;
  for (const tree of trees) {
    layoutTree(tree, offsetX, 40);
    offsetX += calculateSubtreeWidth(tree) + HORIZONTAL_GAP * 2;
  }

  const allNodes = trees.flatMap(getAllNodes);
  const totalWidth = Math.max(
    offsetX + 100,
    ...allNodes.map((n) => n.x + (n.spouse ? NODE_WIDTH * 2 + SPOUSE_GAP : NODE_WIDTH) + 100)
  );
  const totalHeight = Math.max(
    ...allNodes.map((n) => n.y + NODE_HEIGHT + 60)
  );

  // 세대 목록
  const generations = [...new Set(members.map((m) => m.generation))].sort(
    (a, b) => a - b
  );

  // 검색
  function handleSearch(query: string) {
    setSearchQuery(query);
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    const q = query.trim().toLowerCase();
    const matches = members.filter(
      (m) =>
        m.nameKorean.toLowerCase().includes(q) ||
        m.nameHanja?.toLowerCase().includes(q) ||
        m.courtesyName?.toLowerCase().includes(q) ||
        m.penName?.toLowerCase().includes(q)
    );
    const ids = matches.map((m) => m.id);
    setSearchResults(ids);

    // 검색 결과가 있으면 첫 번째 결과로 스크롤
    if (matches.length > 0 && containerRef.current) {
      const firstMatch = matches[0];
      const node = allNodes.find(
        (n) => n.person.id === firstMatch.id || n.spouse?.id === firstMatch.id
      );
      if (node) {
        const targetX = node.spouse?.id === firstMatch.id
          ? node.x + NODE_WIDTH + SPOUSE_GAP
          : node.x;
        containerRef.current.scrollTo({
          left: targetX * zoom - containerRef.current.clientWidth / 2 + (NODE_WIDTH * zoom) / 2,
          top: node.y * zoom - containerRef.current.clientHeight / 2 + (NODE_HEIGHT * zoom) / 2,
          behavior: "smooth",
        });
      }
    }
  }

  // 줌 변경
  function zoomIn() {
    setZoom((z) => Math.min(z * 1.25, 3));
  }
  function zoomOut() {
    setZoom((z) => Math.max(z * 0.8, 0.2));
  }
  function resetZoom() {
    setZoom(1);
    setSelectedGen(null);
  }

  // 특정 세대로 스크롤
  function scrollToGen(gen: number) {
    setSelectedGen(selectedGen === gen ? null : gen);
    const genNodes = allNodes.filter((n) => n.person.generation === gen);
    if (genNodes.length > 0 && containerRef.current) {
      const minX = Math.min(...genNodes.map((n) => n.x));
      const y = genNodes[0].y;
      containerRef.current.scrollTo({
        left: minX * zoom - 100,
        top: y * zoom - 50,
        behavior: "smooth",
      });
    }
  }

  // PDF 출력
  async function handlePdfExport() {
    if (!svgRef.current || isPdfExporting) return;
    setIsPdfExporting(true);
    try {
      const { jsPDF } = await import("jspdf");
      await import("svg2pdf.js");

      const svgClone = svgRef.current.cloneNode(true) as SVGSVGElement;
      const padding = 40;
      svgClone.setAttribute(
        "viewBox",
        `${-padding} ${-padding} ${totalWidth + padding * 2} ${totalHeight + padding * 2}`
      );
      svgClone.setAttribute("width", String(totalWidth + padding * 2));
      svgClone.setAttribute("height", String(totalHeight + padding * 2));

      svgClone.style.position = "absolute";
      svgClone.style.left = "-99999px";
      document.body.appendChild(svgClone);

      const isLandscape = totalWidth > totalHeight;
      const pdf = new jsPDF({
        orientation: isLandscape ? "landscape" : "portrait",
        unit: "pt",
        format: "a3",
      });

      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      const scale = Math.min(
        pageW / (totalWidth + padding * 2),
        pageH / (totalHeight + padding * 2)
      );

      await (pdf as unknown as { svg: (el: SVGElement, opts: Record<string, unknown>) => Promise<void> }).svg(svgClone, {
        x: 0,
        y: 0,
        width: (totalWidth + padding * 2) * scale,
        height: (totalHeight + padding * 2) * scale,
      });

      document.body.removeChild(svgClone);
      pdf.save("연안차씨_가계도.pdf");
    } catch (err) {
      console.error("PDF export failed:", err);
      alert("PDF 출력에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setIsPdfExporting(false);
    }
  }

  // 선 그리기: 부모 → 자식
  function renderConnections(node: TreeNode): React.ReactNode[] {
    const lines: React.ReactNode[] = [];
    const parentCenterX = node.x + NODE_WIDTH / 2;
    const parentBottomY = node.y + NODE_HEIGHT;

    if (node.children.length > 0) {
      const midY = parentBottomY + VERTICAL_GAP / 2;

      lines.push(
        <line
          key={`v-${node.person.id}`}
          x1={parentCenterX}
          y1={parentBottomY}
          x2={parentCenterX}
          y2={midY}
          stroke="#CBD5E1"
          strokeWidth={2}
        />
      );

      if (node.children.length > 1) {
        const firstChildCX = node.children[0].x + NODE_WIDTH / 2;
        const lastChildCX =
          node.children[node.children.length - 1].x + NODE_WIDTH / 2;
        lines.push(
          <line
            key={`h-${node.person.id}`}
            x1={firstChildCX}
            y1={midY}
            x2={lastChildCX}
            y2={midY}
            stroke="#CBD5E1"
            strokeWidth={2}
          />
        );
      }

      for (const child of node.children) {
        const childCX = child.x + NODE_WIDTH / 2;
        lines.push(
          <line
            key={`cv-${child.person.id}`}
            x1={childCX}
            y1={midY}
            x2={childCX}
            y2={child.y}
            stroke="#CBD5E1"
            strokeWidth={2}
          />
        );
      }
    }

    if (node.spouse) {
      lines.push(
        <line
          key={`sp-${node.person.id}`}
          x1={node.x + NODE_WIDTH}
          y1={node.y + NODE_HEIGHT / 2}
          x2={node.x + NODE_WIDTH + SPOUSE_GAP}
          y2={node.y + NODE_HEIGHT / 2}
          stroke="#F472B6"
          strokeWidth={2}
          strokeDasharray="6 3"
        />
      );
    }

    for (const child of node.children) {
      lines.push(...renderConnections(child));
    }

    return lines;
  }

  function isHighlighted(person: Person): boolean {
    if (selectedGen === null) return true;
    return person.generation === selectedGen;
  }

  function isSearchMatch(personId: string): boolean {
    return searchResults.includes(personId);
  }

  return (
    <div className="flex flex-col h-full">
      {/* 컨트롤 바 */}
      <div className="flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-3 bg-white border-b border-gray-200 flex-wrap">
        {/* 검색 */}
        <div className="relative w-full sm:w-auto order-first sm:order-none mb-2 sm:mb-0">
          <svg
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400"
            width="14"
            height="14"
            viewBox="0 0 14 14"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="6" cy="6" r="4.5" />
            <path d="M9.5 9.5L13 13" />
          </svg>
          <input
            type="text"
            placeholder="인물 검색..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full sm:w-44 pl-8 pr-3 py-1.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100"
          />
          {searchQuery && (
            <button
              onClick={() => handleSearch("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs"
            >
              &times;
            </button>
          )}
          {searchQuery && searchResults.length > 0 && (
            <span className="absolute -bottom-5 left-0 text-[10px] text-amber-600">
              {searchResults.length}명 검색됨
            </span>
          )}
          {searchQuery && searchResults.length === 0 && (
            <span className="absolute -bottom-5 left-0 text-[10px] text-gray-400">
              검색 결과 없음
            </span>
          )}
        </div>

        <span className="text-sm font-medium text-gray-600 mr-1 hidden sm:inline">세대:</span>
        <button
          onClick={resetZoom}
          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
            selectedGen === null
              ? "bg-gray-800 text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          전체
        </button>
        <div className="flex gap-1 overflow-x-auto flex-wrap">
          {generations.map((gen) => (
            <button
              key={gen}
              onClick={() => scrollToGen(gen)}
              className="px-2 py-1 rounded-full text-xs font-medium transition-colors"
              style={{
                backgroundColor:
                  selectedGen === gen ? getGenerationColor(gen) : "#F3F4F6",
                color: selectedGen === gen ? "white" : "#4B5563",
              }}
            >
              {gen}세
            </button>
          ))}
        </div>
        <div className="ml-auto flex gap-2 shrink-0 items-center">
          <button
            onClick={zoomIn}
            className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-lg flex items-center justify-center"
          >
            +
          </button>
          <span className="text-xs text-gray-500 w-12 text-center">{Math.round(zoom * 100)}%</span>
          <button
            onClick={zoomOut}
            className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-lg flex items-center justify-center"
          >
            -
          </button>
          <button
            onClick={resetZoom}
            className="px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium hidden sm:block"
          >
            초기화
          </button>
          <button
            onClick={handlePdfExport}
            disabled={isPdfExporting}
            className="px-3 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 text-xs font-medium flex items-center gap-1 disabled:opacity-50"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M3 12h8M7 2v7m0 0L4.5 6.5M7 9l2.5-2.5" />
            </svg>
            <span className="hidden sm:inline">{isPdfExporting ? "출력 중..." : "PDF 출력"}</span>
          </button>
        </div>
      </div>

      {/* 스크롤 가능한 가계도 영역 - 브라우저 기본 스크롤 사용 */}
      <div
        ref={containerRef}
        className="flex-1 bg-gradient-to-br from-gray-50 to-blue-50"
        style={{ overflow: "auto" }}
      >
        <svg
          ref={svgRef}
          width={totalWidth * zoom}
          height={totalHeight * zoom}
          viewBox={`0 0 ${totalWidth} ${totalHeight}`}
          style={{ display: "block" }}
        >
          <defs>
            <filter id="shadow" x="-4%" y="-4%" width="108%" height="116%">
              <feDropShadow dx="0" dy="2" stdDeviation="4" floodOpacity="0.1" />
            </filter>
          </defs>

          {/* 세대 배경 밴드 */}
          {generations.map((gen, i) => {
            const genNodes = allNodes.filter((n) => n.person.generation === gen);
            if (genNodes.length === 0) return null;
            const y = genNodes[0].y;
            return (
              <g key={`gen-bg-${gen}`}>
                <rect
                  x={0}
                  y={y - 10}
                  width={totalWidth}
                  height={NODE_HEIGHT + 20}
                  fill={i % 2 === 0 ? "rgba(59,130,246,0.03)" : "transparent"}
                />
                <text
                  x={12}
                  y={y + NODE_HEIGHT / 2 + 4}
                  fontSize={12}
                  fill={getGenerationColor(gen)}
                  fontWeight="bold"
                  opacity={0.6}
                >
                  {gen}세
                </text>
              </g>
            );
          })}

          {/* 연결선 */}
          {trees.flatMap((tree) => renderConnections(tree))}

          {/* 인물 카드 */}
          {allNodes.map((node) => (
            <g
              key={node.person.id}
              opacity={isHighlighted(node.person) ? 1 : 0.25}
              style={{ transition: "opacity 0.3s" }}
            >
              <PersonCard
                person={node.person}
                x={node.x}
                y={node.y}
                onEdit={onEditPerson}
                onClick={setSelectedPerson}
                isSearchMatch={isSearchMatch(node.person.id)}
              />
              {node.spouse && (
                <g opacity={isHighlighted(node.spouse) ? 1 : 0.25}>
                  <PersonCard
                    person={node.spouse}
                    x={node.x + NODE_WIDTH + SPOUSE_GAP}
                    y={node.y}
                    isSpouse
                    onEdit={onEditPerson}
                    onClick={setSelectedPerson}
                    isSearchMatch={isSearchMatch(node.spouse.id)}
                  />
                </g>
              )}
            </g>
          ))}
        </svg>
      </div>

      {/* 범례 */}
      <div className="flex items-center gap-3 sm:gap-6 px-3 sm:px-4 py-2 bg-white border-t border-gray-200 text-[10px] sm:text-xs text-gray-500 flex-wrap">
        <div className="flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded border-2 border-blue-500" />
          남성
        </div>
        <div className="flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded border-2 border-pink-400" />
          여성
        </div>
        <div className="flex items-center gap-1">
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500" />
          생존
        </div>
        <div className="flex items-center gap-1 hidden sm:flex">
          <span className="inline-block w-4 border-t-2 border-dashed border-pink-400" />
          부부
        </div>
        <div className="flex items-center gap-1 hidden sm:flex">
          <span className="inline-block w-4 border-t-2 border-gray-300" />
          부모-자녀
        </div>
        <span className="ml-auto text-gray-400 hidden sm:inline">
          마우스 휠: 스크롤 | +/- 버튼: 확대/축소 | 클릭: 상세정보
        </span>
        <span className="ml-auto text-gray-400 sm:hidden">
          스와이프: 이동 | 핀치: 확대/축소
        </span>
      </div>

      {/* 인물 상세 팝업 */}
      {selectedPerson && (
        <PersonDetailPopup
          person={selectedPerson}
          allMembers={members}
          onClose={() => setSelectedPerson(null)}
          onEdit={onEditPerson}
        />
      )}
    </div>
  );
}

"use client";

import { useState, useRef, useCallback, useEffect } from "react";
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
}: {
  person: Person;
  x: number;
  y: number;
  isSpouse?: boolean;
  onEdit?: (person: Person) => void;
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
    <Link href={`/person/${person.id}`}>
      <g
        transform={`translate(${x}, ${y})`}
        className="cursor-pointer"
        role="button"
        tabIndex={0}
      >
        {/* 카드 배경 */}
        <rect
          width={NODE_WIDTH}
          height={NODE_HEIGHT}
          rx={12}
          ry={12}
          fill="white"
          stroke={borderColor}
          strokeWidth={2.5}
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
        {/* 성별 아이콘 */}
        <circle
          cx={24}
          cy={32}
          r={16}
          fill={person.gender === "male" ? "#DBEAFE" : "#FCE7F3"}
          stroke={borderColor}
          strokeWidth={1.5}
        />
        <text
          x={24}
          y={37}
          textAnchor="middle"
          fontSize={16}
        >
          {person.gender === "male" ? "\u{1F468}" : "\u{1F469}"}
        </text>
        {/* 이름 */}
        <text
          x={50}
          y={28}
          fontSize={15}
          fontWeight="bold"
          fill="#1F2937"
        >
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
        {/* 배우자 본관 (본관+성씨) */}
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
    </Link>
  );
}

interface FamilyTreeViewProps {
  members: Person[];
  onEditPerson?: (person: Person) => void;
}

export default function FamilyTreeView({ members, onEditPerson }: FamilyTreeViewProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [viewBox, setViewBox] = useState({ x: 0, y: 0, w: 1400, h: 900 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [selectedGen, setSelectedGen] = useState<number | null>(null);

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

  // 줌 처리
  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();
      const zoomFactor = e.deltaY > 0 ? 1.1 : 0.9;
      setViewBox((prev) => {
        const newW = prev.w * zoomFactor;
        const newH = prev.h * zoomFactor;
        const dx = (newW - prev.w) / 2;
        const dy = (newH - prev.h) / 2;
        return { x: prev.x - dx, y: prev.y - dy, w: newW, h: newH };
      });
    },
    []
  );

  // 드래그 처리
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.button !== 0) return;
      setIsDragging(true);
      setDragStart({ x: e.clientX, y: e.clientY });
    },
    []
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDragging) return;
      const dx = e.clientX - dragStart.x;
      const dy = e.clientY - dragStart.y;
      const container = containerRef.current;
      if (!container) return;
      const scale = viewBox.w / container.clientWidth;
      setViewBox((prev) => ({
        ...prev,
        x: prev.x - dx * scale,
        y: prev.y - dy * scale,
      }));
      setDragStart({ x: e.clientX, y: e.clientY });
    },
    [isDragging, dragStart, viewBox.w]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // 전체 보기로 리셋
  const resetView = () => {
    setViewBox({ x: 0, y: 0, w: totalWidth, h: totalHeight });
    setSelectedGen(null);
  };

  // 특정 세대로 이동
  const scrollToGen = (gen: number) => {
    setSelectedGen(selectedGen === gen ? null : gen);
    const genNodes = allNodes.filter((n) => n.person.generation === gen);
    if (genNodes.length > 0) {
      const minX = Math.min(...genNodes.map((n) => n.x));
      const maxX = Math.max(...genNodes.map((n) => n.x + NODE_WIDTH));
      const y = genNodes[0].y;
      const padding = 200;
      setViewBox({
        x: minX - padding,
        y: y - padding / 2,
        w: Math.max(maxX - minX + padding * 2, 800),
        h: NODE_HEIGHT + padding * 2,
      });
    }
  };

  // 초기 viewBox 설정
  useEffect(() => {
    setViewBox({ x: 0, y: 0, w: totalWidth, h: totalHeight });
  }, []);

  // 선 그리기: 부모 → 자식
  function renderConnections(node: TreeNode): React.ReactNode[] {
    const lines: React.ReactNode[] = [];
    const parentCenterX = node.x + NODE_WIDTH / 2;
    const parentBottomY = node.y + NODE_HEIGHT;

    if (node.children.length > 0) {
      const midY = parentBottomY + VERTICAL_GAP / 2;

      // 부모에서 아래로 수직선
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

      // 자식들 사이의 수평선
      if (node.children.length > 1) {
        const firstChildCX =
          node.children[0].x + NODE_WIDTH / 2;
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

      // 각 자식으로 수직선
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

    // 부부 연결선
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

  // 세대별 필터링 된 노드인지 확인
  function isHighlighted(person: Person): boolean {
    if (selectedGen === null) return true;
    return person.generation === selectedGen;
  }

  return (
    <div className="flex flex-col h-full">
      {/* 컨트롤 바 */}
      <div className="flex items-center gap-2 px-4 py-3 bg-white border-b border-gray-200 flex-wrap">
        <span className="text-sm font-medium text-gray-600 mr-1">세대:</span>
        <button
          onClick={resetView}
          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
            selectedGen === null
              ? "bg-gray-800 text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          전체
        </button>
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
        <div className="ml-auto flex gap-2">
          <button
            onClick={() =>
              setViewBox((prev) => ({
                x: prev.x + prev.w * 0.1,
                y: prev.y + prev.h * 0.1,
                w: prev.w * 0.8,
                h: prev.h * 0.8,
              }))
            }
            className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-lg flex items-center justify-center"
          >
            +
          </button>
          <button
            onClick={() =>
              setViewBox((prev) => ({
                x: prev.x - prev.w * 0.1,
                y: prev.y - prev.h * 0.1,
                w: prev.w * 1.2,
                h: prev.h * 1.2,
              }))
            }
            className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-lg flex items-center justify-center"
          >
            -
          </button>
          <button
            onClick={resetView}
            className="px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium"
          >
            전체 보기
          </button>
        </div>
      </div>

      {/* SVG 가계도 */}
      <div
        ref={containerRef}
        className="flex-1 overflow-hidden bg-gradient-to-br from-gray-50 to-blue-50"
        style={{ cursor: isDragging ? "grabbing" : "grab" }}
      >
        <svg
          ref={svgRef}
          width="100%"
          height="100%"
          viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.w} ${viewBox.h}`}
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
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
                  x={viewBox.x}
                  y={y - 10}
                  width={viewBox.w + Math.abs(viewBox.x) + 2000}
                  height={NODE_HEIGHT + 20}
                  fill={i % 2 === 0 ? "rgba(59,130,246,0.03)" : "transparent"}
                />
                <text
                  x={viewBox.x + 12}
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
              />
              {node.spouse && (
                <g opacity={isHighlighted(node.spouse) ? 1 : 0.25}>
                  <PersonCard
                    person={node.spouse}
                    x={node.x + NODE_WIDTH + SPOUSE_GAP}
                    y={node.y}
                    isSpouse
                    onEdit={onEditPerson}
                  />
                </g>
              )}
            </g>
          ))}
        </svg>
      </div>

      {/* 범례 */}
      <div className="flex items-center gap-6 px-4 py-2 bg-white border-t border-gray-200 text-xs text-gray-500">
        <div className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded border-2 border-blue-500" />
          남성
        </div>
        <div className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded border-2 border-pink-400" />
          여성
        </div>
        <div className="flex items-center gap-1.5">
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500" />
          생존
        </div>
        <div className="flex items-center gap-1.5">
          <span className="inline-block w-4 border-t-2 border-dashed border-pink-400" />
          부부 관계
        </div>
        <div className="flex items-center gap-1.5">
          <span className="inline-block w-4 border-t-2 border-gray-300" />
          부모-자녀
        </div>
        <div className="flex items-center gap-1.5">
          {"⛰"} 묘소 정보 있음
        </div>
        <span className="ml-auto text-gray-400">마우스 드래그: 이동 | 스크롤: 확대/축소</span>
      </div>
    </div>
  );
}

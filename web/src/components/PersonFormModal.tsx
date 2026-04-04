"use client";

import { useState, useEffect, useRef } from "react";
import { Person } from "@/lib/types";

interface PersonFormModalProps {
  person?: Person; // undefined이면 새 인물 추가
  members: Person[];
  nextId: string;
  onSave: (person: Person) => void;
  onClose: () => void;
}

export default function PersonFormModal({
  person,
  members,
  nextId,
  onSave,
  onClose,
}: PersonFormModalProps) {
  const isEdit = !!person;

  const [form, setForm] = useState<Person>({
    id: person?.id ?? nextId,
    nameKorean: person?.nameKorean ?? "",
    nameHanja: person?.nameHanja ?? "",
    courtesyName: person?.courtesyName ?? "",
    penName: person?.penName ?? "",
    generation: person?.generation ?? 20,
    generationChar: person?.generationChar ?? "",
    birthDateSolar: person?.birthDateSolar ?? "",
    birthDateLunar: person?.birthDateLunar ?? "",
    deathDateSolar: person?.deathDateSolar ?? "",
    deathDateLunar: person?.deathDateLunar ?? "",
    gender: person?.gender ?? "male",
    branch: person?.branch ?? "",
    bio: person?.bio ?? "",
    position: person?.position ?? "",
    burialLocation: person?.burialLocation ?? "",
    burialDirection: person?.burialDirection ?? "",
    burialJoint: person?.burialJoint ?? "",
    spouseClan: person?.spouseClan ?? "",
    isLiving: person?.isLiving ?? true,
    fatherId: person?.fatherId ?? "",
    motherId: person?.motherId ?? "",
    spouseIds: person?.spouseIds ?? [],
    childrenIds: person?.childrenIds ?? [],
  });

  const [spouseInput, setSpouseInput] = useState(
    person?.spouseIds?.join(", ") ?? ""
  );

  // 사진 관리: 대표 사진 + 추가 사진들
  const [allPhotos, setAllPhotos] = useState<string[]>(() => {
    const photos: string[] = [];
    if (person?.profilePhoto) photos.push(person.profilePhoto);
    if (person?.photos) {
      for (const p of person.photos) {
        if (!photos.includes(p)) photos.push(p);
      }
    }
    return photos;
  });
  const [primaryIndex, setPrimaryIndex] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ESC 키로 닫기
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  function handleChange(
    field: keyof Person,
    value: string | number | boolean
  ) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function resizeImage(file: File): Promise<string> {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => {
        const img = new Image();
        img.onload = () => {
          const maxSize = 300;
          const canvas = document.createElement("canvas");
          let w = img.width;
          let h = img.height;
          if (w > maxSize || h > maxSize) {
            if (w > h) { h = (h / w) * maxSize; w = maxSize; }
            else { w = (w / h) * maxSize; h = maxSize; }
          }
          canvas.width = w;
          canvas.height = h;
          canvas.getContext("2d")!.drawImage(img, 0, 0, w, h);
          resolve(canvas.toDataURL("image/jpeg", 0.8));
        };
        img.src = reader.result as string;
      };
      reader.readAsDataURL(file);
    });
  }

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const newPhotos: string[] = [];
    for (let i = 0; i < files.length; i++) {
      newPhotos.push(await resizeImage(files[i]));
    }
    setAllPhotos((prev) => [...prev, ...newPhotos]);
    // 첫 사진이 없었으면 대표로 설정
    if (allPhotos.length === 0) setPrimaryIndex(0);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function handleRemovePhoto(index: number) {
    setAllPhotos((prev) => {
      const next = prev.filter((_, i) => i !== index);
      // 대표 사진 인덱스 보정
      if (index === primaryIndex) setPrimaryIndex(0);
      else if (index < primaryIndex) setPrimaryIndex((p) => p - 1);
      return next;
    });
  }

  function handleSetPrimary(index: number) {
    setPrimaryIndex(index);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!form.nameKorean.trim()) {
      alert("한글 이름은 필수 항목입니다.");
      return;
    }

    // 배우자 IDs 파싱
    const spouseIds = spouseInput
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    // 빈 문자열 필드를 undefined로 변환
    const cleaned: Person = {
      id: form.id,
      nameKorean: form.nameKorean.trim(),
      nameHanja: form.nameHanja || undefined,
      courtesyName: form.courtesyName || undefined,
      penName: form.penName || undefined,
      generation: form.generation,
      generationChar: form.generationChar || undefined,
      birthDateSolar: form.birthDateSolar || undefined,
      birthDateLunar: form.birthDateLunar || undefined,
      deathDateSolar: form.deathDateSolar || undefined,
      deathDateLunar: form.deathDateLunar || undefined,
      gender: form.gender,
      branch: form.branch || undefined,
      bio: form.bio || undefined,
      position: form.position || undefined,
      burialLocation: form.burialLocation || undefined,
      burialDirection: form.burialDirection || undefined,
      burialJoint: form.burialJoint || undefined,
      spouseClan: form.spouseClan || undefined,
      profilePhoto: allPhotos.length > 0 ? allPhotos[primaryIndex] : undefined,
      photos: allPhotos.length > 1
        ? allPhotos.filter((_, i) => i !== primaryIndex)
        : undefined,
      isLiving: form.isLiving,
      fatherId: form.fatherId || undefined,
      motherId: form.motherId || undefined,
      spouseIds: spouseIds.length > 0 ? spouseIds : undefined,
      childrenIds:
        form.childrenIds && form.childrenIds.length > 0
          ? form.childrenIds
          : undefined,
    };

    onSave(cleaned);
  }

  // 부모 후보 목록 (자기 자신 제외)
  const parentCandidates = members.filter((m) => m.id !== form.id);

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 overflow-y-auto py-8"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 overflow-hidden">
        {/* 헤더 */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">
            {isEdit ? "인물 정보 수정" : "새 인물 추가"}
          </h2>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white text-2xl leading-none"
          >
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-6">
          {/* ===== 사진 업로드 (복수) ===== */}
          <fieldset>
            <legend className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
              사진
            </legend>
            <div className="flex flex-wrap gap-3">
              {allPhotos.map((photo, idx) => (
                <div key={idx} className="relative group">
                  <div
                    className={`w-20 h-20 rounded-lg overflow-hidden border-2 cursor-pointer transition-colors ${
                      idx === primaryIndex
                        ? "border-blue-500 ring-2 ring-blue-200"
                        : "border-gray-200 hover:border-gray-400"
                    }`}
                    onClick={() => handleSetPrimary(idx)}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={photo}
                      alt={`사진 ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  {idx === primaryIndex && (
                    <span className="absolute -top-1.5 -left-1.5 bg-blue-500 text-white text-[9px] px-1.5 py-0.5 rounded-full font-bold">
                      대표
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => handleRemovePhoto(idx)}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    &times;
                  </button>
                </div>
              ))}
              {/* 추가 버튼 */}
              <div
                className="w-20 h-20 rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="#9CA3AF" strokeWidth="2">
                  <line x1="10" y1="4" x2="10" y2="16" />
                  <line x1="4" y1="10" x2="16" y2="10" />
                </svg>
                <span className="text-[9px] text-gray-400 mt-1">사진 추가</span>
              </div>
            </div>
            <p className="text-[10px] text-gray-400 mt-2">
              여러 장 선택 가능 | 클릭하여 대표 사진 지정 | JPG, PNG (자동 축소)
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handlePhotoUpload}
              className="hidden"
            />
          </fieldset>

          {/* ===== 기본 정보 ===== */}
          <fieldset>
            <legend className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
              기본 정보
            </legend>
            <div className="grid grid-cols-2 gap-4">
              <Field label="한글 이름 *" required>
                <input
                  type="text"
                  value={form.nameKorean}
                  onChange={(e) => handleChange("nameKorean", e.target.value)}
                  className="input"
                  placeholder="예: 원부"
                  required
                />
              </Field>
              <Field label="한자 이름">
                <input
                  type="text"
                  value={form.nameHanja ?? ""}
                  onChange={(e) => handleChange("nameHanja", e.target.value)}
                  className="input"
                  placeholder="예: 原頫"
                />
              </Field>
              <Field label="자(字)">
                <input
                  type="text"
                  value={form.courtesyName ?? ""}
                  onChange={(e) => handleChange("courtesyName", e.target.value)}
                  className="input"
                  placeholder="예: 원부(원부)"
                />
              </Field>
              <Field label="호(號)">
                <input
                  type="text"
                  value={form.penName ?? ""}
                  onChange={(e) => handleChange("penName", e.target.value)}
                  className="input"
                  placeholder="예: 운암"
                />
              </Field>
              <Field label="성별">
                <select
                  value={form.gender}
                  onChange={(e) =>
                    handleChange("gender", e.target.value as "male" | "female")
                  }
                  className="input"
                >
                  <option value="male">남성</option>
                  <option value="female">여성</option>
                </select>
              </Field>
              <Field label="세대 (世)">
                <input
                  type="number"
                  min={1}
                  max={99}
                  value={form.generation}
                  onChange={(e) =>
                    handleChange("generation", parseInt(e.target.value, 10) || 20)
                  }
                  className="input"
                />
              </Field>
              <Field label="항렬자">
                <input
                  type="text"
                  value={form.generationChar ?? ""}
                  onChange={(e) =>
                    handleChange("generationChar", e.target.value)
                  }
                  className="input"
                />
              </Field>
              <Field label="파(派)">
                <input
                  type="text"
                  value={form.branch ?? ""}
                  onChange={(e) => handleChange("branch", e.target.value)}
                  className="input"
                />
              </Field>
              <Field label="관직/직업">
                <input
                  type="text"
                  value={form.position ?? ""}
                  onChange={(e) => handleChange("position", e.target.value)}
                  className="input"
                  placeholder="예: 성균 진사"
                />
              </Field>
              <Field label="생존 여부">
                <label className="flex items-center gap-2 mt-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.isLiving}
                    onChange={(e) =>
                      handleChange("isLiving", e.target.checked)
                    }
                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">생존</span>
                </label>
              </Field>
            </div>
          </fieldset>

          {/* ===== 날짜 정보 ===== */}
          <fieldset>
            <legend className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
              생몰 정보
            </legend>
            <div className="grid grid-cols-2 gap-4">
              <Field label="출생일 (양력)">
                <input
                  type="text"
                  value={form.birthDateSolar ?? ""}
                  onChange={(e) =>
                    handleChange("birthDateSolar", e.target.value)
                  }
                  className="input"
                  placeholder="예: 1849-12-01"
                />
              </Field>
              <Field label="출생일 (음력)">
                <input
                  type="text"
                  value={form.birthDateLunar ?? ""}
                  onChange={(e) =>
                    handleChange("birthDateLunar", e.target.value)
                  }
                  className="input"
                />
              </Field>
              <Field label="사망일 (양력)">
                <input
                  type="text"
                  value={form.deathDateSolar ?? ""}
                  onChange={(e) =>
                    handleChange("deathDateSolar", e.target.value)
                  }
                  className="input"
                  placeholder="예: 1896-08-16"
                />
              </Field>
              <Field label="사망일 (음력)">
                <input
                  type="text"
                  value={form.deathDateLunar ?? ""}
                  onChange={(e) =>
                    handleChange("deathDateLunar", e.target.value)
                  }
                  className="input"
                />
              </Field>
            </div>
          </fieldset>

          {/* ===== 가족 관계 ===== */}
          <fieldset>
            <legend className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
              가족 관계
            </legend>
            <div className="grid grid-cols-2 gap-4">
              <Field label="부친">
                <select
                  value={form.fatherId ?? ""}
                  onChange={(e) => handleChange("fatherId", e.target.value)}
                  className="input"
                >
                  <option value="">-- 선택 안 함 --</option>
                  {parentCandidates
                    .filter((m) => m.gender === "male")
                    .sort((a, b) => a.generation - b.generation)
                    .map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.nameKorean}
                        {m.nameHanja ? ` (${m.nameHanja})` : ""} - {m.generation}
                        세
                      </option>
                    ))}
                </select>
              </Field>
              <Field label="모친">
                <select
                  value={form.motherId ?? ""}
                  onChange={(e) => handleChange("motherId", e.target.value)}
                  className="input"
                >
                  <option value="">-- 선택 안 함 --</option>
                  {parentCandidates
                    .filter((m) => m.gender === "female")
                    .sort((a, b) => a.generation - b.generation)
                    .map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.nameKorean}
                        {m.nameHanja ? ` (${m.nameHanja})` : ""} - {m.generation}
                        세
                      </option>
                    ))}
                </select>
              </Field>
              <Field label="배우자 ID">
                <input
                  type="text"
                  value={spouseInput}
                  onChange={(e) => setSpouseInput(e.target.value)}
                  className="input"
                  placeholder="예: s4 (쉼표로 복수 입력)"
                />
              </Field>
              <Field label="배우자 본관+성씨">
                <input
                  type="text"
                  value={form.spouseClan ?? ""}
                  onChange={(e) => handleChange("spouseClan", e.target.value)}
                  className="input"
                  placeholder="예: 경주 금씨"
                />
              </Field>
            </div>
          </fieldset>

          {/* ===== 묘소 정보 ===== */}
          <fieldset>
            <legend className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
              묘소 정보
            </legend>
            <div className="grid grid-cols-2 gap-4">
              <Field label="묘소 위치" fullWidth>
                <input
                  type="text"
                  value={form.burialLocation ?? ""}
                  onChange={(e) =>
                    handleChange("burialLocation", e.target.value)
                  }
                  className="input"
                  placeholder="예: 경기 광주 오포 시안가족묘원"
                />
              </Field>
              <Field label="좌향">
                <input
                  type="text"
                  value={form.burialDirection ?? ""}
                  onChange={(e) =>
                    handleChange("burialDirection", e.target.value)
                  }
                  className="input"
                  placeholder="예: 경좌"
                />
              </Field>
              <Field label="합장 여부">
                <input
                  type="text"
                  value={form.burialJoint ?? ""}
                  onChange={(e) => handleChange("burialJoint", e.target.value)}
                  className="input"
                  placeholder="예: 쌍조, 합조"
                />
              </Field>
            </div>
          </fieldset>

          {/* ===== 약력 ===== */}
          <fieldset>
            <legend className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
              약력 / 비고
            </legend>
            <textarea
              value={form.bio ?? ""}
              onChange={(e) => handleChange("bio", e.target.value)}
              className="input min-h-[80px] resize-y"
              placeholder="추가 정보를 입력하세요..."
            />
          </fieldset>

          {/* ===== 버튼 ===== */}
          <div className="flex items-center justify-end gap-3 pt-2 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-lg text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              취소
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors"
            >
              {isEdit ? "수정 저장" : "인물 추가"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({
  label,
  required,
  fullWidth,
  children,
}: {
  label: string;
  required?: boolean;
  fullWidth?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={fullWidth ? "col-span-2" : ""}>
      <label className="block text-xs font-medium text-gray-600 mb-1">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

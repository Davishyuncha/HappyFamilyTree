"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  PlazaPost,
  PlazaFileRef,
  getPostsByCategory,
  addPlazaPost,
  deletePlazaPost,
  MAX_FILE_SIZE,
} from "@/lib/plaza-store";

const TABS = [
  { key: "photo" as const, label: "사진" },
  { key: "video" as const, label: "동영상" },
  { key: "link" as const, label: "콘텐츠 링크" },
  { key: "notice" as const, label: "알림" },
  { key: "etc" as const, label: "기타" },
];

export default function PlazaPage() {
  const [activeTab, setActiveTab] = useState<PlazaPost["category"]>("photo");
  const [posts, setPosts] = useState<PlazaPost[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);

  const refreshPosts = useCallback(async () => {
    setLoading(true);
    const data = await getPostsByCategory(activeTab);
    setPosts(data);
    setLoading(false);
  }, [activeTab]);

  useEffect(() => {
    refreshPosts();
  }, [refreshPosts]);

  async function handleDelete(id: string) {
    await deletePlazaPost(id);
    refreshPosts();
  }

  return (
    <div className="flex flex-col min-h-[calc(100vh-44px)]">
      {/* 헤더 */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-4 sm:pt-6 pb-0">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">차씨 광장</h1>
          <p className="text-xs sm:text-sm text-gray-500 mb-3 sm:mb-4">
            가족 모두가 함께 소통하는 공간입니다
          </p>

          {/* 탭 */}
          <div className="flex gap-0.5 sm:gap-1 overflow-x-auto">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => {
                  setActiveTab(tab.key);
                  setShowForm(false);
                }}
                className={`px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                  activeTab === tab.key
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* 게시판 내용 */}
      <main className="flex-1 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
          {/* 글쓰기 버튼 */}
          {!showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="mb-6 px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors flex items-center gap-1.5"
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
              글쓰기
            </button>
          )}

          {/* 글쓰기 폼 */}
          {showForm && (
            <PostForm
              category={activeTab}
              onSubmit={() => {
                setShowForm(false);
                refreshPosts();
              }}
              onCancel={() => setShowForm(false)}
            />
          )}

          {/* 게시글 목록 */}
          {loading ? (
            <div className="text-center py-16 text-gray-400">
              <p className="text-sm">불러오는 중...</p>
            </div>
          ) : posts.length === 0 && !showForm ? (
            <div className="text-center py-16 text-gray-400">
              <div className="text-4xl mb-3">
                {activeTab === "photo" && "\uD83D\uDCF7"}
                {activeTab === "video" && "\uD83C\uDFA5"}
                {activeTab === "link" && "\uD83D\uDD17"}
                {activeTab === "notice" && "\uD83D\uDD14"}
                {activeTab === "etc" && "\uD83D\uDCDD"}
              </div>
              <p className="text-sm">
                아직 등록된 글이 없습니다.
                <br />
                첫 번째 글을 작성해보세요!
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {posts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  onDelete={() => handleDelete(post.id)}
                />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

// ─── 파일 크기 포맷 ───
function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

// ─── 동영상 파일인지 확인 ───
function isVideoFile(file: File): boolean {
  return file.type.startsWith("video/") || /\.(mp4|mov|avi|mkv|webm|wmv|flv)$/i.test(file.name);
}

/* ─── 글쓰기 폼 ─── */
function PostForm({
  category,
  onSubmit,
  onCancel,
}: {
  category: PlazaPost["category"];
  onSubmit: () => void;
  onCancel: () => void;
}) {
  const [author, setAuthor] = useState("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [imageItems, setImageItems] = useState<{ file: File; previewUrl: string }[]>([]);
  const [videoItems, setVideoItems] = useState<{ file: File; previewUrl: string }[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const acceptMap: Record<string, string> = {
    photo: "image/*",
    video: "video/mp4,video/quicktime,video/x-msvideo,video/webm,video/x-matroska,video/*",
    link: "",
    notice: "",
    etc: "*/*",
  };

  function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files;
    if (!selected || selected.length === 0) return;
    setError("");

    for (let i = 0; i < selected.length; i++) {
      const file = selected[i];

      if (file.size > MAX_FILE_SIZE) {
        setError(`"${file.name}" 파일이 너무 큽니다 (${formatSize(file.size)}). 최대 ${formatSize(MAX_FILE_SIZE)}까지 가능합니다.`);
        continue;
      }

      const previewUrl = URL.createObjectURL(file);
      if (isVideoFile(file)) {
        setVideoItems((prev) => [...prev, { file, previewUrl }]);
      } else {
        setImageItems((prev) => [...prev, { file, previewUrl }]);
      }
    }
    if (fileRef.current) fileRef.current.value = "";
  }

  function removeImage(index: number) {
    setImageItems((prev) => {
      URL.revokeObjectURL(prev[index].previewUrl);
      return prev.filter((_, i) => i !== index);
    });
  }

  function removeVideo(index: number) {
    setVideoItems((prev) => {
      URL.revokeObjectURL(prev[index].previewUrl);
      return prev.filter((_, i) => i !== index);
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!author.trim() || !title.trim()) return;
    setIsSubmitting(true);
    setError("");

    try {
      await addPlazaPost({
        category,
        author: author.trim(),
        title: title.trim(),
        content: content.trim(),
        imageFiles: imageItems.length > 0 ? imageItems.map((i) => i.file) : undefined,
        videoFiles: videoItems.length > 0 ? videoItems.map((v) => v.file) : undefined,
        linkUrl: linkUrl.trim() || undefined,
      });

      for (const i of imageItems) URL.revokeObjectURL(i.previewUrl);
      for (const v of videoItems) URL.revokeObjectURL(v.previewUrl);

      onSubmit();
    } catch (err) {
      console.error("Post submit failed:", err);
      setError("저장에 실패했습니다. 네트워크 연결을 확인해주세요.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6 space-y-4"
    >
      <h3 className="font-bold text-gray-800">
        새 글 작성 ({TABS.find((t) => t.key === category)?.label})
      </h3>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs text-gray-500 mb-1">작성자 *</label>
          <input
            className="input"
            placeholder="이름"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">제목 *</label>
          <input
            className="input"
            placeholder="제목을 입력하세요"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>
      </div>

      <div>
        <label className="block text-xs text-gray-500 mb-1">내용</label>
        <textarea
          className="input"
          rows={4}
          placeholder="내용을 입력하세요"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          style={{ resize: "vertical" }}
        />
      </div>

      {category === "link" && (
        <div>
          <label className="block text-xs text-gray-500 mb-1">링크 URL</label>
          <input
            className="input"
            type="url"
            placeholder="https://..."
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
          />
        </div>
      )}

      {(category === "photo" || category === "video" || category === "etc") && (
        <div>
          <label className="block text-xs text-gray-500 mb-1">
            파일 첨부
            {category === "photo" && " (이미지, 여러 장 가능)"}
            {category === "video" && " (동영상, mp4/mov/avi/webm, 최대 100MB)"}
            {category === "etc" && " (여러 개 가능)"}
          </label>
          <input
            ref={fileRef}
            type="file"
            accept={acceptMap[category]}
            multiple
            onChange={handleFiles}
            className="block w-full text-sm text-gray-500 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />

          {error && (
            <p className="text-xs text-red-500 mt-2 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
          )}

          {/* 이미지 미리보기 */}
          {imageItems.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {imageItems.map((item, idx) => (
                <div key={idx} className="relative group">
                  {item.file.type.startsWith("image/") ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.previewUrl}
                      alt={item.file.name}
                      className="w-20 h-20 object-cover rounded-lg border border-gray-200"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-lg border border-gray-200 bg-gray-50 flex flex-col items-center justify-center p-1">
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#9CA3AF" strokeWidth="1.5">
                        <path d="M9 1H4a1 1 0 00-1 1v12a1 1 0 001 1h8a1 1 0 001-1V5L9 1z" />
                        <path d="M9 1v4h4" />
                      </svg>
                      <span className="text-[8px] text-gray-400 mt-1 truncate w-full text-center">{item.file.name}</span>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => removeImage(idx)}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    &times;
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* 동영상 미리보기 */}
          {videoItems.length > 0 && (
            <div className="flex flex-wrap gap-3 mt-3">
              {videoItems.map((item, idx) => (
                <div key={idx} className="relative group">
                  <div className="w-40 rounded-lg border border-gray-200 overflow-hidden bg-black">
                    <video
                      src={item.previewUrl}
                      className="w-full h-24 object-cover"
                    />
                    <div className="bg-gray-50 px-2 py-1">
                      <p className="text-[9px] text-gray-500 truncate">{item.file.name}</p>
                      <p className="text-[8px] text-gray-400">{formatSize(item.file.size)}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeVideo(idx)}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    &times;
                  </button>
                </div>
              ))}
            </div>
          )}

          {(imageItems.length > 0 || videoItems.length > 0) && (
            <p className="text-[10px] text-gray-400 mt-1">
              {imageItems.length + videoItems.length}개 파일 선택됨
              {videoItems.length > 0 && ` (동영상 ${videoItems.length}개)`}
            </p>
          )}
        </div>
      )}

      <div className="flex gap-2 pt-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors disabled:opacity-50"
        >
          {isSubmitting ? "업로드 중..." : "등록"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="px-5 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium transition-colors"
        >
          취소
        </button>
      </div>
    </form>
  );
}

/* ─── 게시글 카드 ─── */
function PostCard({
  post,
  onDelete,
}: {
  post: PlazaPost;
  onDelete: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const date = new Date(post.createdAt);
  const dateStr = `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, "0")}.${String(date.getDate()).padStart(2, "0")} ${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;

  const imageFiles = (post.files || []).filter(
    (f) => !f.name.match(/\.(mp4|mov|avi|mkv|webm|wmv|flv)$/i)
  );
  const videoFiles = post.videoFiles || [];
  const otherFiles = (post.files || []).filter((f) =>
    !f.name.match(/\.(jpg|jpeg|png|gif|webp|bmp|svg|mp4|mov|avi|mkv|webm|wmv|flv)$/i)
  );
  const fileCount = (post.files?.length || 0) + videoFiles.length;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div
        className="px-6 py-4 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 font-medium shrink-0">
              {TABS.find((t) => t.key === post.category)?.label}
            </span>
            <h3 className="font-medium text-gray-900 truncate">{post.title}</h3>
            {fileCount > 0 && (
              <span className="text-[10px] text-gray-400 shrink-0">
                ({fileCount > 1 ? `파일 ${fileCount}개` : (post.files?.[0]?.name || videoFiles[0]?.name || "파일")})
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 shrink-0 ml-4">
            <span className="text-xs text-gray-400">{post.author}</span>
            <span className="text-xs text-gray-300 hidden sm:inline">{dateStr}</span>
            <svg
              width="12"
              height="12"
              viewBox="0 0 12 12"
              fill="none"
              stroke="#9ca3af"
              strokeWidth="2"
              className={`transition-transform ${expanded ? "rotate-180" : ""}`}
            >
              <path d="M2 4l4 4 4-4" />
            </svg>
          </div>
        </div>
      </div>

      {expanded && (
        <div className="px-6 pb-5 border-t border-gray-100 pt-4">
          {post.content && (
            <p className="text-sm text-gray-700 whitespace-pre-wrap mb-4">
              {post.content}
            </p>
          )}

          {post.linkUrl && (
            <a
              href={post.linkUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-800 mb-4"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M5.5 8.5l3-3" />
                <path d="M7 6.5L5.5 8a2 2 0 002.83 2.83L9.5 9.5" />
                <path d="M7 7.5L8.5 6a2 2 0 00-2.83-2.83L4.5 4.5" />
              </svg>
              {post.linkUrl}
            </a>
          )}

          {/* 이미지 슬라이드 */}
          {imageFiles.length > 0 && <ImageSlider images={imageFiles} />}

          {/* 동영상 플레이어 */}
          {videoFiles.length > 0 && (
            <div className="space-y-3 mb-4">
              {videoFiles.map((vf, idx) => (
                <div key={idx}>
                  <video
                    src={vf.url}
                    controls
                    className="max-w-full max-h-96 rounded-lg border border-gray-200"
                    preload="metadata"
                  />
                  <p className="text-[10px] text-gray-400 mt-1">{vf.name}</p>
                </div>
              ))}
            </div>
          )}

          {/* 기타 파일 다운로드 */}
          {otherFiles.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {otherFiles.map((f, idx) => (
                <a
                  key={idx}
                  href={f.url}
                  download={f.name}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg text-sm text-gray-700 hover:bg-gray-100 border border-gray-200"
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M7 1v9m0 0l-3-3m3 3l3-3M2 12h10" />
                  </svg>
                  {f.name}
                </a>
              ))}
            </div>
          )}

          <div className="flex justify-end">
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (confirm("이 글을 삭제하시겠습니까?")) onDelete();
              }}
              className="text-xs text-red-400 hover:text-red-600 transition-colors"
            >
              삭제
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── 이미지 슬라이더 ─── */
function ImageSlider({ images }: { images: PlazaFileRef[] }) {
  const [current, setCurrent] = useState(0);

  if (images.length === 1) {
    return (
      <div className="mb-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={images[0].url}
          alt={images[0].name}
          className="max-w-full max-h-96 rounded-lg border border-gray-200"
        />
      </div>
    );
  }

  return (
    <div className="mb-4">
      <div className="relative rounded-lg border border-gray-200 overflow-hidden bg-gray-100">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={images[current].url}
          alt={images[current].name}
          className="max-w-full max-h-96 mx-auto block"
        />

        <button
          onClick={(e) => {
            e.stopPropagation();
            setCurrent((c) => (c === 0 ? images.length - 1 : c - 1));
          }}
          className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M9 2L4 7l5 5" />
          </svg>
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation();
            setCurrent((c) => (c === images.length - 1 ? 0 : c + 1));
          }}
          className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M5 2l5 5-5 5" />
          </svg>
        </button>

        <div className="absolute bottom-2 right-2 bg-black/50 text-white text-[10px] px-2 py-0.5 rounded-full">
          {current + 1} / {images.length}
        </div>
      </div>

      <div className="flex gap-1.5 mt-2 overflow-x-auto pb-1">
        {images.map((img, idx) => (
          <button
            key={idx}
            onClick={(e) => {
              e.stopPropagation();
              setCurrent(idx);
            }}
            className={`w-14 h-14 rounded-md overflow-hidden border-2 shrink-0 transition-colors ${
              idx === current ? "border-blue-500" : "border-gray-200 hover:border-gray-400"
            }`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={img.url} alt={img.name} className="w-full h-full object-cover" />
          </button>
        ))}
      </div>
    </div>
  );
}

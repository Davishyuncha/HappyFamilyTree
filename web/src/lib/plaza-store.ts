export interface PlazaFileRef {
  url: string;
  name: string;
}

export interface PlazaPost {
  id: string;
  category: "photo" | "video" | "link" | "notice" | "etc";
  author: string;
  title: string;
  content: string;
  files?: PlazaFileRef[];
  videoFiles?: PlazaFileRef[];
  linkUrl?: string;
  createdAt: string;
}

// 파일 크기 제한 (100MB)
export const MAX_FILE_SIZE = 100 * 1024 * 1024;

// ─── 게시글 조회 ───

export async function getPostsByCategory(
  category: PlazaPost["category"]
): Promise<PlazaPost[]> {
  const res = await fetch(`/api/plaza?category=${category}`);
  if (!res.ok) return [];
  return res.json();
}

// ─── 게시글 작성 ───

export async function addPlazaPost(data: {
  category: PlazaPost["category"];
  author: string;
  title: string;
  content: string;
  imageFiles?: File[];
  videoFiles?: File[];
  linkUrl?: string;
}): Promise<PlazaPost> {
  const form = new FormData();
  form.set("category", data.category);
  form.set("author", data.author);
  form.set("title", data.title);
  form.set("content", data.content);
  if (data.linkUrl) form.set("linkUrl", data.linkUrl);

  if (data.imageFiles) {
    for (const f of data.imageFiles) form.append("images", f);
  }
  if (data.videoFiles) {
    for (const f of data.videoFiles) form.append("videos", f);
  }

  const res = await fetch("/api/plaza", { method: "POST", body: form });
  if (!res.ok) throw new Error("게시글 저장에 실패했습니다.");
  return res.json();
}

// ─── 게시글 삭제 ───

export async function deletePlazaPost(id: string): Promise<void> {
  const res = await fetch(`/api/plaza?id=${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("게시글 삭제에 실패했습니다.");
}

import { put, list, del } from "@vercel/blob";
import { NextRequest } from "next/server";

interface PlazaFileRef {
  url: string;
  name: string;
}

interface PlazaPost {
  id: string;
  category: string;
  author: string;
  title: string;
  content: string;
  files?: PlazaFileRef[];
  videoFiles?: PlazaFileRef[];
  linkUrl?: string;
  createdAt: string;
}

const POSTS_BLOB = "plaza-posts.json";

// ─── 헬퍼: posts.json 읽기 ───

async function readPosts(): Promise<PlazaPost[]> {
  const { blobs } = await list({ prefix: POSTS_BLOB });
  if (blobs.length === 0) return [];
  const res = await fetch(blobs[0].url);
  return (await res.json()) as PlazaPost[];
}

async function writePosts(posts: PlazaPost[]): Promise<void> {
  await put(POSTS_BLOB, JSON.stringify(posts), {
    access: "public",
    addRandomSuffix: false,
  });
}

// ─── GET: 게시글 목록 ───

export async function GET(request: NextRequest) {
  const category = request.nextUrl.searchParams.get("category");

  let posts = await readPosts();
  if (category) {
    posts = posts.filter((p) => p.category === category);
  }
  posts.sort(
    (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return Response.json(posts);
}

// ─── POST: 게시글 작성 ───

export async function POST(request: NextRequest) {
  const formData = await request.formData();

  const category = formData.get("category") as string;
  const author = formData.get("author") as string;
  const title = formData.get("title") as string;
  const content = (formData.get("content") as string) || "";
  const linkUrl = (formData.get("linkUrl") as string) || "";

  if (!category || !author || !title) {
    return Response.json({ error: "필수 항목이 누락되었습니다." }, { status: 400 });
  }

  const postId = `plaza_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

  // 이미지 파일 업로드
  const imageEntries = formData.getAll("images") as File[];
  const files: PlazaFileRef[] = [];
  for (const file of imageEntries) {
    if (file.size === 0) continue;
    const safeName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
    const blob = await put(`plaza/files/${postId}/${safeName}`, file, {
      access: "public",
      addRandomSuffix: false,
    });
    files.push({ url: blob.url, name: file.name });
  }

  // 동영상 파일 업로드
  const videoEntries = formData.getAll("videos") as File[];
  const videoFiles: PlazaFileRef[] = [];
  for (const file of videoEntries) {
    if (file.size === 0) continue;
    const safeName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
    const blob = await put(`plaza/files/${postId}/${safeName}`, file, {
      access: "public",
      addRandomSuffix: false,
    });
    videoFiles.push({ url: blob.url, name: file.name });
  }

  const newPost: PlazaPost = {
    id: postId,
    category,
    author,
    title,
    content,
    files: files.length > 0 ? files : undefined,
    videoFiles: videoFiles.length > 0 ? videoFiles : undefined,
    linkUrl: linkUrl || undefined,
    createdAt: new Date().toISOString(),
  };

  const posts = await readPosts();
  posts.push(newPost);
  await writePosts(posts);

  return Response.json(newPost, { status: 201 });
}

// ─── DELETE: 게시글 삭제 ───

export async function DELETE(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id");
  if (!id) {
    return Response.json({ error: "id가 필요합니다." }, { status: 400 });
  }

  const posts = await readPosts();
  const post = posts.find((p) => p.id === id);
  if (!post) {
    return Response.json({ error: "게시글을 찾을 수 없습니다." }, { status: 404 });
  }

  // 첨부파일 삭제
  const allFiles = [...(post.files || []), ...(post.videoFiles || [])];
  if (allFiles.length > 0) {
    await del(allFiles.map((f) => f.url));
  }

  // 게시글 목록에서 제거
  const remaining = posts.filter((p) => p.id !== id);
  await writePosts(remaining);

  return Response.json({ ok: true });
}

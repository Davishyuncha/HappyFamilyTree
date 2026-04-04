export interface PlazaFile {
  dataUrl: string;
  name: string;
}

export interface PlazaPost {
  id: string;
  category: "photo" | "video" | "link" | "notice" | "etc";
  author: string;
  title: string;
  content: string;
  fileDataUrl?: string; // 하위 호환용 (단일 파일)
  fileName?: string;
  files?: PlazaFile[]; // 복수 파일 (이미지 등 작은 파일)
  blobFileIds?: string[]; // IndexedDB에 저장된 대용량 파일 ID
  linkUrl?: string;
  createdAt: string;
}

// 대용량 파일 메타 (IndexedDB에 blob과 함께 저장)
export interface BlobFileRecord {
  id: string;
  postId: string;
  name: string;
  type: string;
  blob: Blob;
}

const STORAGE_KEY = "happyfamilytree_plaza";
const IDB_NAME = "happyfamilytree_blobs";
const IDB_STORE = "files";
const IDB_VERSION = 1;

// ─── IndexedDB 헬퍼 ───

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(IDB_NAME, IDB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(IDB_STORE)) {
        db.createObjectStore(IDB_STORE, { keyPath: "id" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function saveBlobFile(record: BlobFileRecord): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, "readwrite");
    tx.objectStore(IDB_STORE).put(record);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getBlobFile(id: string): Promise<BlobFileRecord | undefined> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, "readonly");
    const req = tx.objectStore(IDB_STORE).get(id);
    req.onsuccess = () => resolve(req.result as BlobFileRecord | undefined);
    req.onerror = () => reject(req.error);
  });
}

export async function deleteBlobFiles(ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, "readwrite");
    const store = tx.objectStore(IDB_STORE);
    for (const id of ids) store.delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// ─── localStorage 기반 포스트 관리 ───

export function getPlazaPosts(): PlazaPost[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as PlazaPost[];
  } catch {
    return [];
  }
}

export function getPostsByCategory(category: PlazaPost["category"]): PlazaPost[] {
  return getPlazaPosts()
    .filter((p) => p.category === category)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function addPlazaPost(post: Omit<PlazaPost, "id" | "createdAt">): PlazaPost {
  const posts = getPlazaPosts();
  const newPost: PlazaPost = {
    ...post,
    id: `plaza_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    createdAt: new Date().toISOString(),
  };
  posts.push(newPost);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(posts));
  return newPost;
}

export async function deletePlazaPost(id: string): Promise<void> {
  const posts = getPlazaPosts();
  const post = posts.find((p) => p.id === id);
  // IndexedDB의 blob 파일도 삭제
  if (post?.blobFileIds && post.blobFileIds.length > 0) {
    await deleteBlobFiles(post.blobFileIds);
  }
  const remaining = posts.filter((p) => p.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(remaining));
}

// 파일 크기 제한 (100MB)
export const MAX_FILE_SIZE = 100 * 1024 * 1024;

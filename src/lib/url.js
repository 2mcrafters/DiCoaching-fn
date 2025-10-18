// Helpers to build URLs based on Vite env

export const getApiBaseUrl = () => {
  let base = import.meta.env.VITE_API_URL || "http://localhost:5050";
  base = base.replace(/\/+$/g, "");
  if (base.endsWith("/api")) base = base.slice(0, -4);
  return base;
};

// Build an absolute URL for files served by backend static "/uploads"
export const buildUploadUrl = (pathLike) => {
  if (!pathLike) return null;
  const raw = String(pathLike).trim();
  if (!raw) return null;
  if (/^https?:\/\//i.test(raw)) return raw; // already absolute
  // Ensure single leading segment without leading slash
  const normalized = raw.replace(/^\/+/, "");
  return `${getApiBaseUrl()}/${normalized}`;
};

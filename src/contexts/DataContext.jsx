import React, {
  createContext,
  useState,
  useEffect,
  useContext,
  useRef,
} from "react";
import slugify from "slugify";
import { useAuth } from "./AuthContext";
import apiService from "@/services/api";

const DataContext = createContext();

export const useData = () => useContext(DataContext);

const normalizeTerm = (item, index) => {
  // Handle various API shapes (legacy or new)
  const rawTerm = item.terme || item.term || item.title || item.name || "";
  const rawDefinition =
    item.definition || item.desc || item.description || item.resume || "";
  const rawExamples = item.exemples || item.examples || item.sample || "";
  const rawSources = item.sources || item.source || "";
  const rawRemark = item.remarque || item.remark || item.note || "";

  const examples =
    rawExamples && typeof rawExamples === "string" && rawExamples.trim() !== ""
      ? [{ text: rawExamples }]
      : Array.isArray(rawExamples)
      ? rawExamples
      : [];

  const sources =
    rawSources && typeof rawSources === "string" && rawSources.trim() !== ""
      ? [{ text: rawSources, url: "" }]
      : Array.isArray(rawSources)
      ? rawSources
      : [];

  return {
    id: item.id || item._id || `term-${index + 1}`,
    slug:
      item.slug ||
      slugify(rawTerm || `term-${index + 1}`, { lower: true, strict: true }),
    term: rawTerm,
    category: item.category || "Coaching",
    definition: rawDefinition,
    examples,
    sources,
    remarque: rawRemark || null,
    // normalize missing author to the special 'user-api' sentinel so UI can show the desired default name
    authorId: item.authorId || item.userId || "user-api",
    status: item.status || "published",
    createdAt: item.createdAt || item.date || new Date().toISOString(),
    updatedAt: item.updatedAt || item.modifiedAt || new Date().toISOString(),
    // snake_case aliases for legacy UI expects
    created_at:
      item.created_at ||
      item.createdAt ||
      item.date ||
      new Date().toISOString(),
    updated_at:
      item.updated_at ||
      item.updatedAt ||
      item.modifiedAt ||
      new Date().toISOString(),
    likes: item.likes || 0,
  };
};

export const DataProvider = ({ children }) => {
  const [terms, setTerms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  // Keep a ref to the current AbortController so we can cancel inflight requests
  const currentController = useRef(null);

  const isAbortError = (err) => {
    if (!err) return false;
    const name = String(err.name || "").toLowerCase();
    const msg = String(err.message || "").toLowerCase();
    const code = String(err.code || "").toLowerCase();
    return (
      name === "aborterror" ||
      code === "err_aborted" ||
      code === "err_aborted" ||
      msg.includes("aborted") ||
      msg.includes("abort")
    );
  };

  const fetchFromBackend = async (externalSignal) => {
    // Cancel previous request if any
    if (currentController.current) {
      try {
        currentController.current.abort();
      } catch (_) {}
      currentController.current = null;
    }

    const controller = externalSignal ? null : new AbortController();
    if (controller) currentController.current = controller;
    const signal =
      externalSignal || (controller && controller.signal) || undefined;

    setLoading(true);
    setError(null);
    try {
      // Use the central api service which points to your backend (VITE_API_URL)
      const options = signal ? { signal } : {};
      const data = await apiService.getTerms({}, options);

      if (!data) {
        throw new Error("Aucune donnée retournée par le backend");
      }

      // If backend returns an object with `data` or `terms` field, use it
      const rawTerms = Array.isArray(data)
        ? data
        : Array.isArray(data.data)
        ? data.data
        : Array.isArray(data.terms)
        ? data.terms
        : [];

      const normalized = rawTerms.map((t, i) => normalizeTerm(t, i));
      setTerms(normalized);
    } catch (e) {
      // Ignore aborted requests (caused by unmount/strict-mode double render or manual abort)
      if (isAbortError(e)) {
        // do not set error for aborted fetches
        return;
      }
      console.error(
        "Erreur lors de la récupération des termes depuis le backend :",
        e
      );
      setError(e.message || String(e));
      setTerms([]); // fallback to empty list to avoid stale localStorage data
    } finally {
      setLoading(false);
      // clear controller if it was ours
      if (currentController.current === controller)
        currentController.current = null;
    }
  };

  useEffect(() => {
    // Initial fetch — create an internal controller
    fetchFromBackend();

    return () => {
      if (currentController.current) {
        try {
          currentController.current.abort();
        } catch (_) {}
        currentController.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const refreshData = () => {
    // Start a fresh fetch and cancel any inflight one
    fetchFromBackend();
  };

  const value = {
    terms,
    loading,
    error,
    setTerms,
    refreshData,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};

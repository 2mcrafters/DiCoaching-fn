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

  // Extract "Voir aussi" from definition and sources
  let cleanedDefinition = rawDefinition;
  let cleanedSources = [...sources];
  const voirAussi = [];

  // Pattern to match "Voir aussi:" followed by content (case insensitive)
  const voirAussiRegex = /voir\s+aussi\s*:?\s*/i;

  // Check definition for "Voir aussi"
  if (
    typeof cleanedDefinition === "string" &&
    voirAussiRegex.test(cleanedDefinition)
  ) {
    const parts = cleanedDefinition.split(voirAussiRegex);
    if (parts.length > 1) {
      cleanedDefinition = parts[0].trim();
      // The rest is "Voir aussi" content
      const voirAussiText = parts.slice(1).join(" ").trim();
      if (voirAussiText) {
        voirAussi.push({ text: voirAussiText });
      }
    }
  }

  // Check sources for "Voir aussi"
  const filteredSources = [];
  for (const source of cleanedSources) {
    const sourceText = source.text || "";
    if (voirAussiRegex.test(sourceText)) {
      const parts = sourceText.split(voirAussiRegex);
      if (parts.length > 1) {
        // First part stays in sources if not empty
        const beforeText = parts[0].trim();
        if (beforeText) {
          filteredSources.push({ ...source, text: beforeText });
        }
        // Rest goes to Voir aussi
        const voirAussiText = parts.slice(1).join(" ").trim();
        if (voirAussiText) {
          voirAussi.push({ text: voirAussiText, url: source.url || "" });
        }
      }
    } else {
      filteredSources.push(source);
    }
  }

  const authorId = item.authorId || item.userId || item.author_id || null;
  const firstName = item.firstname || item.firstName || "";
  const lastName = item.lastname || item.lastName || "";
  const authorNameFromBackend = `${firstName} ${lastName}`.trim();

  // Set all terms to be authored by Mohamed Rachid Belhadj
  const authorName = "Mohamed Rachid Belhadj";

  return {
    id: item.id || item._id || `term-${index + 1}`,
    slug:
      item.slug ||
      slugify(rawTerm || `term-${index + 1}`, { lower: true, strict: true }),
    term: rawTerm,
    category: item.category || "Coaching",
    definition: cleanedDefinition,
    examples,
    sources: filteredSources,
    voirAussi: voirAussi.length > 0 ? voirAussi : [],
    remarque: rawRemark || null,
    authorId,
    authorName: authorName,
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
      // Don't filter out terms - just normalize them
      setTerms(normalized);
    } catch (e) {
      // Ignore aborted requests (caused by unmount/strict-mode double render or manual abort)
      if (isAbortError(e)) {
        // Silently ignore abort errors - this is expected behavior
        console.debug("Request aborted (expected during navigation/unmount)");
        return;
      }
      console.error(
        "Erreur lors de la récupération des termes depuis le backend :",
        e
      );
      setError(e.message || String(e));
      setTerms([]); // fallback to empty list to avoid stale localStorage data
    } finally {
      // Only update loading state if request wasn't aborted
      if (currentController.current === controller || !controller) {
        setLoading(false);
      }
      // clear controller if it was ours
      if (currentController.current === controller)
        currentController.current = null;
    }
  };

  useEffect(() => {
    // Initial fetch — create an internal controller
    fetchFromBackend().catch((error) => {
      if (!isAbortError(error)) {
        console.error(
          "Unexpected error while fetching terms during mount:",
          error
        );
      }
    });

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

    return fetchFromBackend().catch((error) => {
      if (!isAbortError(error)) {
        console.error("Unexpected error while refreshing terms:", error);
      }
    });
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

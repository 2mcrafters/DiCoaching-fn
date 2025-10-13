const toCollectionItem = (item) => {
  if (!item) return null;

  if (typeof item === "string") {
    const text = item.trim();
    return text ? { text } : null;
  }

  if (typeof item === "object") {
    const textCandidate = [item.text, item.value, item.label]
      .map((candidate) => (typeof candidate === "string" ? candidate.trim() : ""))
      .find(Boolean);
    const urlCandidate = [item.url, item.href]
      .map((candidate) => (typeof candidate === "string" ? candidate.trim() : ""))
      .find(Boolean);

    const normalized = {};
    if (textCandidate) normalized.text = textCandidate;
    if (urlCandidate) normalized.url = urlCandidate;

    return Object.keys(normalized).length ? normalized : null;
  }

  return null;
};

const normalizeCollection = (value) => {
  if (!value) return [];
  const arrayValue = Array.isArray(value) ? value : [value];
  return arrayValue.map(toCollectionItem).filter(Boolean);
};

export const sanitizeModificationChanges = (changes) => {
  if (!changes || typeof changes !== "object") return {};

  const sanitized = { ...changes };

  const normalizedExamples = normalizeCollection(
    changes.exemples ?? changes.examples ?? changes.example ?? null
  );
  if (normalizedExamples.length) {
    sanitized.examples = normalizedExamples;
    sanitized.exemples = normalizedExamples;
  }

  const normalizedSources = normalizeCollection(changes.sources ?? changes.source ?? null);
  if (normalizedSources.length) {
    sanitized.sources = normalizedSources;
  }

  const normalizedRemarks = normalizeCollection(
    changes.remarques ?? changes.remarque ?? changes.remarks ?? null
  );
  if (normalizedRemarks.length) {
    sanitized.remarques = normalizedRemarks;
  }

  return sanitized;
};

const pickFirstValue = (changes, keys) => {
  if (!changes || typeof changes !== "object" || !Array.isArray(keys)) return null;

  for (const key of keys) {
    if (!key) continue;
    if (Object.prototype.hasOwnProperty.call(changes, key)) {
      const value = changes[key];
      if (value !== null && value !== undefined && value !== "") {
        return value;
      }
    }
  }

  return null;
};

export const prepareTermUpdateFromChanges = (rawChanges) => {
  const changes = sanitizeModificationChanges(rawChanges);
  if (!changes || typeof changes !== "object") return {};

  const payload = {};

  const termValue = pickFirstValue(changes, ["terme", "term"]);
  if (termValue !== null) payload.terme = termValue;

  const definitionValue = pickFirstValue(changes, ["definition", "definition_fr"]);
  if (definitionValue !== null) payload.definition = definitionValue;

  const categoryValue = pickFirstValue(changes, ["categorie_id", "category_id"]);
  if (categoryValue !== null) payload.categorie_id = categoryValue;

  const authorValue = pickFirstValue(changes, ["author_id", "authorId"]);
  if (authorValue !== null) payload.author_id = authorValue;

  const statusValue = pickFirstValue(changes, ["status"]);
  if (statusValue !== null) payload.status = statusValue;

  const normalizedExamples = normalizeCollection(changes.exemples ?? changes.examples ?? null);
  if (normalizedExamples.length) payload.exemples = normalizedExamples;

  const normalizedSources = normalizeCollection(changes.sources ?? changes.source ?? null);
  if (normalizedSources.length) payload.sources = normalizedSources;

  const normalizedRemarks = normalizeCollection(
    changes.remarques ?? changes.remarque ?? changes.remarks ?? null
  );
  if (normalizedRemarks.length) payload.remarques = normalizedRemarks;

  return payload;
};

export const formatModificationCollection = (collection) => normalizeCollection(collection);

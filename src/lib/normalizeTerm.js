// Normalisation d'un objet terme pour assurer une structure cohérente dans toute l'application
import slugify from 'slugify';

export function normalizeTerm(item, index = 0) {
  if (!item || typeof item !== 'object') return { id: `term-${index+1}`, term: '', category: 'Coaching' };

  // Préserver si déjà normalisé
  if (item.__normalized) return item;

  const rawTerm = item.terme || item.term || item.title || item.name || '';
  const rawDefinition = item.definition || item.desc || item.description || item.resume || '';
  const rawExamples = item.exemples || item.examples || item.sample || item.exemple || '';
  const rawSources = item.sources || item.source || '';
  const rawRemark = item.remarque || item.remark || item.note || '';
  // Support new plural remarques array structure (preferred going forward)
  const rawRemarques = item.remarques || item.notes || [];

  const examples = (() => {
    if (Array.isArray(rawExamples)) return rawExamples;
    if (typeof rawExamples === 'string' && rawExamples.trim() !== '') {
      return rawExamples.split(/\r?\n/).map(s => s.trim()).filter(Boolean).map(text => ({ text }));
    }
    return [];
  })();

  const sources = (() => {
    if (Array.isArray(rawSources)) return rawSources;
    if (typeof rawSources === 'string' && rawSources.trim() !== '') {
      return rawSources.split(/\r?\n/).map(s => s.trim()).filter(Boolean).map(text => ({ text, url: '' }));
    }
    return [];
  })();

  // Map various author id shapes from backend joins and legacy local data
  const authorId = item.authorId || item.author_id || item.userId || null;
  const categorie_id = item.categorie_id || item.category_id || null;
  const categoryLabel = item.category || item.categorie_libelle || item.category_label || 'Coaching';
  const firstName = item.firstname || item.firstName || '';
  const lastName = item.lastname || item.lastName || '';
  const authorNameFromBackend = `${firstName} ${lastName}`.trim();

  // Build remarques array: if explicit array provided use it; else derive from single remark
  const remarques = (() => {
    if (Array.isArray(rawRemarques) && rawRemarques.length > 0) {
      return rawRemarques.map(r => (typeof r === 'string' ? { text: r } : r)).filter(r => r && r.text && r.text.trim() !== '');
    }
    if (typeof rawRemark === 'string' && rawRemark.trim() !== '') {
      return rawRemark.split(/\r?\n/).map(s => s.trim()).filter(Boolean).map(text => ({ text }));
    }
    return [];
  })();

  return {
    __normalized: true,
    id: item.id || item._id || `term-${index + 1}`,
    slug:
      item.slug ||
      slugify(rawTerm || `term-${index + 1}`,( { lower: true, strict: true } )),
    term: rawTerm,
  category: categoryLabel,
  categorie_id,
    definition: rawDefinition,
    examples,
    sources,
  // Backward compat: keep singular 'remarque' plus new plural 'remarques'
  remarque: rawRemark || (remarques[0]?.text || null),
  remarques,
    authorId,
    authorName: authorNameFromBackend || 'Mohamed Rachid Belhadj',
    status: item.status || 'published',
    createdAt: item.createdAt || item.date || new Date().toISOString(),
    updatedAt: item.updatedAt || item.modifiedAt || new Date().toISOString(),
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
}

export function normalizeTerms(list) {
  return (list || []).map((t, i) => normalizeTerm(t, i));
}

import React, { useState, useMemo, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Helmet } from "react-helmet-async";
import { motion } from 'framer-motion';
import { addDays } from 'date-fns';

import { useDispatch, useSelector } from "react-redux";
import { selectAllTerms, fetchTerms } from "@/features/terms/termsSlice";
import SearchFilters from "@/components/search/SearchFilters";
import SearchResults from "@/components/search/SearchResults";

const ITEMS_PER_PAGE = 20;

const Search = () => {
  const dispatch = useDispatch();
  const terms = useSelector(selectAllTerms);
  const loading = useSelector((state) => state.terms.loading);
  const error = useSelector((state) => state.terms.error);
  const [searchParams, setSearchParams] = useSearchParams();

  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");
  const [selectedCategory, setSelectedCategory] = useState(
    searchParams.get("category") || "all"
  );
  const [selectedStatus, setSelectedStatus] = useState(
    searchParams.get("status") || "published"
  );
  const [selectedAuthor, setSelectedAuthor] = useState(
    searchParams.get("author") || "all"
  );
  const [sortBy, setSortBy] = useState(
    searchParams.get("sort") || (searchQuery ? "relevance" : "alphabetical")
  );
  const [dateRange, setDateRange] = useState({
    from: searchParams.get("from")
      ? new Date(searchParams.get("from"))
      : undefined,
    to: searchParams.get("to") ? new Date(searchParams.get("to")) : undefined,
  });
  const [currentPage, setCurrentPage] = useState(
    parseInt(searchParams.get("page") || "1", 10)
  );

  // Ensure terms are loaded from backend via Redux
  useEffect(() => {
    // Always fetch all terms without limit for search functionality
    dispatch(fetchTerms({})); // Empty params = fetch ALL terms
  }, [dispatch]);

  // Apply status first (default to published)
  const statusTerms = useMemo(() => {
    if (selectedStatus === "all") return terms;
    return terms.filter((t) => (t.status || "published") === selectedStatus);
  }, [terms, selectedStatus]);

  // Build authors list directly from backend-normalized terms (no localStorage)
  const authors = useMemo(() => {
    const map = new Map();
    statusTerms.forEach((t) => {
      const id = t.authorId || "unknown";
      const name = t.authorName || "Mohamed Rachid Belhadj";
      if (!map.has(id)) map.set(id, name);
    });
    const items = Array.from(map.entries()).map(([id, name]) => ({ id, name }));
    return [{ id: "all", name: "Tous les auteurs" }, ...items];
  }, [statusTerms]);

  const categories = useMemo(() => {
    return ["all", "Coaching"];
  }, []);

  const filteredTerms = useMemo(() => {
    let filtered = [...statusTerms];

    // Apply standard filters first
    if (selectedCategory !== "all") {
      filtered = filtered.filter((term) => term.category === selectedCategory);
    }
    if (selectedAuthor !== "all") {
      filtered = filtered.filter((term) => term.authorId === selectedAuthor);
    }
    if (dateRange.from) {
      filtered = filtered.filter(
        (term) => new Date(term.createdAt) >= dateRange.from
      );
    }
    if (dateRange.to) {
      filtered = filtered.filter(
        (term) => new Date(term.createdAt) <= addDays(dateRange.to, 1)
      );
    }

    // Apply search query and relevance scoring
    // Only search in term names that start with the search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered
        .filter((term) => term.term.toLowerCase().startsWith(query))
        .map((term) => ({ ...term, score: 1 }));
    } else {
      // Add a default score if no search query
      filtered = filtered.map((term) => ({ ...term, score: 0 }));
    }

    // Apply sorting
    const allLikes = (() => {
      try {
        return JSON.parse(localStorage.getItem("coaching_dict_likes") || "{}");
      } catch {
        return {};
      }
    })();

    filtered.sort((a, b) => {
      if (sortBy === "relevance" && searchQuery.trim()) {
        if (a.score !== b.score) return b.score - a.score;
      }

      // Secondary sorting for relevance or primary for other options
      switch (sortBy) {
        case "recent":
          return new Date(b.createdAt) - new Date(a.createdAt);
        case "likes":
          const likesA = (allLikes[a.id] || []).length;
          const likesB = (allLikes[b.id] || []).length;
          return likesB - likesA;
        case "alphabetical":
        default:
          return a.term.localeCompare(b.term);
      }
    });

    return filtered;
  }, [
    searchQuery,
    selectedCategory,
    selectedStatus,
    selectedAuthor,
    sortBy,
    dateRange,
    statusTerms,
  ]);

  const totalPages = Math.ceil(filteredTerms.length / ITEMS_PER_PAGE);
  const paginatedTerms = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredTerms.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredTerms, currentPage]);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      window.scrollTo(0, 0);
    }
  };

  useEffect(() => {
    if (searchQuery.trim() && sortBy !== "relevance") {
      setSortBy("relevance");
    } else if (!searchQuery.trim() && sortBy === "relevance") {
      setSortBy("alphabetical");
    }
  }, [searchQuery, sortBy]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (searchQuery) params.set("q", searchQuery);
    if (selectedCategory !== "all") params.set("category", selectedCategory);
    if (selectedStatus && selectedStatus !== "published")
      params.set("status", selectedStatus);
    if (selectedAuthor !== "all") params.set("author", selectedAuthor);

    // Only set sort if it's not the default
    const defaultSort = searchQuery.trim() ? "relevance" : "alphabetical";
    if (sortBy !== defaultSort) params.set("sort", sortBy);

    if (dateRange.from)
      params.set("from", dateRange.from.toISOString().split("T")[0]);
    if (dateRange.to)
      params.set("to", dateRange.to.toISOString().split("T")[0]);
    if (currentPage > 1) params.set("page", currentPage);

    setSearchParams(params, { replace: true });
  }, [
    searchQuery,
    selectedCategory,
    selectedAuthor,
    sortBy,
    dateRange,
    currentPage,
    setSearchParams,
  ]);

  const getAuthorName = (authorId) => {
    const term = statusTerms.find((t) => t.authorId === authorId);
    return term?.authorName || "Mohamed Rachid Belhadj";
  };

  return (
    <>
      <Helmet>
        <title>Recherche - Dicoaching</title>
        <meta
          name="description"
          content="Recherchez et explorez les termes du dictionnaire collaboratif du coaching. Filtrez par catégorie et trouvez les concepts qui vous intéressent."
        />
      </Helmet>

      <div className="min-h-screen creative-bg py-8">
        <div className="max-w-8xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-8"
          >
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Recherche dans le{" "}
              <span className="creative-gradient-text">dictionnaire</span>
            </h1>
            <p className="text-muted-foreground">
              Explorez les concepts et techniques du coaching
              {!loading && statusTerms.length > 0 && (
                <span className="ml-2 font-medium">
                  • {statusTerms.length} terme
                  {statusTerms.length > 1 ? "s" : ""} disponible
                  {statusTerms.length > 1 ? "s" : ""}
                </span>
              )}
            </p>
          </motion.div>

          <div className="flex flex-col lg:flex-row gap-8">
            <motion.aside
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="w-full lg:w-1/4 xl:w-1/5"
            >
              <SearchFilters
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                selectedCategory={selectedCategory}
                setSelectedCategory={setSelectedCategory}
                selectedStatus={selectedStatus}
                setSelectedStatus={setSelectedStatus}
                selectedAuthor={selectedAuthor}
                setSelectedAuthor={setSelectedAuthor}
                sortBy={sortBy}
                setSortBy={setSortBy}
                dateRange={dateRange}
                setDateRange={setDateRange}
                authors={authors}
                categories={categories}
                setCurrentPage={setCurrentPage}
              />
            </motion.aside>

            <main className="flex-1">
              <SearchResults
                paginatedTerms={paginatedTerms}
                loading={loading}
                error={error}
                filteredTermsLength={filteredTerms.length}
                totalPages={totalPages}
                currentPage={currentPage}
                handlePageChange={handlePageChange}
                getAuthorName={getAuthorName}
                searchQuery={searchQuery}
              />
            </main>
          </div>
        </div>
      </div>
    </>
  );
};

export default Search;
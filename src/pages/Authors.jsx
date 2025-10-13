import React, { useState, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchUsers, selectAllUsers } from "@/features/users/usersSlice";
import { Helmet } from "react-helmet";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search } from "lucide-react";
import AuthorCard from "@/components/authors/AuthorCard";
import { useData } from "@/contexts/DataContext";

const FALLBACK_PROFESSION = "Mohamed Rachid Belhadj";
const SPECIAL_ADMIN_EMAILS = ["admin@dict.com", "admin@dictionnaire.fr"];

const fallbackAvatar = (id) =>
  `https://i.pravatar.cc/150?u=${id || Math.random()}`;

const splitName = (fullName = "") => {
  const trimmed = fullName.trim();
  if (!trimmed) return { firstname: "", lastname: "" };
  const parts = trimmed.split(/\s+/);
  if (parts.length === 1) return { firstname: parts[0], lastname: "" };
  return {
    firstname: parts.slice(0, -1).join(" "),
    lastname: parts.slice(-1).join(" "),
  };
};

const normalizeUser = (user = {}) => {
  const firstname = user.firstname || user.first_name || "";
  const lastname = user.lastname || user.last_name || "";
  const nameFromRecord = user.name || user.email || `Mohamed Rachid Belhadj`;
  const { firstname: splitFirst, lastname: splitLast } =
    !firstname && !lastname
      ? splitName(nameFromRecord)
      : { firstname, lastname };

  return {
    id: String(user.id),
    email: user.email || null,
    firstname: firstname || splitFirst,
    lastname: lastname || splitLast,
    name:
      `${firstname || splitFirst} ${lastname || splitLast}`.trim() ||
      nameFromRecord,
    role: user.role,
    status: user.status || "active",
    professionalStatus:
      user.professional_status ||
      user.professionalStatus ||
      FALLBACK_PROFESSION,
    profile_picture: user.profile_picture || null,
    biography: user.biography || "",
    termsAdded: user.termsAdded || 0,
    score: user.score || 0,
    sex: user.sex,
  };
};

const Authors = () => {
  const dispatch = useDispatch();
  const users = useSelector(selectAllUsers);
  const usersLoading = useSelector((state) => state.users.loading);
  const usersError = useSelector((state) => state.users.error);
  const { terms } = useData();

  const [searchQuery, setSearchQuery] = useState("");
  const [professionFilter, setProfessionFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState("popularity");

  useEffect(() => {
    dispatch(fetchUsers());
  }, [dispatch]);

  const usersById = useMemo(() => {
    const map = new Map();
    (users || []).forEach((user) => {
      if (user && user.id != null) {
        map.set(String(user.id), normalizeUser(user));
      }
    });
    return map;
  }, [users]);

  const authorsFromTerms = useMemo(() => {
    const map = new Map();
    (terms || []).forEach((term) => {
      const authorId = String(
        term.authorId || term.author_id || term.author || "unknown"
      );

      const authorName =
        term.authorName ||
        term.author_name ||
        `${term.firstname || ""} ${term.lastname || ""}`.trim() ||
        "Mohamed Rachid Belhadj";

      if (!map.has(authorId)) {
        map.set(authorId, {
          id: authorId,
          name: authorName,
          email: term.authorEmail || null,
          professionalStatus:
            term.authorProfessionalStatus || FALLBACK_PROFESSION,
          profile_picture: term.authorProfilePicture || null,
          biography: term.authorBiography || "",
          sex: term.authorSex,
          terms: [],
        });
      }
      map.get(authorId).terms.push(term);
    });
    return map;
  }, [terms]);

  const authors = useMemo(() => {
    const combined = new Map();

    authorsFromTerms.forEach((entry, id) => {
      const matchedUser = usersById.get(id);
      const primaryTerm = entry.terms[0] || {};
      const base =
        matchedUser ||
        normalizeUser({ id, email: entry.email, name: entry.name });

      const author = {
        ...base,
        email: base.email || entry.email,
        professionalStatus:
          base.professionalStatus ||
          entry.professionalStatus ||
          FALLBACK_PROFESSION,
        biography: base.biography || entry.biography || "",
        profile_picture: base.profile_picture || entry.profile_picture || null,
        sex: base.sex || entry.sex,
        termsAdded: entry.terms.length,
        score: Math.max(base.score || 0, entry.terms.length),
      };

      if (!author.firstname && author.name) {
        const { firstname, lastname } = splitName(author.name);
        author.firstname = firstname;
        author.lastname = lastname;
      }

      combined.set(id, author);
    });

    (users || []).forEach((user) => {
      if (!user) return;
      const normalized = normalizeUser(user);
      const id = normalized.id;
      const isAuthorRole = ["author", "auteur", "admin"].includes(
        (normalized.role || "").toLowerCase()
      );
      if (!isAuthorRole) return;

      if (combined.has(id)) {
        const existing = combined.get(id);
        combined.set(id, {
          ...existing,
          ...normalized,
          profile_picture:
            normalized.profile_picture || existing.profile_picture,
          termsAdded: Math.max(
            existing.termsAdded || 0,
            normalized.termsAdded || 0
          ),
          score: Math.max(existing.score || 0, normalized.score || 0),
          biography: existing.biography || normalized.biography,
        });
      } else {
        combined.set(id, {
          ...normalized,
          profile_picture: normalized.profile_picture || null,
        });
      }
    });

    SPECIAL_ADMIN_EMAILS.forEach((email) => {
      const lower = email.toLowerCase();
      combined.forEach((author, key) => {
        if ((author.email || "").toLowerCase() === lower) {
          author.firstname = "Mohamed Rachid";
          author.lastname = "Belhadj";
          author.name = "Mohamed Rachid Belhadj";
          author.professionalStatus = "Coach / Formateur";
          author.score = Math.max(author.score || 0, 150);
          author.role = "auteur";
        }
      });
    });

    // Deduplicate by email to prevent duplicate cards
    const seenEmails = new Map();
    const deduplicated = new Map();
    combined.forEach((author, id) => {
      const email = (author.email || "").toLowerCase();
      if (email && seenEmails.has(email)) {
        // Merge with existing entry
        const existingId = seenEmails.get(email);
        const existing = deduplicated.get(existingId);
        deduplicated.set(existingId, {
          ...existing,
          ...author,
          termsAdded: Math.max(
            existing.termsAdded || 0,
            author.termsAdded || 0
          ),
          score: Math.max(existing.score || 0, author.score || 0),
          profile_picture: author.profile_picture || existing.profile_picture,
          professionalStatus:
            author.professionalStatus || existing.professionalStatus,
        });
      } else {
        if (email) seenEmails.set(email, id);
        deduplicated.set(id, author);
      }
    });

    const list = Array.from(deduplicated.values()).map((author) => {
      if (!author.profile_picture) {
        author.profile_picture = fallbackAvatar(author.id);
      }
      if (!author.firstname && author.name) {
        const { firstname, lastname } = splitName(author.name);
        author.firstname = firstname;
        author.lastname = lastname;
      }
      author.professionalStatus =
        author.professionalStatus || FALLBACK_PROFESSION;
      if (String(author.id) === "3") {
        author.termsAdded = Math.max(author.termsAdded || 0, 1421);
        author.score = Math.max(author.score || 0, 14210);
      }
      return author;
    });

    return list;
  }, [authorsFromTerms, usersById, users]);

  const professions = useMemo(() => {
    const unique = new Set();
    unique.add("all");
    authors.forEach((author) => {
      if (author.professionalStatus) {
        unique.add(author.professionalStatus);
      }
    });
    return Array.from(unique);
  }, [authors]);

  const filteredAuthors = useMemo(() => {
    let result = [...authors];

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter((author) => author.name.toLowerCase().includes(q));
    }

    if (professionFilter !== "all") {
      result = result.filter(
        (author) => author.professionalStatus === professionFilter
      );
    }

    if (sortOrder === "popularity") {
      result.sort((a, b) => b.score - a.score || b.termsAdded - a.termsAdded);
    } else if (sortOrder === "name_asc") {
      result.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortOrder === "name_desc") {
      result.sort((a, b) => b.name.localeCompare(a.name));
    }

    return result;
  }, [authors, searchQuery, professionFilter, sortOrder]);

  return (
    <>
      <Helmet>
        <title>Nos Auteurs - Dictionnaire Collaboratif du Coaching</title>
        <meta
          name="description"
          content="Découvrez les auteurs et contributeurs qui enrichissent le dictionnaire collaboratif du coaching."
        />
      </Helmet>
      <div className="min-h-screen creative-bg py-12">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h1 className="text-4xl font-extrabold text-foreground sm:text-5xl md:text-6xl">
              Nos <span className="creative-gradient-text">Auteurs</span>
            </h1>
            <p className="mt-3 max-w-md mx-auto text-base text-muted-foreground sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
              Rencontrez la communauté d'experts qui partagent leur savoir et
              enrichissent le dictionnaire.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex flex-col md:flex-row gap-4 mb-8 p-4 border rounded-lg bg-card"
          >
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Rechercher un auteur par nom..."
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className="pl-10 h-12"
              />
            </div>
            <div className="flex gap-4">
              <Select
                value={professionFilter}
                onValueChange={setProfessionFilter}
              >
                <SelectTrigger className="w-full md:w-[200px] h-12">
                  <SelectValue placeholder="Filtrer par profession" />
                </SelectTrigger>
                <SelectContent>
                  {professions.map((prof) => (
                    <SelectItem key={prof} value={prof}>
                      {prof === "all" ? "Toutes les professions" : prof}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={sortOrder} onValueChange={setSortOrder}>
                <SelectTrigger className="w-full md:w-[200px] h-12">
                  <SelectValue placeholder="Trier par" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="popularity">Popularité</SelectItem>
                  <SelectItem value="name_asc">Nom (A-Z)</SelectItem>
                  <SelectItem value="name_desc">Nom (Z-A)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </motion.div>

          {usersLoading && (
            <div className="text-center py-16 text-muted-foreground">
              Chargement des auteurs...
            </div>
          )}

          {usersError && (
            <div className="text-center py-16 text-red-500">
              Impossible de charger les auteurs : {usersError}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {filteredAuthors.map((author, index) => (
              <motion.div
                key={`${author.id}-${index}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.05 }}
              >
                <AuthorCard author={author} />
              </motion.div>
            ))}
          </div>
          {filteredAuthors.length === 0 && !usersLoading && (
            <div className="text-center col-span-full py-16">
              <p className="text-muted-foreground">
                Aucun auteur ne correspond à votre recherche.
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Authors;

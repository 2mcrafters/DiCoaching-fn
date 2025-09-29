import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DateRangePicker } from '@/components/ui/daterangepicker';
import { Search as SearchIcon, SlidersHorizontal } from 'lucide-react';

const SearchFilters = ({
  searchQuery,
  setSearchQuery,
  selectedCategory,
  setSelectedCategory,
  selectedAuthor,
  setSelectedAuthor,
  sortBy,
  setSortBy,
  dateRange,
  setDateRange,
  authors,
  categories,
  setCurrentPage
}) => {
  return (
    <Card className="sticky top-24">
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><SlidersHorizontal className="h-5 w-5" /> Filtres & Tri</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <form onSubmit={(e) => { e.preventDefault(); setCurrentPage(1); }} className="space-y-4">
          <div>
            <Label htmlFor="search-input">Recherche par contenu</Label>
            <div className="relative mt-1">
              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="search-input"
                type="text"
                placeholder="Rechercher dans tout le contenu..."
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                className="pl-10"
              />
            </div>
          </div>
        </form>
        <div className="space-y-2">
          <Label>Catégorie</Label>
          <Select value={selectedCategory} onValueChange={(value) => { setSelectedCategory(value); setCurrentPage(1); }}>
            <SelectTrigger>
              <SelectValue placeholder="Toutes les catégories" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category === 'all' ? 'Toutes les catégories' : category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Auteur</Label>
          <Select value={selectedAuthor} onValueChange={(value) => { setSelectedAuthor(value); setCurrentPage(1); }}>
            <SelectTrigger>
              <SelectValue placeholder="Tous les auteurs" />
            </SelectTrigger>
            <SelectContent>
              {authors.map((author) => (
                <SelectItem key={author.id} value={author.id}>
                  {author.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Date de publication</Label>
          <DateRangePicker date={dateRange} onDateChange={(range) => { setDateRange(range || {}); setCurrentPage(1); }} />
        </div>
        <div className="space-y-2">
          <Label>Trier par</Label>
          <Select value={sortBy} onValueChange={(value) => { setSortBy(value); setCurrentPage(1); }}>
            <SelectTrigger>
              <SelectValue placeholder="Trier par" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="relevance">Pertinence</SelectItem>
              <SelectItem value="alphabetical">Alphabétique</SelectItem>
              <SelectItem value="recent">Plus récents</SelectItem>
              <SelectItem value="likes">Plus aimés</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
};

export default SearchFilters;
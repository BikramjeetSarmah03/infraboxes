"use client";

import { useState } from "react";
import { Search, Loader2, Globe, Shuffle, Plus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { toast } from "sonner";
import { searchDomains } from "../actions/domain-actions";
import { DomainResultsList } from "./domain-results-list";
import type { DomainAvailability } from "../domain-types";
import { SUPPORTED_TLDS } from "../infrastructure/resellerclub-provider";

export function DomainSearchSection() {
  const [keyword, setKeyword] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [results, setResults] = useState<DomainAvailability[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedTld, setSelectedTld] = useState("com");
  const [currentPage, setCurrentPage] = useState(0);

  const handleSearch = async (e?: React.FormEvent) => {
    e?.preventDefault();
    
    if (!keyword.trim() || keyword.length < 2) {
      toast.error("Please enter at least 2 characters");
      return;
    }

    setIsSearching(true);
    setHasSearched(true);
    setCurrentPage(0); // Reset page on new search
    
    try {
      const response = await searchDomains(keyword, selectedTld, 0);
      
      if (response.success && response.domains) {
        setResults(response.domains);
        if (response.domains.length === 0) {
          toast.info("No suggestions found for this keyword.");
        }
      } else {
        toast.error(response.error || "Failed to fetch domains");
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
    } finally {
      setIsSearching(false);
    }
  };

  const handleLoadMore = async () => {
    if (isSearching || isLoadingMore) return;
    
    const nextPage = currentPage + 1;
    setIsLoadingMore(true);
    
    try {
      const response = await searchDomains(keyword, selectedTld, nextPage);
      
      if (response.success && response.domains) {
        if (response.domains.length > 0) {
          setResults((prev: DomainAvailability[]) => [...prev, ...response.domains!]);
          setCurrentPage(nextPage);
        } else {
          toast.info("No more suggestions available.");
        }
      } else {
        toast.error("Failed to load more domains");
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
    } finally {
      setIsLoadingMore(false);
    }
  };

  const handleShuffle = () => {
    const randomWords = ["vault", "sphere", "pulse", "echo", "nexus", "nova", "prime", "grid", "flow", "drift"];
    const randomWord = randomWords[Math.floor(Math.random() * randomWords.length)];
    setKeyword(randomWord);
    setIsSearching(true);
    setHasSearched(true);
    setCurrentPage(0);
    searchDomains(randomWord, selectedTld, 0).then(response => {
      if (response.success && response.domains) {
        setResults(response.domains);
      }
      setIsSearching(false);
    });
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8 p-4">
      {/* Search Header */}
      <div className="text-center space-y-4">
        <motion.h1 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl font-bold tracking-tight bg-linear-to-r from-primary to-primary/60 bg-clip-text text-transparent"
        >
          Find Your Perfect Domain
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="text-muted-foreground text-lg"
        >
          Search across hundreds of TLDs with instant availability checks.
        </motion.p>
      </div>

      {/* Search Bar Container */}
      <motion.div 
        layout
        className="relative group mt-8"
      >
        <div className="absolute -inset-1 bg-linear-to-r from-primary/20 to-primary/10 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
        <form 
          onSubmit={handleSearch}
          className="relative flex items-center bg-background/80 backdrop-blur-xl p-2 md:p-4 rounded-xl border border-border shadow-2xl space-x-2"
        >
          <div className="flex-1 flex items-center pl-2 md:pl-4">
            <Globe className="w-5 h-5 text-muted-foreground mr-3 md:mr-4 shrink-0" />
            <Input 
              placeholder="Enter keyword or business name..." 
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              className="border-0 focus-visible:ring-0 text-lg bg-transparent p-0 h-10 md:h-12"
              autoFocus
            />
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={handleShuffle}
              disabled={isSearching}
              className="rounded-lg h-10 w-10 md:h-12 md:w-12 text-muted-foreground hover:text-primary transition-colors"
              title="Shuffle"
            >
              <Shuffle className={`w-5 h-5 ${isSearching ? "animate-spin-slow" : ""}`} />
            </Button>

            <div className="hidden sm:block">
              <Select value={selectedTld} onValueChange={setSelectedTld}>
                <SelectTrigger className="w-24 md:w-32 h-10 md:h-12 bg-muted/30 border-muted rounded-lg font-medium">
                  <SelectValue placeholder="TLD" />
                </SelectTrigger>
                <SelectContent>
                  {SUPPORTED_TLDS.map(tld => (
                    <SelectItem key={tld} value={tld}>
                      .{tld}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button 
              disabled={isSearching}
              size="lg"
              className="rounded-lg px-6 md:px-8 h-10 md:h-12 bg-primary hover:bg-primary/90 transition-all font-semibold shadow-lg shadow-primary/20"
            >
              {isSearching ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Search className="w-5 h-5 mr-2" />
                  <span className="hidden sm:inline">Search</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </motion.div>

      {/* Results Section */}
      <AnimatePresence mode="wait">
        {hasSearched && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            key="results"
            className="pt-8"
          >
            <DomainResultsList 
              domains={results} 
              isLoading={isSearching} 
            />

            {!isSearching && results.length > 0 && (
              <div className="mt-12 flex justify-center pb-12">
                <Button
                  variant="outline"
                  size="lg"
                  onClick={handleLoadMore}
                  disabled={isLoadingMore}
                  className="rounded-full px-12 border-primary/20 hover:border-primary/50 hover:bg-primary/5 transition-all group"
                >
                  {isLoadingMore ? (
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  ) : (
                    <Plus className="w-5 h-5 mr-2 group-hover:rotate-90 transition-transform" />
                  )}
                  {isLoadingMore ? "Searching More..." : "Show More Suggestions"}
                </Button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

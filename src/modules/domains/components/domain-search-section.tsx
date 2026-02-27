"use client";

import { useState } from "react";
import { Search, Loader2, Globe } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { searchDomains } from "../actions/domain-actions";
import { DomainResultsList } from "./domain-results-list";
import type { DomainAvailability } from "../domain-types";

export function DomainSearchSection() {
  const [keyword, setKeyword] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<DomainAvailability[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async (e?: React.FormEvent) => {
    e?.preventDefault();
    
    if (!keyword.trim() || keyword.length < 2) {
      toast.error("Please enter at least 2 characters");
      return;
    }

    setIsSearching(true);
    setHasSearched(true);
    
    try {
      const response = await searchDomains(keyword);
      
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
          className="relative flex items-center space-x-4 bg-background/80 backdrop-blur-xl p-4 rounded-xl border border-border shadow-2xl"
        >
          <div className="flex-1 flex items-center pl-4">
            <Globe className="w-5 h-5 text-muted-foreground mr-4" />
            <Input 
              placeholder="Enter keyword or business name..." 
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              className="border-0 focus-visible:ring-0 text-lg bg-transparent p-0 h-12"
              autoFocus
            />
          </div>
          <Button 
            disabled={isSearching}
            size="lg"
            className="rounded-lg px-8 h-12 bg-primary hover:bg-primary/90 transition-all font-semibold shadow-lg shadow-primary/20"
          >
            {isSearching ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <Search className="w-5 h-5 mr-2" />
                Search
              </>
            )}
          </Button>
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
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

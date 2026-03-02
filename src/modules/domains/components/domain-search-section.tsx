"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Globe, Loader2, Plus, Search, Shuffle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { searchDomains } from "../actions/domain-actions";
import type { DomainAvailability } from "../domain-types";
import { SUPPORTED_TLDS } from "../infrastructure/resellerclub-provider";
import { DomainResultsList } from "./domain-results-list";

export function DomainSearchSection({
  onSelectDomain,
  selectedDomains = [],
}: {
  onSelectDomain?: (domain: DomainAvailability) => void;
  selectedDomains?: string[];
}) {
  const [keyword, setKeyword] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [results, setResults] = useState<DomainAvailability[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedTld, setSelectedTld] = useState("com");
  const [currentPage, setCurrentPage] = useState(0);
  const [showTaken, setShowTaken] = useState(false);

  const filteredResults = showTaken
    ? results
    : results.filter((domain) => domain.status === "available");

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
          setResults((prev: DomainAvailability[]) => [
            ...prev,
            ...response.domains!,
          ]);
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
    const randomWords = [
      "vault",
      "sphere",
      "pulse",
      "echo",
      "nexus",
      "nova",
      "prime",
      "grid",
      "flow",
      "drift",
    ];
    const randomWord =
      randomWords[Math.floor(Math.random() * randomWords.length)];
    setKeyword(randomWord);
    setIsSearching(true);
    setHasSearched(true);
    setCurrentPage(0);
    searchDomains(randomWord, selectedTld, 0).then((response) => {
      if (response.success && response.domains) {
        setResults(response.domains);
      }
      setIsSearching(false);
    });
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-12">
      {/* Search Header */}
      <div className="text-center space-y-4">
        <motion.h1
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl font-black tracking-tight text-zinc-900 dark:text-zinc-50"
        >
          Find Your Perfect Domain
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="text-muted-foreground text-[10px] font-bold uppercase tracking-widest"
        >
          Check availability across 100+ global extensions instantly.
        </motion.p>
      </div>

      {/* Search Bar Container */}
      <motion.div layout className="relative mt-12 px-4">
        <form
          onSubmit={handleSearch}
          className="relative flex items-center bg-white dark:bg-zinc-950 p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm focus-within:border-zinc-400 dark:focus-within:border-zinc-600 transition-all space-x-3"
        >
          <div className="flex-1 flex items-center pl-4 border-r border-zinc-100 dark:border-zinc-900">
            <Globe className="w-5 h-5 text-zinc-400 mr-4 shrink-0" />
            <Input
              placeholder="Enter keyword or business name..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              className="border-0 focus-visible:ring-0 text-lg font-black tracking-tight bg-transparent p-0 h-12 placeholder:text-zinc-300 dark:placeholder:text-zinc-700"
              autoFocus
            />
          </div>

          <div className="flex items-center space-x-2 shrink-0 pr-1">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={handleShuffle}
              disabled={isSearching}
              className="rounded-lg h-12 w-12 text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-all"
              title="Shuffle"
            >
              <Shuffle
                className={`w-5 h-5 ${isSearching ? "animate-spin-slow" : ""}`}
              />
            </Button>

            <div className="hidden sm:block">
              <Select value={selectedTld} onValueChange={setSelectedTld}>
                <SelectTrigger className="w-32 h-12 bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-lg font-black text-xs uppercase tracking-widest focus:ring-0">
                  <SelectValue placeholder="TLD" />
                </SelectTrigger>
                <SelectContent className="border-zinc-200 dark:border-zinc-800 rounded-xl">
                  {SUPPORTED_TLDS.map((tld) => (
                    <SelectItem
                      key={tld}
                      value={tld}
                      className="font-bold text-xs"
                    >
                      .{tld.toUpperCase()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              disabled={isSearching}
              className="rounded-lg px-8 h-12 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:scale-[1.02] active:scale-[0.98] transition-all font-black text-[10px] uppercase tracking-widest shadow-xl shadow-zinc-900/10 dark:shadow-zinc-50/10"
            >
              {isSearching ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <div className="flex items-center gap-2">
                  <Search className="w-4 h-4" />
                  <span>Search</span>
                </div>
              )}
            </Button>
          </div>
        </form>
      </motion.div>

      {/* Results Section */}
      <AnimatePresence mode="wait">
        {hasSearched ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            key="results"
            className="pt-8 px-2"
          >
            <div className="flex items-center justify-between mb-8">
              <div className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">
                {results.length > 0 && (
                  <span className="flex items-center gap-3">
                    <span className="bg-zinc-100 dark:bg-zinc-900 px-2 py-0.5 rounded border border-zinc-200 dark:border-zinc-800 text-zinc-500">
                      {results.length} Suggestions
                    </span>
                    <span className="text-emerald-500">
                      {filteredResults.length} Available
                    </span>
                  </span>
                )}
              </div>

              {results.length > 0 && (
                <div className="flex items-center space-x-4 bg-zinc-50 dark:bg-zinc-900 px-4 py-2 rounded-lg border border-zinc-100 dark:border-zinc-800">
                  <Label
                    htmlFor="show-taken"
                    className="text-[10px] font-black uppercase tracking-widest cursor-pointer text-zinc-500"
                  >
                    Show Unavailable
                  </Label>
                  <Switch
                    id="show-taken"
                    checked={showTaken}
                    onCheckedChange={setShowTaken}
                    className="data-[state=checked]:bg-zinc-900 dark:data-[state=checked]:bg-zinc-100"
                  />
                </div>
              )}
            </div>

            {results.length > 0 &&
              filteredResults.length === 0 &&
              !isSearching && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-zinc-50 dark:bg-zinc-900 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl p-16 text-center space-y-6"
                >
                  <div className="size-16 bg-zinc-100 dark:bg-zinc-800 rounded-lg flex items-center justify-center mx-auto text-zinc-400 border border-zinc-200 dark:border-zinc-800 shadow-sm">
                    <Search className="size-8" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-black tracking-tight">
                      No available domains found
                    </h3>
                    <p className="text-zinc-500 text-sm font-bold max-w-sm mx-auto leading-relaxed">
                      All suggestions for this keyword are currently taken. Try
                      a different keyword or toggle the switch to see taken
                      domains.
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => setShowTaken(true)}
                    className="rounded-lg border-zinc-200 dark:border-zinc-800 font-black text-[10px] uppercase tracking-widest px-8"
                  >
                    Show Taken Domains
                  </Button>
                </motion.div>
              )}

            <DomainResultsList
              domains={filteredResults}
              isLoading={isSearching}
              selectedDomains={selectedDomains}
              onSelect={onSelectDomain}
            />

            {!isSearching && results.length > 0 && (
              <div className="mt-16 flex justify-center pb-20">
                <Button
                  variant="outline"
                  onClick={handleLoadMore}
                  disabled={isLoadingMore}
                  className="rounded-lg px-10 h-12 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-all font-black text-[10px] uppercase tracking-[0.15em] group"
                >
                  {isLoadingMore ? (
                    <Loader2 className="size-4 animate-spin mr-3" />
                  ) : (
                    <Plus className="size-4 mr-3 group-hover:rotate-90 transition-transform" />
                  )}
                  {isLoadingMore
                    ? "Expanding Search..."
                    : "Load More Suggestions"}
                </Button>
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            key="empty"
            className="py-32 flex flex-col items-center text-center space-y-8"
          >
            <div className="size-24 rounded-2xl bg-zinc-50 dark:bg-zinc-900 flex items-center justify-center text-zinc-200 dark:text-zinc-800 border border-zinc-100 dark:border-zinc-800 relative">
              <Globe className="size-12" />
              <div className="absolute inset-0 bg-primary/5 blur-3xl rounded-full -z-10" />
            </div>
            <div className="space-y-3">
              <h3 className="text-2xl font-black tracking-tight text-zinc-900 dark:text-zinc-50">
                Global Domain Search
              </h3>
              <p className="text-zinc-400 text-[10px] font-black uppercase tracking-[0.2em] max-w-xs leading-none">
                Instant lookup for COM, NET, ORG, IO and 100+ others.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

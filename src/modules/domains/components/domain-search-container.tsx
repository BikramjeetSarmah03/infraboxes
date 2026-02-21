"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  Check,
  ChevronRight,
  CreditCard,
  Globe,
  Lock,
  Search,
  ShieldCheck,
  ShoppingCart,
  Trash2,
  TrendingUp,
  Zap,
} from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const steps = [
  { id: "search", title: "Find Domain", icon: Search },
  { id: "review", title: "Review Order", icon: ShoppingCart },
  { id: "payment", title: "Checkout", icon: CreditCard },
];

export function DomainSearchContainer() {
  const [currentStep, setCurrentStep] = useState("search");
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [cart, setCart] = useState<{ name: string; price: string }[]>([]);

  const suggestions = [
    {
      name: "infraboxes.com",
      price: "$12.99",
      status: "Premium",
      available: false,
    },
    {
      name: "infraboxes.net",
      price: "$14.99",
      status: "Standard",
      available: false,
    },
    {
      name: "infraboxes.org",
      price: "$13.99",
      status: "Standard",
      available: false,
    },
    {
      name: "infraboxes.io",
      price: "$49.99",
      status: "Popular",
      available: false,
    },
    {
      name: "infraboxes.co",
      price: "$29.99",
      status: "Business",
      available: false,
    },
    {
      name: "getinfraboxes.com",
      price: "$12.99",
      status: "Available",
      available: true,
    },
    {
      name: "infraboxes.app",
      price: "$19.99",
      status: "Available",
      available: true,
    },
    {
      name: "infraboxes.tech",
      price: "$3.99",
      status: "Sale",
      available: true,
    },
  ];

  const handleSearch = () => {
    setIsSearching(true);
    setTimeout(() => setIsSearching(false), 800);
  };

  const addToCart = (domain: { name: string; price: string }) => {
    if (!cart.find((item) => item.name === domain.name)) {
      setCart([...cart, domain]);
    }
  };

  const removeFromCart = (name: string) => {
    setCart(cart.filter((item) => item.name !== name));
  };

  const calculateTotal = () => {
    return cart
      .reduce((acc, item) => acc + parseFloat(item.price.replace("$", "")), 0)
      .toFixed(2);
  };

  return (
    <div className="flex flex-col flex-1">
      {/* Compact Header */}
      <div className="sticky top-0 z-30 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800 shadow-sm">
        <div className="px-6 md:px-12 h-20 flex items-center justify-between max-w-[1500px] mx-auto">
          <div className="flex items-center gap-5">
            <div className="size-11 rounded-xl bg-zinc-900 dark:bg-zinc-100 flex items-center justify-center text-white dark:text-zinc-900">
              <Globe className="size-5" />
            </div>
            <div className="space-y-0.5">
              <h1 className="text-xl font-black text-zinc-900 dark:text-zinc-50 tracking-tight leading-none">
                Domain Registry
              </h1>
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest leading-none">
                Management Console
              </p>
            </div>
          </div>

          <div className="flex items-center bg-zinc-100 dark:bg-zinc-900 p-1.5 rounded-xl gap-1">
            {steps.map((step, index) => {
              const isActive = currentStep === step.id;
              const isCompleted =
                steps.findIndex((s) => s.id === currentStep) > index;

              return (
                <div key={step.id} className="flex items-center">
                  <button
                    type="button"
                    onClick={() => {
                      if (index === 0) setCurrentStep("search");
                      if (index === 1 && cart.length > 0)
                        setCurrentStep("review");
                      if (index === 2 && cart.length > 0)
                        setCurrentStep("payment");
                    }}
                    className={cn(
                      "flex items-center gap-3 px-5 py-2.5 rounded-lg transition-all duration-300 relative group",
                      isActive
                        ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 border border-zinc-200 dark:border-zinc-700 shadow-sm scale-[1.02]"
                        : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-50",
                    )}
                  >
                    <div
                      className={cn(
                        "size-6 rounded-md flex items-center justify-center transition-all duration-500",
                        isActive || isCompleted
                          ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900"
                          : "bg-zinc-200 dark:bg-zinc-800",
                      )}
                    >
                      {isCompleted ? (
                        <Check className="size-3.5" />
                      ) : (
                        <step.icon className="size-3.5" />
                      )}
                    </div>
                    <span className="text-xs font-black whitespace-nowrap hidden lg:block uppercase tracking-wider">
                      {step.title}
                    </span>
                  </button>
                  {index < steps.length - 1 && (
                    <div className="px-1.5 text-zinc-300 dark:text-zinc-700">
                      <ChevronRight className="size-4" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex items-center gap-6">
            <button
              type="button"
              className="relative group p-2.5 hover:bg-zinc-50 dark:hover:bg-zinc-900 rounded-xl transition-all"
              onClick={() => cart.length > 0 && setCurrentStep("review")}
            >
              <ShoppingCart className="size-6 text-zinc-500 group-hover:text-zinc-900 dark:group-hover:text-zinc-50 transition-colors" />
              {cart.length > 0 && (
                <span className="absolute top-0 right-0 size-5 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white dark:border-zinc-950">
                  {cart.length}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {currentStep === "search" && (
          <motion.div
            key="search-step"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="px-6 md:px-10 py-8 max-w-[1400px] mx-auto w-full space-y-8"
          >
            {/* Extremely Fit Search Section */}
            <div className="flex items-center gap-3 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-1.5 rounded-lg max-w-2xl mx-auto w-full">
              <div className="pl-3">
                <Search className="size-4 text-zinc-400" />
              </div>
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                placeholder="Search domain..."
                className="flex-1 border-none bg-transparent h-10 text-base font-bold placeholder:text-zinc-300 focus-visible:ring-0 shadow-none px-2"
              />
              <Button
                onClick={handleSearch}
                disabled={isSearching}
                className="h-10 px-6 rounded-md bg-zinc-900 dark:bg-zinc-50 text-white dark:text-zinc-900 font-bold text-xs uppercase"
              >
                {isSearching ? "..." : "Search"}
              </Button>
            </div>

            <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Suggestions List - Highly Organized & Dense */}
              <div className="lg:col-span-8 space-y-4">
                <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden shadow-none">
                  <div className="divide-y divide-zinc-100 dark:divide-zinc-900">
                    {suggestions.map((domain) => {
                      const isInCart = cart.some(
                        (item) => item.name === domain.name,
                      );
                      return (
                        <div
                          key={domain.name}
                          className="group flex items-center justify-between p-4 hover:bg-zinc-50/50 dark:hover:bg-zinc-900/50 transition-colors"
                        >
                          <div className="flex items-center gap-4">
                            <div
                              className={cn(
                                "size-8 rounded flex items-center justify-center",
                                domain.available
                                  ? "bg-emerald-50 text-emerald-600"
                                  : "bg-zinc-50 text-zinc-400",
                              )}
                            >
                              <Globe className="size-4" />
                            </div>
                            <div className="flex items-center gap-3">
                              <span
                                className={cn(
                                  "text-sm font-bold",
                                  domain.available
                                    ? "text-zinc-900 dark:text-zinc-100"
                                    : "text-zinc-400 dark:text-zinc-700",
                                )}
                              >
                                {domain.name}
                              </span>
                              <Badge
                                variant="outline"
                                className="h-4 text-[8px] font-bold uppercase px-1 rounded-sm border-zinc-200"
                              >
                                {domain.status}
                              </Badge>
                            </div>
                          </div>

                          <div className="flex items-center gap-6">
                            <p
                              className={cn(
                                "text-sm font-bold tabular-nums",
                                domain.available
                                  ? "text-zinc-900 dark:text-zinc-100"
                                  : "text-zinc-400 dark:text-zinc-700",
                              )}
                            >
                              {domain.price}
                              <span className="text-[10px] font-normal opacity-40 ml-0.5">
                                /YR
                              </span>
                            </p>

                            <Button
                              onClick={() => addToCart(domain)}
                              disabled={!domain.available}
                              variant={isInCart ? "secondary" : "outline"}
                              className={cn(
                                "h-8 px-4 rounded-md font-bold text-[10px] uppercase border-zinc-200 dark:border-zinc-800",
                                isInCart &&
                                  "bg-zinc-100 text-zinc-400 border-transparent shadow-none",
                              )}
                            >
                              {isInCart
                                ? "In Cart"
                                : domain.available
                                  ? "Add"
                                  : "Taken"}
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Collapsible/Compact Side Column */}
              <div className="lg:col-span-4 space-y-4">
                <div className="bg-zinc-900 rounded-lg p-6 text-white space-y-4">
                  <div className="flex items-center gap-3">
                    <Zap className="size-4 text-zinc-400" />
                    <h4 className="text-sm font-bold">
                      Privacy Guard Included
                    </h4>
                  </div>
                  <p className="text-[11px] text-zinc-400 leading-relaxed font-medium">
                    All registrations include WHOIS anonymity protection at no
                    extra cost.
                  </p>
                </div>

                {cart.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 space-y-4"
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] font-bold uppercase text-zinc-400 tracking-wider">
                        Subtotal
                      </p>
                      <p className="text-base font-black tabular-nums">
                        ${calculateTotal()}
                      </p>
                    </div>
                    <Button
                      onClick={() => setCurrentStep("review")}
                      className="h-10 w-full rounded-md bg-zinc-900 dark:bg-zinc-50 text-white dark:text-zinc-900 font-bold text-[10px] uppercase tracking-wider"
                    >
                      Checkout Now
                    </Button>
                  </motion.div>
                )}
              </div>
            </section>
          </motion.div>
        )}

        {currentStep === "review" && (
          <motion.div
            key="review-step"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="px-6 md:px-10 py-10 max-w-[1400px] mx-auto w-full space-y-10"
          >
            <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-8">
              <div className="space-y-1">
                <h2 className="text-2xl font-black text-zinc-900 dark:text-zinc-50 tracking-tight">
                  Review your order
                </h2>
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                  Verify selections before checkout
                </p>
              </div>
              <button
                type="button"
                onClick={() => setCurrentStep("search")}
                className="flex items-center gap-2 text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50 transition-colors font-bold text-[10px] uppercase tracking-widest bg-zinc-50 dark:bg-zinc-900 px-4 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800"
              >
                <ArrowLeft className="size-3.5" /> Back to Search
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
              <div className="lg:col-span-8 space-y-8">
                <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden shadow-none">
                  <div className="divide-y divide-zinc-100 dark:divide-zinc-900">
                    {cart.map((item) => (
                      <div
                        key={item.name}
                        className="flex items-center justify-between p-6 group"
                      >
                        <div className="flex items-center gap-6">
                          <div className="size-10 rounded-lg bg-zinc-50 dark:bg-zinc-900 flex items-center justify-center text-zinc-400 border border-zinc-100 dark:border-zinc-800">
                            <Globe className="size-5" />
                          </div>
                          <div className="space-y-1">
                            <h4 className="text-base font-bold text-zinc-900 dark:text-zinc-50">
                              {item.name}
                            </h4>
                            <div className="flex items-center gap-2">
                              <Badge
                                variant="secondary"
                                className="bg-zinc-100 dark:bg-zinc-900 text-zinc-400 font-bold text-[8px] uppercase px-1.5 py-0"
                              >
                                12 Months
                              </Badge>
                              <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest flex items-center gap-1">
                                <ShieldCheck className="size-3" /> Auto-Renew
                                Enabled
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-10">
                          <div className="text-right">
                            <p className="text-lg font-black text-zinc-900 dark:text-zinc-50 tabular-nums">
                              {item.price}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeFromCart(item.name)}
                            className="p-2 text-zinc-300 hover:text-red-500 transition-colors"
                          >
                            <Trash2 className="size-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                    {cart.length === 0 && (
                      <div className="p-20 text-center space-y-4">
                        <ShoppingCart className="size-10 text-zinc-200 mx-auto" />
                        <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">
                          Cart is empty
                        </p>
                        <Button
                          onClick={() => setCurrentStep("search")}
                          variant="outline"
                          className="rounded-md font-bold text-[10px] uppercase border-zinc-200"
                        >
                          Go back
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-6 bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-lg grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-zinc-900 dark:text-zinc-100">
                      <Lock className="size-4" />
                      <h4 className="text-xs font-black uppercase tracking-widest">
                        WHOIS Protection
                      </h4>
                    </div>
                    <p className="text-[11px] text-zinc-500 font-medium">
                      Included free. Your contact information is hidden from the
                      public database.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-zinc-900 dark:text-zinc-100">
                      <Zap className="size-4" />
                      <h4 className="text-xs font-black uppercase tracking-widest">
                        Instant Sync
                      </h4>
                    </div>
                    <p className="text-[11px] text-zinc-500 font-medium">
                      Domain infrastructure is provisioned and ready for use
                      immediately after payment.
                    </p>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-4">
                <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg p-8 space-y-8 shadow-none sticky top-24">
                  <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400">
                    Order Summary
                  </h3>

                  <div className="space-y-4">
                    <div className="flex justify-between items-center text-sm">
                      <span className="font-bold text-zinc-400 uppercase text-[10px] tracking-widest">
                        Subtotal
                      </span>
                      <span className="font-black text-zinc-900 dark:text-zinc-50 tabular-nums">
                        ${calculateTotal()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="font-bold text-zinc-400 uppercase text-[10px] tracking-widest">
                        Privacy Guard
                      </span>
                      <span className="font-black text-emerald-500 text-[10px] tracking-widest uppercase">
                        Free
                      </span>
                    </div>
                    <div className="h-px bg-zinc-100 dark:bg-zinc-900 my-2" />
                    <div className="flex justify-between items-end">
                      <span className="font-black text-zinc-900 dark:text-zinc-100 uppercase text-[11px] tracking-widest">
                        Total Due
                      </span>
                      <span className="font-black text-3xl text-zinc-900 dark:text-zinc-50 tracking-tighter tabular-nums">
                        ${calculateTotal()}
                      </span>
                    </div>
                  </div>

                  <Button
                    onClick={() => setCurrentStep("payment")}
                    disabled={cart.length === 0}
                    className="w-full h-12 rounded-md bg-zinc-900 dark:bg-zinc-50 text-white dark:text-zinc-900 font-black text-[10px] uppercase tracking-widest"
                  >
                    Complete Checkout
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {currentStep === "payment" && (
          <motion.div
            key="payment-step"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="px-6 md:px-10 py-10 max-w-[1400px] mx-auto w-full space-y-10"
          >
            <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-8">
              <div className="space-y-1">
                <h2 className="text-2xl font-black text-zinc-900 dark:text-zinc-50 tracking-tight">
                  Checkout
                </h2>
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                  Secure Infrastructure Payment
                </p>
              </div>
              <button
                type="button"
                onClick={() => setCurrentStep("review")}
                className="flex items-center gap-2 text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50 transition-colors font-bold text-[10px] uppercase tracking-widest bg-zinc-50 dark:bg-zinc-900 px-4 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800"
              >
                <ArrowLeft className="size-3.5" /> Back to Review
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
              {/* Left Column: Information & Payment */}
              <div className="lg:col-span-8 space-y-8">
                {/* Contact Information */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 px-2">
                    <div className="size-5 rounded-full bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 flex items-center justify-center text-[10px] font-bold">
                      1
                    </div>
                    <h3 className="text-xs font-black uppercase tracking-widest text-zinc-900 dark:text-zinc-100">
                      Customer Information
                    </h3>
                  </div>
                  <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label
                        htmlFor="customer-name"
                        className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest px-1"
                      >
                        Full Name
                      </label>
                      <Input
                        id="customer-name"
                        placeholder="John Doe"
                        className="h-10 text-sm font-bold border-zinc-200 focus-visible:ring-1 focus-visible:ring-zinc-400 rounded-md"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label
                        htmlFor="customer-email"
                        className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest px-1"
                      >
                        Email Address
                      </label>
                      <Input
                        id="customer-email"
                        placeholder="john@example.com"
                        className="h-10 text-sm font-bold border-zinc-200 focus-visible:ring-1 focus-visible:ring-zinc-400 rounded-md"
                      />
                    </div>
                  </div>
                </div>

                {/* Payment Method */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between px-2">
                    <div className="flex items-center gap-2">
                      <div className="size-5 rounded-full bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 flex items-center justify-center text-[10px] font-bold">
                        2
                      </div>
                      <h3 className="text-xs font-black uppercase tracking-widest text-zinc-900 dark:text-zinc-100">
                        Payment Method
                      </h3>
                    </div>
                    <div className="flex items-center gap-2 opacity-40">
                      <ShieldCheck className="size-3.5 text-emerald-500" />
                      <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">
                        AES-256 Encrypted
                      </span>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden">
                    {/* Payment Header */}
                    <div className="p-6 border-b border-zinc-100 dark:border-zinc-900 bg-zinc-50/50 dark:bg-zinc-900/20 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <CreditCard className="size-5 text-zinc-400" />
                        <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100 italic">
                          Dodo Payments{" "}
                          <span className="text-[10px] font-normal not-italic text-zinc-400 ml-1">
                            Secure Gateway
                          </span>
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="h-5 w-8 bg-zinc-100 dark:bg-zinc-800 rounded border border-zinc-200 dark:border-zinc-700" />
                        <div className="h-5 w-8 bg-zinc-100 dark:bg-zinc-800 rounded border border-zinc-200 dark:border-zinc-700" />
                        <div className="h-5 w-8 bg-zinc-100 dark:bg-zinc-800 rounded border border-zinc-200 dark:border-zinc-700" />
                      </div>
                    </div>

                    {/* Payment Form Placeholder */}
                    <div className="p-8 space-y-6">
                      <div className="space-y-1.5">
                        <label
                          htmlFor="card-element"
                          className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest px-1"
                        >
                          Card Details
                        </label>
                        <div
                          id="card-element"
                          className="h-10 w-full border border-zinc-200 dark:border-zinc-800 rounded-md bg-zinc-50/30 dark:bg-zinc-900/50 flex items-center px-4"
                        >
                          <span className="text-xs font-medium text-zinc-400">
                            Dodo Payments Card Input Container
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5 opacity-50 pointer-events-none">
                          <label
                            htmlFor="card-expiry"
                            className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest px-1"
                          >
                            Expiry
                          </label>
                          <Input
                            id="card-expiry"
                            disabled
                            placeholder="MM/YY"
                            className="h-10 bg-zinc-50 border-zinc-200 rounded-md"
                          />
                        </div>
                        <div className="space-y-1.5 opacity-50 pointer-events-none">
                          <label
                            htmlFor="card-cvc"
                            className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest px-1"
                          >
                            CVC
                          </label>
                          <Input
                            id="card-cvc"
                            disabled
                            placeholder="•••"
                            className="h-10 bg-zinc-50 border-zinc-200 rounded-md"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-6 bg-emerald-50/50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/30 rounded-lg flex items-start gap-3">
                  <ShieldCheck className="size-5 text-emerald-600 mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-emerald-900 dark:text-emerald-400 uppercase tracking-tight">
                      Buyer Protection Active
                    </p>
                    <p className="text-[11px] text-emerald-800/70 dark:text-emerald-400/60 font-medium italic">
                      Your purchase is protected. ICANN registration fees and
                      WHOIS privacy are fully guaranteed.
                    </p>
                  </div>
                </div>
              </div>

              {/* Right Column: Mini Summary */}
              <div className="lg:col-span-4 lg:sticky lg:top-24">
                <div className="bg-zinc-900 dark:bg-zinc-900 rounded-lg p-8 text-white space-y-6">
                  <h3 className="text-xs font-black uppercase tracking-widest text-zinc-500">
                    Confirm Payment
                  </h3>

                  <div className="space-y-3">
                    {cart.map((item) => (
                      <div
                        key={item.name}
                        className="flex justify-between items-center py-2 border-b border-white/5 last:border-0"
                      >
                        <div className="space-y-0.5">
                          <p className="text-sm font-bold leading-none">
                            {item.name}
                          </p>
                          <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">
                            Domain Registry
                          </p>
                        </div>
                        <p className="text-sm font-black tabular-nums">
                          {item.price}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="pt-4 space-y-4">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-zinc-400 uppercase tracking-widest">
                        Sales Tax (0%)
                      </span>
                      <span className="font-black tabular-nums">$0.00</span>
                    </div>
                    <div className="flex justify-between items-end">
                      <span className="font-bold text-zinc-200 uppercase text-[11px] tracking-widest pb-1">
                        Payable Total
                      </span>
                      <span className="text-4xl font-black tracking-tighter tabular-nums">
                        ${calculateTotal()}
                      </span>
                    </div>

                    <Button
                      type="button"
                      className="w-full h-14 bg-white hover:bg-zinc-100 text-zinc-950 font-black text-xs uppercase tracking-widest rounded-lg shadow-xl shadow-white/5"
                    >
                      Pay via Dodo Payments
                    </Button>

                    <div className="flex items-center justify-center gap-2 pt-2">
                      <Lock className="size-3 text-zinc-500" />
                      <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest">
                        Bank-level Security Protocol
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-6 p-4 text-center">
                  <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest leading-relaxed">
                    By clicking pay, you agree to our <br />
                    <button
                      type="button"
                      className="text-zinc-600 dark:text-zinc-300 underline underline-offset-4"
                    >
                      Terms of Infrastructure
                    </button>
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="py-8 flex justify-center">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 dark:bg-zinc-950 rounded-md border border-gray-300 dark:border-zinc-800">
          <TrendingUp className="size-3 text-zinc-800 dark:text-zinc-200" />
          <p className="text-[9px] text-zinc-800 dark:text-zinc-200 font-bold uppercase tracking-widest">
            Pricing synced via ICANN
          </p>
        </div>
      </div>
    </div>
  );
}

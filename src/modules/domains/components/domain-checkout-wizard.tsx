"use client";

import { City, Country, State } from "country-state-city";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronRight,
  ChevronsUpDown,
  CreditCard,
  Globe,
  Loader2,
  Lock,
  Search,
  ShoppingCart,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { purchaseDomain } from "../actions/domain-actions";
import type { DomainAvailability } from "../domain-types";
import { DomainSearchSection } from "./domain-search-section";

type CheckoutStep = "search" | "cart" | "billing";

export function DomainCheckoutWizard() {
  const [currentStep, setCurrentStep] = useState<CheckoutStep>("search");
  const [cart, setCart] = useState<DomainAvailability[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [billingInfo, setBillingInfo] = useState({
    name: "",
    address: "",
    city: "",
    state: "",
    stateCode: "",
    zipcode: "",
    country: "",
    countryCode: "",
  });

  const [openCountry, setOpenCountry] = useState(false);
  const [openState, setOpenState] = useState(false);
  const [openCity, setOpenCity] = useState(false);

  const countries = Country.getAllCountries();
  const selectedCountryObj = countries.find(
    (c) => c.isoCode === billingInfo.countryCode || c.name === billingInfo.country,
  );

  const states = selectedCountryObj
    ? State.getStatesOfCountry(selectedCountryObj.isoCode)
    : [];
  const selectedStateObj = states.find(
    (s) => s.isoCode === billingInfo.stateCode || s.name === billingInfo.state,
  );

  const cities =
    selectedStateObj && selectedCountryObj
      ? City.getCitiesOfState(
          selectedCountryObj.isoCode,
          selectedStateObj.isoCode,
        )
      : [];

  const steps = [
    { id: "search", label: "Search", icon: Search },
    { id: "cart", label: "Confirm Cart", icon: ShoppingCart },
    { id: "billing", label: "Billing + Pay", icon: CreditCard },
  ];

  const addToCart = (domain: DomainAvailability) => {
    if (cart.some((items) => items.domain === domain.domain)) {
      toast.error(`${domain.domain} is already in your cart`);
      return;
    }
    setCart([...cart, domain]);
    toast.success(`${domain.domain} added to cart!`);
  };

  const removeFromCart = (domainName: string) => {
    setCart(cart.filter((items) => items.domain !== domainName));
    toast.info("Domain removed from cart");
  };

  const totalPrice = cart.reduce((acc, current) => {
    return acc + parseFloat(current.pricing?.register || "0");
  }, 0);

  const handleFinalPurchase = async () => {
    setIsProcessing(true);
    try {
      // For now, we simulate purchasing all domains in the cart
      const purchasePromises = cart.map((item) => purchaseDomain(item.domain, billingInfo));
      const results = await Promise.all(purchasePromises);

      const successful = results.filter((r) => r.success);
      if (successful.length === cart.length) {
        toast.success("Successfully registered all domains!");
        setCart([]);
        setCurrentStep("search");
      } else {
        toast.warning(
          `Registered ${successful.length} of ${cart.length} domains`,
        );
      }
    } catch (error) {
      toast.error("Failed to process registration");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="w-full space-y-8 pb-32">
      {/* Wizard Header / Steps Indicator */}
      <div className="flex items-center justify-center space-x-4 md:space-x-8">
        {steps.map((step, index) => {
          const StepIcon = step.icon;
          const isActive = currentStep === step.id;
          const isDone = steps.findIndex((s) => s.id === currentStep) > index;

          return (
            <div key={step.id} className="flex items-center group">
              <div
                className={`flex flex-col items-center space-y-2 relative transition-all duration-300 ${
                  isActive ? "scale-110 opacity-100" : "opacity-40"
                }`}
              >
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center border-2 transition-all duration-500 shadow-xl ${
                    isDone
                      ? "bg-emerald-500 border-emerald-500 text-white"
                      : isActive
                        ? "bg-primary border-primary text-white shadow-primary/20"
                        : "bg-background border-muted text-muted-foreground"
                  }`}
                >
                  {isDone ? (
                    <CheckCircle2 className="w-6 h-6" />
                  ) : (
                    <StepIcon className="w-6 h-6" />
                  )}
                </div>
                <span
                  className={`text-[10px] font-black uppercase tracking-widest ${isActive ? "text-primary" : "text-muted-foreground"}`}
                >
                  {step.label}
                </span>
                {isActive && (
                  <motion.div
                    layoutId="active-dot"
                    className="absolute -bottom-4 w-1.5 h-1.5 rounded-full bg-primary"
                  />
                )}
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`w-8 md:w-16 h-0.5 mx-4 md:mx-6 rounded-full transition-colors duration-500 ${
                    isDone ? "bg-emerald-500" : "bg-muted"
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        {currentStep === "search" && (
          <motion.div
            key="search"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-12"
          >
            <DomainSearchSection
              onSelectDomain={addToCart}
              selectedDomains={cart.map((d) => d.domain)}
            />

            {cart.length > 0 && (
              <motion.div
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 w-full max-w-xl px-6 group ml-24"
              >
                <div className="bg-zinc-900 border border-zinc-800 dark:bg-zinc-50 dark:border-zinc-200 text-white dark:text-zinc-900 rounded-xl shadow-2xl overflow-hidden transition-all duration-300">
                  <div className="max-h-0 opacity-0 group-hover:max-h-96 group-hover:opacity-100 transition-all duration-500 ease-in-out bg-zinc-950/50 dark:bg-zinc-100/50 border-zinc-800 dark:border-zinc-200">
                    <div className="p-6 text-center space-y-3">
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 mb-4">
                        Selected Domains
                      </p>
                      <div className="space-y-2">
                        {cart.map((item) => (
                          <div
                            key={item.domain}
                            className="flex items-center justify-between px-4 py-3 bg-white/5 dark:bg-black/5 rounded-lg border border-white/5 dark:border-black/5 group/item hover:border-zinc-700 dark:hover:border-zinc-300 transition-all"
                          >
                            <div className="flex flex-col items-start">
                              <span className="text-xs font-black uppercase tracking-widest leading-none">
                                {item.domain}
                              </span>
                              <span className="text-[9px] font-bold text-emerald-500 mt-1.5">
                                $
                                {parseFloat(
                                  item.pricing?.register || "0",
                                ).toFixed(2)}
                              </span>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation();
                                removeFromCart(item.domain);
                              }}
                              className="size-8 rounded-lg text-zinc-500 hover:text-red-500 hover:bg-red-500/10 transition-colors"
                            >
                              <Trash2 className="size-3.5" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="p-4 px-6 flex items-center justify-between">
                    <div className="flex items-center space-x-5">
                      <div className="size-11 rounded-lg bg-zinc-800 dark:bg-zinc-100 flex items-center justify-center border border-zinc-700 dark:border-zinc-200">
                        <ShoppingCart className="size-5 text-white dark:text-zinc-900" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-black tracking-tight leading-none">
                          {cart.length} Domain{cart.length > 1 ? "s" : ""}
                        </span>
                        <span className="text-[10px] uppercase tracking-[0.2em] font-black text-zinc-400 mt-1.5">
                          ${totalPrice.toFixed(2)} Total
                        </span>
                      </div>
                    </div>
                    <Button
                      onClick={() => setCurrentStep("cart")}
                      className="bg-black border border-gray-900 text-lg py-6 px-8 min-w-fit w-60 font-semibold hover:bg-black/80 shadow-2xl shadow-black/70 hover:shadow-gray-700"
                    >
                      Review & Checkout
                      <ChevronRight className="size-3.5 ml-2" />
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}

        {currentStep === "cart" && (
          <motion.div
            key="cart"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="max-w-[1100px] mx-auto container px-4"
          >
            <div className="space-y-10">
              <div className="flex items-center justify-between">
                <Button
                  variant="ghost"
                  onClick={() => setCurrentStep("search")}
                  className="rounded-lg px-5 h-10 -ml-4 group font-black text-[11px] uppercase tracking-widest text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-50"
                >
                  <ArrowLeft className="size-3.5 mr-2 group-hover:-translate-x-1 transition-transform" />
                  Continue Searching
                </Button>
                <div className="space-y-1 text-right">
                  <h2 className="text-2xl font-black tracking-tight leading-none">
                    Review Domains
                  </h2>
                  <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                    Step 02 — Cart Confirmation
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                <div className="lg:col-span-8 space-y-4">
                  {cart.map((item) => (
                    <Card
                      key={item.domain}
                      className="p-5 bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-xl transition-all hover:border-zinc-300 dark:hover:border-zinc-700 shadow-none"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-6">
                          <div className="size-14 rounded-lg bg-zinc-50 dark:bg-zinc-900 flex items-center justify-center text-zinc-400 border border-zinc-100 dark:border-zinc-800">
                            <Globe className="size-6" />
                          </div>
                          <div className="space-y-1.5">
                            <h3 className="text-lg font-black tracking-tight slashed-zero">
                              {item.domain}
                            </h3>
                            <div className="flex items-center gap-2">
                              <Badge
                                variant="secondary"
                                className="text-[9px] font-black uppercase tracking-[0.2em] px-2 py-0.5 border border-zinc-200 dark:border-zinc-800 rounded-md bg-zinc-50 dark:bg-zinc-900 text-zinc-500"
                              >
                                1 Year Term
                              </Badge>
                              <Badge
                                variant="secondary"
                                className="text-[9px] font-black uppercase tracking-[0.2em] px-2 py-0.5 border border-emerald-100 dark:border-emerald-900/50 rounded-md bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400"
                              >
                                Protected
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-10">
                          <div className="text-right space-y-0.5">
                            <div className="text-xl font-black text-zinc-900 dark:text-zinc-50 tracking-tight leading-none">
                              ${item.pricing?.register || "0.00"}
                            </div>
                            <div className="text-[9px] font-black text-zinc-400 uppercase tracking-widest leading-none">
                              Renewal: ${item.pricing?.renew}/yr
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeFromCart(item.domain)}
                            className="text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg size-10"
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>

                <div className="lg:col-span-4 space-y-6">
                  <div className="p-8 bg-zinc-900 dark:bg-zinc-50 border border-zinc-800 dark:border-zinc-200 rounded-xl shadow-2xl">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-500 mb-8 leading-none">
                      Registration Summary
                    </h3>
                    <div className="space-y-4">
                      {cart.map((item) => (
                        <div
                          key={item.domain}
                          className="flex justify-between items-center bg-zinc-800/50 dark:bg-zinc-100/50 p-3 rounded-lg border border-zinc-700/50 dark:border-zinc-200/50"
                        >
                          <span className="font-bold text-[11px] text-zinc-300 dark:text-zinc-600 truncate max-w-[150px]">
                            {item.domain}
                          </span>
                          <span className="font-black text-xs text-white dark:text-zinc-900">
                            ${item.pricing?.register || "0.00"}
                          </span>
                        </div>
                      ))}
                      <div className="pt-6 mt-6 border-t border-zinc-800 dark:border-zinc-200 space-y-6">
                        <div className="flex justify-between items-baseline">
                          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">
                            Order Total
                          </span>
                          <div className="text-4xl font-black tracking-tight text-white dark:text-zinc-900 leading-none">
                            ${totalPrice.toFixed(2)}
                          </div>
                        </div>
                        <Button
                          onClick={() => setCurrentStep("billing")}
                          className="bg-white text-black text-lg py-6 px-8 w-full font-semibold shadow-xl hover:shadow-2xl hover:bg-white shadow-white/70 hover:shadow-gray-700"
                        >
                          Proceed to Payment
                          <ChevronRight className="size-4 ml-2" />
                        </Button>
                      </div>
                    </div>
                  </div>
                  <div className="px-4 flex items-center gap-3">
                    <Lock className="size-3.5 text-zinc-400" />
                    <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest leading-relaxed">
                      Secure Checkout • Encrypted Transaction
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {currentStep === "billing" && (
          <motion.div
            key="billing"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="max-w-6xl mx-auto container px-4"
          >
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
              {/* Left Column: Billing Information */}
              <div className="lg:col-span-7 space-y-10">
                <div className="space-y-3">
                  <h2 className="text-3xl font-black tracking-tight">
                    Billing Details
                  </h2>
                  <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">
                    Required for Domain Registration
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-12">
                  <div className="space-y-2.5">
                    <Label className="text-[10px] uppercase font-black tracking-widest text-zinc-500">
                      Full Name
                    </Label>
                    <Input
                      placeholder="John Doe"
                      className="rounded-lg h-12 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-4 font-bold focus:ring-0 focus:border-zinc-900 dark:focus:border-zinc-100 transition-all"
                      value={billingInfo.name}
                      onChange={(e) =>
                        setBillingInfo({ ...billingInfo, name: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2.5">
                    <Label className="text-[10px] uppercase font-black tracking-widest text-zinc-500">
                      Address Line
                    </Label>
                    <Input
                      placeholder="Street Address"
                      className="rounded-lg h-12 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-4 font-bold focus:ring-0 focus:border-zinc-900 dark:focus:border-zinc-100 transition-all"
                      value={billingInfo.address}
                      onChange={(e) =>
                        setBillingInfo({
                          ...billingInfo,
                          address: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2.5">
                    <Label className="text-[10px] uppercase font-black tracking-widest text-zinc-500">Country</Label>
                    <Popover open={openCountry} onOpenChange={setOpenCountry}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          className={cn(
                            "w-full justify-between rounded-lg h-12 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-4 font-bold text-left shadow-none",
                            !billingInfo.country && "text-zinc-400"
                          )}
                        >
                          {billingInfo.country || "Select Country"}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                        <Command className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800">
                          <CommandInput placeholder="Search country..." className="h-11 font-bold border-none ring-0 focus:ring-0" />
                          <CommandList>
                            <CommandEmpty className="py-6 text-center text-xs font-bold text-zinc-400">No country found.</CommandEmpty>
                            <CommandGroup className="px-2">
                              {countries.map((country) => (
                                <CommandItem
                                  key={country.isoCode}
                                  value={country.name}
                                  onSelect={() => {
                                    setBillingInfo({
                                      ...billingInfo,
                                      country: country.name,
                                      countryCode: country.isoCode,
                                      state: "",
                                      stateCode: "",
                                      city: "",
                                    });
                                    setOpenCountry(false);
                                  }}
                                  className="rounded-md h-10 px-3 font-bold text-sm cursor-pointer aria-selected:bg-zinc-100 dark:aria-selected:bg-zinc-900"
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      country.name === billingInfo.country ? "opacity-100" : "opacity-0"
                                    )}
                                  />
                                  {country.name}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="space-y-2.5">
                    <Label className="text-[10px] uppercase font-black tracking-widest text-zinc-500">State / Region</Label>
                    <Popover open={openState} onOpenChange={setOpenState}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          disabled={!selectedCountryObj}
                          className={cn(
                            "w-full justify-between rounded-lg h-12 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-4 font-bold text-left shadow-none",
                            !billingInfo.state && "text-zinc-400",
                            !selectedCountryObj && "opacity-50"
                          )}
                        >
                          {billingInfo.state || "Select State"}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                        <Command className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800">
                          <CommandInput placeholder="Search state..." className="h-11 font-bold border-none ring-0 focus:ring-0" />
                          <CommandList>
                            <CommandEmpty className="py-6 text-center text-xs font-bold text-zinc-400">No state found.</CommandEmpty>
                            <CommandGroup className="px-2">
                              {states.map((state) => (
                                <CommandItem
                                  key={state.isoCode}
                                  value={state.name}
                                  onSelect={() => {
                                    setBillingInfo({
                                      ...billingInfo,
                                      state: state.name,
                                      stateCode: state.isoCode,
                                      city: "",
                                    });
                                    setOpenState(false);
                                  }}
                                  className="rounded-md h-10 px-3 font-bold text-sm cursor-pointer aria-selected:bg-zinc-100 dark:aria-selected:bg-zinc-900"
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      state.name === billingInfo.state ? "opacity-100" : "opacity-0"
                                    )}
                                  />
                                  {state.name}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="space-y-2.5">
                    <Label className="text-[10px] uppercase font-black tracking-widest text-zinc-500">City</Label>
                    <Popover open={openCity} onOpenChange={setOpenCity}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          disabled={!selectedStateObj}
                          className={cn(
                            "w-full justify-between rounded-lg h-12 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-4 font-bold text-left shadow-none",
                            !billingInfo.city && "text-zinc-400",
                            !selectedStateObj && "opacity-50"
                          )}
                        >
                          {billingInfo.city || "Select City"}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                        <Command className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800">
                          <CommandInput placeholder="Search city..." className="h-11 font-bold border-none ring-0 focus:ring-0" />
                          <CommandList>
                            <CommandEmpty className="py-6 text-center text-xs font-bold text-zinc-400">No city found.</CommandEmpty>
                            <CommandGroup className="px-2">
                              {cities.map((city) => (
                                <CommandItem
                                  key={city.name}
                                  value={city.name}
                                  onSelect={() => {
                                    setBillingInfo({
                                      ...billingInfo,
                                      city: city.name,
                                    });
                                    setOpenCity(false);
                                  }}
                                  className="rounded-md h-10 px-3 font-bold text-sm cursor-pointer aria-selected:bg-zinc-100 dark:aria-selected:bg-zinc-900"
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      city.name === billingInfo.city ? "opacity-100" : "opacity-0"
                                    )}
                                  />
                                  {city.name}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="space-y-2.5">
                    <Label className="text-[10px] uppercase font-black tracking-widest text-zinc-500">ZIP / Postcode</Label>
                    <Input
                      placeholder="10001"
                      className="rounded-lg h-12 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-4 font-bold focus:ring-0 focus:border-zinc-900 dark:focus:border-zinc-100 transition-all shadow-none"
                      value={billingInfo.zipcode}
                      onChange={(e) => setBillingInfo({...billingInfo, zipcode: e.target.value})}
                    />
                  </div>
                </div>
              </div>

              {/* Right Column: Payment & Summary */}
              <div className="lg:col-span-5 pt-12 lg:pt-0">
                <Card className="p-8 rounded-xl border-zinc-200 dark:border-zinc-800 shadow-none space-y-10 bg-white dark:bg-zinc-950 sticky top-32">
                  <div className="space-y-6">
                    <div className="flex items-center justify-between bg-zinc-50 dark:bg-zinc-900 p-6 rounded-lg border border-zinc-100 dark:border-zinc-800">
                      <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
                        Order Total
                      </span>
                      <span className="text-3xl font-black text-emerald-500 tracking-tight leading-none">
                        ${totalPrice.toFixed(2)}
                      </span>
                    </div>

                    <div className="bg-zinc-50 dark:bg-zinc-900 p-8 rounded-lg border border-zinc-100 dark:border-zinc-800 space-y-8">
                      <div className="flex items-center gap-5">
                        <div className="size-14 rounded-lg bg-zinc-900 dark:bg-zinc-50 flex items-center justify-center border border-zinc-800 dark:border-zinc-200 shadow-sm">
                          <CreditCard className="size-6 text-white dark:text-zinc-900" />
                        </div>
                        <div className="flex-1 min-w-0 max-w-37.5">
                          <span className="text-sm font-black uppercase tracking-widest">
                            Secure Credit Card
                          </span>
                          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                            Instant Activation
                          </span>
                        </div>
                      </div>

                      <Separator className="bg-zinc-200 dark:bg-zinc-800" />

                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                            Subtotal
                          </span>
                          <span className="text-sm font-black">
                            ${totalPrice.toFixed(2)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                            Processing Fee
                          </span>
                          <span className="text-sm font-black text-emerald-500">
                            FREE
                          </span>
                        </div>
                      </div>

                      <Separator className="bg-zinc-200 dark:bg-zinc-800" />

                      <div className="flex items-center gap-4 px-2">
                        <CheckCircle2 className="size-4 text-emerald-500" />
                        <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">
                          TLS 1.3 Encryption Active
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <Button
                      disabled={isProcessing}
                      onClick={handleFinalPurchase}
                      className="w-full h-16 bg-zinc-900 dark:bg-zinc-100 text-zinc-50 dark:text-zinc-900 rounded-lg font-black uppercase tracking-[0.2em] text-[11px] shadow-2xl shadow-zinc-900/20 dark:shadow-zinc-50/20 group relative transition-all active:scale-[0.98] hover:scale-[1.01]"
                    >
                      {isProcessing ? (
                        <Loader2 className="size-6 animate-spin" />
                      ) : (
                        <div className="flex items-center gap-3">
                          <span>Complete Registration</span>
                          <ArrowRight className="size-5 transition-transform group-hover:translate-x-1" />
                        </div>
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      disabled={isProcessing}
                      onClick={() => setCurrentStep("cart")}
                      className="w-full h-12 rounded-lg text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50 font-black text-[10px] uppercase tracking-widest transition-all"
                    >
                      Modify Selection
                    </Button>
                  </div>
                </Card>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { City, Country, State } from "country-state-city";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Check,
  CheckCircle2,
  ChevronsUpDown,
  MapPin,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { InputPhone } from "@/components/ui/input-phone";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

import { submitOnboarding } from "../../application/actions";

const onboardingSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  phoneNumber: z.string().min(10, "Please enter a valid phone number."),
  companyName: z.string().min(2, "Company Name is required."),
  companyCategory: z.string().min(2, "Company Category is required."),
  address: z.string().min(5, "Address must be at least 5 characters."),
  country: z.string().min(2, "Country is required."),
  state: z.string().min(2, "State is required."),
  city: z.string().min(2, "City is required."),
  zip: z.string().min(3, "ZIP/Postal code is required."),
});

type OnboardingFormValues = z.infer<typeof onboardingSchema>;

const COMPANY_CATEGORIES = [
  { id: "software", label: "Software & Tech", icon: "💻" },
  { id: "retail", label: "Retail & E-commerce", icon: "🛍️" },
  { id: "healthcare", label: "Healthcare", icon: "🏥" },
  { id: "real_estate", label: "Real Estate", icon: "🏢" },
  { id: "finance", label: "Finance & Accounting", icon: "📈" },
  { id: "education", label: "Education", icon: "🎓" },
  { id: "manufacturing", label: "Manufacturing", icon: "🏭" },
  { id: "other", label: "Other", icon: "✨" },
];

const STEPS = [
  {
    id: "personal",
    title: "Your Details",
    description: "Let's confirm your contact information",
    icon: Building2,
  },
  {
    id: "company",
    title: "Company Info",
    description: "Tell us about your organization",
    icon: CheckCircle2,
  },
  {
    id: "location",
    title: "Location",
    description: "Where are you based?",
    icon: MapPin,
  },
];

export function OnboardingWizard({
  initialData,
}: {
  initialData: Partial<OnboardingFormValues>;
}) {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const _router = useRouter();

  const form = useForm<OnboardingFormValues>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      name: initialData.name || "",
      phoneNumber: initialData.phoneNumber || "",
      companyName: "",
      companyCategory: "",
      address: "",
      country: "",
      state: "",
      city: "",
      zip: "",
    },
  });

  async function processNextStep() {
    let fieldsToValidate: (keyof OnboardingFormValues)[] = [];

    if (step === 0) {
      fieldsToValidate = ["name", "phoneNumber"];
    } else if (step === 1) {
      fieldsToValidate = ["companyName", "companyCategory"];
    }

    const isValid = await form.trigger(fieldsToValidate);
    if (isValid) setStep((s) => s + 1);
  }

  async function onSubmit(data: OnboardingFormValues) {
    setLoading(true);
    try {
      await submitOnboarding(data);

      setTimeout(() => {
        window.location.reload();
      }, 200);
    } catch (error) {
      console.error("Failed to submit onboarding", error);
      setLoading(false);
    }
  }

  const [openCountry, setOpenCountry] = useState(false);
  const [openState, setOpenState] = useState(false);
  const [openCity, setOpenCity] = useState(false);

  const currentCountryName = form.watch("country");
  const currentStateName = form.watch("state");

  const countries = Country.getAllCountries();
  const selectedCountryObj = countries.find(
    (c) => c.name === currentCountryName,
  );

  const states = selectedCountryObj
    ? State.getStatesOfCountry(selectedCountryObj.isoCode)
    : [];
  const selectedStateObj = states.find((s) => s.name === currentStateName);

  const cities =
    selectedStateObj && selectedCountryObj
      ? City.getCitiesOfState(
          selectedCountryObj.isoCode,
          selectedStateObj.isoCode,
        )
      : [];

  return (
    <div className="w-full max-w-3xl bg-white dark:bg-zinc-950 p-8 pt-12 rounded-3xl border shadow-xl relative overflow-hidden">
      {/* Progress Tracker */}
      <div className="flex items-center justify-between mb-12 relative z-10">
        {STEPS.map((s, i) => {
          const Icon = s.icon;
          const isActive = i <= step;
          return (
            <div
              key={s.id}
              className="flex flex-col items-center gap-2 relative z-10"
            >
              <div
                className={`size-12 rounded-full flex items-center justify-center transition-all duration-500 shadow-sm ${
                  isActive
                    ? "bg-black text-white dark:bg-white dark:text-black border-2 border-transparent"
                    : "bg-zinc-100 text-zinc-400 border-2 border-zinc-200 dark:bg-zinc-900 dark:border-zinc-800"
                }`}
              >
                <Icon className="size-5" />
              </div>
              <span
                className={`text-xs font-semibold ${
                  isActive ? "text-black dark:text-white" : "text-zinc-400"
                }`}
              >
                {s.title}
              </span>
            </div>
          );
        })}
        <div className="absolute top-6 left-0 w-full h-[2px] bg-zinc-100 dark:bg-zinc-900 -z-0">
          <motion.div
            className="h-full bg-black dark:bg-white transition-all duration-500"
            initial={{ width: "0%" }}
            animate={{ width: `${(step / (STEPS.length - 1)) * 100}%` }}
          />
        </div>
      </div>

      {/* Form Content */}
      <div className="min-h-[340px]">
        <div className="mb-8">
          <h2 className="text-3xl font-bold tracking-tight">
            {STEPS[step].title}
          </h2>
          <p className="text-zinc-500 mt-1">{STEPS[step].description}</p>
        </div>

        <Form {...form}>
          <form
            onSubmit={(e) => {
              // Prevent default form submission if we are not on the last step
              if (step < STEPS.length - 1) {
                e.preventDefault();
                processNextStep();
              } else {
                form.handleSubmit(onSubmit)(e);
              }
            }}
            className="space-y-6"
          >
            <AnimatePresence mode="wait">
              {step === 0 && (
                <motion.div
                  key="step0"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-4"
                >
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name</FormLabel>
                        <FormControl>
                          <Input placeholder="John Doe" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="phoneNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number</FormLabel>
                        <FormControl>
                          <InputPhone
                            placeholder="Enter your phone number"
                            defaultCountry="IN"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </motion.div>
              )}

              {step === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-4"
                >
                  <FormField
                    control={form.control}
                    name="companyName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Company Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Acme Corp" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="companyCategory"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Company Category</FormLabel>
                        <FormControl>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                            {COMPANY_CATEGORIES.map((category) => (
                              <button
                                type="button"
                                key={category.id}
                                onClick={() => field.onChange(category.id)}
                                className={cn(
                                  "flex flex-col items-center justify-center gap-2 rounded-xl border p-4 text-center transition-all hover:bg-zinc-50 dark:hover:bg-zinc-900 border-solid",
                                  field.value === category.id
                                    ? "border-black bg-black/5 dark:border-white dark:bg-white/10 shadow-sm"
                                    : "border-zinc-200 dark:border-zinc-800",
                                )}
                              >
                                <span className="text-2xl">
                                  {category.icon}
                                </span>
                                <span className="text-xs font-medium">
                                  {category.label}
                                </span>
                              </button>
                            ))}
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </motion.div>
              )}

              {step === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-4"
                >
                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Street Address</FormLabel>
                        <FormControl>
                          <Input placeholder="123 Main St" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="country"
                      render={({ field }) => (
                        <FormItem className="flex flex-col mt-2">
                          <FormLabel>Country</FormLabel>
                          <Popover
                            open={openCountry}
                            onOpenChange={setOpenCountry}
                          >
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant="outline"
                                  role="combobox"
                                  className={cn(
                                    "w-full justify-between",
                                    !field.value && "text-muted-foreground",
                                  )}
                                >
                                  {field.value
                                    ? countries.find(
                                        (c) => c.name === field.value,
                                      )?.name
                                    : "Select country"}
                                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-75 p-0" align="start">
                              <Command>
                                <CommandInput placeholder="Search country..." />
                                <CommandList>
                                  <CommandEmpty>No country found.</CommandEmpty>
                                  <CommandGroup>
                                    {countries.map((country) => (
                                      <CommandItem
                                        value={country.name}
                                        key={country.isoCode}
                                        onSelect={(_value) => {
                                          form.setValue(
                                            "country",
                                            country.name,
                                          );
                                          form.setValue("state", "");
                                          form.setValue("city", "");
                                          setOpenCountry(false);
                                        }}
                                      >
                                        <Check
                                          className={cn(
                                            "mr-2 h-4 w-4",
                                            country.name === field.value
                                              ? "opacity-100"
                                              : "opacity-0",
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
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="state"
                      render={({ field }) => (
                        <FormItem className="flex flex-col mt-2">
                          <FormLabel>State / Province</FormLabel>
                          <Popover open={openState} onOpenChange={setOpenState}>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant="outline"
                                  role="combobox"
                                  disabled={!selectedCountryObj}
                                  className={cn(
                                    "w-full justify-between",
                                    !field.value && "text-muted-foreground",
                                  )}
                                >
                                  {field.value
                                    ? states.find((s) => s.name === field.value)
                                        ?.name
                                    : "Select state"}
                                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-75 p-0" align="start">
                              <Command>
                                <CommandInput placeholder="Search state..." />
                                <CommandList>
                                  <CommandEmpty>No state found.</CommandEmpty>
                                  <CommandGroup>
                                    {states.map((state) => (
                                      <CommandItem
                                        value={state.name}
                                        key={state.isoCode}
                                        onSelect={(_value) => {
                                          form.setValue("state", state.name);
                                          form.setValue("city", "");
                                          setOpenState(false);
                                        }}
                                      >
                                        <Check
                                          className={cn(
                                            "mr-2 h-4 w-4",
                                            state.name === field.value
                                              ? "opacity-100"
                                              : "opacity-0",
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
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="city"
                      render={({ field }) => (
                        <FormItem className="flex flex-col mt-2">
                          <FormLabel>City</FormLabel>
                          <Popover open={openCity} onOpenChange={setOpenCity}>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant="outline"
                                  role="combobox"
                                  disabled={!selectedStateObj}
                                  className={cn(
                                    "w-full justify-between",
                                    !field.value && "text-muted-foreground",
                                  )}
                                >
                                  {field.value
                                    ? cities.find((c) => c.name === field.value)
                                        ?.name
                                    : "Select city"}
                                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-75 p-0" align="start">
                              <Command>
                                <CommandInput placeholder="Search city..." />
                                <CommandList>
                                  <CommandEmpty>No city found.</CommandEmpty>
                                  <CommandGroup>
                                    {cities.map((city) => (
                                      <CommandItem
                                        value={city.name}
                                        key={city.name}
                                        onSelect={(_value) => {
                                          form.setValue("city", city.name);
                                          setOpenCity(false);
                                        }}
                                      >
                                        <Check
                                          className={cn(
                                            "mr-2 h-4 w-4",
                                            city.name === field.value
                                              ? "opacity-100"
                                              : "opacity-0",
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
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="zip"
                      render={({ field }) => (
                        <FormItem className="mt-2">
                          <FormLabel>ZIP / Postal Code</FormLabel>
                          <FormControl>
                            <Input placeholder="10001" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Navigation Actions */}
            <div className="flex justify-between items-center pt-8 border-t border-zinc-100 dark:border-zinc-900">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setStep(step - 1)}
                className={`${step === 0 ? "invisible" : ""}`}
              >
                <ArrowLeft className="mr-2 size-4" /> Back
              </Button>
              {step < STEPS.length - 1 ? (
                <Button type="button" onClick={processNextStep}>
                  Continue <ArrowRight className="ml-2 size-4" />
                </Button>
              ) : (
                <Button type="submit" disabled={loading}>
                  {loading ? "Saving..." : "Complete Setup"}{" "}
                  <CheckCircle2 className="ml-2 size-4" />
                </Button>
              )}
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}

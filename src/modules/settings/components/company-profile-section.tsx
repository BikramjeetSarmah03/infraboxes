"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { City, Country, State } from "country-state-city";
import {
  Building2,
  Calendar,
  Check,
  ChevronsUpDown,
  Loader2,
  MapPin,
  Pencil,
  X,
} from "lucide-react";
import { useOptimistic, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
  type CompanyProfileData,
  upsertCompanyProfile,
} from "../actions/company-actions";

const companyProfileSchema = z.object({
  legalName: z.string().min(2, "Legal name is required"),
  taxId: z.string().optional(),
  incorporationDate: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  zip: z.string().optional(),
});

type CompanyProfileFormValues = z.infer<typeof companyProfileSchema>;

interface CompanyProfileSectionProps {
  initialData: {
    legalName: string;
    taxId?: string | null;
    incorporationDate?: Date | string | null;
    status?: string | null;
    address?: string | null;
    city?: string | null;
    state?: string | null;
    country?: string | null;
    zip?: string | null;
  };
}

export function CompanyProfileSection({
  initialData,
}: CompanyProfileSectionProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isPending, startTransition] = useTransition();

  const [openCountry, setOpenCountry] = useState(false);
  const [openState, setOpenState] = useState(false);
  const [openCity, setOpenCity] = useState(false);

  // Convert incoming date nicely if it's a real Date object
  const formatInitialDate = (dateVal: any) => {
    if (!dateVal) return "";
    if (typeof dateVal === "string") {
      // Trying to take first part of ISO string to fit input type="date"
      return dateVal.split("T")[0];
    }
    if (dateVal instanceof Date) {
      return dateVal.toISOString().split("T")[0];
    }
    return "";
  };

  const initialDateStr = formatInitialDate(initialData.incorporationDate);

  const [optimisticData, setOptimisticData] = useOptimistic(
    { ...initialData, incorporationDateStr: initialDateStr },
    (
      state,
      update: Partial<typeof initialData> & { incorporationDateStr?: string },
    ) => ({
      ...state,
      ...update,
    }),
  );

  const form = useForm<CompanyProfileFormValues>({
    resolver: zodResolver(companyProfileSchema),
    values: {
      legalName: initialData.legalName || "",
      taxId: initialData.taxId || "",
      incorporationDate: initialDateStr,
      address: initialData.address || "",
      city: initialData.city || "",
      state: initialData.state || "",
      country: initialData.country || "",
      zip: initialData.zip || "",
    },
  });

  const onSubmit = (data: CompanyProfileFormValues) => {
    const dirtyFields = Object.keys(form.formState.dirtyFields) as Array<
      keyof CompanyProfileFormValues
    >;

    if (dirtyFields.length === 0) {
      setIsEditing(false);
      return;
    }

    // If we have an incorporationDate, make sure we format it for display
    let displayDateStr = optimisticData.incorporationDateStr;
    if (data.incorporationDate !== undefined) {
      displayDateStr = data.incorporationDate;
    }

    startTransition(async () => {
      // Optimistically update
      setOptimisticData({
        ...data,
        incorporationDateStr: displayDateStr,
      });
      setIsEditing(false);

      const result = await upsertCompanyProfile(data as CompanyProfileData);
      if (result.success) {
        toast.success("Company profile updated securely.");
        form.reset(data);
      } else {
        toast.error(result.error || "Failed to save company profile");
        setIsEditing(true);
      }
    });
  };

  const statusString = optimisticData.status || "pending";

  const selectedCountry = form.watch("country");
  const selectedState = form.watch("state");
  const selectedCity = form.watch("city");

  const renderCountry = optimisticData.country
    ? Country.getCountryByCode(optimisticData.country)?.name ||
      optimisticData.country
    : "—";

  const renderState = optimisticData.state
    ? State.getStateByCodeAndCountry(
        optimisticData.state,
        optimisticData.country || "",
      )?.name || optimisticData.state
    : "—";

  return (
    <section className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="px-6 py-4 border-b border-zinc-100 dark:border-zinc-900 bg-zinc-50/50 dark:bg-zinc-900/50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Building2 className="size-4 text-zinc-500" />
          <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-50 tracking-tight">
            Business Profile
          </h3>
        </div>
        {!isEditing ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsEditing(true)}
            className="h-8 text-xs font-bold px-3 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-none uppercase tracking-widest"
          >
            <Pencil className="size-3 mr-1.5" /> Edit
          </Button>
        ) : (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              form.reset();
              setIsEditing(false);
            }}
            className="h-8 text-[10px] font-bold px-3 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 uppercase tracking-widest"
          >
            <X className="size-3 mr-1.5" /> Cancel
          </Button>
        )}
      </div>

      <div className="p-6">
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-12">
            <div className="space-y-2">
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest leading-none px-1">
                Legal Name
              </p>
              {isEditing ? (
                <div className="space-y-1">
                  <Input
                    {...form.register("legalName")}
                    className="h-10 rounded-lg border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-sm font-medium shadow-none"
                    placeholder="E.g., Acme Corp Inc."
                  />
                  {form.formState.errors.legalName && (
                    <p className="text-[10px] font-bold text-red-500 mt-1">
                      {form.formState.errors.legalName.message}
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-sm font-bold text-zinc-900 dark:text-zinc-50 px-1">
                  {optimisticData.legalName || "—"}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest leading-none px-1">
                Tax ID / PAN
              </p>
              {isEditing ? (
                <Input
                  {...form.register("taxId")}
                  className="h-10 rounded-lg border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-sm font-medium shadow-none"
                  placeholder="Business Tax ID"
                />
              ) : (
                <p className="text-sm font-bold text-zinc-900 dark:text-zinc-50 px-1">
                  {optimisticData.taxId || "—"}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest leading-none px-1">
                Incorporation Date
              </p>
              {isEditing ? (
                <Input
                  type="date"
                  {...form.register("incorporationDate")}
                  className="h-10 rounded-lg border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-sm font-medium shadow-none"
                />
              ) : (
                <div className="flex items-center gap-2 text-sm font-bold text-zinc-900 dark:text-zinc-50 px-1">
                  {optimisticData.incorporationDateStr ? (
                    <>
                      <Calendar className="size-4 text-zinc-400" />
                      {new Date(
                        optimisticData.incorporationDateStr,
                      ).toLocaleDateString("en-US", {
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </>
                  ) : (
                    "—"
                  )}
                </div>
              )}
            </div>

            {!isEditing && (
              <div className="space-y-2">
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest leading-none px-1">
                  Company Status
                </p>
                <div className="px-1">
                  <Badge
                    className={`shadow-none font-bold text-[10px] uppercase ${
                      statusString === "verified"
                        ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border-emerald-200/50 dark:border-emerald-500/20"
                        : "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 border-amber-200/50 dark:border-amber-500/20"
                    }`}
                  >
                    {statusString}
                  </Badge>
                </div>
              </div>
            )}

            {isEditing && (
              <div className="space-y-2">
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest leading-none px-1">
                  Company Status
                </p>
                <div className="px-1 pt-2">
                  <p className="text-xs text-zinc-500 italic">
                    Managed by support
                  </p>
                </div>
              </div>
            )}

            {/* Address */}
            <div className="space-y-2 md:col-span-2">
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest leading-none px-1">
                Registered Address
              </p>
              {isEditing ? (
                <Input
                  {...form.register("address")}
                  className="h-10 rounded-lg border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-sm font-medium shadow-none max-w-lg"
                  placeholder="Street Address"
                />
              ) : (
                <div className="flex items-start gap-2 text-sm font-bold text-zinc-900 dark:text-zinc-50 px-1">
                  <MapPin className="size-4 text-zinc-400 mt-0.5" />
                  <span>{optimisticData.address || "—"}</span>
                </div>
              )}
            </div>

            {/* Country */}
            <div className="space-y-2">
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest leading-none px-1">
                Country
              </p>
              {isEditing ? (
                <Popover open={openCountry} onOpenChange={setOpenCountry}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={openCountry}
                      className="w-full h-10 rounded-lg justify-between border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-sm font-medium shadow-none"
                    >
                      {selectedCountry ? (
                        <span className="truncate">
                          {Country.getCountryByCode(selectedCountry)?.name ||
                            selectedCountry}
                        </span>
                      ) : (
                        "Select country..."
                      )}
                      <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[300px] p-0" align="start">
                    <Command>
                      <CommandInput
                        placeholder="Search country..."
                        className="h-9"
                      />
                      <CommandList>
                        <CommandEmpty>No country found.</CommandEmpty>
                        <CommandGroup>
                          {Country.getAllCountries().map((country) => (
                            <CommandItem
                              key={country.isoCode}
                              value={country.name}
                              onSelect={() => {
                                form.setValue("country", country.isoCode, {
                                  shouldDirty: true,
                                });
                                form.setValue("state", "", {
                                  shouldDirty: true,
                                });
                                form.setValue("city", "", {
                                  shouldDirty: true,
                                });
                                setOpenCountry(false);
                              }}
                            >
                              <span className="truncate">{country.name}</span>
                              <Check
                                className={cn(
                                  "ml-auto size-4 shrink-0",
                                  selectedCountry === country.isoCode
                                    ? "opacity-100"
                                    : "opacity-0",
                                )}
                              />
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              ) : (
                <p className="text-sm font-bold text-zinc-900 dark:text-zinc-50 px-1 truncate max-w-full">
                  {renderCountry}
                </p>
              )}
            </div>

            {/* State */}
            <div className="space-y-2">
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest leading-none px-1">
                State / Province
              </p>
              {isEditing ? (
                <Popover open={openState} onOpenChange={setOpenState}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={openState}
                      className="w-full h-10 rounded-lg justify-between border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-sm font-medium shadow-none"
                      disabled={!selectedCountry}
                    >
                      {selectedState ? (
                        <span className="truncate">
                          {State.getStateByCodeAndCountry(
                            selectedState,
                            selectedCountry || "",
                          )?.name || selectedState}
                        </span>
                      ) : (
                        "Select state..."
                      )}
                      <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[300px] p-0" align="start">
                    <Command>
                      <CommandInput
                        placeholder="Search state..."
                        className="h-9"
                      />
                      <CommandList>
                        <CommandEmpty>No state found.</CommandEmpty>
                        <CommandGroup>
                          {selectedCountry &&
                            State.getStatesOfCountry(selectedCountry).map(
                              (state) => (
                                <CommandItem
                                  key={state.isoCode}
                                  value={state.name}
                                  onSelect={() => {
                                    form.setValue("state", state.isoCode, {
                                      shouldDirty: true,
                                    });
                                    form.setValue("city", "", {
                                      shouldDirty: true,
                                    });
                                    setOpenState(false);
                                  }}
                                >
                                  <span className="truncate">{state.name}</span>
                                  <Check
                                    className={cn(
                                      "ml-auto size-4 shrink-0",
                                      selectedState === state.isoCode
                                        ? "opacity-100"
                                        : "opacity-0",
                                    )}
                                  />
                                </CommandItem>
                              ),
                            )}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              ) : (
                <p className="text-sm font-bold text-zinc-900 dark:text-zinc-50 px-1 truncate max-w-full">
                  {renderState}
                </p>
              )}
            </div>

            {/* City */}
            <div className="space-y-2">
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest leading-none px-1">
                City
              </p>
              {isEditing ? (
                <Popover open={openCity} onOpenChange={setOpenCity}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={openCity}
                      className="w-full h-10 rounded-lg justify-between border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-sm font-medium shadow-none"
                      disabled={!selectedState}
                    >
                      {selectedCity ? (
                        <span className="truncate">{selectedCity}</span>
                      ) : (
                        "Select city..."
                      )}
                      <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[300px] p-0" align="start">
                    <Command>
                      <CommandInput
                        placeholder="Search city..."
                        className="h-9"
                      />
                      <CommandList>
                        <CommandEmpty>No city found.</CommandEmpty>
                        <CommandGroup>
                          {selectedCountry &&
                            selectedState &&
                            City.getCitiesOfState(
                              selectedCountry,
                              selectedState,
                            ).map((city) => (
                              <CommandItem
                                key={city.name}
                                value={city.name}
                                onSelect={() => {
                                  form.setValue("city", city.name, {
                                    shouldDirty: true,
                                  });
                                  setOpenCity(false);
                                }}
                              >
                                <span className="truncate">{city.name}</span>
                                <Check
                                  className={cn(
                                    "ml-auto size-4 shrink-0",
                                    selectedCity === city.name
                                      ? "opacity-100"
                                      : "opacity-0",
                                  )}
                                />
                              </CommandItem>
                            ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              ) : (
                <p className="text-sm font-bold text-zinc-900 dark:text-zinc-50 px-1 truncate max-w-full">
                  {optimisticData.city || "—"}
                </p>
              )}
            </div>

            {/* ZIP Code */}
            <div className="space-y-2">
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest leading-none px-1">
                ZIP / Postal Code
              </p>
              {isEditing ? (
                <Input
                  {...form.register("zip")}
                  className="h-10 rounded-lg border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-sm font-medium shadow-none"
                  placeholder="ZIP / Postal Code"
                />
              ) : (
                <p className="text-sm font-bold text-zinc-900 dark:text-zinc-50 px-1">
                  {optimisticData.zip || "—"}
                </p>
              )}
            </div>
          </div>

          {isEditing && (
            <div className="flex justify-end pt-6 border-t border-zinc-100 dark:border-zinc-900">
              <Button
                type="submit"
                disabled={isPending || !form.formState.isDirty}
                className="h-10 px-8 rounded-lg bg-zinc-900 dark:bg-zinc-50 text-white dark:text-zinc-900 font-bold text-xs uppercase tracking-widest transition-all shadow-none"
              >
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" /> Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </div>
          )}
        </form>
      </div>
    </section>
  );
}

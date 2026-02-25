"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Pencil, User, X } from "lucide-react";
import { useOptimistic, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { updateProfile } from "../actions/user-actions";

const profileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  companyName: z.string().optional(),
  companyCategory: z.string().optional(),
  phoneNumber: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  zip: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

interface PersonalDetailsSectionProps {
  initialData: {
    name: string;
    companyName?: string | null;
    companyCategory?: string | null;
    phoneNumber?: string | null;
    address?: string | null;
    city?: string | null;
    state?: string | null;
    country?: string | null;
    zip?: string | null;
  };
}

export function PersonalDetailsSection({
  initialData,
}: PersonalDetailsSectionProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [optimisticData, setOptimisticData] = useOptimistic(
    initialData,
    (state, update: Partial<typeof initialData>) => ({
      ...state,
      ...update,
    }),
  );

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    values: {
      name: initialData.name || "",
      companyName: initialData.companyName || "",
      companyCategory: initialData.companyCategory || "",
      phoneNumber: initialData.phoneNumber || "",
      address: initialData.address || "",
      city: initialData.city || "",
      state: initialData.state || "",
      country: initialData.country || "",
      zip: initialData.zip || "",
    },
  });

  const onSubmit = (data: ProfileFormValues) => {
    const dirtyFields = Object.keys(form.formState.dirtyFields) as Array<
      keyof ProfileFormValues
    >;

    if (dirtyFields.length === 0) {
      setIsEditing(false);
      return;
    }

    const changedData = dirtyFields.reduce(
      (acc, key) => {
        acc[key] = data[key];
        return acc;
      },
      {} as Partial<ProfileFormValues>,
    );

    startTransition(async () => {
      // Optimistically update the display immediately and close form
      setOptimisticData(changedData);
      setIsEditing(false);

      const result = await updateProfile(changedData as any);
      if (result.success) {
        toast.success("Profile updated successfully");
        form.reset(data); // update internal defaultValues so user can edit back to previous value
      } else {
        toast.error(result.error || "Failed to update profile");
        // Reopen the form so they don't lose their inputs if it fails
        setIsEditing(true);
      }
    });
  };

  return (
    <section className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-none">
      <div className="px-6 py-4 border-b border-zinc-100 dark:border-zinc-900 bg-zinc-50/50 dark:bg-zinc-900/50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <User className="size-4 text-zinc-500" />
          <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-50 tracking-tight">
            Personal Details
          </h3>
        </div>
        {!isEditing ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsEditing(true)}
            className="h-8 text-[10px] font-bold px-4 border-zinc-200 dark:border-zinc-800 uppercase tracking-widest bg-white dark:bg-zinc-900"
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
            {/* Full Name */}
            <div className="space-y-2">
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest leading-none px-1">
                Full Name
              </p>
              {isEditing ? (
                <div className="space-y-1">
                  <Input
                    {...form.register("name")}
                    className="h-10 rounded-lg border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-sm font-medium shadow-none"
                  />
                  {form.formState.errors.name && (
                    <p className="text-[10px] font-bold text-red-500 mt-1">
                      {form.formState.errors.name.message}
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-sm font-bold text-zinc-900 dark:text-zinc-50 px-1">
                  {optimisticData.name || "—"}
                </p>
              )}
            </div>

            {/* Phone Number */}
            <div className="space-y-2">
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest leading-none px-1">
                Phone Number
              </p>
              {isEditing ? (
                <Input
                  {...form.register("phoneNumber")}
                  className="h-10 rounded-lg border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-sm font-medium shadow-none"
                  placeholder="+1 (555) 000-0000"
                />
              ) : (
                <p className="text-sm font-bold text-zinc-900 dark:text-zinc-50 px-1">
                  {optimisticData.phoneNumber || "—"}
                </p>
              )}
            </div>

            {/* Address */}
            <div className="space-y-2 md:col-span-2">
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest leading-none px-1">
                Address
              </p>
              {isEditing ? (
                <Input
                  {...form.register("address")}
                  className="h-10 rounded-lg border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-sm font-medium shadow-none max-w-lg"
                  placeholder="Street Address"
                />
              ) : (
                <p className="text-sm font-bold text-zinc-900 dark:text-zinc-50 px-1">
                  {optimisticData.address || "—"}
                </p>
              )}
            </div>

            {/* City */}
            <div className="space-y-2">
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest leading-none px-1">
                City
              </p>
              {isEditing ? (
                <Input
                  {...form.register("city")}
                  className="h-10 rounded-lg border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-sm font-medium shadow-none"
                  placeholder="City"
                />
              ) : (
                <p className="text-sm font-bold text-zinc-900 dark:text-zinc-50 px-1">
                  {optimisticData.city || "—"}
                </p>
              )}
            </div>

            {/* State */}
            <div className="space-y-2">
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest leading-none px-1">
                State
              </p>
              {isEditing ? (
                <Input
                  {...form.register("state")}
                  className="h-10 rounded-lg border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-sm font-medium shadow-none"
                  placeholder="State / Province"
                />
              ) : (
                <p className="text-sm font-bold text-zinc-900 dark:text-zinc-50 px-1">
                  {optimisticData.state || "—"}
                </p>
              )}
            </div>

            {/* Country */}
            <div className="space-y-2">
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest leading-none px-1">
                Country
              </p>
              {isEditing ? (
                <Input
                  {...form.register("country")}
                  className="h-10 rounded-lg border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-sm font-medium shadow-none"
                  placeholder="Country"
                />
              ) : (
                <p className="text-sm font-bold text-zinc-900 dark:text-zinc-50 px-1">
                  {optimisticData.country || "—"}
                </p>
              )}
            </div>

            {/* Zip Code */}
            <div className="space-y-2">
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest leading-none px-1">
                Zip Code
              </p>
              {isEditing ? (
                <Input
                  {...form.register("zip")}
                  className="h-10 rounded-lg border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-sm font-medium shadow-none"
                  placeholder="Postal Code"
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

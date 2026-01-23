import { AxiosError } from "axios";
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { showToast } from "./toast";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}



export const generateSlug = (name: string): string => {
  return name
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, "-")
  .replace(/(^-|-$)/g, "")
  .substring(0, 50);
}


export const validateSlug = (slug: string): boolean => {
  const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  return slugRegex.test(slug) && slug.length >= 3 && slug.length <= 50;
};


/**
 * Handles API errors and displays appropriate toast messages
 * @param err - The error object from the API call
 */
export const handleApiError = (err: unknown) => {
  const error = err as AxiosError<{
    message?: string;
    errors?: Record<string, string[]>;
  }>;

  const apiErrors = error.response?.data?.errors;
  const message = error.response?.data?.message;

  if (apiErrors && typeof apiErrors === "object") {
    Object.entries(apiErrors).forEach(([field, messages]) => {
      if (Array.isArray(messages)) {
        messages.forEach((msg) => showToast.error(`${field}: ${msg}`));
      }
    });
  } else {
    showToast.error(message || "An unknown error occurred");
  }
};

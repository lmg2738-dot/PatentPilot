import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string): string {
  return new Date(date).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("ko-KR", {
    style: "currency",
    currency: "KRW",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function getPlanLimits(plan: string): number {
  switch (plan) {
    case "pro":
    case "business":
      return Infinity;
    default:
      return 5;
  }
}

export function getStarRating(score: number): string {
  const stars = Math.round((score / 100) * 5);
  return "★".repeat(stars) + "☆".repeat(5 - stars);
}

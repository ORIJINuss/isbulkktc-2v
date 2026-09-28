import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function siniflariBirlestir(...girdiler: ClassValue[]): string {
  return twMerge(clsx(girdiler));
}

export { siniflariBirlestir as sb, clsx };

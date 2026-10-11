import type { Direction } from "~/data/markets";

export const usd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

export function directionClass(direction: Direction) {
  return direction === "up" ? "text-up" : "text-down";
}

export function pillClass(direction: Direction) {
  return direction === "up"
    ? "bg-up-bg text-up"
    : "bg-down-bg text-down";
}

import { CONFIG } from "./config";

const { grid: GRID } = CONFIG;
const params = new URLSearchParams(location.search);

const between = ([min, max]: [number, number]) =>
  min + Math.floor(Math.random() * (max - min + 1));

const dimension = (key: "columns" | "rows") => {
  const value = params.get(key);
  if (value === "random" || (value === null && params.has("random"))) {
    return between(GRID.random[key]);
  }

  const n = Number.parseInt(value ?? "", 10);
  return Number.isNaN(n) ? undefined : Math.min(GRID.max, Math.max(1, n));
};

const columns = dimension("columns");
const rows = dimension("rows");

export const GRID_SIZE = {
  columns: columns ?? GRID.columns,
  rows: rows ?? GRID.rows,
  /** Set from the query string, so it shouldn't be swapped for a portrait screen. */
  fixed: columns !== undefined || rows !== undefined,
};

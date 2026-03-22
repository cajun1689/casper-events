/**
 * Curated list of Wyoming cities for the events city filter.
 * Sorted by population/importance; "All Wyoming" means no city filter.
 */
export const WYOMING_CITIES = [
  "All Wyoming",
  "Cheyenne",
  "Casper",
  "Laramie",
  "Gillette",
  "Rock Springs",
  "Sheridan",
  "Green River",
  "Evanston",
  "Riverton",
  "Cody",
  "Douglas",
  "Powell",
  "Rawlins",
  "Worland",
  "Torrington",
  "Jackson",
  "Buffalo",
  "Lander",
  "Wheatland",
  "Kemmerer",
  "Newcastle",
  "Thermopolis",
  "Sundance",
  "Glenrock",
  "Lovell",
  "Saratoga",
  "Pinedale",
  "Afton",
  "Mills",
  "Evansville",
  "Bar Nunn",
  "South Park",
  "Ranchester",
  "Lyman",
  "Greybull",
  "Shoshoni",
  "Basin",
  "Dubois",
  "Hanna",
  "Marbleton",
] as const;

export type WyomingCity = (typeof WYOMING_CITIES)[number];

export const ALL_WYOMING_VALUE = "All Wyoming";

/** Preset story kinds shown as click options on the home screen. */
export const STORY_KINDS = [
  { id: "fairy-tale", label: "Fairy tale", hint: "magical kingdoms and gentle lessons" },
  { id: "animals", label: "Animal friends", hint: "talking animals, kindness, forest or farm" },
  { id: "adventure", label: "Adventure", hint: "explorers, maps, friendly challenges" },
  { id: "space", label: "Space & stars", hint: "rockets, planets, curious aliens" },
  { id: "ocean", label: "Ocean & sea", hint: "fish, mermaids, underwater worlds" },
  { id: "dinosaurs", label: "Dinosaurs", hint: "gentle dino characters, no scary scenes" },
  { id: "superhero", label: "Everyday hero", hint: "being brave, helping others, no violence" },
  { id: "school", label: "School & friends", hint: "classroom, teamwork, making friends" },
  { id: "fantasy", label: "Fantasy", hint: "wizards, dragons as friends, quests of heart" },
  { id: "bedtime", label: "Bedtime calm", hint: "cozy, slow pacing, soothing ending" },
] as const;

export type StoryKindId = (typeof STORY_KINDS)[number]["id"];

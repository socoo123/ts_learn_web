export type RunMode = "browser" | "local";

export interface FuncDef {
  name: string;
  testSuite: string;
  skeleton: string;
}

export interface Section {
  id: string;
  heading: string;
  secNum: string | null;
  body: string;
  exerciseFunctions: string[];
}

export interface ChapterSummary {
  id: string;
  num: string;
  title: string;
  runMode: RunMode;
}

export interface Chapter extends ChapterSummary {
  tutorialMd: string;
  assignment: string;
  testName: string;
  testSource: string;
  reviewMd: string;
  interleaved: boolean;
  sections: Section[];
  functions: FuncDef[];
  preamble: string;
  localHint?: string;
}

export interface Module {
  id: string;
  title: string;
  subtitle: string;
  dir: string;
  available: boolean;
  chapters: ChapterSummary[];
}

export interface CurriculumIndex {
  modules: Module[];
}

export interface SharedContent {
  mocks: Record<string, string>;
}

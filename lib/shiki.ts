import { createHighlighter, type Highlighter } from "shiki";

const THEMES = { light: "github-light", dark: "github-dark" } as const;

const LANGS = [
  "javascript",
  "typescript",
  "tsx",
  "jsx",
  "json",
  "bash",
  "html",
  "css",
  "python",
  "sql",
  "go",
  "rust",
  "php",
  "yaml",
  "markdown",
  "diff",
];

const ALIASES: Record<string, string> = {
  js: "javascript",
  ts: "typescript",
  py: "python",
  sh: "bash",
  shell: "bash",
  "": "text",
  text: "text",
  plaintext: "text",
};

const EXT_LANG: Record<string, string> = {
  ts: "typescript",
  tsx: "tsx",
  js: "javascript",
  mjs: "javascript",
  cjs: "javascript",
  jsx: "jsx",
  json: "json",
  html: "html",
  htm: "html",
  css: "css",
  scss: "css",
  sh: "bash",
  bash: "bash",
  py: "python",
  go: "go",
  rs: "rust",
  sql: "sql",
  yml: "yaml",
  yaml: "yaml",
  md: "markdown",
  markdown: "markdown",
  php: "php",
  diff: "diff",
  patch: "diff",
};

export function langFromFilename(name?: string | null): string {
  const ext = (name ?? "").split(".").pop()?.toLowerCase() ?? "";
  return EXT_LANG[ext] ?? "";
}

let hp: Promise<Highlighter> | null = null;

function getHighlighter() {
  if (!hp) {
    hp = createHighlighter({ themes: [THEMES.light, THEMES.dark], langs: LANGS });
  }
  return hp;
}

export async function highlight(code: string, lang: string): Promise<string> {
  const h = await getHighlighter();
  const wanted = ALIASES[lang] ?? lang;
  const language = wanted === "text" || h.getLoadedLanguages().includes(wanted) ? wanted : "text";
  return h.codeToHtml(code, {
    lang: language,
    themes: THEMES,
    defaultColor: false,
  });
}

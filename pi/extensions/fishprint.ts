import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { Type } from "typebox";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const DEFAULT_BASE_URL = "http://127.0.0.1:3847";
const MAX_TEXT_CHARS = 24_000;

function baseUrl() {
  return (process.env.FISHPRINT_URL ?? DEFAULT_BASE_URL).replace(/\/$/, "");
}

function truncate(text: string, max = MAX_TEXT_CHARS) {
  if (text.length <= max) return text;
  return `${text.slice(0, max)}\n\n[fishprint output truncated: ${text.length} chars total]`;
}

async function request(path: string, body?: unknown, signal?: AbortSignal) {
  const res = await fetch(`${baseUrl()}${path}`, body === undefined ? { signal } : {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
    signal,
  });

  const text = await res.text();
  let data: unknown = text;
  try { data = text ? JSON.parse(text) : null; } catch {}

  if (!res.ok) {
    const message = typeof data === "object" && data && "error" in data
      ? String((data as { error: unknown }).error)
      : text || `${res.status} ${res.statusText}`;
    throw new Error(message);
  }

  return data;
}

function asToolResult(data: unknown) {
  const text = typeof data === "string" ? data : JSON.stringify(data, null, 2);
  return {
    content: [{ type: "text" as const, text: truncate(text) }],
    details: { data },
  };
}

export default function fishprintPi(pi: ExtensionAPI) {
  pi.registerTool({
    name: "fishprint_health",
    label: "Fishprint Health",
    description: "Check whether the local Fishprint daemon is running on FISHPRINT_URL or http://127.0.0.1:3847.",
    promptSnippet: "Check the local Fishprint daemon health.",
    parameters: Type.Object({}),
    async execute(_id, _params, signal) {
      return asToolResult(await request("/health", undefined, signal));
    },
  });

  pi.registerTool({
    name: "fishprint_open",
    label: "Fishprint Open",
    description: "Open a URL in the Fishprint daemon and return a summarized DOM with selectors for later screenshot capture. Output is truncated to 24KB.",
    promptSnippet: "Open a web page with Fishprint and inspect its summarized DOM/selectors.",
    parameters: Type.Object({
      url: Type.String({ description: "URL to open" }),
    }),
    async execute(_id, params, signal) {
      return asToolResult(await request("/open", { url: params.url }, signal));
    },
  });

  pi.registerTool({
    name: "fishprint_capture",
    label: "Fishprint Capture",
    description: "Screenshot one or more narrow CSS-selected elements from an open Fishprint page and upload them to Gyazo.",
    promptSnippet: "Capture original-page quote screenshots from an open Fishprint page.",
    promptGuidelines: [
      "Use fishprint_capture only with narrow selectors such as p, blockquote, li, figcaption, or h2/h3; do not capture broad containers.",
    ],
    parameters: Type.Object({
      id: Type.String({ description: "Page id returned by fishprint_open" }),
      selectors: Type.Array(Type.String({ description: "Narrow CSS selector to screenshot" })),
    }),
    async execute(_id, params, signal) {
      return asToolResult(await request("/capture", { id: params.id, selectors: params.selectors }, signal));
    },
  });

  pi.registerTool({
    name: "fishprint_close",
    label: "Fishprint Close",
    description: "Close an open Fishprint page by id to free daemon browser resources.",
    promptSnippet: "Close an open Fishprint page.",
    parameters: Type.Object({
      id: Type.String({ description: "Page id returned by fishprint_open" }),
    }),
    async execute(_id, params, signal) {
      return asToolResult(await request("/close", { id: params.id }, signal));
    },
  });

  pi.registerTool({
    name: "fishprint_assemble",
    label: "Fishprint Assemble",
    description: "Assemble section_N.md files into one Markdown digest and clean up the section directory.",
    promptSnippet: "Assemble Fishprint section files into the final Markdown digest.",
    parameters: Type.Object({
      sectionDir: Type.String({ description: "Directory containing section_N.md files" }),
      output: Type.String({ description: "Absolute output path for the digest" }),
      preamble: Type.Optional(Type.String({ description: "Markdown preamble" })),
      appendix: Type.Optional(Type.String({ description: "Markdown appendix" })),
      title: Type.Optional(Type.String({ description: "Optional top-level title" })),
    }),
    async execute(_id, params, signal) {
      return asToolResult(await request("/assemble", params, signal));
    },
  });

  pi.registerCommand("fishprint", {
    description: "Run the Fishprint digest skill. Usage: /fishprint [theme]",
    handler: async (args, ctx) => {
      await ctx.waitForIdle();
      const here = dirname(fileURLToPath(import.meta.url));
      const skillPath = join(here, "..", "skills", "fishprint", "SKILL.md");
      const skill = readFileSync(skillPath, "utf8").replace("$ARGUMENTS", args.trim());
      pi.sendUserMessage(`${skill}\n\nUser: ${args.trim()}`);
    },
  });
}

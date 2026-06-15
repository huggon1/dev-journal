import { readdir, readFile, stat } from "node:fs/promises";
import { homedir, platform } from "node:os";
import path from "node:path";

import { parseCodexSessionJsonl } from "./parseCodexSession.js";

export type SessionSummary = {
  id: string;
  title: string;
  startedAt?: string;
  updatedAt?: string;
  cwd?: string;
  source?: string;
  filePath: string;
  archived: boolean;
  parseWarningCount: number;
};

export type DiscoveryResult = {
  codexHome: string;
  searchedRoots: string[];
  sessions: SessionSummary[];
  warnings: string[];
};

type SessionIndexEntry = {
  id?: string;
  thread_name?: string;
  updated_at?: string;
};

export async function discoverCodexSessions(options: { codexHome?: string } = {}): Promise<DiscoveryResult> {
  const codexHome = options.codexHome ?? getDefaultCodexHome();
  const warnings: string[] = [];
  const searchedRoots = [path.join(codexHome, "sessions"), path.join(codexHome, "archived_sessions")];
  const index = await readSessionIndex(path.join(codexHome, "session_index.jsonl"), warnings);
  const files = await collectSessionFiles(searchedRoots, warnings);

  const sessions = await Promise.all(files.map((file) => summarizeSessionFile(file, codexHome, index, warnings)));
  const sortedSessions = sessions
    .filter((session): session is SessionSummary => Boolean(session))
    .sort((a, b) => (Date.parse(b.updatedAt ?? b.startedAt ?? "") || 0) - (Date.parse(a.updatedAt ?? a.startedAt ?? "") || 0));

  return {
    codexHome,
    searchedRoots,
    sessions: sortedSessions,
    warnings
  };
}

export function getDefaultCodexHome(): string {
  if (process.env.CODEX_HOME) {
    return process.env.CODEX_HOME;
  }

  if (platform() === "win32") {
    return path.join(process.env.USERPROFILE ?? homedir(), ".codex");
  }

  return path.join(homedir(), ".codex");
}

async function readSessionIndex(indexPath: string, warnings: string[]): Promise<Map<string, SessionIndexEntry>> {
  const entries = new Map<string, SessionIndexEntry>();

  try {
    const content = await readFile(indexPath, "utf8");
    for (const line of content.split(/\r?\n/)) {
      if (!line.trim()) {
        continue;
      }
      try {
        const entry = JSON.parse(line) as SessionIndexEntry;
        if (entry.id) {
          entries.set(entry.id, entry);
        }
      } catch {
        warnings.push(`Could not parse a line in session index: ${indexPath}`);
      }
    }
  } catch {
    warnings.push(`Session index not found or unreadable: ${indexPath}`);
  }

  return entries;
}

async function collectSessionFiles(roots: string[], warnings: string[]): Promise<Array<{ filePath: string; archived: boolean }>> {
  const files: Array<{ filePath: string; archived: boolean }> = [];

  for (const root of roots) {
    try {
      const rootStat = await stat(root);
      if (!rootStat.isDirectory()) {
        warnings.push(`Session root is not a directory: ${root}`);
        continue;
      }
      await walkJsonl(root, root.endsWith(`${path.sep}archived_sessions`), files);
    } catch {
      warnings.push(`Session root not found or unreadable: ${root}`);
    }
  }

  return files;
}

async function walkJsonl(root: string, archived: boolean, files: Array<{ filePath: string; archived: boolean }>): Promise<void> {
  const entries = await readdir(root, { withFileTypes: true });

  for (const entry of entries) {
    const entryPath = path.join(root, entry.name);
    if (entry.isDirectory()) {
      await walkJsonl(entryPath, archived, files);
    } else if (entry.isFile() && entry.name.endsWith(".jsonl")) {
      files.push({ filePath: entryPath, archived });
    }
  }
}

async function summarizeSessionFile(
  file: { filePath: string; archived: boolean },
  codexHome: string,
  index: Map<string, SessionIndexEntry>,
  warnings: string[]
): Promise<SessionSummary | undefined> {
  try {
    const content = await readFile(file.filePath, "utf8");
    const parsed = parseCodexSessionJsonl(content);
    const fileStat = await stat(file.filePath);
    const id = parsed.metadata.id ?? path.basename(file.filePath, ".jsonl");
    const indexEntry = index.get(id);
    const title = indexEntry?.thread_name || fallbackTitle(file.filePath, codexHome);

    return {
      id,
      title,
      startedAt: parsed.metadata.timestamp,
      updatedAt: indexEntry?.updated_at ?? fileStat.mtime.toISOString(),
      cwd: parsed.metadata.cwd,
      source: parsed.metadata.source,
      filePath: file.filePath,
      archived: file.archived,
      parseWarningCount: parsed.warnings.length
    };
  } catch {
    warnings.push(`Could not read session transcript: ${file.filePath}`);
    return undefined;
  }
}

function fallbackTitle(filePath: string, codexHome: string): string {
  return path.relative(codexHome, filePath).replaceAll(path.sep, " / ");
}

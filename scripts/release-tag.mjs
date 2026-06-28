/**
 * Minimal publish script for changesets/action.
 *
 * `changeset tag` skips private packages when checking npm, so it produces no
 * output and changesets/action never creates a GitHub Release. This script
 * creates the git tag directly and writes the "New tag: …" line that
 * changesets/action parses to determine which releases to publish.
 */
import { readFileSync } from "node:fs";
import { execSync } from "node:child_process";

const { name, version } = JSON.parse(readFileSync("package.json", "utf8"));
const tag = `${name}@${version}`;

try {
  execSync(`git tag ${tag}`, { stdio: "inherit" });
} catch {
  // Tag already exists — proceed so the release is still created.
}

process.stdout.write(`New tag: ${tag}\n`);

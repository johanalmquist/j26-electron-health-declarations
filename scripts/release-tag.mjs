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

// changesets/action parses stdout for "New tag: name@version",
// extracts the version, and then does `git push origin v{version}`.
// The tag must therefore be named v{version} so the push succeeds.
try {
  execSync(`git tag v${version}`, { stdio: "inherit" });
} catch {
  // Tag already exists — proceed so the release is still created.
}

process.stdout.write(`New tag: ${name}@${version}\n`);

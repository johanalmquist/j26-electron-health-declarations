/**
 * Publish script for changesets/action.
 *
 * Why not `changeset tag`:
 *   It skips private packages (no npm check possible), produces no output,
 *   and changesets/action never sees a published package → no GitHub Release.
 *
 * What this script does:
 *   1. Checks whether the current version already has a git tag. If so, exits
 *      silently — changesets/action sees no "New tag:" line and skips the
 *      release, preventing spurious builds on every push to main.
 *   2. Creates the v{version} tag locally. changesets/action then pushes it
 *      and creates the GitHub Release (it parses "New tag: name@version" to
 *      determine the version, then does `git push origin v{version}`).
 */
import { readFileSync } from "node:fs";
import { execSync } from "node:child_process";

const { name, version } = JSON.parse(readFileSync("package.json", "utf8"));
const tag = `v${version}`;

// If the tag already exists this version has already been released.
// Exit 0 without printing "New tag:" so changesets/action does nothing.
try {
  execSync(`git rev-parse ${tag}`, { stdio: "ignore" });
  process.stdout.write(`${tag} already released — skipping.\n`);
  process.exit(0);
} catch {
  // Tag does not exist yet; proceed.
}

execSync(`git tag ${tag}`);
process.stdout.write(`New tag: ${name}@${version}\n`);

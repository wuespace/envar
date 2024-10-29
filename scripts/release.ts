import { critical, info, setup } from "@std/log";
import { format, increment, parse } from "jsr:@std/semver";
import { resolve } from "node:path";
import conventionalChangelog from "npm:conventional-changelog";
import "npm:conventional-changelog-angular";
import { Bumper } from "npm:conventional-recommended-bump";

setup({});

// Ensure clean working tree
const status = new Deno.Command("git", {
	args: ["status", "--porcelain"],
	stdout: "piped",
	stderr: "inherit",
}).outputSync();

if (status.stdout.length !== 0) {
	critical("Working tree is not clean. Please commit or stash your changes.");
	Deno.exit(1);
}

info("Running tests");

if (
	!new Deno.Command("deno", {
		args: ["task", "test"],
		stdout: "inherit",
		"stderr": "inherit",
	}).outputSync().success
) {
	critical("Tests failed");
	Deno.exit(1);
}

const CURRENT_FILE = import.meta.url.replace("file://", "");
Deno.chdir(resolve(CURRENT_FILE, "..", ".."));

const bumper = new Bumper(Deno.cwd()).loadPreset("angular");
const bump = await bumper.bump();

const currentVersion = await import("../deno.json", { with: { type: "json" } })
	.then((pkg) => pkg.default.version);

if (
	bump.releaseType !== "major" && bump.releaseType !== "minor" &&
	bump.releaseType !== "patch"
) {
	throw new Error("Invalid release type");
}

const newVersion = format(increment(parse(currentVersion), bump.releaseType));

info(`Bumping version from ${currentVersion} to ${newVersion}`);

info("Updating deno.json");

Deno.writeTextFile(
	"./deno.json",
	JSON.stringify(
		{
			...JSON.parse(Deno.readTextFileSync("./deno.json")),
			version: newVersion,
		},
		null,
		2,
	),
);

info("Updated deno.json");
info("Generating changelog");

const changelog = await new Promise<string>((resolve, reject) => {
	let data = "#";
	conventionalChangelog({
		preset: "angular",
		pkg: {
			path: "./deno.json",
		},
	}).on("data", (chunk: string) => {
		data += chunk;
	}).on("end", () => {
		resolve(data);
	}).on("error", (err: Error) => {
		reject(err);
	});
});

const oldChangelog = Deno.readTextFileSync("./CHANGELOG.md");
const newChangelog = oldChangelog.replace(
	"# Changelog",
	`# Changelog\n\n${changelog}`,
);
Deno.writeTextFile("./CHANGELOG.md", newChangelog);

info("Updated CHANGELOG.md");
if (
	!new Deno.Command("git", {
		args: ["add", "deno.json", "CHANGELOG.md"],
		stdout: "inherit",
		"stderr": "inherit",
	}).outputSync().success
) {
	critical("Failed to add files to git");
	Deno.exit(1);
}

info("Added files to git");

if (
	!new Deno.Command("git", {
		args: ["commit", "-m", `chore(release): Release v${newVersion} 🚀`],
		stdout: "inherit",
		"stderr": "inherit",
	}).outputSync().success
) {
	critical("Failed to commit changes");
	Deno.exit(1);
}

info("Committed changes");

if (
	!new Deno.Command("git", {
		args: ["tag", `v${newVersion}`],
		stdout: "inherit",
		"stderr": "inherit",
	}).outputSync().success
) {
	critical("Failed to tag release", newVersion);
	Deno.exit(1);
}

info("Tagged release");

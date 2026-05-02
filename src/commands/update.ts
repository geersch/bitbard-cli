import { defineCommand } from "citty";
import { execSync } from "node:child_process";
import { existsSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const INSTALL_DIR = process.env.BITBARD_DIR ?? join(homedir(), ".bitbard");
const YARN = `node ${join(INSTALL_DIR, ".yarn/releases/yarn-4.14.1.cjs")}`;

function run(cmd: string, cwd: string): void {
  execSync(cmd, { cwd, stdio: "inherit" });
}

function getOutput(cmd: string, cwd: string): string {
  return execSync(cmd, { cwd, encoding: "utf8" }).trim();
}

export default defineCommand({
  meta: {
    name: "update",
    description: "Update bitbard CLI to the latest version",
  },
  run() {
    if (!existsSync(join(INSTALL_DIR, ".git"))) {
      console.error(
        `Error: bitbard installation not found at ${INSTALL_DIR}.\n` +
          "Re-install bitbard using the install script and try again."
      );
      process.exit(1);
    }

    console.log("Checking for updates...");
    run("git fetch --depth=1 origin HEAD", INSTALL_DIR);

    const localHash = getOutput("git rev-parse HEAD", INSTALL_DIR);
    const remoteHash = getOutput("git rev-parse FETCH_HEAD", INSTALL_DIR);

    if (localHash === remoteHash) {
      console.log("bitbard CLI is already up to date.");
      return;
    }

    run("git reset --hard FETCH_HEAD", INSTALL_DIR);

    console.log("Installing dependencies...");
    run(`${YARN} install`, INSTALL_DIR);

    console.log("Building...");
    run(`${YARN} build`, INSTALL_DIR);

    console.log("bitbard updated successfully.");
  },
});

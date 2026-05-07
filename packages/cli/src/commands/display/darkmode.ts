import { defineCommand } from 'citty';
import { select, isCancel } from '@clack/prompts';
import chalk from 'chalk';
import { runAppleScript } from '@bitbard/core/applescript.js';

type DarkMode = 'light' | 'dark';

export default defineCommand({
  meta: {
    name: 'darkmode',
    description: 'Switch macOS appearance between Light and Dark',
  },
  async run() {
    const choice = await select<DarkMode>({
      message: 'Select appearance mode',
      options: [
        { value: 'light', label: 'Light' },
        { value: 'dark', label: 'Dark' },
      ],
    });

    if (isCancel(choice)) {
      return;
    }

    try {
      const darkMode = choice === 'dark';
      await runAppleScript(
        `tell application "System Events" to tell appearance preferences to set dark mode to ${darkMode}`,
      );
      console.log(chalk.bold(chalk.green(`Appearance set to: ${choice === 'dark' ? 'Dark' : 'Light'}`)));
    } catch (err) {
      console.log(chalk.bold(chalk.red(`Failed to apply appearance: ${(err as Error).message}`)));
    }
  },
});

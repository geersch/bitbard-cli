import chalk from 'chalk';

const FRAMES = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];

export function spinner(label: string): (done: string, success?: boolean) => void {
  if (!process.stdout.isTTY) {
    return () => {};
  }

  let i = 0;
  process.stdout.write(`${chalk.cyan(FRAMES[i++ % FRAMES.length])} ${label}`);
  const id = setInterval(() => {
    process.stdout.write(`\r\x1b[2K${chalk.cyan(FRAMES[i++ % FRAMES.length])} ${label}`);
  }, 80);

  return (done: string, success = true) => {
    clearInterval(id);
    const icon = success ? chalk.green('✓') : chalk.yellow('✗');
    process.stdout.write(`\r\x1b[2K${icon} ${done}\n`);
  };
}

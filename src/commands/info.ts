import { defineCommand } from 'citty';
import { getSystemInfo } from '../util/system-info.js';

export default defineCommand({
  meta: {
    name: 'info',
    description: 'Print system information for bug reports',
  },
  run() {
    const info = getSystemInfo(__APP_VERSION__);

    console.log('\nbitbard info\n');
    console.log(`  bitbard:          ${info.bitbard}`);
    console.log(`  OS:               ${info.os}`);
    console.log(`  Architecture:     ${info.architecture}`);
    console.log(`  CPUs:             ${info.cpus}`);
    console.log(`  Memory:           ${info.memory}`);
    console.log(`  Node:             ${info.node}`);
    console.log(`  Git:              ${info.git}`);
    console.log(`  Shell:            ${info.shell}`);
    console.log('');
  },
});

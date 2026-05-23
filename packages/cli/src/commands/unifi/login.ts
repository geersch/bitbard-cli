import { defineCommand } from 'citty';
import { text, password, isCancel, log } from '@clack/prompts';
import { isLoggedIn, saveCredentials } from '@bitbard/unifi/auth.js';

export default defineCommand({
  meta: {
    name: 'login',
    description: 'Log in to UniFi',
  },
  async run() {
    if (await isLoggedIn()) {
      console.log('Already logged in to UniFi. Run: bitbard unifi logout to switch accounts.');
      return;
    }

    const host = await text({
      message: 'UniFi host',
      placeholder: 'https://192.168.1.1',
    });
    if (isCancel(host)) {
      return;
    }

    const apiKey = await text({
      message: 'API key (public API)',
    });
    if (isCancel(apiKey)) {
      return;
    }

    const username = await text({
      message: 'Username (local user)',
    });
    if (isCancel(username)) {
      return;
    }

    const userPassword = await password({
      message: 'Password',
    });
    if (isCancel(userPassword)) {
      return;
    }

    await saveCredentials({
      shared: { host: host as string },
      public: { apiKey: apiKey as string },
      private: { username: username as string, password: userPassword as string },
    });

    log.success('Logged in to UniFi');
  },
});

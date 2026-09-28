import {
  ask,
  message,
} from '@tauri-apps/plugin-dialog';
import { relaunch } from '@tauri-apps/plugin-process';
import { check } from '@tauri-apps/plugin-updater';

// offers to install a newer release, if there is one. a quiet check (the one
// on start) stays silent when there's nothing to install or it fails, e.g.
// being offline, and just runs again on the next start
export async function checkForUpdates(
  { quiet }: { quiet: boolean },
): Promise<void> {
  const result = await check()
    .then(update => ({ update, error: null }))
    .catch(error => ({ update: null, error }));

  if (result.error) {
    if (!quiet) {
      await message(`Could not check for updates: ${result.error}`, {
        title: 'Update check failed',
        kind: 'error',
      });
    }
    return;
  }

  const update = result.update;
  if (!update) {
    if (!quiet) {
      await message('You have the latest version of CalcPad.', {
        title: 'No updates available',
      });
    }
    return;
  }

  const install = await ask(
    `CalcPad ${update.version} is available, you have ${update.currentVersion}.`
      + '\n\nUpdate and restart now?',
    { title: 'Update available', okLabel: 'Update', cancelLabel: 'Later' },
  );
  if (!install) return;

  try {
    await update.downloadAndInstall();
    await relaunch();
  } catch (e) {
    await message(`The update failed: ${e}`, {
      title: 'Update failed',
      kind: 'error',
    });
  }
}

import {
  ask,
  message,
} from '@tauri-apps/plugin-dialog';
import { relaunch } from '@tauri-apps/plugin-process';
import { check } from '@tauri-apps/plugin-updater';

// offers to install a newer release, if there is one. a failed check (e.g.
// being offline) is ignored, it runs again on the next start
export async function checkForUpdates(): Promise<void> {
  const update = await check().catch(() => null);
  if (!update) return;

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

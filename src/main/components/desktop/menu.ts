import {
  Menu,
  MenuItem,
  PredefinedMenuItem,
  Submenu,
} from '@tauri-apps/api/menu';

export interface MenuActions {
  newFile: () => void;
  saveFile: () => void;
  openFile: () => void;
  openPreferences: () => void;
  openHelp: () => void;
  editFunctionsFile: () => void;
}

export async function setupMenu(actions: MenuActions): Promise<void> {
  const item = (text: string, action: () => void, accelerator?: string) =>
    MenuItem.new({ text, action, accelerator });
  const predefined = (
    item:
      | 'Separator'
      | 'Undo'
      | 'Redo'
      | 'Cut'
      | 'Copy'
      | 'Paste'
      | 'SelectAll'
      | 'Quit',
  ) => PredefinedMenuItem.new({ item });

  const menu = await Menu.new({
    items: [
      await Submenu.new({
        text: 'CalcPad',
        items: [await predefined('Quit')],
      }),
      await Submenu.new({
        text: 'File',
        items: [
          await item('New', actions.newFile, 'CmdOrCtrl+N'),
          await item('Save', actions.saveFile, 'CmdOrCtrl+S'),
          await item('Open', actions.openFile, 'CmdOrCtrl+O'),
          await predefined('Separator'),
          await item('Preferences', actions.openPreferences, 'CmdOrCtrl+,'),
          await item('Help', actions.openHelp, 'CmdOrCtrl+Shift+/'),
        ],
      }),
      await Submenu.new({
        text: 'Edit',
        items: [
          await predefined('Undo'),
          await predefined('Redo'),
          await predefined('Separator'),
          await predefined('Cut'),
          await predefined('Copy'),
          await predefined('Paste'),
          await predefined('SelectAll'),
          await predefined('Separator'),
          await item('Edit functions file', actions.editFunctionsFile),
        ],
      }),
    ],
  });

  await menu.setAsAppMenu();
}

import { defaultPreferences, Preferences } from '../components/PreferencesDialog';

const { ipcRenderer } = window.require('electron');

interface Config {
  lastFile: string | null;
  preferences: Preferences;
}

// horrible mixed bag of user preferences and file handling
export class FileStore {
  private configFile: string;
  private tempFile: string;
  private config: Config;

  constructor() { }

  async init(): Promise<void> {
    const userDataPath = await ipcRenderer
      .invoke('electron.app.getPath', 'userData');
    this.configFile = await ipcRenderer
      .invoke('path.join', userDataPath, 'config.json');
    this.tempFile = await ipcRenderer
      .invoke('path.join', userDataPath, 'scratch-file.txt');

    await ipcRenderer.invoke('fs.mkdirPSync', userDataPath);

    await ipcRenderer.invoke('fs.touch', this.tempFile);
    await ipcRenderer.invoke('fs.touch', this.configFile);

    this.config = await parseDataFile(this.configFile);

    const lastFileExists = await ipcRenderer
      .invoke('fs', 'existsSync', [this.config.lastFile]);

    if (!lastFileExists) {
      this.config.lastFile = null;
      await this.storeConfig();
    }
  }

  public getLastFile(): string | null {
    return this.config.lastFile || this.tempFile;
  }

  public async getLastFileContent(): Promise<string> {
    const contents = await ipcRenderer
      .invoke('fs', 'readFileSync', [this.getLastFile()]);

    return String.fromCharCode.apply(null, contents);
  }

  public isTempFile(): boolean {
    return this.config.lastFile === null;
  }

  public async save(content: string): Promise<void> {
    if (this.isTempFile()) {
      await ipcRenderer.invoke('fs', 'writeFileSync', [this.tempFile, content]);
    } else {
      await ipcRenderer.invoke('fs', 'writeFileSync', [this.getLastFile(), content]);
    }
  }

  public async open(file: string): Promise<string> {
    const contents = String.fromCharCode.apply(
      null,
      await ipcRenderer
        .invoke('fs', 'readFileSync', [file]));

    this.setLastFile(file);
    return contents;
  }

  public newFile(): void {
    this.setLastFile(null);
    this.save('');
  }

  public async saveFile(file: string, contents: string): Promise<void> {
    await ipcRenderer
      .invoke('fs', 'writeFileSync', [file, contents]);
    this.setLastFile(file);
  }

  public preferences(): Preferences {
    return this.config.preferences;
  }

  public async savePreferences(preferences: Preferences): Promise<void> {
    this.config.preferences = preferences;
    await this.storeConfig();
  }

  public async readExternalFunctionsFile(): Promise<string> {
    const contents = await ipcRenderer
      .invoke('fs.readExternalFunctionsFile', []);

    return String.fromCharCode.apply(null, contents);
  }

  private async setLastFile(lastFile: string | null): Promise<void> {
    this.config.lastFile = lastFile;
    await this.storeConfig();
  }

  private async storeConfig(): Promise<void> {
    await ipcRenderer.invoke(
      'fs', 'writeFileSync',
      [this.configFile, JSON.stringify(this.config)]);
  }
}

const defaults: Config = {
  lastFile: null,
  preferences: defaultPreferences,
};

async function parseDataFile(filePath: string): Promise<Config> {
  try {
    const dataFileContents = String.fromCharCode.apply(
      null,
      await ipcRenderer
        .invoke('fs', 'readFileSync', [filePath]));
    const stored = JSON.parse(dataFileContents);
    return {
      ...defaults,
      ...stored,
      preferences: {
        ...defaults.preferences,
        ...stored.preferences,
      }
    } as Config;
  } catch {
    return defaults;
  }
}

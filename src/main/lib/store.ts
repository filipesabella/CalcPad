import { configDir, join } from '@tauri-apps/api/path';
import {
  exists,
  mkdir,
  readTextFile,
  writeTextFile,
} from '@tauri-apps/plugin-fs';
import { defaultPreferences, Preferences } from '../components/PreferencesDialog';

interface Config {
  lastFile: string | null;
  preferences: Preferences;
}

// horrible mixed bag of user preferences and file handling
export class FileStore {
  private configFile: string;
  private tempFile: string;
  private functionsFile: string;
  private config: Config;

  constructor() { }

  async init(): Promise<void> {
    // same directory electron used, so existing data carries over
    const userDataPath = await join(await configDir(), 'CalcPad');
    this.configFile = await join(userDataPath, 'config.json');
    this.tempFile = await join(userDataPath, 'scratch-file.txt');
    this.functionsFile = await join(userDataPath, 'calcpad-function.js');

    await mkdir(userDataPath, { recursive: true });

    await touch(this.tempFile);
    await touch(this.configFile);

    this.config = await parseDataFile(this.configFile);

    const lastFileExists = this.config.lastFile !== null
      && await exists(this.config.lastFile).catch(() => false);

    if (!lastFileExists) {
      this.config.lastFile = null;
      await this.storeConfig();
    }
  }

  public getLastFile(): string {
    return this.config.lastFile || this.tempFile;
  }

  public async getLastFileContent(): Promise<string> {
    return readTextFile(this.getLastFile());
  }

  public isTempFile(): boolean {
    return this.config.lastFile === null;
  }

  public async save(content: string): Promise<void> {
    await writeTextFile(this.getLastFile(), content);
  }

  public async open(file: string): Promise<string> {
    const contents = await readTextFile(file);
    this.setLastFile(file);
    return contents;
  }

  public newFile(): void {
    this.setLastFile(null);
    this.save('');
  }

  public async saveFile(file: string, contents: string): Promise<void> {
    await writeTextFile(file, contents);
    this.setLastFile(file);
  }

  public preferences(): Preferences {
    return this.config.preferences;
  }

  public async savePreferences(preferences: Preferences): Promise<void> {
    this.config.preferences = preferences;
    await this.storeConfig();
  }

  public async externalFunctionsFile(): Promise<string> {
    await touch(this.functionsFile);
    return this.functionsFile;
  }

  public async readExternalFunctionsFile(): Promise<string> {
    return readTextFile(await this.externalFunctionsFile());
  }

  private async setLastFile(lastFile: string | null): Promise<void> {
    this.config.lastFile = lastFile;
    await this.storeConfig();
  }

  private async storeConfig(): Promise<void> {
    await writeTextFile(this.configFile, JSON.stringify(this.config));
  }
}

const defaults: Config = {
  lastFile: null,
  preferences: defaultPreferences,
};

async function touch(file: string): Promise<void> {
  if (!await exists(file)) {
    await writeTextFile(file, '');
  }
}

async function parseDataFile(filePath: string): Promise<Config> {
  try {
    const stored = JSON.parse(await readTextFile(filePath));
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

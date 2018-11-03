const electron = (window as any).require('electron');
const path = electron.remote.require('path');
const fs = electron.remote.require('fs');

interface Config {
  lastFile: string | null;
}

export class Store {
  private configFile: string;
  private tempFile: string;
  private config: Config;

  constructor() {
    const userDataPath = electron.remote.app.getPath('userData');
    this.configFile = path.join(userDataPath, 'config.json');
    this.tempFile = path.join(userDataPath, 'scratch-file.txt');

    try {
      fs.mkdirSync(userDataPath);
    } catch (e) {
      // directory already exists, ignore
    }

    // touch
    if (!fs.existsSync(this.tempFile)) {
      fs.closeSync(fs.openSync(this.tempFile, 'w'));
    }

    // touch
    if (!fs.existsSync(this.configFile)) {
      fs.closeSync(fs.openSync(this.configFile, 'w'));
    }

    this.config = parseDataFile(this.configFile);
  }

  public getLastFile(): string | null {
    return this.config.lastFile || this.tempFile;
  }

  public getLastFileContent(): string {
    return fs.readFileSync(this.getLastFile()).toString();
  }

  public isTempFile(): boolean {
    return this.config.lastFile === null;
  }

  public save(content: string) {
    if (this.isTempFile()) {
      fs.writeFileSync(this.tempFile, content);
    } else {
      fs.writeFileSync(this.getLastFile(), content);
    }
  }

  public open(file: string): string {
    const contents = fs.readFileSync(file).toString();
    this.setLastFile(file);
    return contents;
  }

  public newFile(): void {
    this.setLastFile(null);
    this.save('');
  }

  public saveFile(file: string, contents: string): void {
    fs.writeFileSync(file, contents);
    this.setLastFile(file);
  }

  private setLastFile(lastFile: string | null): void {
    this.config.lastFile = lastFile;
    fs.writeFileSync(this.configFile, JSON.stringify(this.config));
  }
}

function parseDataFile(filePath: string): Config {
  try {
    return JSON.parse(fs.readFileSync(filePath)) as Config;
  } catch (_) {
    return {
      lastFile: null,
    };
  }
}

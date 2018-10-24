const electron = (window as any).require('electron');
const path = electron.remote.require('path');
const fs = electron.remote.require('fs');

interface Data {
  lastFile: string | null;
}

export class Store {
  private path: string;
  private data: Data;
  private tempFile: string;

  constructor() {
    const userDataPath = electron.remote.app.getPath('userData');
    this.path = path.join(userDataPath, 'config.json');
    this.tempFile = path.join(userDataPath, 'scratch-file.txt');
    this.data = parseDataFile(this.path);
  }

  public getLastFile(): string | null {
    return this.data.lastFile || this.tempFile;
  }

  public getLastFileContent(): string {
    return fs.readFileSync(this.getLastFile()).toString();
  }

  public setLastFile(lastFile: string | null): void {
    this.data.lastFile = lastFile;
    this.store();
  }

  public isTempFile(): boolean {
    return this.data.lastFile === null;
  }

  public save(content: string) {
    if (this.isTempFile()) {
      fs.writeFileSync(this.tempFile, content);
    } else {
      fs.writeFileSync(this.getLastFile(), content);
    }
  }

  private store(): void {
    fs.writeFileSync(this.path, JSON.stringify(this.data));
  }
}

function parseDataFile(filePath: string): Data {
  try {
    return JSON.parse(fs.readFileSync(filePath)) as Data;
  } catch (error) {
    return {
      lastFile: null,
    };
  }
}

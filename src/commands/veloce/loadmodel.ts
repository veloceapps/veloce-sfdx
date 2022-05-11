import * as os from 'os';
import * as path from 'path';
import { readFileSync } from 'fs';
import { default as axios } from 'axios';
import { flags, SfdxCommand } from '@salesforce/command';
import { Messages } from '@salesforce/core';
import { AnyJson } from '@salesforce/ts-types';
import {
  LegacyUiDefinition,
  UiDef,
  UiDefinition,
  UiElement,
  UiMetadata
} from '../../shared/types/ui.types';
import { getDirectoryNames, readFileSafe } from '../../shared/utils/common.utils';
import { extractElementMetadata, toBase64 } from '../../shared/utils/ui.utils';

// Initialize Messages with the current plugin directory
Messages.importMessagesDirectory(__dirname);

// Load the specific messages for this file. Messages from @salesforce/command, @salesforce/core,
// or any library that is using the messages framework can also be loaded this way.
const messages = Messages.loadMessages('veloce-sfdx', 'loadmodel');

export default class Org extends SfdxCommand {
  public static description = messages.getMessage('commandDescription');

  public static examples = [
    `$ sfdx veloce:loadmodel -n CPQ
  Model CPQ Successfully Loaded!
  `,
    `$ sfdx veloce:loadmodel --name CPQ
  Model CPQ Successfully Loaded!
  `
  ];

  public static args = [];

  protected static flagsConfig = {
    // flag with a value (-n, --name=VALUE)
    name: flags.string({
      char: 'n',
      description: messages.getMessage('nameFlagDescription'),
      required: false
    })
  };

  // Comment this out if your command does not require an org username
  protected static requiresUsername = true;

  // Comment this out if your command does not support a hub org username
  protected static supportsDevhubUsername = true;

  // Set this to true if your command requires a project workspace; 'requiresProject' is false by default
  protected static requiresProject = false;

  public async run(): Promise<AnyJson> {
    const name: string = this.flags.name;

    const homedir = os.homedir();
    const debugSessionFile = path.join(homedir, '.veloce-sfdx/debug.session');
    let debugSession: { [key: string]: any };
    try {
      debugSession = JSON.parse(readFileSync(debugSessionFile).toString());
    } catch (e) {
      this.ux.log('No active debug session found, please start debug session using veloce:debug');
      return {};
    }

    const headers = {
      'dev-token': debugSession.token,
      'Content-Type': 'application/json'
    };
    const backendUrl: string | undefined = debugSession.backendUrl;

    // load PML
    const pml = readFileSync(`models/${name}.pml`).toString();
    try {
      await axios.post(`${backendUrl}/services/dev-override/model/${name}/pml`, pml, {
        headers
      });
    } catch ({ data }) {
      this.ux.log(`Failed to save PML: ${data as string}`);
      return {};
    }
    this.ux.log('PML Successfully Loaded!');

    // load UI
    const dir = `models/${name}`;
    const uiDefs: UiDef[] = [...this.packUiDefinitions(dir), ...this.packLegacyUiDefinitions(dir)];
    try {
      await axios.post(`${backendUrl}/services/dev-override/model/${name}/ui`, JSON.stringify(uiDefs), { headers });
    } catch ({ data }) {
      this.ux.log(`Failed to save PML: ${data as string}`);
      return {};
    }
    this.ux.log('UI Successfully Loaded!');

    // Return an object to be displayed with --json
    return { model: pml, ui: JSON.stringify(uiDefs) };
  }

  private packUiDefinitions(dir: string): UiDefinition[] {
    const folders = getDirectoryNames(dir);

    const uiDefinitions: UiDefinition[] = folders.reduce((acc, folder) => {
      const uiDir = `${dir}/${folder}`;
      const metadataString = readFileSafe(`${uiDir}/metadata.json`);

      if (!metadataString) {
        return acc;
      }

      const metadata: UiMetadata = JSON.parse(metadataString);
      const { children, ...rest } = metadata;

      const uiDefinition: UiDefinition = {
        ...rest,
        children: children.map(childName => this.packUiElement(`${uiDir}/${childName}`))
      };

      return [...acc, uiDefinition];
    }, [] as UiDefinition[]);

    return uiDefinitions;
  }

  private packUiElement(dir: string): UiElement {
    const script = readFileSafe(`${dir}/script.ts`);
    const metadata = extractElementMetadata(script);

    const element: UiElement = {
      script: toBase64(script),
      children: metadata.children.map(childName => this.packUiElement(`${dir}/${childName}`))
    };

    const styles = readFileSafe(`${dir}/styles.css`);
    if (styles) {
      element.styles = toBase64(styles);
    }

    const template = readFileSafe(`${dir}/template.html`);
    if (template) {
      element.template = toBase64(template);
    }

    return element;
  }

  private packLegacyUiDefinitions(dir: string): LegacyUiDefinition[] {
    const metadataString = readFileSync(`${dir}/metadata.json`, 'utf-8');

    if (!metadataString) {
      return [];
    }

    const legacyDefinitions: LegacyUiDefinition[] = JSON.parse(metadataString);

    for (const ui of legacyDefinitions) {
      for (const section of ui.sections) {
        if (section.templateUrl) {
          const p = `models/${section.templateUrl.trim()}`;
          this.assertPath(p);
          const b = readFileSync(p);
          const base64 = b.toString('base64');
          section.template = base64;
          delete section.templateUrl;
        }
        if (section.scriptUrl) {
          const p = `models/${section.scriptUrl.trim()}`;
          this.assertPath(p);
          const b = readFileSync(p);
          const base64 = b.toString('base64');
          section.script = base64;
          delete section.scriptUrl;
        }
        if (section.stylesUrl) {
          const p = `models/${section.stylesUrl.trim()}`;
          this.assertPath(p);
          const b = readFileSync(p);
          const base64 = b.toString('base64');
          section.styles = base64;
          delete section.stylesUrl;
        }
        if (section.propertiesUrl) {
          const p = `models/${section.propertiesUrl.trim()}`;
          this.assertPath(p);
          section.properties = this.parseJsonFile(p);
          delete section.propertiesUrl;
        }
      }
    }

    return legacyDefinitions;
  }

  private assertPath(p: string): void {
    for (const part of p.split('/')) {
      if (part.startsWith(' ') || part.endsWith(' ') || part.startsWith('\t') || part.endsWith('\t')) {
        this.ux.log(`Path has leading trailing/leading spaces, please remove and rename folder: ${p}`);
        process.exit(255);
      }
    }
  }

  private parseJsonFile(p: string): any {
    try {
      const b = readFileSync(p).toString();
      return JSON.parse(b);
    } catch (e) {
      this.ux.log('Failed to read/parse JSON file ', e);
      process.exit(255);
    }
  }
}

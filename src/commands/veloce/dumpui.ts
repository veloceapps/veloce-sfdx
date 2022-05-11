import { existsSync, mkdirSync } from 'fs';
import { gunzipSync } from 'zlib';
import { flags, SfdxCommand } from '@salesforce/command';
import { Messages, SfdxError } from '@salesforce/core';
import { AnyJson } from '@salesforce/ts-types';
import {
  LegacySection,
  LegacyUiDefinition,
  UiDef,
  UiDefinition,
  UiElement, UiMetadata
} from '../../shared/types/ui.types';
import { writeFileSafe } from '../../shared/utils/common.utils';
import { extractElementMetadata, fromBase64, isLegacyDefinition } from '../../shared/utils/ui.utils';

// Initialize Messages with the current plugin directory
Messages.importMessagesDirectory(__dirname);

// Load the specific messages for this file. Messages from @salesforce/command, @salesforce/core,
// or any library that is using the messages framework can also be loaded this way.
const messages = Messages.loadMessages('veloce-sfdx', 'dumpui');

export default class Org extends SfdxCommand {
  public static description = messages.getMessage('commandDescription');

  public static examples = ['$ sfdx veloce:dumpui -n ProductModelName -u username -o models/myui'];

  public static args = [{ name: 'file' }];

  protected static flagsConfig = {
    name: flags.string({
      char: 'n',
      description: messages.getMessage('nameFlagDescription'),
      required: true
    }),
    outputdir: flags.string({
      char: 'o',
      description: messages.getMessage('outputpathFlagDescription'),
      required: true
    })
  };

  // Comment this out if your command does not require an org username
  protected static requiresUsername = true;

  // Comment this out if your command does not support a hub org username
  protected static supportsDevhubUsername = true;

  // Set this to true if your command requires a project workspace; 'requiresProject' is false by default
  protected static requiresProject = false;

  public async run(): Promise<AnyJson> {
    const modelName: string = this.flags.name;
    const documentId = await this.getDocumentId(modelName);
    const uiDefs = await this.fetchUiDefinitions(documentId);
    const path = this.flags.outputdir as string;

    // legacy ui definitions metadata is stored in global metadata.json as array
    const legacyMetadataArray: LegacyUiDefinition[] = [];

    uiDefs.forEach(ui => {
      const uiDir = `${path}/${ui.name}`;

      if (isLegacyDefinition(ui)) {
        this.saveLegacyUiDefinition(ui, uiDir, legacyMetadataArray);
      } else {
        this.saveUiDefinition(ui, uiDir);
      }
    });

    if (legacyMetadataArray.length) {
      writeFileSafe(path, 'metadata.json', JSON.stringify(legacyMetadataArray, null, 2));
    }

    // Return an object to be displayed with --json
    return {};
  }

  private async getDocumentId(modelName: string): Promise<string | undefined> {
    const conn = this.org.getConnection();
    const query = `Select VELOCPQ__UiDefinitionsId__c from VELOCPQ__ProductModel__c WHERE Name='${modelName}'`;

    const result = await conn.query<{ 'VELOCPQ__UiDefinitionsId__c': string }>(query);
    const [record] = result?.records ?? [];

    if (!record) {
      throw new SfdxError(`Product Model not found: ${modelName}`);
    }

    return record.VELOCPQ__UiDefinitionsId__c;
  }

  private async fetchUiDefinitions(documentId: string): Promise<UiDef[]> {
    const conn = this.org.getConnection();
    const query = `Select Body from Document WHERE Id='${documentId}'`;

    // get attachment url
    const result = await conn.query<{ Body: string }>(query);

    const [record] = result?.records ?? [];
    if (!record) {
      throw new SfdxError('Document not found');
    }

    const url = record.Body;

    // get attachment content
    const res = await conn.request({ url });
    const gzipped = Buffer.from(res.toString(), 'base64');
    const data = gunzipSync(gzipped).toString();

    // parse the content
    try {
      return JSON.parse(data) as UiDef[];
    } catch (err) {
      this.ux.log(`Failed to parse document content: ${documentId} will create new file at the end`);
      return [];
    }
  }

  private saveLegacyUiDefinition(ui: LegacyUiDefinition, path: string, metadataArray: LegacyUiDefinition[]): void {
    const legacyMetadata: LegacyUiDefinition = { ...ui, sections: [] };

    ui.tabs.forEach(tab => {
      const tabPath = `${path}/${tab.name}`;
      const tabSections = ui.sections.filter(section => section.page === tab.id);

      this.saveLegacySections(tabSections, tabPath, legacyMetadata);
    });

    metadataArray.push(legacyMetadata);
  }

  private saveLegacySections(
    sections: LegacySection[],
    path: string,
    metadata: LegacyUiDefinition,
    parentId?: string
  ): void {
    const firstChildren = sections.filter(s => s.parentId === parentId);

    firstChildren.forEach(c => {
      const childPath = `${path}/${c.label}`;

      // save files
      this.saveLegacySectionFiles(c, childPath, metadata);

      // save grandchildren
      this.saveLegacySections(sections, childPath, metadata, c.id);
    });
  }

  private saveLegacySectionFiles(section: LegacySection, dir: string, metadata: LegacyUiDefinition): void {
    const sectionMeta = { ...section };

    if (section.script) {
      const fileName = `${section.label}.js`;
      writeFileSafe(dir, fileName, fromBase64(section.script));
      delete sectionMeta.script;
      sectionMeta.scriptUrl = `${dir}/${fileName}`;
    }
    if (section.styles) {
      const fileName = `${section.label}.css`;
      writeFileSafe(dir, fileName, fromBase64(section.styles));
      delete sectionMeta.styles;
      sectionMeta.scriptUrl = `${dir}/${fileName}`;
    }
    if (section.template) {
      const fileName = `${section.label}.html`;
      writeFileSafe(dir, fileName, fromBase64(section.template));
      delete sectionMeta.template;
      sectionMeta.templateUrl = `${dir}/${fileName}`;
    }
    if (section.properties) {
      const fileName = `${section.label}.json`;
      writeFileSafe(dir, fileName, JSON.stringify(section.properties, null, 2));
      delete sectionMeta.properties;
      sectionMeta.propertiesUrl = `${dir}/${fileName}`;
    }

    metadata.sections.push(sectionMeta);
  }

  private saveUiDefinition(ui: UiDefinition, path: string): void {
    const { children, ...rest } = ui;

    // save elements recursively
    const childrenNames = children.reduce((acc, child) => {
      return [...acc, this.saveElement(child, path)];
    }, [] as string[]);

    // create UI Definition metadata
    const metadata: UiMetadata = {
      ...rest,
      children: childrenNames
    };
    writeFileSafe(path, 'metadata.json', JSON.stringify(metadata, null, 2) + '\n');
  }

  private saveElement(el: UiElement, path: string): string {
    // name is located in the Angular decorator which is the part of the element script
    const script = el.script && fromBase64(el.script);
    const elName = extractElementMetadata(script).name;
    const elDir = `${path}/${elName}`;

    if (!existsSync(elDir)) {
      mkdirSync(elDir, { recursive: true });
    }

    if (script) {
      writeFileSafe(elDir, 'script.ts', script);
    }
    if (el.styles) {
      writeFileSafe(elDir, 'styles.css', fromBase64(el.styles));
    }
    if (el.template) {
      writeFileSafe(elDir, 'template.html', fromBase64(el.template));
    }

    el.children.forEach(c => this.saveElement(c, elDir));

    return elName;
  }
}

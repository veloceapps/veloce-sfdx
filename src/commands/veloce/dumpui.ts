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
  UiElement,
  UiElementMetadata
} from '../../shared/types/ui.types';
import { fromBase64, isLegacyDefinition } from '../../shared/utils/ui.utils';
import { readIdMap, reverseId, writeFileSafe } from '../../shared/utils/common.utils';
import { IdMap } from '../../shared/types/common.types';

// Initialize Messages with the current plugin directory
Messages.importMessagesDirectory(__dirname);

// Load the specific messages for this file. Messages from @salesforce/command, @salesforce/core,
// or any library that is using the messages framework can also be loaded this way.
const messages = Messages.loadMessages('veloce-sfdx', 'dumpui');

const METADATA_DECORATOR_REGEX = /@ElementDefinition\(([\s\S]+)\)(\n|.)*export class/g;

export default class Org extends SfdxCommand {
  public static description = messages.getMessage('commandDescription');

  public static examples = [
    '$ sfdx veloce:dumpui -i 00Dxx000000001234 -u username -o models/myui',
    '$ sfdx veloce:dumpui -i 00Dxx000000001234 -u username -o models/myui --idmap=./org-idmap.json '
  ];

  public static args = [{ name: 'file' }];

  protected static flagsConfig = {
    id: flags.string({
      char: 'i',
      description: messages.getMessage('idFlagDescription'),
      required: true
    }),
    idmap: flags.string({ char: 'I', description: messages.getMessage('idmapFlagDescription'), required: false }),
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
    const idmapPath: string | undefined = this.flags.idmap;
    const idmap = idmapPath ? readIdMap(idmapPath, this.ux) : {};

    // ProductModelId reverse mapping
    const id = reverseId(this.flags.id as string, idmap);

    const documentId = await this.getDocumentId(id);
    const uiDefs = await this.fetchUiDefinitions(documentId);
    const path = this.flags.outputdir as string;

    // legacy ui definitions metadata is stored in global metadata.json as array
    const legacyMetadataArray: LegacyUiDefinition[] = [];

    uiDefs.forEach(ui => {
      const uiDir = `${path}/${ui.name}`;

      if (isLegacyDefinition(ui)) {
        this.saveLegacyUiDefinition(ui, uiDir, legacyMetadataArray, idmap);
      } else {
        this.saveUiDefinition(ui, uiDir, idmap);
      }
    });

    if (legacyMetadataArray.length) {
      writeFileSafe(path, 'metadata.json', JSON.stringify(legacyMetadataArray, null, 2));
    }

    // Return an object to be displayed with --json
    return {};
  }

  private async getDocumentId(id: string): Promise<string | undefined> {
    const conn = this.org.getConnection();
    const query = `Select VELOCPQ__UiDefinitionsId__c from VELOCPQ__ProductModel__c WHERE Id='${id}'`;

    const result = await conn.query<{ 'VELOCPQ__UiDefinitionsId__c': string }>(query);
    const [record] = result?.records ?? [];

    if (!record) {
      throw new SfdxError('Product Model not found');
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

  private saveLegacyUiDefinition(
    ui: LegacyUiDefinition,
    path: string,
    metadataArray: LegacyUiDefinition[],
    idmap: IdMap
  ): void {
    // priceListId reverse mapping
    const priceList = ui.priceList ? reverseId(ui.priceList, idmap) : undefined;
    const legacyMetadata: LegacyUiDefinition = { ...ui, priceList, sections: [] };

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
      writeFileSafe(dir, fileName, fromBase64(JSON.stringify(section.properties, null, 2)));
      delete sectionMeta.properties;
      sectionMeta.propertiesUrl = `${dir}/${fileName}`;
    }

    metadata.sections.push(sectionMeta);
  }

  private saveUiDefinition(ui: UiDefinition, path: string, idmap: IdMap): void {
    const { children, ...rest } = ui;

    // priceListId reverse mapping
    const priceList = ui.properties?.priceList ? reverseId(ui.properties.priceList, idmap) : undefined;

    // create UI Definition metadata
    const metadata: Omit<UiDefinition, 'children'> = {
      ...rest,
      properties: {
        ...ui.properties,
        priceList
      }
    };
    writeFileSafe(path, 'metadata.json', JSON.stringify(metadata) + '\n');

    // save elements recursively
    children.forEach(el => this.saveElement(el, path));
  }

  private saveElement(el: UiElement, path: string): void {
    const elName = this.getElementName(el);
    const elDir = `${path}/${elName}`;

    if (!existsSync(elDir)) {
      mkdirSync(elDir, { recursive: true });
    }

    if (el.script) {
      writeFileSafe(elDir, 'script.ts', fromBase64(el.script));
    }
    if (el.styles) {
      writeFileSafe(elDir, 'styles.css', fromBase64(el.styles));
    }
    if (el.template) {
      writeFileSafe(elDir, 'template.html', fromBase64(el.template));
    }

    el.children.forEach(c => this.saveElement(c, elDir));
  }

  private getElementName(el: UiElement): string | undefined {
    // name is located in the Angular decorator which is the part of the element script
    const script = el.script && fromBase64(el.script);

    const metadataString = (METADATA_DECORATOR_REGEX.exec(script) ?? [])[1];

    // need to reset regex last index to prevent null result for next execution
    METADATA_DECORATOR_REGEX.lastIndex = 0;

    const metadata = eval(`(${metadataString})`) as UiElementMetadata;
    return metadata?.name;
  }
}

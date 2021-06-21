import {flags, SfdxCommand} from '@salesforce/command';
import {Messages} from '@salesforce/core';
import {AnyJson} from '@salesforce/ts-types';
/* tslint:disable */
const fs = require('fs');
/* tslint:enable */

// Initialize Messages with the current plugin directory
Messages.importMessagesDirectory(__dirname);

// Load the specific messages for this file. Messages from @salesforce/command, @salesforce/core,
// or any library that is using the messages framework can also be loaded this way.
const messages = Messages.loadMessages('veloce-sfdx', 'loadcontentdoc');

export default class Org extends SfdxCommand {

  public static description = messages.getMessage('commandDescription');

  public static examples = [
    `$ sfdx veloce:loadcontentdoc -i 01521000000gHgnAAE --targetusername myOrg@example.com --targetdevhubusername devhub@org.com
  Document content here
  `,
    `$ sfdx veloce:loadcontentdoc -i 01521000000gHgnAAE --name myname --targetusername myOrg@example.com
  Document content here
  `
  ];

  public static args = [{name: 'file'}];

  protected static flagsConfig = {
    // flag with a value (-n, --name=VALUE)
    idmap: flags.string({char: 'I', description: messages.getMessage('idmapFlagDescription'), required: true}),
    id: flags.string({
      char: 'i',
      description: messages.getMessage('idFlagDescription'),
      required: true
    }),
    name: flags.string({
      char: 'n',
      description: messages.getMessage('nameFlagDescription'),
      required: true
    }),
    description: flags.string({
      char: 'd',
      description: messages.getMessage('descriptionFlagDescription'),
      required: true
    }),
    inputfile: flags.string({
      char: 'f',
      description: messages.getMessage('inputfileFlagDescription'),
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
    let idmap;
    try {
      idmap = JSON.parse(fs.readFileSync(this.flags.idmap).toString());
    } catch (err) {
      this.ux.log(`Failed to load ID-Map file: ${this.flags.idmap} will create new file at the end`);
      idmap = {};
    }
    const id = idmap[this.flags.id] ? idmap[this.flags.id] : this.flags.id;

    const fdata = fs.readFileSync(`${this.flags.inputfile}`, {flag: 'r'});
    const b64Data = fdata.toString('base64');

    const conn = this.org.getConnection();

    // The type we are querying for
    interface ContentVersion {
      VersionData: string;
      ContentDocumentId: string|undefined;
      Title: string;
      PathOnClient: string;
      Description: string;
      SharingOption: string;
      SharingPrivacy: string;
    }
    interface ContentDocument {
      Id: string;
    }

    interface RestResult {
      id: string;
      success: boolean;
      errors: string[];
    }

    // Query the org
    const result = await conn.query<ContentDocument>(`Select Id from ContentDocument WHERE Id='${id}'`);

    if (!result.records || result.records.length <= 0) {
      // Document not found, insert new one.
      const data: ContentVersion = {
        VersionData: b64Data,
        ContentDocumentId: undefined,
        Title: this.flags.name,
        PathOnClient: this.flags.name,
        Description: this.flags.description,
        SharingOption: 'A',
        SharingPrivacy: 'N'
      };
      /* tslint:disable */
      const rr = await conn.request({
        url: `/services/data/v${conn.getApiVersion()}/sobjects/ContentVersion`,
        body: JSON.stringify(data),
        method: 'POST'
      } as any) as RestResult;
      if (!rr.success) {
        this.ux.log(`Failed to upload content version, error: ${rr.errors.join(',')}`)
        process.exit(255)
      }

      const r = await conn.query<ContentVersion>(`Select ContentDocumentId from ContentVersion WHERE IsLatest = true AND Id='${rr.id}'`);
      if (!r.records || r.records.length <= 0) {
        this.ux.log(`Failed to query newly created content record, no results`)
        process.exit(255)
      }

      // Store new ID in idmap
      if (this.flags.id !== r.records[0].ContentDocumentId) {
        this.ux.log(`${this.flags.id} => ${r.records[0].ContentDocumentId}`)
        idmap[this.flags.id] = r.records[0].ContentDocumentId;
      }
    } else {
      // Document found, only upload new ContentVersion
      const docId = result.records[0].Id;

      const query = `Select VersionData from ContentVersion WHERE IsLatest = true AND ContentDocumentId='${docId}'`;
      const qr = await conn.query<ContentVersion>(query);
      const url = qr.records[0].VersionData;
      const res = ((await conn.request({ url, encoding: null } as any)) as unknown) as Buffer;

      if (res.compare(fdata) == 0) {
        this.ux.log(`Identical document is already uploaded: ${docId}, skipping creation of new ContentVersion!`);
        return 0;
      }
      this.ux.log(`Patching existing document ${this.flags.name} with id ${docId}`);

      const data: ContentVersion = {
        VersionData: b64Data,
        ContentDocumentId: docId,
        Title: this.flags.name,
        PathOnClient: this.flags.name,
        Description: this.flags.description,
        SharingOption: 'A',
        SharingPrivacy: 'N'
      };
      /* tslint:disable */
      const r = await conn.request({
        url: `/services/data/v${conn.getApiVersion()}/sobjects/ContentVersion`,
        body: JSON.stringify(data),
        method: 'POST'
      } as any) as RestResult;
      if (!r.success) {
        this.ux.log(`Upload of content version failed: ${r.errors.join(',')}`)
        process.exit(255)
      }
    }

    fs.writeFileSync(this.flags.idmap, JSON.stringify(idmap, null, 2), {flag: 'w+'});
    this.ux.log(`Successfully loaded from ${this.flags.inputfile}`);
    // Return an object to be displayed with --json
    return {orgId: this.org.getOrgId()};
  }
}

import { flags, SfdxCommand } from '@salesforce/command';
import { Messages } from '@salesforce/core';
import { AnyJson } from '@salesforce/ts-types';
/* tslint:disable */
const fs = require('fs');
const zlib = require("zlib");
/* tslint:enable */

// Initialize Messages with the current plugin directory
Messages.importMessagesDirectory(__dirname);

// Load the specific messages for this file. Messages from @salesforce/command, @salesforce/core,
// or any library that is using the messages framework can also be loaded this way.
const messages = Messages.loadMessages('veloce-sfdx', 'loaddoc');

export default class Org extends SfdxCommand {

  public static description = messages.getMessage('commandDescription');

  public static examples = [
  `$ sfdx veloce:loaddoc -i 01521000000gHgnAAE --targetusername myOrg@example.com --targetdevhubusername devhub@org.com
  Document content here
  `,
  `$ sfdx veloce:loaddoc -i 01521000000gHgnAAE --name myname --targetusername myOrg@example.com
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

    // this.org is guaranteed because requiresUsername=true, as opposed to supportsUsername
    const data = fs.readFileSync(`${this.flags.inputfile}`, {flag: 'r'});
    const gzipped = zlib.gzipSync(data);
    const b64Data = gzipped.toString('base64');

    const conn = this.org.getConnection();
    const query = `Select Body from Document WHERE Id='${id}'`;
    // The type we are querying for
    interface Document {
      Body: string;
    }
    interface CreateResult {
      id: string;
      success: boolean;
      errors: string[];
      name: string;
      message: string;
    }
    // Query the org
    const result = await conn.query<Document>(query);

    // Organization will always return one result, but this is an example of throwing an error
    // The output and --json will automatically be handled for you.
    if (!result.records || result.records.length <= 0) {
      // Document not found, insert new one.
    } else {
      // Document found, only upload new file!
      const uploadUrl = result.records[0].Body;
      this.ux.log(uploadUrl);
    }

    const formData = {
      entity_content: {
        value: '',
        options: {
          contentType: 'application/json'
        }
      },
      Body: b64Data
    };
    /* tslint:disable */
    const response = ((await conn.request({
      url: `/services/data/v${conn.getApiVersion()}/sobjects/Document`,
      formData,
      method: 'POST'
    } as any)) as unknown) as CreateResult;
    /* tslint:enable */

    this.ux.log(response.toString());
    this.ux.log(`Successfully loaded from ${this.flags.inputfile}`);
    // Return an object to be displayed with --json
    return {orgId: this.org.getOrgId()};
  }
}

import { brotliDecompressSync, gunzipSync } from 'zlib';
import { flags, SfdxCommand } from '@salesforce/command'
import { Messages, SfdxError } from '@salesforce/core'
import { AnyJson } from '@salesforce/ts-types'
/* tslint:disable */
const fs = require('fs');
/* tslint:enable */

// Initialize Messages with the current plugin directory
Messages.importMessagesDirectory(__dirname)

// Load the specific messages for this file. Messages from @salesforce/command, @salesforce/core,
// or any library that is using the messages framework can also be loaded this way.
const messages = Messages.loadMessages('veloce-sfdx', 'dumpdoc')

type compressionMethod = 'gzip' | 'brotli' | 'base64' | 'none';

export default class Org extends SfdxCommand {

  public static description = messages.getMessage('commandDescription')

  public static examples = [
    `$ sfdx veloce:dumpdoc -i 01521000000gHgnAAE -o file.pml --targetusername myOrg@example.com --targetdevhubusername devhub@org.com
  `,
    `$ sfdx veloce:dumpdoc -i 01521000000gHgnAAE -o file.pml --name myname --targetusername myOrg@example.com
  `
  ]

  public static args = [{name: 'file'}]

  protected static flagsConfig = {
    // flag with a value (-n, --name=VALUE)
    id: flags.string({
      char: 'i',
      description: messages.getMessage('idFlagDescription'),
      required: true
    }),
    outputfile: flags.string({
      char: 'o',
      description: messages.getMessage('outputfileFlagDescription'),
      required: true
    }),
    compression: flags.string({
      char: 'c',
      description: messages.getMessage('compressionFlagDescription'),
      required: false,
    })
  }

  // Comment this out if your command does not require an org username
  protected static requiresUsername = true

  // Comment this out if your command does not support a hub org username
  protected static supportsDevhubUsername = true

  // Set this to true if your command requires a project workspace; 'requiresProject' is false by default
  protected static requiresProject = false

  public async run(): Promise<AnyJson> {
    // this.org is guaranteed because requiresUsername=true, as opposed to supportsUsername
    const conn = this.org.getConnection()
    const query = `Select Body from Document WHERE Id='${this.flags.id}'`
    // The type we are querying for
    interface Document {
      Body: string
    }
    // Query the org
    const result = await conn.query<Document>(query)

    // Organization will always return one result, but this is an example of throwing an error
    // The output and --json will automatically be handled for you.
    if (!result.records || result.records.length <= 0) {
      throw new SfdxError('Document not found')
    }
    // Document body always only returns one result
    const url = result.records[0].Body
    /* tslint:disable */
    const res = ((await conn.request({ url, encoding: null } as any)) as unknown) as Buffer;
    /* tslint:enable */

    const data = await decompressResult(res, this.flags.compression);
    fs.writeFileSync(`${this.flags.outputfile}`, data, {flag: 'w+'})

    this.ux.log(`Successfully saved into ${this.flags.outputfile}`)
    // Return an object to be displayed with --json
    return {orgId: this.org.getOrgId()}
  }
}

async function decompressResult(res: Buffer, method: compressionMethod | undefined): Promise<Buffer | string | undefined> {
  const base64Data = Buffer.from(res.toString(), 'base64');

  switch (method) {
    case 'gzip':
      return gunzipSync(base64Data).toString();
    case 'brotli':
      return brotliDecompressSync(base64Data).toString('utf8');
    case 'base64':
      return base64Data;
    case 'none':
      return res;
    default: {
      return new Promise(resolve => {
        try {
          if (checkSequence([0x1f, 0x8b], base64Data)) {
            // gzip compression method
            const result = gunzipSync(base64Data).toString()
            resolve(result);
          } else {
            // brotli compression method
            const result = brotliDecompressSync(base64Data).toString('utf8');
            resolve(result);
          }
        } catch (err) {
          resolve(res);
        }
      })
    }
  }
}

// https://stackoverflow.com/questions/71868696/check-if-file-is-compressed-browser-side
const checkSequence = (sequence: number[], bytes: Uint8Array): boolean => {
  if (sequence.length > bytes.length) {
    throw new Error(`bytes.size ${bytes.length} sequence.length ${sequence.length}`);
  }
  for (let index = 0; index < sequence.length; index++) {
    const byte = bytes[index];
    if (byte !== sequence[index]) {
      return false;
    }
  }
  return true;
};

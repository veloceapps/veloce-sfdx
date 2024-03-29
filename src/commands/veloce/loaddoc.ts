import {flags, SfdxCommand} from '@salesforce/command'
import {Messages, SfdxError} from '@salesforce/core'
import {AnyJson} from '@salesforce/ts-types'
/* tslint:disable */
const fs = require('fs');
const zlib = require("zlib");
/* tslint:enable */

// Initialize Messages with the current plugin directory
Messages.importMessagesDirectory(__dirname)

// Load the specific messages for this file. Messages from @salesforce/command, @salesforce/core,
// or any library that is using the messages framework can also be loaded this way.
const messages = Messages.loadMessages('veloce-sfdx', 'loaddoc')

export default class Org extends SfdxCommand {

  public static description = messages.getMessage('commandDescription')

  public static examples = [
    `$ sfdx veloce:loaddoc -i 01521000000gHgnAAE --targetusername myOrg@example.com --targetdevhubusername devhub@org.com
  Document content here
  `,
    `$ sfdx veloce:loaddoc -i 01521000000gHgnAAE --name myname --targetusername myOrg@example.com
  Document content here
  `
  ]

  public static args = [{name: 'file'}]

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
    foldername: flags.string({
      char: 'F',
      description: messages.getMessage('foldernameFlagDescription'),
      required: true
    }),
    inputfile: flags.string({
      char: 'f',
      description: messages.getMessage('inputfileFlagDescription'),
      required: true
    }),
    compression: flags.string({
      char: 'c',
      description: messages.getMessage('compressionFlagDescription'),
      required: false,
      default: 'gzip'
    })
  }

  // Comment this out if your command does not require an org username
  protected static requiresUsername = true

  // Comment this out if your command does not support a hub org username
  protected static supportsDevhubUsername = true

  // Set this to true if your command requires a project workspace; 'requiresProject' is false by default
  protected static requiresProject = false

  public async run(): Promise<AnyJson> {
    let idmap
    try {
      idmap = JSON.parse(fs.readFileSync(this.flags.idmap).toString())
    } catch (err) {
      this.ux.log(`Failed to load ID-Map file: ${this.flags.idmap} will create new file at the end`)
      idmap = {}
    }
    const id = idmap[this.flags.id] ? idmap[this.flags.id] : this.flags.id

    // this.org is guaranteed because requiresUsername=true, as opposed to supportsUsername
    const fdata = fs.readFileSync(`${this.flags.inputfile}`, {flag: 'r'})
    let data = fdata;
    if (this.flags.compression === 'gzip') {
      const gzipped = zlib.gzipSync(fdata);
      // Encode to base64 TWICE!, first time is requirement of POST/PATCH, and it will be decoded on reads automatically by SF.
      data = Buffer.from(gzipped.toString('base64'))
    }
    const b64Data = data.toString('base64')

    const conn = this.org.getConnection()

    // The type we are querying for
    interface Document {
      Id: string
      Body: string
      FolderId: string
    }

    interface Folder {
      Id: string
      Name: string
      DeveloperName: string
      AccessType: string
      Type: string
    }

    interface CreateResult {
      id: string
      success: boolean
      errors: string[]
      name: string
      message: string
    }
    // Query the org
    const result = await conn.query<Document>(`Select Id,Body,FolderId from Document WHERE Id='${id}'`)

    // Organization will always return one result, but this is an example of throwing an error
    // The output and --json will automatically be handled for you.
    let folderId
    if (!result.records || result.records.length <= 0) {
      // Document not found, insert new one.
      // Check if veloce folder exists:
      const folderName: string = this.flags.foldername;
      const folderResult = await conn.query<Folder>(`Select Id, Name, Type
                                                     from Folder
                                                     WHERE Name = '${folderName}'`)
      if (!folderResult.records || folderResult.records.length <= 0) {
        // Create new Folder
        const folder = {
          Name: this.flags.foldername,
          DeveloperName: this.flags.foldername,
          Type: 'Document',
          AccessType: 'Public'
        } as Folder
        const folderCreateResult = (await conn.sobject('Folder').create(folder)) as CreateResult
        if (folderCreateResult.success) {
          this.ux.log(`New folder created ${folderCreateResult.name} with id ${folderCreateResult.id}`)
        } else {
          throw new SfdxError(`Failed to create folder: ${JSON.stringify(folderCreateResult)}`)
        }
        folderId = folderCreateResult.id
      } else {
        folderId = folderResult.records[0].Id
        this.ux.log(`Use existing folder ${folderResult.records[0].Name} with id ${folderId}`)
      }

      const data = {
        body: b64Data,
        name: this.flags.name,
        folderId
      }
      /* tslint:disable */
      const response = ((await conn.request({
        url: `/services/data/v${conn.getApiVersion()}/sobjects/Document`,
        body: JSON.stringify(data),
        method: 'POST'
      } as any)) as unknown) as CreateResult;
      /* tslint:enable */
      if (response.success) {
        this.ux.log(`New Document ${this.flags.name} created with id ${response.id}`)
      } else {
        throw new SfdxError(`Failed to create document: ${JSON.stringify(response)}`)
      }
      // Store new ID in idmap
      if (this.flags.id !== response.id) {
        this.ux.log(`${this.flags.id} => ${response.id}`)
        idmap[this.flags.id] = response.id
      }
    } else {
      // Document found, only upload new file!
      folderId = result.records[0].FolderId
      const docId = result.records[0].Id
      this.ux.log(`Patching existing document ${this.flags.name} with id ${docId}`)

      const data = {
        body: b64Data,
        name: this.flags.name,
        folderId
      }
      /* tslint:disable */
      await conn.request({
        url: `/services/data/v${conn.getApiVersion()}/sobjects/Document/${docId}`,
        body: JSON.stringify(data),
        method: 'PATCH'
      } as any);
    }

    fs.writeFileSync(this.flags.idmap, JSON.stringify(idmap, null, 2), {flag: 'w+'});
    this.ux.log(`Successfully loaded from ${this.flags.inputfile}`);
    // Return an object to be displayed with --json
    return {orgId: this.org.getOrgId()};
  }
}

import { writeFileSync } from 'fs'
import { flags, SfdxCommand } from '@salesforce/command'
import { Messages } from '@salesforce/core'
import { AnyJson } from '@salesforce/ts-types'
import { readIdMap } from '../../shared/utils/common.utils'
import { UiDefinitionsBuilder } from '../../shared/utils/ui.utils'

// Initialize Messages with the current plugin directory
Messages.importMessagesDirectory(__dirname)

// Load the specific messages for this file. Messages from @salesforce/command, @salesforce/core,
// or any library that is using the messages framework can also be loaded this way.
const messages = Messages.loadMessages('veloce-sfdx', 'packui')

export default class Org extends SfdxCommand {
  public static description = messages.getMessage('commandDescription')

  public static examples = ['$ sfdx veloce:packui --inputdir . -n BOARDING --outputfile metadata_new.json']

  public static args = [{ name: 'file' }]

  protected static flagsConfig = {
    modelname: flags.string({ char: 'n', description: messages.getMessage('modelnameFlagDescription'), required: true }),
    pricelistid: flags.string({ char: 'P', description: messages.getMessage('pricelistidFlagDescription'), required: false }),
    inputdir: flags.string({ char: 'i', description: messages.getMessage('inputdirFlagDescription'), required: true }),
    outputfile: flags.string({ char: 'o', description: messages.getMessage('outputfileFlagDescription'), required: true }),
    idmap: flags.string({ char: 'I', description: messages.getMessage('idmapFlagDescription'), required: true })
  }

  // Comment this out if your command does not require an org username
  protected static requiresUsername = false

  // Comment this out if your command does not support a hub org username
  protected static supportsDevhubUsername = false

  // Set this to true if your command requires a project workspace; 'requiresProject' is false by default
  protected static requiresProject = false

  public run(): Promise<AnyJson> {
    const inputdir: string = this.flags.inputdir
    const modelname: string = this.flags.modelname
    const outputfile: string = this.flags.outputfile

    const idmap = readIdMap(this.flags.idmap, this.ux)

    const uiBuilder = new UiDefinitionsBuilder(inputdir, modelname, idmap, this.ux)
    const uiDefinitions = uiBuilder.pack()
    const normalized = uiBuilder.normalizePricelist(uiDefinitions, this.flags.pricelistid, true)

    const output = JSON.stringify(normalized, null, 2)
    writeFileSync(outputfile, output, 'utf-8')
    this.ux.log(`Data successfully packed into: ${outputfile}`)

    // Return an object to be displayed with --json
    return Promise.resolve({ inputdir, modelname, outputfile })
  }
}

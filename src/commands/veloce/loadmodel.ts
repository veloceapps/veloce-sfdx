import { readFileSync } from 'fs'
import * as os from 'os'
import * as path from 'path'
import { flags, SfdxCommand } from '@salesforce/command'
import { Messages } from '@salesforce/core'
import { AnyJson } from '@salesforce/ts-types'
import { default as axios } from 'axios'
import { UiDef } from '../../shared/types/ui.types'
import { UiDefinitionsBuilder } from '../../shared/utils/ui.utils'

// Initialize Messages with the current plugin directory
Messages.importMessagesDirectory(__dirname)

// Load the specific messages for this file. Messages from @salesforce/command, @salesforce/core,
// or any library that is using the messages framework can also be loaded this way.
const messages = Messages.loadMessages('veloce-sfdx', 'loadmodel')

export default class Org extends SfdxCommand {
  public static description = messages.getMessage('commandDescription')

  public static examples = [
    `$ sfdx veloce:loadmodel -n CPQ -i orgData/models`, 
    `$ sfdx veloce:loadmodel -n CPQ -i orgData/models -S`
  ]

  public static args = []

  protected static flagsConfig = {
    // flag with a value (-n, --name=VALUE)
    name: flags.string({
      char: 'n',
      default: '',
      description: messages.getMessage('nameFlagDescription'),
      required: true
    }),
    inputdir: flags.string({
      char: 'i',
      description: messages.getMessage('inputdirFlagDescription'),
      required: true
    }),
    skipui: flags.boolean({
      char: 'S',
      description: messages.getMessage('skipuiFlagDescription'),
      required: false
    })
  }

  // Comment this out if your command does not require an org username
  protected static requiresUsername = true

  // Comment this out if your command does not support a hub org username
  protected static supportsDevhubUsername = true

  // Set this to true if your command requires a project workspace; 'requiresProject' is false by default
  protected static requiresProject = false

  public async run(): Promise<AnyJson> {
    const name: string = this.flags.name
    const inputdir: string = this.flags.inputdir
    const skipui: boolean = this.flags.skipui

    const homedir = os.homedir()
    const debugSessionFile = path.join(homedir, '.veloce-sfdx/debug.session')
    let debugSession: { [key: string]: any }
    try {
      debugSession = JSON.parse(readFileSync(debugSessionFile).toString())
    } catch (e) {
      this.ux.log('No active debug session found, please start debug session using veloce:debug')
      return {}
    }

    const params = {
      "veloceNamespace": "",
      "instanceUrl": `${debugSession.instanceUrl}`,
      "organizationId": `${debugSession.orgId}`,
      "oAuthHeaderValue": "Dummy"
    }
    const authorization = Buffer.from(JSON.stringify(params)).toString('base64')
    const headers = {
      'dev-token': debugSession.token,
      'Authorization': authorization,
      'Content-Type': 'application/json'
    }
    const backendUrl: string | undefined = debugSession.backendUrl

    // load PML
    const pml = readFileSync(`${inputdir}/${name}.pml`, 'utf8').toString()
    try {
      await axios.post(`${backendUrl}/services/dev-override/model/${name}/pml`, {content: pml}, {
        headers
      })
    } catch ({ data }) {
      this.ux.log(`Failed to save PML: ${data as string}`)
      return {}
    }
    this.ux.log('PML Successfully Loaded!')

    if (skipui) {
      return { model: pml }
    }
    // load UI
    const uiDefs: UiDef[] = new UiDefinitionsBuilder(inputdir, name, {}, this.ux).pack()
    try {
      await axios.post(`${backendUrl}/services/dev-override/model/${name}/ui`, { content: JSON.stringify(uiDefs) }, { headers })
    } catch ({ response }) {
      this.ux.log(`Failed to save UI: ${response.statusText}. ${response.data.message}`)
      return {}
    }
    this.ux.log('UI Successfully Loaded!')

    // Return an object to be displayed with --json
    return { model: pml, ui: JSON.stringify(uiDefs) }
  }
}

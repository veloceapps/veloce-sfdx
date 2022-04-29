import {flags, SfdxCommand} from '@salesforce/command'
import {Messages} from '@salesforce/core'
import { AnyJson } from '@salesforce/ts-types'

// Initialize Messages with the current plugin directory
Messages.importMessagesDirectory(__dirname)

// Load the specific messages for this file. Messages from @salesforce/command, @salesforce/core,
// or any library that is using the messages framework can also be loaded this way.
const messages = Messages.loadMessages('veloce-sfdx', 'loadmodel')

export default class Org extends SfdxCommand {

  public static description = messages.getMessage('commandDescription')

  public static examples = [
  `$ sfdx veloce:loadmodel -n CPQ
  Model CPQ Successfully Loaded!
  `,
  `$ sfdx veloce:loadmodel --name CPQ
  Model CPQ Successfully Loaded!
  `
  ]

  public static args = []

  protected static flagsConfig = {
    // flag with a value (-n, --name=VALUE)
    name: flags.boolean({
      char: 'n',
      default: false,
      description: messages.getMessage('nameFlagDescription'),
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
    const fs = require("fs")
    const os = require('os')
    const path = require('path')
    const axios = require('axios').default;

    const name = this.flags.name

    const homedir = os.homedir()
    const debugSessionFile = path.join(homedir, '.veloce-sfdx/debug.session');
    let debugSession
    try {
      debugSession = JSON.parse(fs.readFileSync(debugSessionFile).toString())
    } catch(e) {
      this.ux.log(`No active debug session found, please start debug session using veloce:debug`)
      return {}
    }

    const headers = {
      'DebugSessionId': debugSession.session,
      'Content-Type': 'application/json'
    }

    const pml = fs.readFileSync(`models/${name}.pml`).toString()
    try {
      await axios.post(`${debugSession.backendUrl}/api/debug/model`, pml, headers)
    } catch (e) {
      this.ux.log(`Failed to save PML: ${e.data}`)
      return {}
    }
    this.ux.log(`PML Successfully Loaded!`)

    const metadataString = fs.readFileSync(`models/${name}/metadata.json`, 'utf-8')
    const metadataObject = JSON.parse(metadataString)
    for (const metadata of metadataObject) {
      for (const section of metadata['sections']) {
        if (section['templateUrl']) {
          const p = `models/${section['templateUrl'].trim()}`
          this.assertPath(p)
          const b = fs.readFileSync(p)
          const base64 = b.toString('base64')
          section['template'] = base64
          delete section['templateUrl']
        }
        if (section['scriptUrl']) {
          const p = `models/${section['scriptUrl'].trim()}`
          this.assertPath(p)
          const b = fs.readFileSync(p)
          const base64 = b.toString('base64')
          section['script'] = base64
          delete section['scriptUrl']
        }
        if (section['stylesUrl']) {
          const p = `models/${section['stylesUrl'].trim()}`
          this.assertPath(p)
          const b = fs.readFileSync(p)
          const base64 = b.toString('base64')
          section['styles'] = base64
          delete section['stylesUrl']
        }
        if (section['propertiesUrl']) {
          const p = `models/${section['propertiesUrl'].trim()}`
          this.assertPath(p)
          section.properties = this.parseJsonFile(p)
          delete section['propertiesUrl']
        }
      }
    }
    try {
      await axios.post(`${debugSession.backendUrl}/api/debug/ui`, JSON.stringify(metadataObject), headers)
    } catch (e) {
      this.ux.log(`Failed to save PML: ${e.data}`)
      return {}
    }
    this.ux.log(`UI Successfully Loaded!`)

    // Return an object to be displayed with --json
    return { model: pml, ui: metadataObject}
  }

  private assertPath(p: string) {
    for (const part of p.split('/')) {
      if (part.startsWith(' ') || part.endsWith(' ') ||
        part.startsWith('\t') || part.endsWith('\t')) {
        this.ux.log(`Path has leading trailing/leading spaces, please remove and rename folder: ${p}`)
        process.exit(255)
      }
    }
  }

  private parseJsonFile(p: string) {
    const fs = require("fs")
    try {
      const b = fs.readFileSync(p)
      return JSON.parse(b)
    } catch (e) {
      this.ux.log('Failed to read/parse JSON file ', e)
      process.exit(255)
    }
  }

}

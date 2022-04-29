import { SfdxCommand } from '@salesforce/command'
import { Messages } from '@salesforce/core'
import { AnyJson } from '@salesforce/ts-types'

// Initialize Messages with the current plugin directory
Messages.importMessagesDirectory(__dirname)

// Load the specific messages for this file. Messages from @salesforce/command, @salesforce/core,
// or any library that is using the messages framework can also be loaded this way.
const messages = Messages.loadMessages('veloce-sfdx', 'loadconfig')

export default class Org extends SfdxCommand {

  public static description = messages.getMessage('commandDescription')

  public static examples = [
  `$ sfdx veloce:loadconfig
  Configuration Settings successfully loaded!
  `
  ]

  public static args = []

  protected static flagsConfig = {
  }

  // Comment this out if your command does not require an org username
  protected static requiresUsername = false

  // Comment this out if your command does not support a hub org username
  protected static supportsDevhubUsername = false

  // Set this to true if your command requires a project workspace; 'requiresProject' is false by default
  protected static requiresProject = false

  public async run(): Promise<AnyJson> {
    const fs = require("fs")
    const os = require('os')
    const path = require('path')
    const axios = require('axios').default;

    const homedir = os.homedir()
    const debugSessionFile = path.join(homedir, '.veloce-sfdx/debug.session');
    let debugSession
    try {
      debugSession = JSON.parse(fs.readFileSync(debugSessionFile).toString())
    } catch(e) {
      this.ux.log(`No active debug session found, please start debug session using veloce:debug`)
      return {}
    }

    const result = []
    fs.readdirSync('ConfigurationSettings').forEach(file => {
      this.ux.log('processing configuration file:', file)
      const output = {VELOCPQ__Value__c: '', VELOCPQ__Key__c: '', VELOCPQ__ReferenceId__c: ''}
      output.VELOCPQ__Value__c = fs.readFileSync('ConfigurationSettings/' + file, 'UTF-8').toString()
      output.VELOCPQ__Key__c = file.indexOf('.') > 0 ? file.substring(0, file.indexOf('.')) : file
      output.VELOCPQ__ReferenceId__c = output.VELOCPQ__Key__c
      result.push(output)
    })
    const headers = {
      'DebugSessionId': debugSession.session,
      'Content-Type': 'application/json'
    }
    let configSettings
    try {
      configSettings = await axios.post(`${debugSession.backendUrl}/api/debug/config`, result, headers)
      this.ux.log(configSettings.data)
    } catch (e) {
      this.ux.log(`Failed to save configuration settings`)
      return {}
    }
    this.ux.log(`Configuration Settings successfully loaded!`)
    // Return an object to be displayed with --json
    return { configurationSettings: result}
  }
}

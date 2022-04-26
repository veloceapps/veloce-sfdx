import { SfdxCommand } from '@salesforce/command'
import { Messages, SfdxError } from '@salesforce/core'
import { AnyJson } from '@salesforce/ts-types'

// Initialize Messages with the current plugin directory
Messages.importMessagesDirectory(__dirname)

// Load the specific messages for this file. Messages from @salesforce/command, @salesforce/core,
// or any library that is using the messages framework can also be loaded this way.
const messages = Messages.loadMessages('veloce-sfdx', 'loadconfig')

export default class Org extends SfdxCommand {

  public static description = messages.getMessage('commandDescription')

  public static examples = [
  `$ sfdx veloce:loadconfig -u my-org-alias
  Configuration Settings successfully loaded.
  `,
  `$ sfdx veloce:loadconfig --targetusername my-org-alias
  Configuration Settings successfully loaded.
  `
  ]

  public static args = [{name: 'file'}]

  protected static flagsConfig = {
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
    const query = 'Select Name, TrialExpirationDate from Organization'

    // The type we are querying for
    interface Organization {
      Name: string
      TrialExpirationDate: string
    }

    // Query the org
    const result = await conn.query<Organization>(query)

    // Organization will always return one result, but this is an example of throwing an error
    // The output and --json will automatically be handled for you.
    if (!result.records || result.records.length <= 0) {
      throw new SfdxError(messages.getMessage('errorNoOrgResults', [this.org.getOrgId()]))
    }

    // Organization always only returns one result
    const orgName = result.records[0].Name
    const trialExpirationDate = result.records[0].TrialExpirationDate

    let outputString = `Hello This is org: ${orgName}`
    if (trialExpirationDate) {
      const date = new Date(trialExpirationDate).toDateString()
      outputString = `${outputString} and I will be around until ${date}!`
    }
    this.ux.log(outputString)

    // this.hubOrg is NOT guaranteed because supportsHubOrgUsername=true, as opposed to requiresHubOrgUsername.
    if (this.hubOrg) {
      const hubOrgId = this.hubOrg.getOrgId()
      this.ux.log(`My hub org id is: ${hubOrgId}`)
    }

    // Return an object to be displayed with --json
    return { orgId: this.org.getOrgId(), outputString }
  }
}

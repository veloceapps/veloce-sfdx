import {SfdxCommand} from '@salesforce/command'
import {Messages, Org as oorg} from '@salesforce/core'
import {AnyJson} from '@salesforce/ts-types'
import {v4 as uuidv4} from 'uuid';

// Initialize Messages with the current plugin directory
Messages.importMessagesDirectory(__dirname)

// Load the specific messages for this file. Messages from @salesforce/command, @salesforce/core,
// or any library that is using the messages framework can also be loaded this way.
const messages = Messages.loadMessages('veloce-sfdx', 'debug')

export default class Org extends SfdxCommand {

  public static description = messages.getMessage('commandDescription')

  public static examples = [
    `$ sfdx veloce:debug -u my-org-alias
  Debugging session started, open your browser at xxx url, if not opened automatically..
  `,
    `$ sfdx veloce:debug --targetusername my-org-alias
  Debugging session started, open your browser at xxx url, if not opened automatically..
  `
  ]

  public static args = []
  protected static flagsConfig = {}

  // Comment this out if your command does not require an org username
  protected static requiresUsername = true

  // Comment this out if your command does not support a hub org username
  protected static supportsDevhubUsername = false

  // Set this to true if your command requires a project workspace; 'requiresProject' is false by default
  protected static requiresProject = false

  public async run(): Promise<AnyJson> {
    await this.org.refreshAuth(); // we need a live accessToken for the frontdoor url
    const conn = this.org.getConnection();
    const accessToken = conn.accessToken;
    const instanceUrl = this.org.getField(oorg.Fields.INSTANCE_URL) as string;
    const orgId = this.org.getField(oorg.Fields.ORG_ID) as string;

    const instanceUrlClean = instanceUrl.replace(/\/$/, '');
    const devToken = uuidv4();

    this.ux.log(`${instanceUrlClean}/apex/VELOCPQ__DevTokenRegistration?dev-token=${devToken}`);

    const axios = require('axios').default;
    let orgInfo
    try {
      orgInfo = await axios.get(`https://canvas.velocpq.com/org-info/${orgId}`)
    } catch (e) {
      this.ux.log("Failed to get org-info")
      return {}
    }

    const backendUrl = orgInfo.data['BackendURL']
    this.ux.log(`Starting debug of backend: ${backendUrl}`)

    const params = {
      "veloceNamespace": "",
      "instanceUrl": `${instanceUrlClean}`,
      "organizationId": `${orgId}`,
      "oAuthHeaderValue": `Bearer ${accessToken}`
    }
    const authorization = Buffer.from(JSON.stringify(params)).toString('base64')
    const headers = {
      'dev-token': `${devToken}`,
      'Authorization': authorization,
      'Content-Type': 'application/json'
    }
    try {
      await axios.post(`${backendUrl}/services/dev-override/auth`, {}, {"headers": headers})
    } catch (e) {
      this.ux.log(`Failed to start debug session: ${e}`)
      return {}
    }
    const fs = require("fs")
    const os = require('os')
    const path = require('path')

    const homedir = os.homedir()
    const veloceHome = path.join(homedir, '.veloce-sfdx');
    try {
      fs.mkdirSync(veloceHome);
    } catch (e) {
    }

    const debugSessionFile = path.join(veloceHome, 'debug.session');

    try {
      fs.writeFileSync(debugSessionFile,
        JSON.stringify({token: devToken, backendUrl: backendUrl, orgId: orgId}),
        {
          encoding: "utf8",
          flag: "w+",
          mode: '600'
        }
      )
    } catch (e) {
      this.ux.log(`failed to save session: ${e}`)
    }


    // Return an object to be displayed with --json
    return {orgId}
  }

}

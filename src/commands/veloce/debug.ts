import {flags, SfdxCommand} from '@salesforce/command'
import {AuthInfo, Messages, WebOAuthServer} from '@salesforce/core'
import {AnyJson} from '@salesforce/ts-types'
import * as open from 'open'
import {OAuth2Options} from "jsforce";

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
  protected static flagsConfig = {
    target: flags.string({
      char: 'u',
      description: messages.getMessage('targetFlagDescription'),
      required: true
    })
  }

  // Comment this out if your command does not require an org username
  protected static requiresUsername = false

  // Comment this out if your command does not support a hub org username
  protected static supportsDevhubUsername = false

  // Set this to true if your command requires a project workspace; 'requiresProject' is false by default
  protected static requiresProject = false

  public async run(): Promise<AnyJson> {
    const alias = this.flags.target
    const authorizations = await AuthInfo.listAllAuthorizations()
    const auth = authorizations.find(a => a.alias === alias);
    if (auth === undefined) {
      // Return an object to be displayed with --json
      this.ux.log("no such alias")
      return {}
    }
    this.ux.log(`Login into org ${auth.instanceUrl}`)
    const newAuthInfo = await this.executeLoginFlow(auth.instanceUrl)
    const fields = newAuthInfo.getFields(true);
    const username = fields.username
    const accessToken = fields.accessToken
    const refreshToken = fields.refreshToken
    const instanceUrl = fields.instanceUrl
    const clientId = fields.clientId
    const orgId = fields.orgId
    this.ux.log(`orgId: ${orgId}, clientId: ${clientId}, instanceUrl: ${instanceUrl}, refreshToken: ${refreshToken}, accessToken: ${accessToken}, username: ${username}`)

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
    const headers = {
      'VeloceSfAccessToken': accessToken,
      'VeloceOrgId': orgId,
      'Content-Type': 'application/json'
    }
    const params = { }
    let debugSession
    try {
      debugSession = await axios.post(`${backendUrl}/api/debug/start`, params, headers)
    } catch (e) {
      this.ux.log("Failed to start debug session")
      //return {}
    }
    const fs = require("fs")
    const os = require('os')
    const path = require('path')

    const homedir = os.homedir()
    const veloceHome = path.join(homedir, '.veloce-sfdx');
    try {
      fs.mkdirSync(veloceHome);
    } catch (e) {}

    const debugSessionId = debugSession ? debugSession.data : 'invalid_session'
    const debugSessionFile = path.join(veloceHome, 'debug.session');

    try {
      fs.writeFileSync(debugSessionFile,
        JSON.stringify({session: debugSessionId, backendUrl: backendUrl, orgId: orgId}),
        {
          encoding: "utf8",
          flag: "w+",
          mode: '600'
        }
      )
    } catch (e) {
      this.ux.log(`failed to save session: ${e}`)
    }

    const logsHeaders = {
      'DebugSessionId': debugSessionId,
      'Content-Type': 'application/json'
    }
    const logsParams = { }

    while(true) {
      let logs
      try {
        logs = await axios.post(`${backendUrl}/api/debug/logs`, logsParams, logsHeaders)
        this.ux.log(logs.data)
        logsHeaders['ContinuationToken'] = logs.headers['ContinuationToken']
      } catch (e) {
        this.ux.log(`Failed to get logs`)
      }
      await new Promise((resolve) => {
        setTimeout(resolve, 5000);
      })
    }
    // Return an object to be displayed with --json
    return {username, accessToken, refreshToken, instanceUrl, clientId, orgId}
    /* Alternative
      await this.org.refreshAuth(); // we need a live accessToken for the frontdoor url
      const conn = this.org.getConnection();
      const accessToken = conn.accessToken;
      const instanceUrl = this.org.getField(oorg.Fields.INSTANCE_URL) as string;
      const instanceUrlClean = instanceUrl.replace(/\/$/, '');
      this.ux.log (`${instanceUrlClean}/secur/frontdoor.jsp?sid=${accessToken}`);
      return {}
    */
  }

  public async executeLoginFlow(instanceUrl: string): Promise<AuthInfo> {
    const opts: OAuth2Options = {loginUrl: instanceUrl}
    const oauthServer = await WebOAuthServer.create({oauthConfig: opts});
    await oauthServer.start();
    await open(oauthServer.getAuthorizationUrl(), {wait: false});
    return oauthServer.authorizeAndSave();
  }
}

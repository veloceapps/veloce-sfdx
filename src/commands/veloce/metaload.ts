import {flags, SfdxCommand} from '@salesforce/command';
import {Messages} from '@salesforce/core';
import { Deploy } from '@salesforce/plugin-source/lib/commands/force/source/deploy';
//import { Report } from '@salesforce/plugin-source/lib/commands/force/source/deploy/report'
import {AnyJson} from '@salesforce/ts-types';

// Initialize Messages with the current plugin directory
Messages.importMessagesDirectory(__dirname);
const messages = Messages.loadMessages('veloce-sfdx', 'metaload');

export default class Org extends SfdxCommand {

  public static description = messages.getMessage('commandDescription');

  public static examples = [
    `$ sfdx veloce:permgen -f ./myname.csv --targetusername myOrg@example.com --targetdevhubusername devhub@org.com -s Product2
  Hello world! This is org: MyOrg and I will be around until Tue Mar 20 2018!
  My hub org id is: 00Dxx000000001234
  `,
    `$ sfdx veloce:permgen -f ./myname.csv --targetusername myOrg@example.com -s Product2
  Hello myname! This is org: MyOrg and I will be around until Tue Mar 20 2018!
  `
  ];

  protected static flagsConfig = {
    // flag with a value (-n, --name=VALUE)
    testlevel: flags.string({char: 'l', description: messages.getMessage('testlevelFlagDescription')}),
    useralias: flags.string({char: 'u', description: messages.getMessage('useraliasFlagDescription'), required: true})
  };

  // Comment this out if your command does not require an org username
  protected static requiresUsername = false;

  // Comment this out if your command does not support a hub org username
  protected static supportsDevhubUsername = false;

  // Set this to true if your command requires a project workspace; 'requiresProject' is false by default
  protected static requiresProject = false;

  public async run(): Promise<AnyJson> {
    const deployCmdTestLevel = (this.flags.testlevel || 'NoTestRun').trim();
    const sfUserAlias = this.flags.useralias.trim();
    const deployCmdConfig: any = {runHook: () => {}}; // new Deploy() fails if config has not runHook field
    const deployCmd = new Deploy(
      ['-p', 'project-source/main/default/objects,project-source/main/default/classes', '-u', sfUserAlias, '-l', deployCmdTestLevel, '-w', '0'], deployCmdConfig
    );

    let deployJobID: string;

    deployCmd._run().then(
      (result) => {
        deployJobID = result['id']
      }
    );

    console.log(deployJobID);
    // const deployReportCmdConfig: any = {}
    // const deployReportCmd = new Report(
    //   [], deployReportCmdConfig
    // )
    return {};
  }
}

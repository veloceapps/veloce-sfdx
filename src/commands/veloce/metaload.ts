import {flags, SfdxCommand} from '@salesforce/command';
import {Connection, Messages, Org, User} from '@salesforce/core';
import {ComponentSet} from '@salesforce/source-deploy-retrieve';
import {AnyJson} from '@salesforce/ts-types';

// Initialize Messages with the current plugin directory
Messages.importMessagesDirectory(__dirname);
const messages = Messages.loadMessages('veloce-sfdx', 'metaload');

export default class VeloceOrg extends SfdxCommand {

  public static description = messages.getMessage('commandDescription');

  public static examples = [
    `$ sfdx veloce:metaload
      -u user-or-alias
      -l RunLocalTests
      -f project-source/main/default/objects
      -f project-source/main/default/classes
      -p project-source/main/default/permissionsets
    `
  ];

  protected static flagsConfig = {
    // flag with a value (-n, --name=VALUE)
    testlevel: flags.string({char: 'l', description: messages.getMessage('testlevelFlagDescription')}),
    files: flags.string({char: 'f', description: messages.getMessage('filesFlagDescription'), multiple: true}),
    permissionsets: flags.string({char: 'p', description: messages.getMessage('permissionsets'), multiple: true})
  };

  // Comment this out if your command does not require an org username
  protected static requiresUsername = true;

  // Comment this out if your command does not support a hub org username
  protected static supportsDevhubUsername = false;

  // Set this to true if your command requires a project workspace; 'requiresProject' is false by default
  protected static requiresProject = false;

  public async run(): Promise<AnyJson> {
    const deployTestLevel = (this.flags.testlevel || 'NoTestRun').trim();
    const deploy = await ComponentSet
      .fromSource(this.flags.files)
      .deploy({usernameOrConnection: this.org.getUsername(), apiOptions: {
        testLevel: deployTestLevel
      }});

    await deploy.pollStatus(5000, 180);
    const deployResult = await this.org.getConnection().metadata.checkDeployStatus(deploy.id, true);

    this.ux.log(`Showing results for ${deploy.id}`);
    console.log(deployResult);
    if (!deployResult.success) {
      this.ux.log('Deploy failed, check results above ^^^');
      process.exit(255);
    }

    const deploy2 = await ComponentSet
      .fromSource(this.flags.permissionsets)
      .deploy({usernameOrConnection: this.org.getUsername(), apiOptions: {
        testLevel: deployTestLevel
      }});

    await deploy2.pollStatus(5000, 180);
    const deployResult2 = await this.org.getConnection().metadata.checkDeployStatus(deploy2.id, true);
    this.ux.log(`Showing results for ${deploy2.id}`);
    console.log(deployResult2);
    if (!deployResult2.success) {
      this.ux.log('Deploy failed, check results above ^^^');
      process.exit(255);
    }

    const connection: Connection = this.org.getConnection();
    const org = await Org.create({ connection });
    const user: User = await User.create({ org });
    const queryResult = await connection.singleRecordQuery<{ Id: string }>(
      `SELECT Id FROM User WHERE Username='${this.org.getUsername()}'`
    );


    try {
      await user.assignPermissionSets(queryResult.Id, ['Veloce_GP_Boarding']);
    } catch (e) {
      console.log(e);
    }

    try {
      await user.assignPermissionSets(queryResult.Id, ['VeloceEcommerce']);
    } catch (e) {
      console.log(e);
    }

    this.ux.log('veloce:metaload completed!');
    return {};
  }

}

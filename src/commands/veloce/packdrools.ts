import {flags, SfdxCommand} from '@salesforce/command';
import {fs, Messages} from '@salesforce/core';
import {AnyJson} from '@salesforce/ts-types';
import {DroolsDeploy} from '../../deploy/drools/deploy';
import {DeploymentError, DeploymentGroup, DeploymentInput, DeploymentType} from '../../deploy/model';
import {getExtension, getFiles} from '../../deploy/utils';
// import {prepareDeploymentInput} from './deploy/deploy.input';
// import {DroolsDeploy} from './deploy/drools/deploy';
// import {DeploymentError} from './deploy/model';

// Initialize Messages with the current plugin directory
Messages.importMessagesDirectory(__dirname);

// Load the specific messages for this file. Messages from @salesforce/command, @salesforce/core,
// or any library that is using the messages framework can also be loaded this way.
const messages = Messages.loadMessages('veloce-sfdx', 'deploy');

export default class Org extends SfdxCommand {
  public static description = messages.getMessage('commandDescription');

  public static examples = [
    '$ sfdx veloce:deploy -i /path/to/folder'
  ];

  protected static flagsConfig = {
    inputpath: flags.string({char: 'i', description: messages.getMessage('inputdirFlagDescription'), required: true})
  };

  // Comment this out if your command does not require an org username
  protected static requiresUsername = true;

  // Comment this out if your command does not support a hub org username
  protected static supportsDevhubUsername = true;

  // Set this to true if your command requires a project workspace; 'requiresProject' is false by default
  protected static requiresProject = false;

  public async run(): Promise<AnyJson> {
    const input = this.flags.inputpath;
    if (input?.trim() === '') {
      this.ux.log('Missing Input');
      throw new DeploymentError('Missing Input');
    }

    const deploymentInput = prepareDeploymentInput(input);
    console.log('deploymentInput', deploymentInput);
    //
    const conn = this.org.getConnection();

    const droolsDeploy = new DroolsDeploy();
    for await (const group of deploymentInput.groups) {
      await droolsDeploy.preprocess(group, this.ux, conn);
      try {
        await droolsDeploy.process(group, this.ux, conn);
      } catch (e) {
        console.log('failed', e);
      }
    }
    // const deployStrategy = new DeployStrategy(this.ux, conn);
    //
    // const deploymentResult = deploymentInput.groups.map(async group => {
    //   deployStrategy.setStrategy(getDeployStrategy(group.type));
    //   return await deployStrategy.execute(group);
    // });
    //
    // // const deploymentResult = deployGroups(deploymentInput.groups);
    // console.log('deploymentResults', deploymentResult);
    return Object.assign({});
  }

}

// const getDeployStrategy = (deploymentType: DeploymentType) => {
//   switch (deploymentType) {
//     case DeploymentType.DROOLS:
//       return new DroolsDeploy();
//     default:
//       throw new DeploymentError(`Unrecognized deployment type ${deploymentType}`);
//   }
// };

export const prepareDeploymentInput = (input: string): DeploymentInput => {
  const stats = fs.statSync(input);
  const files = stats.isDirectory() ? getFiles(input) : [input];
  return {
    input,
    groups: prepareGroups(files)
  };
};

const prepareGroups = (files: string[]): DeploymentGroup[] => {
  const extensionToFiles = files.reduce((acc, el) => {
    const extension = getExtension(el);
    // console.log('ex', extension);
    // console.log('acc', acc);
    return {
      ...acc,
      [extension]: [...(acc[extension] || []), el]
    };
  }, {});

  // console.log('extensionToFiles', extensionToFiles);

  return Object.keys(extensionToFiles).map(ext => {
    return {
      type: getDeploymentType(ext),
      filePaths: extensionToFiles[ext]
    };
  });

};

const getDeploymentType = (ext: string) => {
  if (ext.indexOf('drl') >= 0) {
    return DeploymentType.DROOLS;
  }
  throw new DeploymentError(`Unrecognized file extension ${ext}`);
};

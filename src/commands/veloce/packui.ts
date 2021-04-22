import { flags, SfdxCommand } from '@salesforce/command';
import { Messages } from '@salesforce/core';
import { AnyJson } from '@salesforce/ts-types';
/* tslint:disable */
const fs = require('fs');
/* tslint:enable */

// Initialize Messages with the current plugin directory
Messages.importMessagesDirectory(__dirname);

// Load the specific messages for this file. Messages from @salesforce/command, @salesforce/core,
// or any library that is using the messages framework can also be loaded this way.
const messages = Messages.loadMessages('veloce-sfdx', 'packui');

export default class Org extends SfdxCommand {

  public static description = messages.getMessage('commandDescription');

  public static examples = [
  '$ sfdx veloce:packui --inputdir . -n BOARDING --outputfile metadata_new.json'
  ];

  public static args = [{name: 'file'}];

  protected static flagsConfig = {
    modelname: flags.string({char: 'n', description: messages.getMessage('modelnameFlagDescription'), required: true}),
    inputdir: flags.string({char: 'i', description: messages.getMessage('inputdirFlagDescription'), required: true}),
    outputfile: flags.string({char: 'o', description: messages.getMessage('outputfileFlagDescription'), required: true}),
    idmap: flags.string({char: 'I', description: messages.getMessage('idmapFlagDescription'), required: true})
  };

  // Comment this out if your command does not require an org username
  protected static requiresUsername = false;

  // Comment this out if your command does not support a hub org username
  protected static supportsDevhubUsername = false;

  // Set this to true if your command requires a project workspace; 'requiresProject' is false by default
  protected static requiresProject = false;

  public async run(): Promise<AnyJson> {
    const inputdir = this.flags.inputdir || '.';
    const modelname = this.flags.modelname || 'CPQ';
    const outputfile = this.flags.outputfile || 'metadata.output.json';

    let idmap;
    try {
      idmap = JSON.parse(fs.readFileSync(this.flags.idmap).toString());
    } catch (err) {
      this.ux.log(`Failed to load ID-Map file: ${this.flags.idmap} will create new file at the end`);
      idmap = {};
    }

    const inputString = fs.readFileSync(`${inputdir}/${modelname}/metadata.json`, 'utf-8');
    const input = JSON.parse(inputString);
    for (const metadata of input) {
      if (metadata['priceList']) {
        if (idmap[metadata['priceList']]) {
          this.ux.log(`${metadata['priceList']} => ${idmap[metadata['priceList']]}`);
          metadata['priceList'] = idmap[metadata['priceList']];
        }
      }
      for (const section of metadata['sections']) {
        if (section['templateUrl']) {
          const b = fs.readFileSync(`${inputdir}/${section['templateUrl']}`);
          const base64 = b.toString('base64');
          section['template'] = base64;
          delete section['templateUrl'];
        }
        if (section['scriptUrl']) {
          const b = fs.readFileSync(`${inputdir}/${section['scriptUrl']}`);
          const base64 = b.toString('base64');
          section['script'] = base64;
          delete section['scriptUrl'];
        }
        if (section['stylesUrl']) {
          const b = fs.readFileSync(`${inputdir}/${section['stylesUrl']}`);
          const base64 = b.toString('base64');
          section['styles'] = base64;
          delete section['stylesUrl'];
        }
      }
    }
    const output = JSON.stringify(input, null, 2);
    fs.writeFileSync(outputfile, output, 'utf-8');
    this.ux.log(`Data successfully packed into: ${outputfile}`);
    // Return an object to be displayed with --json
    return { inputdir, modelname, outputfile};
  }
}

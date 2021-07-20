import {flags, SfdxCommand} from '@salesforce/command';
import {Messages} from '@salesforce/core';
import {AnyJson} from '@salesforce/ts-types';
/* tslint:disable */
const fs = require('fs');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
/* tslint:enable */

// Initialize Messages with the current plugin directory
Messages.importMessagesDirectory(__dirname);

// Load the specific messages for this file. Messages from @salesforce/command, @salesforce/core,
// or any library that is using the messages framework can also be loaded this way.
const messages = Messages.loadMessages('veloce-sfdx', 'packconfig');

export default class Org extends SfdxCommand {

  public static description = messages.getMessage('commandDescription');

  public static examples = [
    '$ sfdx veloce:createconfig -i config -o VELOCPQ__ConfigurationSetting__c.csv',
    'Configuration file example \n' +
    'filename: flows.json - where filename will be configuration property key( in this case `flows`) and inside that json file \n' +
    '{\n    "value": "some value here maybe ' +
    'multi-lined too",\n }'
  ];

  public static args = [{name: 'file'}];

  protected static flagsConfig = {
    inputdir: flags.string({char: 'i', description: messages.getMessage('inputdirFlagDescription'), required: true}),
    outputfile: flags.string({char: 'o', description: messages.getMessage('outputfileFlagDescription'), required: true})
  };

  // Comment this out if your command does not require an org username
  protected static requiresUsername = false;

  // Comment this out if your command does not support a hub org username
  protected static supportsDevhubUsername = false;

  // Set this to true if your command requires a project workspace; 'requiresProject' is false by default
  protected static requiresProject = false;

  public async run(): Promise<AnyJson> {
    const inputdir = this.flags.inputdir;
    const outputfile = this.flags.outputfile;
    const csvWriter = createCsvWriter({
      header: [{id: 'VELOCPQ__Key__c', title: 'VELOCPQ__Key__c'},
        {id: 'VELOCPQ__Value__c', title: 'VELOCPQ__Value__c'},
        {id: 'VELOCPQ__ReferenceId__c', title: 'VELOCPQ__ReferenceId__c'}],
      path: outputfile
    });
    const result = [];
    fs.readdirSync(inputdir).forEach(file => {
      console.log('processing configuration file:', file);
      const output = {VELOCPQ__Value__c: '', VELOCPQ__Key__c: '', VELOCPQ__ReferenceId__c: ''};
      output.VELOCPQ__Value__c = fs.readFileSync(inputdir + '/' + file, 'UTF-8').toString();
      output.VELOCPQ__Key__c = file.indexOf('.') > 0 ? file.substring(0, file.indexOf('.')) : file;
      output.VELOCPQ__ReferenceId__c = output.VELOCPQ__Key__c;
      result.push(output);
    });
    csvWriter.writeRecords(result).then(() => console.log('Result saved to', outputfile));
    return {output: outputfile, result};
  }
}

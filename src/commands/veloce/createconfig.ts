import {flags, SfdxCommand} from '@salesforce/command';
import {Messages} from '@salesforce/core';
import {AnyJson} from '@salesforce/ts-types';
/* tslint:disable */
const fs = require('fs');
const parse = require('csv-parse/lib/sync');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
/* tslint:enable */

// Initialize Messages with the current plugin directory
Messages.importMessagesDirectory(__dirname);

// Load the specific messages for this file. Messages from @salesforce/command, @salesforce/core,
// or any library that is using the messages framework can also be loaded this way.
const messages = Messages.loadMessages('veloce-sfdx', 'createconfig');

export default class Org extends SfdxCommand {

  public static description = messages.getMessage('commandDescription');

  public static examples = [
    '$ sfdx veloce:createconfig -i config . -n BOARDING -t ConfigurationSettings_template.csv -o VELOCPQ__ConfigurationSetting__c.csv'
  ];

  public static args = [{name: 'file'}];

  protected static flagsConfig = {
    modelname: flags.string({char: 'n', description: messages.getMessage('modelnameFlagDescription'), required: true}),
    inputdir: flags.string({char: 'i', description: messages.getMessage('inputdirFlagDescription'), required: true}),
    outputfile: flags.string({char: 'o', description: messages.getMessage('outputfileFlagDescription'), required: true}),
    template: flags.string({char: 't', description: messages.getMessage('templatefileFlagDescription'), required: true})
  };

  // Comment this out if your command does not require an org username
  protected static requiresUsername = false;

  // Comment this out if your command does not support a hub org username
  protected static supportsDevhubUsername = false;

  // Set this to true if your command requires a project workspace; 'requiresProject' is false by default
  protected static requiresProject = false;

  public async run(): Promise<AnyJson> {
    const templateFile = this.flags.template;
    const inputdir = this.flags.inputdir;
    const outputfile = this.flags.outputfile;

    const template = fs.readFileSync(templateFile, 'UTF-8');
    const csvTemplate = parse(template, {columns: true, bom: true});
    const csvWriter = createCsvWriter({
      header: [{id: 'VELOCPQ__Key__c', title: 'VELOCPQ__Key__c'},
        {id: 'VELOCPQ__Value__c', title: 'VELOCPQ__Value__c'}],
      path: outputfile
    });
    console.log('Using csv template', (csvTemplate));
    const result = [];
    fs.readdirSync(inputdir).forEach(file => {
      console.log('processing configuration file:', file);
      const output = {...csvTemplate[0]};
      const {value} = JSON.parse(fs.readFileSync(inputdir + file, 'UTF-8').toString());
      output.VELOCPQ__Value__c = value;
      output.VELOCPQ__Key__c = file.substring(0, file.indexOf('.'));
      result.push(output);
    });
    csvWriter.writeRecords(result).then(() => console.log('Result saved to', outputfile));
    return {'Output ': outputfile};
  }
}

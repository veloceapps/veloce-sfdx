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
const messages = Messages.loadMessages('veloce-sfdx', 'dumprules');

export default class Org extends SfdxCommand {
  public static description = messages.getMessage('commandDescription');

  public static examples = [
    '$ sfdx veloce:dumprules -i rules -o VELOCPQ__PriceRule__c.csv -m pricegroupconfiguration.txt'
  ];

  public static args = [{name: 'file'}];

  protected static ruleExtractRegex = /(rule\b)([\S\s]*?)(end\b)/g;
  protected static rulePreconditionRegex = /(?<=when\b)([\S\s]*?)(?=then\b)/g;
  protected static ruleBodyRegex = /(?<=then\b)([\S\s]*?)(?=end\b)/g;
  protected static ruleSequenceRegex = /(?<=salience\b)([\S\s]*?)(?=when\b)/g;

  protected static flagsConfig = {
    inputdir: flags.string({char: 'i', description: messages.getMessage('inputdirFlagDescription'), required: true}),
    outputfile: flags.string({char: 'o', description: messages.getMessage('outputfileFlagDescription'), required: true}),
    pricegroupconfiguration: flags.string({char: 'm', description: messages.getMessage('pricegroupconfigurationFlagDescription'), required: true})
  };

  // Comment this out if your command does not require an org username
  protected static requiresUsername = false;

  // Comment this out if your command does not support a hub org username
  protected static supportsDevhubUsername = false;

  // Set this to true if your command requires a project workspace; 'requiresProject' is false by default
  protected static requiresProject = false;

  public async run(): Promise<AnyJson> {
    const pricegroupconfiguration = this.flags.pricegroupconfiguration;
    const inputdir = this.flags.inputdir;
    const outputFile = this.flags.outputfile;
    const csvWriter = createCsvWriter({
      header: [{id: 'Name', title: 'Name'},
        {id: 'VELOCPQ__PriceRuleGroupId__c', title: 'VELOCPQ__PriceRuleGroupId__c'},
        {id: 'VELOCPQ__Action__c', title: 'VELOCPQ__Action__c'},
        {id: 'VELOCPQ__Active__c', title: 'VELOCPQ__Active__c'},
        {id: 'VELOCPQ__Condition__c', title: 'VELOCPQ__Condition__c'},
        {id: 'VELOCPQ__Sequence__c', title: 'VELOCPQ__Sequence__c'}
      ],
      path: outputFile
    });
    const result = this.extractRulesFromFolder(inputdir, pricegroupconfiguration);
    console.log(result);
    csvWriter.writeRecords(result).then(() => console.log('Result saved to ', outputFile));
    return {'Output ': outputFile};
  }

  // tslint:disable-next-line:no-any
  public extractRulesFromFolder(rulesDirectory: string, pathToRuleGroupMap: string): any {
    const ruleToGroup = this.populateRuleGroupIdMap(pathToRuleGroupMap);
    const result = [];
    fs.readdirSync(rulesDirectory).forEach(ruleFile => {
      const rulesContent = fs.readFileSync(rulesDirectory + '/' + ruleFile, 'UTF-8').toString();
      const groupId = this.getRuleGroupId(ruleFile, ruleToGroup);
      const rulesRegexResults = [...rulesContent.match(Org.ruleExtractRegex)];
      for (const rulesRegexResult of rulesRegexResults) {
        const preconditionResult = [...rulesRegexResult.match(Org.rulePreconditionRegex)];
        const ruleBodyResult = [...rulesRegexResult.match(Org.ruleBodyRegex)];

        const ruleCsvRecord = {
          Name: this.getRuleName(rulesRegexResult), VELOCPQ__PriceRuleGroupId__c: groupId,
          VELOCPQ__Action__c: ruleBodyResult[0], VELOCPQ__Active__c: 1,
          VELOCPQ__Condition__c: preconditionResult[0], VELOCPQ__Sequence__c: this.getSequenceNumber(rulesRegexResult)
        };
        result.push(ruleCsvRecord);
      }
    });
    return result;
  }

  // tslint:disable-next-line:no-any
  public getRuleName(rulesRegexResultElement: any) {
    const startPosition = rulesRegexResultElement.indexOf('\"');
    const endPosition = rulesRegexResultElement.indexOf('\"', startPosition + 1);
    return rulesRegexResultElement.substring(startPosition + 1, endPosition);
  }

  // tslint:disable-next-line:no-any
  public getSequenceNumber(rulesRegexResultElement: any) {
    const sequence = [...rulesRegexResultElement.match(Org.ruleSequenceRegex)][0];
    // tslint:disable-next-line:radix
    return parseInt(sequence.toString().trim());
  }

  public getRuleGroupId(ruleFilename: string, ruleToGroup: Map<string, string>): string {
    const key = ruleFilename.substring(0, ruleFilename.indexOf('.'));
    return ruleToGroup.get(key);
  }

  public populateRuleGroupIdMap(mapPath: string): Map<string, string> {
    const result = new Map();
    const data = fs.readFileSync(mapPath, 'UTF-8').toString();
    const lines = data.replace(/\r\n/g, '\n').split('\n');
    console.log('Rule group lines', lines);
    for (const line of lines) {
      const splitedLine = line.split(':');
      result.set(splitedLine[0], splitedLine[1]);
    }
    return result;
  }
}

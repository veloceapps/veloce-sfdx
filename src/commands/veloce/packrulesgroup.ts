import {flags, SfdxCommand} from '@salesforce/command'
import {Messages} from '@salesforce/core'
import {AnyJson} from '@salesforce/ts-types'
/* tslint:disable */
const fs = require('fs');
const path = require('path');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
/* tslint:enable */

// Initialize Messages with the current plugin directory
Messages.importMessagesDirectory(__dirname)

// Load the specific messages for this file. Messages from @salesforce/command, @salesforce/core,
// or any library that is using the messages framework can also be loaded this way.
const messages = Messages.loadMessages('veloce-sfdx', 'packrulesgroup')

export default class Org extends SfdxCommand {
  public static description = messages.getMessage('commandDescription')

  public static examples = [
    '$ sfdx veloce:packrulesgroup -i ./rules/ -o ./VELOCPQ__PriceRuleGroup__c.csv -P PRICELISTID',
    'Each rule in rules folder need to have .json meta file - for example xxx.drl will have xxx.json. \n' +
    'Meta file example: \n' +
    '{\n    "label": "project cato 10 pre config",\n    "description": "Pre Configuration Rules",\n    "sequence": 10,\n    "type": "PreConfiguration"\n}'
  ]

  public static args = [{name: 'file'}]

  protected static flagsConfig = {
    inputdir: flags.string({char: 'i', description: messages.getMessage('inputdirFlagDescription'), required: true}),
    outputfile: flags.string({char: 'o', description: messages.getMessage('outputfileFlagDescription'), required: true}),
    pricelistiid: flags.string({char: 'P', description: messages.getMessage('pricelistidFlagDescription'), required: false})
  }

  // Comment this out if your command does not require an org username
  protected static requiresUsername = false

  // Comment this out if your command does not support a hub org username
  protected static supportsDevhubUsername = false

  // Set this to true if your command requires a project workspace; 'requiresProject' is false by default
  protected static requiresProject = false

  public async run(): Promise<AnyJson> {
    const pricelistmeta = this.flags.pricelistmeta
    const inputdir = this.flags.inputdir
    const outputFile = this.flags.outputfile
    const pricelistiid = this.flags.pricelistiid
    const csvWriter = createCsvWriter({
      header: [{id: 'Id', title: 'Id'},
        {id: 'Name', title: 'Name'},
        {id: 'VELOCPQ__Type__c', title: 'VELOCPQ__Type__c'},
        {id: 'VELOCPQ__Active__c', title: 'VELOCPQ__Active__c'},
        {id: 'VELOCPQ__Description__c', title: 'VELOCPQ__Description__c'},
        {id: 'VELOCPQ__Sequence__c', title: 'VELOCPQ__Sequence__c'},
        {id: 'VELOCPQ__PriceListId__c', title: 'VELOCPQ__PriceListId__c'}
      ],
      path: outputFile
    })
    const result = this.extractRulesGroupMeta(inputdir, pricelistmeta, pricelistiid)
    csvWriter.writeRecords(result).then(() => console.log('Result saved to ', outputFile))
    return {'Output ': outputFile}
  }

  public extractRulesGroupMeta(inputdir: string, pricelistmetaFile: string, pricelistid: string) {
    const extension = '.json'
    const metaFiles = []
    fs.readdirSync(inputdir).forEach(ruleGroupFile => {
      if (path.extname(ruleGroupFile).toLowerCase() === extension) {
        metaFiles.push(ruleGroupFile)
      }
    })
    const result = []
    console.log('Pricelist meta file path', pricelistmetaFile)
    for (const metaFile of metaFiles) {
      const data = JSON.parse(fs.readFileSync(inputdir + '/' + metaFile, 'UTF-8').toString())
      const ruleCsvRecord = {
        Id: data['priceGroupId'], Name: data['label'],
        VELOCPQ__Description__c: data['description'], VELOCPQ__Active__c: 1,
        VELOCPQ__Sequence__c: data['sequence'], VELOCPQ__Type__c: data['type'],
        VELOCPQ__PriceListId__c: pricelistid
      }
      result.push(ruleCsvRecord)
    }
    return result
  }
}

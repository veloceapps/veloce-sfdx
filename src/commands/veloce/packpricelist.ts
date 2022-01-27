import {flags, SfdxCommand} from '@salesforce/command'
import {Messages} from '@salesforce/core'
import {AnyJson} from '@salesforce/ts-types'
/* tslint:disable */
const fs = require('fs');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
/* tslint:enable */

// Initialize Messages with the current plugin directory
Messages.importMessagesDirectory(__dirname)

// Load the specific messages for this file. Messages from @salesforce/command, @salesforce/core,
// or any library that is using the messages framework can also be loaded this way.
const messages = Messages.loadMessages('veloce-sfdx', 'packpricelist')

export default class Org extends SfdxCommand {
  public static description = messages.getMessage('commandDescription')

  public static examples = [
    '$ sfdx veloce:packpricelist -i ./project-cato-pricelist.json -o ./VELOCPQ__PriceList__c.csv'
  ]

  public static args = [{name: 'file'}]

  protected static flagsConfig = {
    inputdir: flags.string({char: 'i', description: messages.getMessage('inputfileFlagDescription'), required: true}),
    outputfile: flags.string({char: 'o', description: messages.getMessage('outputfileFlagDescription'), required: true})
  }

  // Comment this out if your command does not require an org username
  protected static requiresUsername = false

  // Comment this out if your command does not support a hub org username
  protected static supportsDevhubUsername = false

  // Set this to true if your command requires a project workspace; 'requiresProject' is false by default
  protected static requiresProject = false

  public async run(): Promise<AnyJson> {
    const inputDir = this.flags.inputdir
    const outputFile = this.flags.outputfile
    const csvWriter = createCsvWriter({
      header: [{id: 'Id', title: 'Id'},
        {id: 'Name', title: 'Name'},
        {id: 'VELOCPQ__Description__c', title: 'VELOCPQ__Description__c'}
      ],
      path: outputFile
    })
    const result = this.extractPriceListMeta(inputDir)
    csvWriter.writeRecords(result).then(() => console.log('Result saved to ', outputFile))
    return {'Output ': outputFile}
  }

  private extractPriceListMeta(inputFile: string) {
    const result = []
    const priceListMeta = JSON.parse(fs.readFileSync(inputFile, 'UTF-8').toString())
    const pricelistRecord = {
      Id: priceListMeta['id'], Name: priceListMeta['name'],
      VELOCPQ__Description__c: priceListMeta['description']
    }
    result.push(pricelistRecord)
    return result
  }
}

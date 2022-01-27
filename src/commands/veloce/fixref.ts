import {  flags, SfdxCommand } from '@salesforce/command'
import { Messages } from '@salesforce/core'
import { AnyJson } from '@salesforce/ts-types'
import 'ts-replace-all'


/* tslint:disable */
const apexNode = require('@salesforce/apex-node');
/* tslint:enable */

// Initialize Messages with the current plugin directory
Messages.importMessagesDirectory(__dirname)

// Load the specific messages for this file. Messages from @salesforce/command, @salesforce/core,
// or any library that is using the messages framework can also be loaded this way.
const messages = Messages.loadMessages('veloce-sfdx', 'fixref')

export default class Org extends SfdxCommand {

    public static description = messages.getMessage('commandDescription')

    public static examples = [
        `$ sfdx veloce:fixref -u gp01 -p
  `]
  protected static flagsConfig = {
    // flag with a value (-n, --name=VALUE)
    perform: flags.boolean({
      char: 'p',
      default: false,
      description: messages.getMessage('performFlagDescription'),
      required: false
    })
  }
    // Comment this out if your command does not require an org username
    protected static requiresUsername = true

    // Comment this out if your command does not support a hub org username
    protected static supportsDevhubUsername = false

    // Set this to true if your command requires a project workspace; 'requiresProject' is false by default
    protected static requiresProject = false

    public async run(): Promise<AnyJson> {
        const script = `
            Map<String, Object> result = new Map<String, Object>();
            List<Map<String, String>> veloceObjectsWithoutRefDebug = new List<Map<String, String>>();
            Set<String> veloceObjectsWithoutRefColumn = new Set<String>();
            String refIDColumn = 'VELOCPQ__ReferenceId__c';

            for ( Schema.SObjectType o : Schema.getGlobalDescribe().values() ) {
                Schema.DescribeSObjectResult objResult = o.getDescribe();
                if (objResult.getName().contains('VELOCPQ_')) {
                    if (objResult.queryable) {
                        Set<String> objectFields = objResult.fields.getMap().keySet();
                        if(objectFields.contains(refIDColumn.toLowerCase())) {
                            String query = String.format('SELECT {0} FROM {1} WHERE {2}=null', new String[]{refIDColumn, objResult.getName(), refIDColumn});
                            List<SObject> veloceObjectsWithoutRef = Database.query(query);
                            for ( SObject vo : veloceObjectsWithoutRef) {
                                Map<String, String> objectInfo = new Map<String, String>();
                                objectInfo.put(vo.getSObjectType().getDescribe().getName(), vo.Id);
                                veloceObjectsWithoutRefDebug.add(objectInfo);
                                ${this.flags.perform ? "vo.put('VELOCPQ__ReferenceId__c', vo.Id);" : '//'}
                                ${this.flags.perform ? 'update vo;' : '//'}
                            }
                        } else {
                            veloceObjectsWithoutRefColumn.add(objResult.getName());
                        }
                    }
                }
            }
            result.put('objects_with_empty_ref_id', veloceObjectsWithoutRefDebug);

            result.put('objects_without_ref_column', veloceObjectsWithoutRefColumn);

            String resultJSON = JSON.serialize(result);
            System.debug(resultJSON);
        `
        const conn = this.org.getConnection()

        const exec = new apexNode.ExecuteService(conn)
        const execAnonOptions = Object.assign({}, { apexCode: script })
        const result = await exec.executeAnonymous(execAnonOptions)

        if (!result.success) {
            this.ux.log('Failed to execute apex code')
            const out = this.formatDefault(result)
            this.ux.log(out)
            this.ux.log(script)
            process.exit(1)
        }

        let debugInfo = ''
        for (const line of result.logs.split('\n')) {
            if (line.includes('{"objects_without_ref_column":[')) {
                debugInfo = line.split('|')
                debugInfo = debugInfo[debugInfo.length - 1]
                debugInfo = JSON.parse(debugInfo)
                break
            }
        }
        if (!this.flags.perform) {
            if (debugInfo !== '') {
                if (debugInfo['objects_with_empty_ref_id'].length < 1) {
                    this.ux.log('This org has no empty ref ids, all is ok')
                    process.exit(1)
                }
                this.ux.log("the following items haven't ref ids and can be fixed:")
                debugInfo['objects_with_empty_ref_id'].forEach(ob => {
                    this.ux.log(ob)
                })
                this.ux.log('please use --perform flag to fix empty ref ids in listed object')
                process.exit(0)
            }
            this.ux.log("Can't provide dry run info about which objects should be fixed, because there is no info in apex debug response, but you can still use --perform to replace empty ref ids")
            process.exit(1)
        }
        this.ux.log('External ids fixed, please use this commande without --perform flag to verify')

        // Return an object to be displayed with --json
        return { orgId: this.org.getOrgId() }
    }

    private formatDefault(response) {
        let outputText = ''
        if (response.success) {
            outputText += 'SUCCESS\n'
            outputText += `\n${response.logs}`
        } else {
            const diagnostic = response.diagnostic[0]
            if (!response.compiled) {
                outputText += `Error: Line: ${diagnostic.lineNumber}, Column: ${diagnostic.columnNumber}\n`
                outputText += `Error: ${diagnostic.compileProblem}\n`
            } else {
                outputText += 'COMPILE SUCCESS\n'
                outputText += `Error: ${diagnostic.exceptionMessage}\n`
                outputText += `Error: ${diagnostic.exceptionStackTrace}\n`
                outputText += `\n${response.logs}`
            }
        }
        return outputText
    }
}

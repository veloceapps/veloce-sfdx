import {flags, SfdxCommand} from '@salesforce/command';
import {Messages, SfdxError} from '@salesforce/core';
import {AnyJson} from '@salesforce/ts-types';
/* tslint:disable */
const apexNode = require('@salesforce/apex-node');
const parse = require('csv-parse/lib/sync');
const fs = require('fs');
/* tslint:enable */

const MAGIC = '###VELOCEOUTPUT###@';
const MAGIC_SERACH = `DEBUG|${MAGIC}`;
let currentBatch = 0;

// Initialize Messages with the current plugin directory
Messages.importMessagesDirectory(__dirname);

// Load the specific messages for this file. Messages from @salesforce/command, @salesforce/core,
// or any library that is using the messages framework can also be loaded this way.
const messages = Messages.loadMessages('veloce-sfdx', 'apexload');

export default class Org extends SfdxCommand {

  public static description = messages.getMessage('commandDescription');

  public static examples = [
    `$ sfdx veloce:apexload -u gp01 -s PricebookEntry -i sfxId__c ./data/insert.csv
  `];

  public static args = [{name: 'file'}];

  protected static flagsConfig = {
    // flag with a value (-n, --name=VALUE)
    // -s | --sobjecttype SOBJECTTYPE
    // -i | --externalid EXTERNALID
    // -o | ignorefields
    sobjecttype: flags.string({
      char: 's',
      description: messages.getMessage('sobjecttypeFlagDescription'),
      required: true
    }),
    externalid: flags.string({
      char: 'i',
      description: messages.getMessage('externalidFlagDescription'),
      required: true
    }),
    idmap: flags.string({char: 'I', description: messages.getMessage('idmapFlagDescription'), required: true}),
    ignorefields: flags.string({char: 'o', description: messages.getMessage('ignoreFieldsFlagDescription')}),
    batch: flags.string({char: 'b', description: messages.getMessage('batchFlagDescription')}),
    boolfields: flags.string({char: 'B', description: messages.getMessage('boolFieldsFlagDescription')})
  };

  // Comment this out if your command does not require an org username
  protected static requiresUsername = true;

  // Comment this out if your command does not support a hub org username
  protected static supportsDevhubUsername = true;

  // Set this to true if your command requires a project workspace; 'requiresProject' is false by default
  protected static requiresProject = false;

  public async run(): Promise<AnyJson> {
    let ok = true;
    let output = '';
    const batchSize = parseInt(this.flags.batch || 10, 10);
    const sType = this.flags.sobjecttype;
    const extId = this.flags.externalid;
    const ignorefields = (this.flags.ignorefields || '').split(',');
    const boolfields = (this.flags.boolfields || '').split(',');

    const idmap = JSON.parse(fs.readFileSync(this.flags.idmap).toString());

    const fileContent = fs.readFileSync(this.args.file);
    const records = parse(fileContent, {columns: true, bom: true});
    while (true) {
      let objects = '';
      const batch = records.slice(batchSize * currentBatch, batchSize * (currentBatch + 1));
      console.log(`batch#${currentBatch} size: ${batch.length}`);
      if (batch.length === 0) {
        break;
      }
      for (const r of batch) {
        const fields = [];
        for (const [k, value] of Object.entries(r)) {
          let s = '' + value;
          if (s === '' || ignorefields.includes(k)) {
            continue;
          }
          const m = idmap[s];
          if (k !== extId && m) { // dont map ExternalID column!
            s = m;
          }
          if (boolfields.includes(k)) {
            fields.push(`${k}=${s}`);
          } else if (this.isNumber(s)) {
            fields.push(`${k}=${s}`);
          } else {
            fields.push(`${k}='${s
              .replace('\'', '\\\'')
              .replace('\n', '\\n')
              .replace('\r', '\\r')}'`);
          }
        }
        objects += `o.add(new ${sType} (${fields.join(',')}));\n`;
      }

      const script = `
${sType} [] o = new List<${sType}>();
${objects}
upsert o ${extId};
for (${sType} i : o) {
  system.debug('${MAGIC}' + i.Id);
}
`;
      const conn = this.org.getConnection();
      const exec = new apexNode.ExecuteService(conn);
      const execAnonOptions = Object.assign({}, {apexCode: script});
      const result = await exec.executeAnonymous(execAnonOptions);

      this.ux.log(script);

      if (result.success) {
        const newIds = result.logs
          .split('\n')
          .filter(s => s.includes(MAGIC_SERACH))
          .map(s => s.split(MAGIC_SERACH)[1]);
        batch.forEach((r, index) => {
          idmap[r.Id] = newIds[index];
          this.ux.log(`${idmap[r.Id]} => ${newIds[index]}`)
        });
      } else {
        ok = false;
        const out = this.formatDefault(result);
        this.ux.log(out);
        output += `${out}\n`;
      }
      currentBatch++;
    }

    fs.writeFileSync(this.flags.idmap, JSON.stringify(idmap, null, 2));
    if (!ok) {
      throw new SfdxError(output, 'ApexError');
    }
    // Return an object to be displayed with --json
    return {orgId: this.org.getOrgId()};
  }

  private isNumber(s): boolean {
    if (!isNaN(s)) {
      return true;
    }
    return false;
  }

  private formatDefault(response) {
    let outputText = '';
    if (response.success) {
      outputText += 'SUCCESS\n';
      outputText += `\n${response.logs}`;
    } else {
      const diagnostic = response.diagnostic[0];
      if (!response.compiled) {
        outputText += `Error: Line: ${diagnostic.lineNumber}, Column: ${diagnostic.columnNumber}\n`;
        outputText += `Error: ${diagnostic.compileProblem}\n`;
      } else {
        outputText += 'COMPILE SUCCESS\n';
        outputText += `Error: ${diagnostic.exceptionMessage}\n`;
        outputText += `Error: ${diagnostic.exceptionStackTrace}\n`;
        outputText += `\n${response.logs}`;
      }
    }
    return outputText;
  }
}

import { flags, SfdxCommand } from '@salesforce/command';
import {Connection, Logger, Messages, SfdxError} from '@salesforce/core';
import {Tooling} from '@salesforce/core/lib/connection';
import { AnyJson } from '@salesforce/ts-types';
import { QueryResult} from 'jsforce';

/* tslint:disable */
const parse = require('csv-parse/lib/sync');
const fs = require('fs');
/* tslint:enable */
let currentBatch = 0;

// Initialize Messages with the current plugin directory
Messages.importMessagesDirectory(__dirname);

// Load the specific messages for this file. Messages from @salesforce/command, @salesforce/core,
// or any library that is using the messages framework can also be loaded this way.
const messages = Messages.loadMessages('veloce-sfdx', 'load');

const replaceAll = (str, find, replace) => {
  return str.replace(new RegExp(find, 'g'), replace);
};

export default class Org extends SfdxCommand {

  public static description = messages.getMessage('commandDescription');

  public static examples = [
  `$ sfdx veloce:load -f ./ myname.csv --targetusername myOrg@example.com --targetdevhubusername devhub@org.com
  Hello world! This is org: MyOrg and I will be around until Tue Mar 20 2018!
  My hub org id is: 00Dxx000000001234
  `,
  `$ sfdx veloce:load -f ./ myname.csv --targetusername myOrg@example.com
  Hello myname! This is org: MyOrg and I will be around until Tue Mar 20 2018!
  `
  ];

  public static args = [{name: 'file'}];

  protected static flagsConfig = {
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
    idreplacefields: flags.string({char: 'R', description: messages.getMessage('idreplacefieldsFlagDescription'), required: false}),

    printids: flags.boolean({char: 'P', description: messages.getMessage('printidsFlagDescription'), required: false}),
    upsert: flags.boolean({char: 'U', description: messages.getMessage('upsertFlagDescription'), required: false}),
    file: flags.string({char: 'f', description: messages.getMessage('fileFlagDescription'), required: true}),
    idmap: flags.string({char: 'I', description: messages.getMessage('idmapFlagDescription'), required: true}),
    ignorefields: flags.string({char: 'o', description: messages.getMessage('ignoreFieldsFlagDescription')}),
    batch: flags.string({char: 'b', description: messages.getMessage('batchFlagDescription')})
  };

  // Comment this out if your command does not require an org username
  protected static requiresUsername = true;

  // Comment this out if your command does not support a hub org username
  protected static supportsDevhubUsername = true;

  // Set this to true if your command requires a project workspace; 'requiresProject' is false by default
  protected static requiresProject = false;

  public async runSoqlQuery(connection: Connection | Tooling, query: string, logger: Logger): Promise<QueryResult<unknown>> {
    logger.debug('running query');

    const result = await connection.autoFetchQuery(query, {autoFetch: true, maxFetch: 50000});
    logger.debug(`Query complete with ${result.totalSize} records returned`);
    if (result.totalSize) {
      logger.debug('fetching columns for query');
    }
    // remove nextRecordsUrl and force done to true
    delete result.nextRecordsUrl;
    result.done = true;
    return result;
  }

  public async run(): Promise<AnyJson> {
    let ok = true;
    const output = '';
    const batchSize = parseInt(this.flags.batch || 10, 10);
    const sType = this.flags.sobjecttype;
    const extId = this.flags.externalid;
    const ignorefields = this.flags.ignorefields ? this.flags.ignorefields.split(',') : [];
    const idReplaceFields = this.flags.idreplacefields ? this.flags.idreplacefields.split(',') : [];
    const upsert = this.flags.upsert || false;

    if (upsert === false) {
      throw new SfdxError('non-upsert mode is currently NOT SUPPORTED', 'ApexError');
    }

    if (!ignorefields.includes('Id')) {
      ignorefields.push('Id');
    }
    if (!ignorefields.includes(extId) && !upsert) {
      ignorefields.push(extId);
    }

    const fileContent = fs.readFileSync(this.flags.file);
    let idmap;
    try {
      idmap = JSON.parse(fs.readFileSync(this.flags.idmap).toString());
    } catch (err) {
      this.ux.log(`Failed to load ID-Map file: ${this.flags.idmap} will create new file at the end`);
      idmap = {};
    }
    // retrieve types of args
    const conn = this.org.getConnection();
    const fieldsResult = await conn.autoFetchQuery(`
SELECT EntityDefinition.QualifiedApiName, QualifiedApiName, DataType
FROM FieldDefinition
WHERE EntityDefinition.QualifiedApiName IN ('${this.flags.sobjecttype}') ORDER BY QualifiedApiName
    `, {autoFetch: true, maxFetch: 50000});

    for (const f of fieldsResult.records) {
      const apiName = f['QualifiedApiName'];
      const datatype = f['DataType'];
      if (datatype.includes('Formula')) {
        ignorefields.push(apiName);
      }
    }

    const records = parse(fileContent, {columns: true, bom: true});
    while (true) {
      const batch = records.slice(batchSize * currentBatch, batchSize * (currentBatch + 1));
      console.log(`batch#${currentBatch} size: ${batch.length}`);
      if (batch.length === 0) {
        break;
      }
      const ids = [];
      const extId2OldId = {};
      batch.forEach(r => {
        // Populate external ID from ID
        if (!r[extId]) {
          this.ux.log(`${r.Id}: Auto-populating ${extId} with ${r.Id}`);
          r[extId] = r.Id;
          // remove external ID from ignore fields
          if (ignorefields.includes(extId)) {
            const index = ignorefields.indexOf(extId);
            if (index > -1) {
              ignorefields.splice(index, 1);
            }
          }
        }
        ids.push(r[extId]);
        extId2OldId[r[extId]] = r.Id;
      });

      const objects = [];
      for (const r of batch) {
        const obj: Record<string, string> = {};
        for (const [k, value] of Object.entries(r)) {
          let s = '' + value;
          if (s === '' || ignorefields.includes(k)) {
            continue;
          }
          if (idReplaceFields.includes(k)) {
            for (const [key, v] of Object.entries(idmap)) {
              const olds = s;
              s = replaceAll(olds, key, v as string);
              if (olds !== s) {
                this.ux.log(`CONTENT: ${key} => ${v}`);
              }
            }
          }
          const m = idmap[s];
          if (k !== extId && m) { // dont map ExternalID column!
            s = m;
          }
          obj[k] = s;
        }
        objects.push(obj);
      }

      const job = conn.bulk.createJob(this.flags.sobjecttype, 'upsert', {
        extIdField: this.flags.externalid as string,
        concurrencyMode: 'Serial'
      });
      job.on('error', (err): void => {
        ok = false;
        this.ux.log(`Error: ${err}`);
      });
      const newBatch = job.createBatch();
      newBatch.execute(objects);
      await new Promise((resolve, reject) => {
        newBatch.on('queue', batchInfo => {
          const batchId = batchInfo.id;
          const b = job.batch(batchId);
          b.on('response', res => {
            resolve(res);
          });
          b.on('error', err => {
            ok = false;
            this.ux.log(`Error: ${err}`);
            reject(err);
          });
          b.poll(5 * 1000, 300 * 1000);
        });
      });
      // Query back Ids
      const query = `SELECT Id,${extId} FROM ${sType} WHERE ${extId} in ('${ids.join('\',\'')}')`;
      const queryResult: QueryResult<unknown> = await this.runSoqlQuery(conn, query, this.logger);
      if (!queryResult.done) {
        throw new SfdxError(`Query not done: ${query}`, 'ApexError');
      }
      /* tslint:disable */
      queryResult.records.forEach((r: any) => {
        if (extId2OldId[r[extId]] && r.Id) {
          if (extId2OldId[r[extId]] != r.Id) {
            this.ux.log(`${extId2OldId[r[extId]]} => ${r.Id}`);
            idmap[extId2OldId[r[extId]]] = r.Id;
          }
        } else {
          this.ux.log(`MISSING => ${r.Id}`);
        }
      });
      /* tslint:enable */
      currentBatch++;
    }

    fs.writeFileSync(this.flags.idmap, JSON.stringify(idmap, null, 2), {flag: 'w+'});
    if (!ok) {
      throw new SfdxError(output, 'ApexError');
    }
    this.ux.log('Data successfully loaded');
    // Return an object to be displayed with --json
    return {orgId: this.org.getOrgId()};
  }
}

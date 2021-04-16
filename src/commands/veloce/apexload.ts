import {flags, SfdxCommand} from '@salesforce/command';
import {Connection, Logger, Messages, SfdxError} from '@salesforce/core';
import {Tooling} from '@salesforce/core/lib/connection';
import {AnyJson} from '@salesforce/ts-types';
import {ensureJsonArray, ensureJsonMap, ensureString, isJsonArray, toJsonMap} from '@salesforce/ts-types';
import {Field, FieldType, SoqlQueryResult} from '../../shared/dataSoqlQueryTypes';

/* tslint:disable */
const apexNode = require('@salesforce/apex-node');
const parse = require('csv-parse/lib/sync');
const fs = require('fs');
/* tslint:enable */
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
    upsert: flags.boolean({char: 'U', description: messages.getMessage('upsertFlagDescription'), required: false}),
    idmap: flags.string({char: 'I', description: messages.getMessage('idmapFlagDescription'), required: true}),
    ignorefields: flags.string({char: 'o', description: messages.getMessage('ignoreFieldsFlagDescription')}),
    batch: flags.string({char: 'b', description: messages.getMessage('batchFlagDescription')}),
    boolfields: flags.string({char: 'B', description: messages.getMessage('boolFieldsFlagDescription')}),
    numericfields: flags.string({char: 'N', description: messages.getMessage('numericFieldsFlagDescription')})
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
    const numericfields = (this.flags.numericfields || '').split(',');

    const upsert = this.flags.upsert || false;

    const idmap = JSON.parse(fs.readFileSync(this.flags.idmap).toString());

    const fileContent = fs.readFileSync(this.args.file);
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
        if (r[extId]) {
          ids.push(r[extId]);
          extId2OldId[r[extId]] = r.Id;
        } else {
          this.ux.log(`${r.Id}:Missing external ID, will use mapped/original Id instead: ${idmap[r.Id] ? idmap[r.Id] : r.Id}`);
        }
      });
      let script = '';
      let objects = '';
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
            fields.push(`${upsert ? '' : 'o.'}${k}=${s}`);
          } else if (numericfields.includes(k)) {
            fields.push(`${upsert ? '' : 'o.'}${k}=${s}`);
          } else {
            fields.push(`${upsert ? '' : 'o.'}${k}='${s
              .replace('\'', '\\\'')
              .replace('\n', '\\n')
              .replace('\r', '\\r')}'`);
          }
        }
        if (upsert) {
          objects += `o.add(new ${sType} (${fields.join(',')}));\n`;
        } else {
          if (r[extId]) {
            objects += `o = [SELECT Id FROM ${sType} WHERE ${extId}='${r[extId]}' LIMIT 1];\n`;
          } else {
            // Fallback to mapped Id
            const id = idmap[r.Id] ? idmap[r.Id] : r.Id;
            objects += `o = [SELECT Id FROM ${sType} WHERE Id='${id}' LIMIT 1];\n`;
          }
          objects += `${fields.join(';')};\n`;
          objects += 'update o;\n';
        }
      }

      if (upsert) {
        script = `
${sType} [] o = new List<${sType}>();
${objects}
upsert o ${extId};
`;
      } else {
        // Update only mode!
        script = `
${sType} o;
${objects}
`;
      }

      const conn = this.org.getConnection();
      const exec = new apexNode.ExecuteService(conn);
      const execAnonOptions = Object.assign({}, {apexCode: script});
      const result = await exec.executeAnonymous(execAnonOptions);

      if (!result.success) {
        ok = false;
        const out = this.formatDefault(result);
        this.ux.log(out);
        output += `${out}\n`;
      }
      // Query back Ids
      const query = `SELECT Id,${extId} FROM ${sType} WHERE ${extId} in ('${ids.join('\',\'')}')`;
      const queryResult: SoqlQueryResult = await this.runSoqlQuery(conn, query, this.logger);
      if (!queryResult.result.done) {
        throw new SfdxError(`Query not done: ${query}`, 'ApexError');
      }
      /* tslint:disable */
      queryResult.result.records.forEach((r: any) => {
        if (extId2OldId[r[extId]] != r.Id) {
          this.ux.log(`${extId2OldId[r[extId]]} => ${r.Id}`);
        }
        if (extId2OldId[r[extId]] && r.Id) {
          idmap[extId2OldId[r[extId]]] = r.Id;
        } else {
          throw new SfdxError(`Cannot insert id map record (missing srcId/targetId), ${extId}=${r[extId]}: ${extId2OldId[r[extId]]} => ${r.Id}`, 'ApexError');
        }
      });
      /* tslint:enable */
      currentBatch++;
    }

    fs.writeFileSync(this.flags.idmap, JSON.stringify(idmap, null, 2));
    if (!ok) {
      throw new SfdxError(output, 'ApexError');
    }
    this.ux.log('Data successfully loaded');
    // Return an object to be displayed with --json
    return {orgId: this.org.getOrgId()};
  }

  public async runSoqlQuery(connection: Connection | Tooling, query: string, logger: Logger
  ): Promise<SoqlQueryResult> {
    let columns: Field[] = [];
    logger.debug('running query');

    const result = await connection.autoFetchQuery(query, {autoFetch: true, maxFetch: 50000});
    logger.debug(`Query complete with ${result.totalSize} records returned`);
    if (result.totalSize) {
      logger.debug('fetching columns for query');
      columns = await this.retrieveColumns(connection, query);
    }

    // remove nextRecordsUrl and force done to true
    delete result.nextRecordsUrl;
    result.done = true;
    return {
      query,
      columns,
      result
    };
  }

  /**
   * Utility to fetch the columns involved in a soql query.
   *
   * Columns are then transformed into one of three types, Field, SubqueryField and FunctionField. List of
   * fields is returned as the product.
   *
   * @param connection
   * @param query
   */
  public async retrieveColumns(connection: Connection | Tooling, query: string):
    Promise<Field[]> {
    // eslint-disable-next-line no-underscore-dangle
    const columnUrl = `${connection._baseUrl()}/query?q=${encodeURIComponent(query)}&columns=true`;
    const results = toJsonMap(await connection.request(columnUrl));
    const columns
      :
      Field[] = [];
    for (let column of ensureJsonArray(results.columnMetadata)) {
      column = ensureJsonMap(column);
      const name = ensureString(column.columnName);

      if (isJsonArray(column.joinColumns) && column.joinColumns.length > 0) {
        if (column.aggregate) {
          const field: Field = {
            fieldType: FieldType.subqueryField,
            name,
            fields: []
          };
          for (const subcolumn of column.joinColumns) {
            const f: Field = {
              fieldType: FieldType.field,
              name: ensureString(ensureJsonMap(subcolumn).columnName)
            };
            if (field.fields) field.fields.push(f);
          }
          columns.push(field);
        } else {
          for (const subcolumn of column.joinColumns) {
            const f: Field = {
              fieldType: FieldType.field,
              name: `${name}.${ensureString(ensureJsonMap(subcolumn).columnName)}`
            };
            columns.push(f);
          }
        }
      } else if (column.aggregate) {
        const field: Field = {
          fieldType: FieldType.functionField,
          name: ensureString(column.displayName)
        };
        // If it isn't an alias, skip so the display name is used when messaging rows
        if (!/expr[0-9]+/.test(name)) {
          field.alias = name;
        }
        columns.push(field);
      } else {
        columns.push({fieldType: FieldType.field, name} as Field);
      }
    }
    return columns;
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

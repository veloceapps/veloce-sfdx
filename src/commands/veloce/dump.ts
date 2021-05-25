import {flags, SfdxCommand} from '@salesforce/command';
import {Messages} from '@salesforce/core';
import {AnyJson} from '@salesforce/ts-types';
/* tslint:disable */
const fs = require('fs');
const csvWriter = require('csv-write-stream');
/* tslint:enable */

// Initialize Messages with the current plugin directory
Messages.importMessagesDirectory(__dirname);

// Load the specific messages for this file. Messages from @salesforce/command, @salesforce/core,
// or any library that is using the messages framework can also be loaded this way.
const messages = Messages.loadMessages('veloce-sfdx', 'dump');

// const SYSTEM_DATE_FIELDS = [
//   'CreatedDate',
//   'LastModifiedDate',
//   'SystemModstamp',
//   'LastViewedDate',
//   'LastReferencedDate',
// ];
// based on this: https://github.com/salesforcecli/data/tree/main/packages/plugin-data/src/commands/force/data

/*

*/

export default class Org extends SfdxCommand {

  public static description = messages.getMessage('commandDescription');

  public static examples = [
    `$ sfdx veloce:dump -s Product2 -i 00Dxx000000001234 --targetusername myOrg@example.com --targetdevhubusername devhub@org.com
  Hello world! This is org: MyOrg and I will be around until Tue Mar 20 2018!
  My hub org id is: 00Dxx000000001234
  `,
    `$ sfdx veloce:dump -s Product2 -i 00Dxx000000001234 --targetusername myOrg@example.com
  Hello myname! This is org: MyOrg and I will be around until Tue Mar 20 2018!
  `
  ];

  public static args = [{name: 'file'}];

  protected static flagsConfig = {
    id: flags.string({
      char: 'i',
      description: messages.getMessage('idFlagDescription'),
      required: false
    }),
    onlyfields: flags.string({
      char: 'F',
      description: messages.getMessage('onlyfieldsFlagDescription'),
      required: false
    }),
    where: flags.string({
      char: 'w',
      description: messages.getMessage('whereFlagDescription'),
      required: false
    }),
    sobjecttype: flags.string({
      char: 's',
      description: messages.getMessage('sobjecttypeFlagDescription'),
      required: true
    }),
    idmap: flags.string({char: 'I', description: messages.getMessage('idmapFlagDescription'), required: true}),
    file: flags.string({
      char: 'f',
      description: messages.getMessage('fileFlagDescription'),
      required: true
    }),
    ignorefields: flags.string({char: 'o', description: messages.getMessage('ignoreFieldsFlagDescription')}),
    idreplacefields: flags.string({char: 'R', description: messages.getMessage('idreplacefieldsFlagDescription'), required: false})
  };

  // Comment this out if your command does not require an org username
  protected static requiresUsername = true;

  // Comment this out if your command does not support a hub org username
  protected static supportsDevhubUsername = true;

  // Set this to true if your command requires a project workspace; 'requiresProject' is false by default
  protected static requiresProject = false;

  public async run(): Promise<AnyJson> {
    const idReplaceFields = this.flags.idreplacefields ? this.flags.idreplacefields.split(',') : [];
    const lookupFields = [];
    const onlyFields = [];
    if (this.flags.onlyfields) {
      for (const f of this.flags.onlyfields.split(',')) {
        onlyFields.push(f.trim().toLowerCase());
      }
    }

    const ignoreFields = this.flags.ignorefields?.split(',') || ['CreatedDate', 'CreatedById', 'LastModifiedDate', 'LastModifiedById', 'SystemModstamp', 'IsDeleted', 'IsArchived', 'LastViewedDate', 'LastReferencedDate', 'UserRecordAccessId', 'OwnerId'];
    let idmap: { [key: string]: string; };
    try {
      idmap = JSON.parse(fs.readFileSync(this.flags.idmap).toString());
    } catch (err) {
      this.ux.log(`No ID-Map file: ${this.flags.idmap} will not perform reverse-id map!`);
      idmap = {};
    }
    const reverseIdmap: { [key: string]: string; } = {};
    for (const [key, value] of Object.entries(idmap)) {
      reverseIdmap[value] = key;
    }

    const writer = csvWriter({
      separator: ',',
      newline: '\n',
      headers: undefined,
      sendHeaders: true,
      bom: true
    });
    writer.pipe(fs.createWriteStream(this.flags.file));

    const fields = [];
    const conn = this.org.getConnection();
    const fieldsResult = await conn.autoFetchQuery(`
SELECT EntityDefinition.QualifiedApiName, QualifiedApiName, DataType
FROM FieldDefinition
WHERE EntityDefinition.QualifiedApiName IN ('${this.flags.sobjecttype}') ORDER BY QualifiedApiName
    `, {autoFetch: true, maxFetch: 50000});

    for (const f of fieldsResult.records) {
      const apiName = f['QualifiedApiName'];
      const datatype = f['DataType'];
      if (datatype.includes('Formula') || ignoreFields.includes(apiName) ||
        (onlyFields.length > 0 && !onlyFields.includes(apiName.trim().toLowerCase()))) {
        continue;
      }
      if (datatype.includes('Lookup')) {
        lookupFields.push(apiName);
      }
      fields.push(apiName);
    }
    let query;
    if (this.flags.id) {
      const newId = reverseIdmap[this.flags.id];
      if (newId) {
        // Reverse mapping IDs
        this.ux.log(`QUERY: ${this.flags.id} => ${newId}`);
        this.flags.id = newId;
      }
      query = `SELECT ${fields.join(',')} FROM ${this.flags.sobjecttype} WHERE Id = '${this.flags.id}' ORDER BY Name,Id`;
    } else if (this.flags.where) {
      query = `SELECT ${fields.join(',')} FROM ${this.flags.sobjecttype} WHERE ${this.flags.where} ORDER BY Name,Id`;
    } else {
      query = `SELECT ${fields.join(',')} FROM ${this.flags.sobjecttype} ORDER BY Name,Id`;
    }

    const result = await conn.autoFetchQuery(query, {autoFetch: true, maxFetch: 100000});
    this.ux.log(`Query complete with ${result.totalSize} records returned`);
    if (result.totalSize) {
      for (const r of result.records) {
        delete r['attributes'];
        // reverse map Ids
        for (const f of lookupFields) {
          const newId = reverseIdmap[r[f]];
          if (r[f] && newId) {
            // Reverse mapping IDs
            this.ux.log(`${r[f]} => ${newId}`);
            r[f] = newId;
          }
        }
        for (const [key, value] of Object.entries(r)) {
          if (idReplaceFields.includes(key)) {
            let s = '' + value;
            for (const [k, v] of Object.entries(reverseIdmap)) {
              const olds = s;
              s = olds.replaceAll(k, v as string);
              if (olds !== s) {
                this.ux.log(`CONTENT: ${k} => ${v}`);
              }
            }
            r[key] = s;
          }
        }

        writer.write(r);
      }
    }
    writer.end();
    // Return an object to be displayed with --json
    return {};
  }
}

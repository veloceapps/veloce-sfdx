import {flags, SfdxCommand} from '@salesforce/command'
import {Connection, Logger, Messages, SfdxError} from '@salesforce/core'
import {Tooling} from '@salesforce/core/lib/connection'
import {AnyJson} from '@salesforce/ts-types'
import {QueryResult} from 'jsforce'
import 'ts-replace-all'
import { sleep } from '../../shared/utils/common.utils'

/* tslint:disable */
const apexNode = require('@salesforce/apex-node');
const parse = require('csv-parse/lib/sync');
const fs = require('fs');
/* tslint:enable */
let currentBatch = 0

// Initialize Messages with the current plugin directory
Messages.importMessagesDirectory(__dirname)

// Load the specific messages for this file. Messages from @salesforce/command, @salesforce/core,
// or any library that is using the messages framework can also be loaded this way.
const messages = Messages.loadMessages('veloce-sfdx', 'apexload')
const salesforceIdRegex = new RegExp('^[a-zA-Z0-9]{18}$')

const keysToLowerCase = (rWithCase: object): object => {
  // convert keys to lowercase
  const keys = Object.keys(rWithCase)
  let n = keys.length

  /* tslint:disable-next-line */
  const r: any = {};
  while (n--) {
    const key = keys[n]
    if (key) {
      r[key.toLowerCase()] = rWithCase[key]
    }
  }
  return r
}

const validSFID = (input: string): boolean => {
  // https://stackoverflow.com/a/29299786/1333724
  if (!salesforceIdRegex.test(input)) {
    return false
  }
  const parts = [input.substr(0, 5),
    input.substr(5, 5),
    input.substr(10, 5)]
  const chars: number[] = [0, 0, 0]
  for (let j = 0; j < parts.length; j++) {
    const word = parts[j]
    for (let i = 0; i < word.length; i++) {
      const char = word.charCodeAt(i)
      if (char >= 65 && char <= 90) {
        chars[j] += 1 << i
      }
    }
  }
  for (let i = 0; i < chars.length; i++) {
    const c = chars[i]
    if (c <= 25) {
      chars[i] = c + 65
    } else {
      chars[i] = c - 25 + 48
    }
  }

  return (String.fromCharCode(chars[0], chars[1], chars[2])) === input.substr(15, 3)
}

export default class Org extends SfdxCommand {

  public static description = messages.getMessage('commandDescription')

  public static examples = [
    `$ sfdx veloce:apexload -u gp01 -s PricebookEntry -i sfxId__c -f ./data/insert.csv
  `]

  public static args = [{name: 'file'}]

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
    idreplacefields: flags.string({
      char: 'R',
      description: messages.getMessage('idreplacefieldsFlagDescription'),
      required: false
    }),

    printids: flags.boolean({char: 'P', description: messages.getMessage('printidsFlagDescription'), required: false}),
    upsert: flags.boolean({char: 'U', description: messages.getMessage('upsertFlagDescription'), required: false}),
    dry: flags.boolean({char: 'd', description: messages.getMessage('dryFlagDescription'), required: false}),
    diff: flags.boolean({char: 'D', description: messages.getMessage('diffFlagDescription'), required: false}),
    file: flags.string({char: 'f', description: messages.getMessage('fileFlagDescription'), required: true}),
    idmap: flags.string({char: 'I', description: messages.getMessage('idmapFlagDescription'), required: true}),
    ignorefields: flags.string({char: 'o', description: messages.getMessage('ignoreFieldsFlagDescription')}),
    batch: flags.string({char: 'b', description: messages.getMessage('batchFlagDescription')})
  }

  // Comment this out if your command does not require an org username
  protected static requiresUsername = true

  // Comment this out if your command does not support a hub org username
  protected static supportsDevhubUsername = true

  // Set this to true if your command requires a project workspace; 'requiresProject' is false by default
  protected static requiresProject = false

  public async run(): Promise<AnyJson> {
    let ok = true
    let output = ''
    const batchSize = parseInt((this.flags.batch || '5'), 10)
    const sType = this.flags.sobjecttype.toLowerCase()
    const extId = this.flags.externalid.toLowerCase()
    const ignorefields = this.flags.ignorefields ? this.flags.ignorefields.toLowerCase().split(',') : []
    const idReplaceFields = this.flags.idreplacefields ? this.flags.idreplacefields.toLowerCase().split(',') : []
    const upsert = this.flags.upsert || false
    const dry = this.flags.dry || false
    let diff = this.flags.diff || true

    if (!ignorefields.includes('id')) {
      ignorefields.push('id')
    }
    if (!ignorefields.includes(extId) && !upsert) {
      ignorefields.push(extId)
    }
    const boolfields = []
    const datefields = []
    const numericfields = []

    const fileContent = fs.readFileSync(this.flags.file)
    let idmap
    try {
      idmap = JSON.parse(fs.readFileSync(this.flags.idmap).toString())
    } catch (err) {
      this.ux.log(`Failed to load ID-Map file: ${this.flags.idmap} will create new file at the end`)
      idmap = {}
    }

    // retrieve types of args
    const conn = this.org.getConnection()
    const fieldsResult = await conn.autoFetchQuery(`
      SELECT EntityDefinition.QualifiedApiName, QualifiedApiName, DataType
      FROM FieldDefinition
      WHERE EntityDefinition.QualifiedApiName IN ('${this.flags.sobjecttype}')
      ORDER BY QualifiedApiName
    `, {autoFetch: true, maxFetch: 50000})

    for (const f of fieldsResult.records) {
      const apiName = f['QualifiedApiName'].toLowerCase()
      const datatype = f['DataType']
      if (datatype.includes('Formula')) {
        ignorefields.push(apiName)
      } else if (datatype.includes('Checkbox')) {
        boolfields.push(apiName)
      } else if (datatype.includes('Number') || datatype.includes('Percent') || datatype.includes('Currency')) {
        numericfields.push(apiName)
      } else if (datatype.includes('Date')) {
        datefields.push(apiName)
      }
    }

    const records = parse(fileContent, {columns: true, bom: true})

    if (records.length > 128 && !this.flags.diff) {
       this.ux.log('Turning off Auto-Diff mode because too much data, use --diff to force it ON')
       diff = false
    }

    let hasFailedExtIds = false
    const seenExtIds = []

    records.forEach(rWithCase => {
      const r = keysToLowerCase(rWithCase)

      if (r[extId] && seenExtIds.includes(r[extId])) {
        this.ux.log(`${r['id']}: Duplicated Value ${r[extId]} for key ${extId}, External IDs MUST be unique across the file`)
        hasFailedExtIds = true
      }
      // Fail if id's are empty
      if (!r[extId]) {
        this.ux.log(`${r['id']}: ${extId} is empty please populate with some truly unique ID and proceed`)
        hasFailedExtIds = true
      } else {
        seenExtIds.push(r[extId])
      }
    })
    if (hasFailedExtIds) {
      throw new SfdxError(`Failed because at least one ${extId} (duplicate or empty)`)
    }

    while (true) {
      const batch = records.slice(batchSize * currentBatch, batchSize * (currentBatch + 1))
      this.ux.log(`batch#${currentBatch} size: ${batch.length}`)
      if (batch.length === 0) {
        break
      }
      const ids: string[] = []
      let extId2OldOrgValues: { [key: string]: object; } = {}

      batch.forEach(rWithCase => {
        const r = keysToLowerCase(rWithCase)
        ids.push(r[extId])
      })
      let script = ''
      let objects = ''
      const idsToValidate = new Set<string>()
      let keys = []
      for (const rWithCase of batch) {
        const r = keysToLowerCase(rWithCase)

        const fields = []
        const currentKeys = []
        for (const [k, value] of Object.entries(r)) {

          let s = '' + value
          if (ignorefields.includes(k)) {
            continue
          }

          if (!currentKeys.includes(k)) {
            currentKeys.push(k)
          }
          keys = currentKeys

          if (idReplaceFields.includes(k)) {
            for (const [key, v] of Object.entries(idmap)) {
              const olds = s
              s = olds.replaceAll(key, v as string)
              if (olds !== s) {
                this.ux.log(`CONTENT: ${key} => ${v}`)
              }
            }
          }
          const m = idmap[s]
          if (k !== extId && m) { // dont map ExternalID column!
            s = m
          }
          if (s === '') {
            fields.push(`${upsert ? '' : 'o.'}${k}=null`)
          } else if (boolfields.includes(k)) {
            if (s === '1') {
              fields.push(`${upsert ? '' : 'o.'}${k}=true`)
            } else if (s === '0') {
              fields.push(`${upsert ? '' : 'o.'}${k}=false`)
            } else {
              fields.push(`${upsert ? '' : 'o.'}${k}=${s}`)
            }
          } else if (datefields.includes(k)) {
            fields.push(`${upsert ? '' : 'o.'}${k}=date.valueOf('${s}')`)
          } else if (numericfields.includes(k)) {
            fields.push(`${upsert ? '' : 'o.'}${k}=${s}`)
          } else {
            if (k !== extId && validSFID(s)) {
              idsToValidate.add(s)
            }
            fields.push(`${upsert ? '' : 'o.'}${k}='${s
              .replaceAll('\\', '\\\\')
              .replaceAll('\'', '\\\'')
              .replaceAll('\n', '\\n')
              .replaceAll('\r', '\\r')}'`)
          }
        }

        if (upsert) {
          objects += `o.add(new ${sType} (${fields.join(',')}));\n`
        } else {
          if (this.flags.printids) {
            this.ux.log(`ID: ${extId} = ${r[extId]}`)
          }
          objects += `o = [SELECT Id FROM ${sType} WHERE ${extId}='${r[extId]}' LIMIT 1];\n`
          objects += `${fields.join(';')};\n`
          objects += 'update o;\n'
        }
      }

      extId2OldOrgValues = diff ? await this.getOldRecords(conn, keys, sType, extId, ids) : {}
      script = ""
      if (upsert) {
        for (const vid of idsToValidate) {
          script += `Database.query('SELECT Id FROM '+((Id)'${vid}').getsobjecttype()+' WHERE Id = \\'${vid}\\'');\n`
        }
        script += `
${sType} [] o = new List<${sType}>();
${objects}
upsert o ${extId};
`
      } else {
        for (const vid of idsToValidate) {
          script += `Database.query('SELECT Id FROM '+((Id)'${vid}').getsobjecttype()+' WHERE Id = \\'${vid}\\');\n`
        }
        // Update only mode!
        script = `
${sType} o;
${objects}
`
      }

      await sleep(300) // prevent api rate limit\
      this.ux.log('sleep 300 ms')
      if (!dry) {
        const exec = new apexNode.ExecuteService(conn)
        const execAnonOptions = Object.assign({}, {apexCode: script})
        const result = await exec.executeAnonymous(execAnonOptions)

        if (!result.success) {
          ok = false
          const out = this.formatDefault(result)
          this.ux.log(out)
          output += `${out}\n`
          this.ux.log('Executed Script START')
          this.ux.log(script)
          this.ux.log('Executed Script END')
          output += `${out}\n`
        }
      } else {
        this.ux.log('No Data Updated, because running in DRY mode')
      }

      // Query back Ids
      const newIds = await this.getIds(conn, sType, extId, ids)
      batch.forEach(rWithCase => {
        const r = keysToLowerCase(rWithCase)
        let changeType: string
        let oldOrgValue: object
        if (diff) {
          oldOrgValue = extId2OldOrgValues[r[extId]]
          changeType = this.hasChanges(idmap, ignorefields, extId, oldOrgValue, r)
        } else {
          changeType = ''
        }

        if (r['id'] && newIds[r[extId]]) {
          this.ux.log(`${r['id']} => ${newIds[r[extId]]} <${changeType}>`)
          if (r['id'] !== newIds[r[extId]]) {
            idmap[r['id']] = newIds[r[extId]]
          }
        } else {
          this.ux.log(`${r['id'] ? r['id'] : 'MISSING'} => ${newIds[r[extId]] ? newIds[r[extId]] : '??????????????????'} <${changeType}>`)
        }
        if (diff) {
          this.printChanges(idmap, ignorefields, extId, oldOrgValue, r)
        }
      })

      /* tslint:enable */
      currentBatch++
    }

    if (!dry) {
      fs.writeFileSync(this.flags.idmap, JSON.stringify(idmap, null, 2), {flag: 'w+'})
    } else {
      this.ux.log(`Skipping write to idmap file because in dry mode: ${this.flags.idmap}`)
    }
    if (!ok) {
      throw new SfdxError(output, 'ApexError')
    }
    this.ux.log('Data successfully loaded')
    // Return an object to be displayed with --json
    return {orgId: this.org.getOrgId()}
  }

  public hasChanges(idmap: object, ignorefields: string[], extId: string, oldObj: object, obj: object): 'NEW'|'CHANGE'|'UNCHANGED' {
    for (const k of Object.keys(obj)) {
      if (!k) {
        continue
      }
      if (ignorefields.includes(k)) {
        continue
      }
      if (k === 'id') {
        continue
      }
      if (!oldObj) {
        return 'NEW'
      }
      let o = obj[k]
      if (k !== extId && idmap[obj[k]]) {
        o = idmap[obj[k]]
      }
      if ('' + oldObj[k] !== '' + o && (!(oldObj[k] === null && o === ''))) {
        return 'CHANGE'
      }

    }
    return 'UNCHANGED'
  }

  public printChanges(idmap: object, ignorefields: string[], extId: string, oldObj: object, obj: object) {
    for (const k of Object.keys(obj)) {
      if (k === 'id') {
        continue
      }
      if (ignorefields.includes(k)) {
        continue
      }
      if (!k) {
        continue
      }
      if (!oldObj) {
        this.ux.log(`  ${k}: ${('' + obj[k]).length > 512 ? '...' : obj[k]}`)
        continue
      }
      let o = obj[k]
      if (k !== extId && idmap[obj[k]]) {
        o = idmap[obj[k]]
      }
      if ('' + oldObj[k] !== '' + o && (!(oldObj[k] === null && o === ''))) {
        this.ux.log(`  ${k}: ${oldObj[k] === undefined ? '' : ('' + oldObj[k]).length > 512 ? '...' : oldObj[k]} => ${('' + o).length > 512 ? '...' : o}`)
      }
    }
  }

  public async getOldRecords(conn: Connection, keys: string[], sType: string, extIdField: string, ids: string[]): Promise<{ [key: string]: object; }> {
    const extId2OldValues: { [key: string]: object; } = {}
    // Query back Ids
    const query = `SELECT ${keys.join(',')}
                   FROM ${sType}
                   WHERE ${extIdField} in ('${ids.join('\',\'')}')`

    const queryResult: QueryResult<unknown> = await this.runSoqlQuery(conn, query, this.logger)

    if (!queryResult.done) {
      throw new SfdxError(`Query not done: ${query}`, 'ApexError')
    }
    /* tslint:disable */
    queryResult.records.forEach((rWithCase: any) => {
      const r = keysToLowerCase(rWithCase)
      extId2OldValues[r[extIdField]] = r
    });
    return extId2OldValues
  }

  public async getIds(conn: Connection, sType: string, extIdField: string, ids: string[]): Promise<{ [key: string]: string; }> {
    const extId2OldValues: { [key: string]: string; } = {}
    // Query back Ids
    const query = `SELECT Id,${extIdField}
                   FROM ${sType}
                   WHERE ${extIdField} in ('${ids.join('\',\'')}')`

    const queryResult: QueryResult<unknown> = await this.runSoqlQuery(conn, query, this.logger)

    if (!queryResult.done) {
      throw new SfdxError(`Query not done: ${query}`, 'ApexError')
    }
    /* tslint:disable */
    queryResult.records.forEach((rWithCase: any) => {
      const r = keysToLowerCase(rWithCase)
      extId2OldValues[r[extIdField]] = r['id']
    });
    return extId2OldValues
  }

  public async runSoqlQuery(connection: Connection | Tooling, query: string, logger: Logger
  ): Promise<QueryResult<unknown>> {
    logger.debug('running query')

    const result = await connection.autoFetchQuery(query, {autoFetch: true, maxFetch: 50000})
    logger.debug(`Query complete with ${result.totalSize} records returned`)
    if (result.totalSize) {
      logger.debug('fetching columns for query')
    }
    // remove nextRecordsUrl and force done to true
    delete result.nextRecordsUrl
    result.done = true
    return result
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

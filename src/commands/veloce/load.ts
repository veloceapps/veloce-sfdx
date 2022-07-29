import { flags, SfdxCommand } from '@salesforce/command'
import {Connection, Logger, Messages, SfdxError} from '@salesforce/core'
import {Tooling} from '@salesforce/core/lib/connection'
import { AnyJson } from '@salesforce/ts-types'
import { QueryResult} from 'jsforce'
import 'ts-replace-all'

/* tslint:disable */
const apexNode = require('@salesforce/apex-node');
const parse = require('csv-parse/lib/sync');
const fs = require('fs');
/* tslint:enable */
let currentBatch = 0
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

// Initialize Messages with the current plugin directory
Messages.importMessagesDirectory(__dirname)

// Load the specific messages for this file. Messages from @salesforce/command, @salesforce/core,
// or any library that is using the messages framework can also be loaded this way.
const messages = Messages.loadMessages('veloce-sfdx', 'load')
export default class Org extends SfdxCommand {

  public static description = messages.getMessage('commandDescription')

  public static examples = [
  `$ sfdx veloce:load -f ./ myname.csv --targetusername myOrg@example.com --targetdevhubusername devhub@org.com
  Hello world! This is org: MyOrg and I will be around until Tue Mar 20 2018!
  My hub org id is: 00Dxx000000001234
  `,
  `$ sfdx veloce:load -f ./ myname.csv --targetusername myOrg@example.com
  Hello myname! This is org: MyOrg and I will be around until Tue Mar 20 2018!
  `
  ]

  public static args = [{name: 'file'}]

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
  }

  // Comment this out if your command does not require an org username
  protected static requiresUsername = true

  // Comment this out if your command does not support a hub org username
  protected static supportsDevhubUsername = true

  // Set this to true if your command requires a project workspace; 'requiresProject' is false by default
  protected static requiresProject = false

  public async runSoqlQuery(connection: Connection | Tooling, query: string, logger: Logger): Promise<QueryResult<unknown>> {
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

  public async run(): Promise<AnyJson> {
    let ok = true
    const output = ''
    const batchSize = parseInt((this.flags.batch || '10'), 10)
    const sType = this.flags.sobjecttype.toLowerCase()
    const extId = this.flags.externalid.toLowerCase()
    const ignorefields = this.flags.ignorefields ? this.flags.ignorefields.toLowerCase().split(',') : []
    const idReplaceFields = this.flags.idreplacefields ? this.flags.idreplacefields.toLowerCase().split(',') : []
    const upsert = this.flags.upsert || false

    if (upsert === false) {
      throw new SfdxError('non-upsert mode is currently NOT SUPPORTED', 'ApexError')
    }

    if (!ignorefields.includes('id')) {
      ignorefields.push('id')
    }
    if (!ignorefields.includes(extId) && !upsert) {
      ignorefields.push(extId)
    }

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
WHERE EntityDefinition.QualifiedApiName IN ('${this.flags.sobjecttype}') ORDER BY QualifiedApiName
    `, {autoFetch: true, maxFetch: 50000})

    for (const f of fieldsResult.records) {
      const apiName = f['QualifiedApiName']
      const datatype = f['DataType']
      if (datatype.includes('Formula')) {
        ignorefields.push(apiName.toLowerCase())
      }
    }

    const records = parse(fileContent, {columns: true, bom: true})
    while (true) {
      const batch = records.slice(batchSize * currentBatch, batchSize * (currentBatch + 1))
      console.log(`batch#${currentBatch} size: ${batch.length}`)
      if (batch.length === 0) {
        break
      }
      const ids = []
      const extId2OldId = {}
      batch.forEach(rWithCase => {
        const r = keysToLowerCase(rWithCase)

        // Populate external ID from ID
        if (!r[extId]) {
          this.ux.log(`${r['id']}: Auto-populating ${extId} with ${r['id']}`)
          r[extId] = r['id']
          // remove external ID from ignore fields
          if (ignorefields.includes(extId)) {
            const index = ignorefields.indexOf(extId)
            if (index > -1) {
              ignorefields.splice(index, 1)
            }
          }
        }
        ids.push(r[extId])
        extId2OldId[r[extId]] = r['id']
      })

      const idsToValidate = new Set<string>()
      const objects = []
      for (const rWithCase of batch) {
        const r = keysToLowerCase(rWithCase)

        const obj: Record<string, string> = {}
        for (const [k, value] of Object.entries(r)) {
          let s = '' + value
          if (ignorefields.includes(k)) {
            continue
          }
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
          obj[k] = s
          if (k !== extId && validSFID(s)) {
            idsToValidate.add(s)
          }
        }
        objects.push(obj)
      }

      let script = ''
      for (const vid of idsToValidate) {
        script += `Database.query('SELECT Id FROM '+((Id)'${vid}').getsobjecttype()+' WHERE Id = \\'${vid}\\'');\n`
      }
      if (script.length > 0) {
        let validationOutput = ''
        const exec = new apexNode.ExecuteService(conn)
        const execAnonOptions = Object.assign({}, {apexCode: script})
        const result = await exec.executeAnonymous(execAnonOptions)

        if (!result.success) {
          ok = false
          const out = this.formatDefault(result)
          this.ux.log(out)
          validationOutput += `${out}\n`
          this.ux.log('Executed Script START')
          this.ux.log(script)
          this.ux.log('Executed Script END')
          validationOutput += `${out}\n`
          throw new SfdxError(validationOutput, 'ApexError')
        }
      }

      const job = conn.bulk.createJob(this.flags.sobjecttype, 'upsert', {
        extIdField: this.flags.externalid as string,
        concurrencyMode: 'Serial'
      })
      job.on('error', (err): void => {
        ok = false
        this.ux.log(`Error: ${err}`)
      })
      const newBatch = job.createBatch()
      newBatch.execute(objects)
      await new Promise((resolve, reject) => {
        newBatch.on('queue', batchInfo => {
          const batchId = batchInfo.id
          const b = job.batch(batchId)
          b.on('response', res => {
            resolve(res)
          })
          b.on('error', err => {
            ok = false
            this.ux.log(`Error: ${err}`)
            reject(err)
          })
          b.poll(5 * 1000, 1200 * 1000)
        })
      })
      // Query back Ids
      const query = `SELECT Id,${extId} FROM ${sType} WHERE ${extId} in ('${ids.join('\',\'')}')`
      const queryResult: QueryResult<unknown> = await this.runSoqlQuery(conn, query, this.logger)
      if (!queryResult.done) {
        throw new SfdxError(`Query not done: ${query}`, 'ApexError')
      }
      /* tslint:disable */
      queryResult.records.forEach((rWithCase: any) => {
        const r = keysToLowerCase(rWithCase)

        if (extId2OldId[r[extId]] && r['id']) {
          if (extId2OldId[r[extId]] != r['id']) {
            this.ux.log(`${extId2OldId[r[extId]]} => ${r['id']}`);
            idmap[extId2OldId[r[extId]]] = r['id'];
          }
        } else {
          this.ux.log(`MISSING => ${r['id']}`);
        }
      });
      /* tslint:enable */
      currentBatch++
    }

    fs.writeFileSync(this.flags.idmap, JSON.stringify(idmap, null, 2), {flag: 'w+'})
    if (!ok) {
      throw new SfdxError(output, 'ApexError')
    }
    this.ux.log('Data successfully loaded')
    // Return an object to be displayed with --json
    return {orgId: this.org.getOrgId()}
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

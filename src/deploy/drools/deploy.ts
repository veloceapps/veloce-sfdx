/* tslint:disable */

import {ExecuteService} from '@salesforce/apex-node';
import 'ts-replace-all';
import {DeploymentProcessorAdapter} from '../deploy.processor';
import {DeploymentGroup} from '../model';
import {mapFieldsToSF} from '../utils';
import {parseFile} from './file-parser';

interface Record {
  Id: string;
  Name: string;
}

const ACTIVE_FIELD = 'VELOCPQ_Active__c';
const GROUP_OBJECT = 'TestPriceRuleGroup__c';
const RULE_OBJECT = 'TestVelocePriceRule__c';

// can transform automatically namespacePrefix + Capitalize + __c
const ruleFieldMapping = {
  name: 'Name',
  salience: 'VELOCPQ_Sequence__c',
  context: 'VELOCPQ_Condition__c',
  action: 'VELOCPQ_Action__c',
  group: 'TestPriceRuleGroup__c'
};
const groupFieldMapping = {
  label: 'Name',
  description: 'VELOCPQ_Description__c',
  sequence: 'VELOCPQ_Sequence__c',
  type: 'VELOCPQ_Type__c',
  // active: 'VELOCPQ_Active__c',
  priceListId: 'VELOCPQ_PriceListId__c',
};

export class DroolsDeploy extends DeploymentProcessorAdapter {

  public async preprocess(input: DeploymentGroup, logger, conn) {
    let result;
    const exec = new ExecuteService(conn);

    const activeGroups = (await this.fetchActiveRecords(exec.connection, GROUP_OBJECT));
    const activeRules = (await this.fetchActiveRecords(exec.connection, RULE_OBJECT));
    // TODO think on possible force flags + fail saves
    if (activeGroups.length === 0 || activeRules.length === 0) {
      const out = 'No Active Groups or Rules, skipping delete looks like something went wrong and should be checked manually';
      logger.log(out);
      return {
        status: false,
        out
      };
    }

    //TODO make as commands and execute sequentially
    const deleteGroupsScript = this.prepareDeleteScript(GROUP_OBJECT);
    result = await this.executeScript(exec, deleteGroupsScript);
    if (!result.success) {
      const out = this.formatDefault(result);
      logger.log(out);
      return {
        status: false,
        out
      };
    }
    const deleteRulesScript = this.prepareDeleteScript(RULE_OBJECT);
    result = await this.executeScript(exec, deleteRulesScript);
    if (!result.success) {
      const out = this.formatDefault(result);
      logger.log(out);
      return {
        status: false,
        out
      };
    }
    const groupsInactiveScript = this.prepareInactiveScript(GROUP_OBJECT);
    result = await this.executeScript(exec, groupsInactiveScript);
    if (!result.success) {
      const out = this.formatDefault(result);
      logger.log(out);
      return {
        status: false,
        out
      };
    }
    const rulesInactiveScript = this.prepareInactiveScript(RULE_OBJECT);
    result = await this.executeScript(exec, rulesInactiveScript);
    if (!result.success) {
      const out = this.formatDefault(result);
      logger.log(out);
      return {
        status: false,
        out
      };
    }

    return {
      status: true,
    };
  }

  public async process(input: DeploymentGroup, logger, conn) {
    let result;

    const exec = new ExecuteService(conn);
    const parseResult = await this.parseDroolFiles(['/Users/vadimskuznecovs/work/cato-dev/drools/src/main/resources/rules/project-cato-0-pre-config-init.drl']);

    result = await this.insertGroups(parseResult, exec);
    if (!result.success) {
      const out = this.formatDefault(result);
      logger.log(out);
      return {
        status: false,
        out
      };
    }

    const insertedGroups = await this.fetchActiveRecords(exec.connection, GROUP_OBJECT);
    result = await this.insertRules(exec, parseResult, insertedGroups);
    if (!result.success) {
      const out = this.formatDefault(result);
      logger.log(out);
      return {
        status: false,
        out,
        insertedGroups: insertedGroups
      };
    }
    console.log('success');
    return {
      status: true
    };
  }

  private async insertRules(exec: ExecuteService, parseResult: any[], insertedGroups) {
    const rulesToInsert = parseResult.flatMap((pr) => {
      const groupId = insertedGroups.find((ig) => ig.Name === pr.group.label).Id;
      return {
        ...pr,
        rules: pr.rules.map(r => {
          return {
            ...r,
            group: groupId
          };
        })
      };
    })
      .flatMap(pr => pr.rules).map(r => {
        return {
          ...mapFieldsToSF(r, ruleFieldMapping),
        };
      });
    const script = this.prepareInsertScript(RULE_OBJECT, rulesToInsert);
    return await this.executeScript(exec, script);
  }

  private async insertGroups(parseResult: any[], exec: ExecuteService) {
    const sfGroups = parseResult.flatMap(pr => pr.group).map((g) => {
      return mapFieldsToSF(g, groupFieldMapping);
    });
    const script = this.prepareInsertScript(GROUP_OBJECT, sfGroups);
    return await this.executeScript(exec, script);
  }

  private async parseDroolFiles(filePaths) {
    const parseResult = [];
    for await(const file of filePaths) {
      parseResult.push(await parseFile(file));
    }
    return parseResult;
  }

//
  // public rollback(files: string[], ctx: DeploymentCommandContext): DeploymentCommandContext {
  //   // delete uploaded data if any
  //   // restore inactives to active
  //   return undefined;
  // }

  private prepareInactiveScript(objectName) {
    return `
        List<${objectName}> rs = [SELECT ${ACTIVE_FIELD} from ${objectName}];
        for (${objectName} r : rs) {
          r.${ACTIVE_FIELD} = false;
        }
        update rs;
    `;
  }

  private prepareDeleteScript(objectName) {
    return `
      List<${objectName}> rs = [SELECT Id FROM ${objectName} WHERE ${ACTIVE_FIELD} = false];
      delete rs;
    `;
  }

  private prepareInsertScript(objectName, records) {
    const insertRecords = records.map(r => {
      const fields = Object.entries(r)
        .map(([key, value]) => {
          if (typeof value === 'number' && isFinite(value)) {
            return `${key} = ${value}`;
          } else {
            const espacedValue = ('' + value)
              .replaceAll('\\', '\\\\')
              .replaceAll('\'', '\\\'')
              .replaceAll('\n', '\\n')
              .replaceAll('\r', '\\r');
            return `${key} = '${espacedValue}'`;
          }
        }).join(', ');
      return `rs.add(new ${objectName}(${fields}));`;
    });
    return `
        List<${objectName}> rs = new List<${objectName}>();
        ${insertRecords.join(' ')}
        insert rs;
    `;
  }

  private async executeScript(exec: ExecuteService, script) {
    const execAnonOptions = Object.assign({}, {apexCode: script});
    return await exec.executeAnonymous(execAnonOptions);
  }

  private async fetchActiveRecords(connection, objectName): Promise<Record[]> {
    const selectQuery = `SELECT Id, Name
                         FROM ${objectName}
                         WHERE ${ACTIVE_FIELD} = true`;
    const query = await connection.autoFetchQuery(selectQuery);
    return query.records;
  }

  // @ts-ignore
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

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
    let scriptSuccess: boolean;
    // todo
    let output = '';
    output += 'a';
    const exec = new ExecuteService(conn);

    // SELECT Existing Groups/Rules
    const fetchGroupId = (await this.fetchActiveRecords(exec.connection, 'TestPriceRuleGroup__c')).map(r => r.Id);
    console.log('fetchGroupId', fetchGroupId);

    const deleteGroupsScript = this.prepareDeleteScript('TestPriceRuleGroup__c');
    scriptSuccess = await this.executeScript(exec, logger, output, deleteGroupsScript);
    if (!scriptSuccess) {
      return {
        status: false,
        output
      };
    }
    const groupsInactiveScript = this.prepareInactiveScript('TestPriceRuleGroup__c');
    console.log('sc', groupsInactiveScript);

    scriptSuccess = await this.executeScript(exec, logger, output, groupsInactiveScript);
    if (!scriptSuccess) {
      console.log('fail!!!');
      return {
        status: false,
        output
      };
    }

    return {
      status: true,
      output
    };
  }

  //
  public async process(input: DeploymentGroup, logger, conn) {
    let scriptSuccess: boolean;
    const exec = new ExecuteService(conn);
    const parseResult = [];
    parseResult.push(await parseFile('/Users/vadimskuznecovs/work/cato-dev/drools/src/main/resources/rules/project-cato-0-pre-config-init.drl'));
    // const rules = await input.filePaths.map(async (fil) => {
    //   return await parseFile(fil);
    // });

    const sfGroups = parseResult.flatMap(pr => pr.group).map((g) => {
      return mapFieldsToSF(g, groupFieldMapping);
    });

    //----------------GROUP----------------//
    console.log('group', sfGroups);

    const insertGroup = this.prepareInsertScript('TestPriceRuleGroup__c', sfGroups);
    scriptSuccess = await this.executeScript(exec, logger, '', insertGroup);
    if (!scriptSuccess) {
      return {
        status: false
      };
    }
    //----------------GROUP----------------//

    //----------------RULES----------------//
    const insertedGroups = await this.fetchActiveRecords(exec.connection, 'TestPriceRuleGroup__c');

    const establishedGroupRelations = parseResult.map((pr) => {
      console.log('pr', pr);
      console.log('insertedGroups', insertedGroups);
      const gropuId = insertedGroups.find((ig) => ig.Name === pr.group.label).Id;
      return {
        ...pr,
        rules: pr.rules.map(r => {
          return {
            ...r,
            group: gropuId
          };
        })
      };
    });

    const allRules = establishedGroupRelations.flatMap(pr => pr.rules).map(r => {
      return {
        ...mapFieldsToSF(r, ruleFieldMapping),
      };
    });

    console.log('rules', allRules);
    const s = this.prepareInsertScript('TestVelocePriceRule__c', allRules);
    console.log('re', s);
    scriptSuccess = await this.executeScript(exec, logger, '', s);
    if (!scriptSuccess) {
      return {
        status: false,
        groupsToDelete: insertedGroups
      };
    }
    const insertedRules = await this.fetchActiveRecords(exec.connection, 'TestVelocePriceRule__c');
    if (insertedRules.length !== allRules.length) {
      // fail :S
      // rollback<
    }
    return undefined;
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

  private async executeScript(exec: ExecuteService, logger, output, script) {
    const execAnonOptions = Object.assign({}, {apexCode: script});
    const result = await exec.executeAnonymous(execAnonOptions);
    if (!result.success) {
      const out = this.formatDefault(result);
      logger.log(out);
      output += `${out}\n`;
    }
    console.log('res', result);
    return result.success;
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

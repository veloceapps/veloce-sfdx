import {ExecuteService} from '@salesforce/apex-node';
import {DeploymentProcessorAdapter} from '../deploy.processor';
import {DeploymentGroup} from '../model';

enum RECORD_STATUS {
  ACTIVE = 'Active',
  INACTIVE = 'Inactive'
}

export class DroolsDeploy extends DeploymentProcessorAdapter {

  public async preprocess(input: DeploymentGroup, logger, conn) {
    let scriptSuccess: boolean;
    // todo
    let output = '';
    output += 'a';
    const exec = new ExecuteService(conn);

    // SELECT Existing Groups/Rules
    const fetchGroupId = await this.fetchActiveRecordIds(exec.connection, 'TestPriceRuleGroup__c');
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
  public process(input: DeploymentGroup, logger, conn) {
    const recordsToInsert = [
      {
        Notes__c: 'Active',
        Id: 'aaa'
      }
    ];
    console.log('re', recordsToInsert);
    // read and parse each file
    // compose groups
    // upload groups
    // compse rules
    // upload rules
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
        List<${objectName}> rs = [SELECT Name, Notes__c from ${objectName}];
        for (${objectName} r : rs) {
          r.Notes__c = '${RECORD_STATUS.INACTIVE}';
        }
        update rs;
    `;
  }

  private prepareDeleteScript(objectName) {
    return `
      List<${objectName}> rs = [SELECT Id FROM ${objectName} WHERE Notes__c = '${RECORD_STATUS.INACTIVE}'];
      delete rs;
    `;
  }

  // private prepareInsertScript(objectName, records) {
  //   return `
  //       List<${objectName}> rs = [SELECT Name, Notes__c from ${objectName}];
  //       for (${objectName} r : rs) {
  //         r.Notes__c = '${RECORD_STATUS.INACTIVE}';
  //       }
  //       insert rs;
  //
  //   `;
  // }

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

  private async fetchActiveRecordIds(connection, objectName) {
    const selectQuery = `SELECT Id
                         FROM ${objectName}
                         WHERE Notes__c = '${RECORD_STATUS.ACTIVE}'`;
    const query = await connection.autoFetchQuery(selectQuery);
    return query.records.map(r => r.Id);
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

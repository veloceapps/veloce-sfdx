import * as fs from 'fs';
import * as readline from 'readline';
// const fs = import('fs');
// const readline = require('readline');

export interface DroolFile {
  group: {
    label?: string;
    description?: string;
    sequence?: number;
    type?: string;
    priceListId?: string;
  };
  rules: [{
    rule?: string;
    salience?: number;
    when?: number;
    action?: number;
  }];
}

export const parseFile = async (filePath: string) => {
  const fileStream = fs.createReadStream(filePath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  let salience = null;
  let context = '';
  let action = '';
  let name = '';
  let whenRuleStarted = false;
  let thenRuleStarted = false;
  let groupStarted = false;
  let label = '';
  let description = '';
  let sequence = null;
  let type = '';
  let priceListId = '';
  const result = {} as DroolFile;
  const rules = [];

  for await (const next of rl) {
    // Each line in input.txt will be successively available here as `line`.
    if (next.trim() === '' || next.startsWith('import') || next.startsWith('//')) {
      // ignore
    } else {
      if (next.startsWith('declare') && next.endsWith('Group')) {
        groupStarted = true;
      } else if (next.indexOf('@label') >= 0 && groupStarted) {
        label = next.substring(next.indexOf('(') + 1, next.indexOf(')', next.indexOf('(') + 1));
      } else if (next.indexOf('@description') >= 0 && groupStarted) {
        description = next.substring(next.indexOf('(') + 1, next.indexOf(')', next.indexOf('(') + 1));
      } else if (next.indexOf('@sequence') >= 0 && groupStarted) {
        sequence = next.substring(next.indexOf('(') + 1, next.indexOf(')', next.indexOf('(') + 1));
      } else if (next.indexOf('@type') >= 0 && groupStarted) {
        type = next.substring(next.indexOf('(') + 1, next.indexOf(')', next.indexOf('(') + 1));
      } else if (next.indexOf('@priceListId') >= 0 && groupStarted) {
        priceListId = next.substring(next.indexOf('(') + 1, next.indexOf(')', next.indexOf('(') + 1));
      } else if (next.startsWith('end') && groupStarted) {
        result.group = {
          label,
          description,
          sequence: parseInt(sequence, 10),
          type,
          priceListId
        };
        groupStarted = false;
        label = '';
        description = '';
        sequence = null;
        type = '';
        priceListId = '';
      } else if (next.startsWith('rule')) {
        name = next.substring(next.indexOf('"') + 1, next.indexOf('"', next.indexOf('"') + 1));
        salience = next.substring(next.indexOf('salience') + 9).trim();
      } else if (next.startsWith('when')) {
        whenRuleStarted = true;
        thenRuleStarted = false;
      } else if (next.startsWith('then')) {
        whenRuleStarted = false;
        thenRuleStarted = true;
      } else if (next.startsWith('end')) {
        whenRuleStarted = false;
        thenRuleStarted = false;
        const items = {
          name,
          salience: parseInt(salience, 10),
          context,
          action
        };
        rules.push(items);
        action = '';
        context = '';
        name = '';
        salience = null;
      } else {
        if (whenRuleStarted) {
          context += next;
          context += '\n';
        } else if (thenRuleStarted) {
          action += next;
          action += '\n';
        }
      }
    }
  }

  return {
    ...result,
    rules
  };
};

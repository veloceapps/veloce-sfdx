/*
 * Copyright (c) 2019 American Express Travel Related Services Company, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except
 * in compliance with the License. You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under the License
 * is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express
 * or implied. See the License for the specific language governing permissions and limitations under
 * the License.
 */
import * as childProc from 'child_process';
import * as path from 'path';
import { isNullOrUndefined } from 'util';
import { info } from './logger';

export interface CLICommand {
  commandString: string;
  encloseInQuotes?: boolean;
  args?: string[];
  errors?: string[];
}

/**
 * Wrapper function for running multiple CLI commands
 *
 * @param commands Array of command objects to run
 * @param runner Optional alternate function to run the commands
 */
export function runAll(
  commands: CLICommand[],
  runner?: (string) => void
): void {
  if (commands.length > 0) {
    commands.forEach((cmd) => {
      run(cmd, runner);
    });
  } else {
    info('No commands to run.');
  }
}

/**
 * Wrapper function for running a CLI command
 *
 * @param cmd Command object to run
 * @param runner Optional alternate function to run command
 */
export function run(cmd: CLICommand, runner?: (string) => void): void {
  let commandStr = cmd.commandString;

  commandStr = path.normalize(
    commandStr.replace('$REPO', process.env.REPO).replace('~', process.env.HOME)
  );

  if (cmd.encloseInQuotes) {
    commandStr = `"${commandStr}"`;
  }
  if (!isNullOrUndefined(cmd.args) && cmd.args.length > 0) {
    commandStr += ` ${cmd.args.join(' ')}`;
  }

  if (runner) {
    runner(commandStr);
  } else {
    runCmd(commandStr);
  }
}

/**
 * Synchronously executes a command
 *
 * @param command the command (e.g. dx command) to execute
 * @param noInherit boolean flag to omit stdio: 'inherit' option when calling execSync
 */
export function runCmd(command: string, noInherit?: boolean): string {
  if (process.env.SYSTEM_DEBUG === 'true') {
    info(`Running CLI command: ${command}`);
  }
  let retVal: string;
  if (!command.startsWith('testcommand')) {
    if (noInherit) {
      retVal = childProc.execSync(command, { encoding: 'utf8' });
    } else {
      retVal = childProc.execSync(command, {
        encoding: 'utf8',
        stdio: 'inherit',
      });
    }
  }
  return retVal;
}

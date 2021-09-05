export enum DeploymentType {DROOLS}

export class DeploymentError extends Error {
}

export interface DeploymentCommandContext {
  namespace: string;
  sType: string;
  // todo change to T
  // tslint:disable-next-line:no-any
  [key: string]: any;
}

export interface DeploymentProcessor {
  preprocess(input: DeploymentGroup, logger, connection);

  // process(files: string[], ctx: DeploymentCommandContext): DeploymentCommandContext;
  //
  // postProcess(files: string[], ctx: DeploymentCommandContext): DeploymentCommandContext;
  //
  // rollback(files: string[], ctx: DeploymentCommandContext): DeploymentCommandContext;
}

export interface DeploymentInput {
  input: string;
  groups: DeploymentGroup[];
}

export interface DeploymentGroup {
  type: DeploymentType;
  filePaths: string[];
}

export interface DeploymentOutput {
  success: boolean;
  message?: string;
}

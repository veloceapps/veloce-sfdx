import {DeploymentGroup, DeploymentProcessor} from './model';

export class DeploymentProcessorAdapter implements DeploymentProcessor {

  // public process(files: string[], ctx: DeploymentCommandContext): DeploymentCommandContext {
  //   return ctx;
  // }
  //
  // public postProcess(files: string[], ctx: DeploymentCommandContext): DeploymentCommandContext {
  //   return ctx;
  // }

  public preprocess(input: DeploymentGroup, logger, connection) {
  }

  //
  // public rollback(files: string[], ctx: DeploymentCommandContext): DeploymentCommandContext {
  //   return ctx;
  // }
}

// export const deployGroups = (input: DeploymentGroup[]): DeploymentOutput[] => {
//   return input.map(deployGroup);
// };

// const deployGroup = (input: DeploymentGroup): DeploymentOutput => {
//   const {type, filePaths} = input;
//   let ctx = {} as DeploymentCommandContext;
//   const deploymentProcessor = getGroupDeploymentProcessor(type);
//   ctx = deploymentProcessor.preprocess(filePaths, ctx);
//   try {
//     ctx = deploymentProcessor.process(filePaths, ctx);
//     return {
//       success: true
//     };
//   } catch (e) {
//     deploymentProcessor.rollback(filePaths, ctx);
//     return {
//       success: false,
//       message: e
//     };
//   } finally {
//     deploymentProcessor.postProcess(filePaths, ctx);
//   }
// };
//
// const getGroupDeploymentProcessor = (deploymentType: DeploymentType) => {
//   switch (deploymentType) {
//     case DeploymentType.DROOLS:
//       return new DroolsDeploy();
//     default:
//       throw new DeploymentError(`Unrecognized deployment type ${deploymentType}`);
//   }
// };
//

import {DeploymentGroup, DeploymentProcessor} from './model';

export class DeployStrategy {

  private logger;
  private connection;
  private strategy: DeploymentProcessor;

  constructor(logger, connection) {
    this.logger = logger;
    this.connection = connection;
  }

  public setStrategy(strategy: DeploymentProcessor) {
    this.strategy = strategy;
  }

  public async execute(input: DeploymentGroup) {
    this.strategy.preprocess(input, this.connection, this.logger);
  }

}

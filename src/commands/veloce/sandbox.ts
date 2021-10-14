import {SfdxCommand} from '@salesforce/command';
import {AnyJson} from "@salesforce/ts-types";
import {ComponentSet, MetadataApiDeploy} from "@salesforce/source-deploy-retrieve";

export default class Org extends SfdxCommand {
  public static description = "Sandbox";
  public static readonly requiresUsername = true;
  public async run(): Promise<AnyJson> {
    let cs = ComponentSet.fromSource(['../veloce-integration/project-source/main/default/objects', '../veloce-integration/project-source/main/default/classes'])
    let result: MetadataApiDeploy;
    console.log(this.org.getUsername())
    result = await cs.deploy({usernameOrConnection: this.org.getUsername(), apiOptions: {}});
    console.log(result)
    return {}
  }
}

import {flags, SfdxCommand} from '@salesforce/command';
import {Messages} from '@salesforce/core';
import {AnyJson} from '@salesforce/ts-types';

/* tslint:disable */
const parser = require('fast-xml-parser');
const fs = require('fs');
/* tslint:enable */

// Initialize Messages with the current plugin directory
Messages.importMessagesDirectory(__dirname);

// Load the specific messages for this file. Messages from @salesforce/command, @salesforce/core,
// or any library that is using the messages framework can also be loaded this way.
const messages = Messages.loadMessages('veloce-sfdx', 'permgen');

export default class Org extends SfdxCommand {

  public static description = messages.getMessage('commandDescription');

  public static examples = [
    `$ sfdx veloce:permgen -f ./ myname.csv --targetusername myOrg@example.com --targetdevhubusername devhub@org.com -s Product2
  Hello world! This is org: MyOrg and I will be around until Tue Mar 20 2018!
  My hub org id is: 00Dxx000000001234
  `,
    `$ sfdx veloce:permgen -f ./ myname.csv --targetusername myOrg@example.com -s Product2
  Hello myname! This is org: MyOrg and I will be around until Tue Mar 20 2018!
  `
  ];

  public static args = [{name: 'file'}];

  protected static flagsConfig = {
    // flag with a value (-n, --name=VALUE)
    file: flags.string({char: 'f', description: messages.getMessage('fileFlagDescription')}),
    sobjecttypes: flags.string({char: 's', description: messages.getMessage('sobjecttypesFlagDescription')})
  };

  // Comment this out if your command does not require an org username
  protected static requiresUsername = true;

  // Comment this out if your command does not support a hub org username
  protected static supportsDevhubUsername = true;

  // Set this to true if your command requires a project workspace; 'requiresProject' is false by default
  protected static requiresProject = false;

  public async run(): Promise<AnyJson> {
    const sobjecttypess = this.flags.sobjecttypes ? this.flags.sobjecttypes.split(',') : [];
    if (!sobjecttypess.length) {
      this.ux.log('At least one sobjecttype is required!');
      process.exit(255);
    }
    const fieldPermissions = [];
    const objectPermissions = [];
    /*
<?xml version="1.0" encoding="UTF-8"?>
<PermissionSet xmlns="http://soap.sforce.com/2006/04/metadata">
    <hasActivationRequired>false</hasActivationRequired>
    <label>Veloce Client Objects Full</label>
    <fieldPermissions>
        <editable>true</editable>
        <field>Product2.External_ID__c</field>
        <readable>true</readable>
    </fieldPermissions>
    <fieldPermissions>
        <editable>true</editable>
        <field>Product2.Combo_Parent__c</field>
        <readable>true</readable>
    </fieldPermissions>
    <objectPermissions>
        <allowCreate>true</allowCreate>
        <allowDelete>true</allowDelete>
        <allowEdit>true</allowEdit>
        <allowRead>true</allowRead>
        <modifyAllRecords>true</modifyAllRecords>
        <object>Product2</object>
        <viewAllRecords>true</viewAllRecords>
    </objectPermissions>
</PermissionSet>
     */

    const initialXML = `<?xml version="1.0" encoding="UTF-8"?>
<PermissionSet xmlns="http://soap.sforce.com/2006/04/metadata">
    <hasActivationRequired>false</hasActivationRequired>
    <label>Veloce Client Objects Full</label>
</PermissionSet>
`;
    let jsonObj = null;
    const validationResult = parser.validate(initialXML);
    if (validationResult === true) { // optional (it'll return an object in case it's not valid)
      jsonObj = parser.parse(initialXML, {
        attributeNamePrefix: '@_',
        attrNodeName: 'attr', // default is 'false'
        textNodeName: '#text',
        ignoreAttributes: true,
        ignoreNameSpace: false,
        allowBooleanAttributes: false,
        parseNodeValue: true,
        parseAttributeValue: false,
        trimValues: true,
        cdataTagName: '__cdata', // default is 'false'
        cdataPositionChar: '\\c',
        parseTrueNumberOnly: false,
        arrayMode: false // "strict"
      });
    } else {
      this.ux.warn(`XML Fails validation: ${JSON.stringify(validationResult, null, '  ')}`);
      process.exit(-1);
    }

    for (const sobjecttype of sobjecttypess) {
      const conn = this.org.getConnection();
      const fieldsResult = await conn.autoFetchQuery(`
SELECT EntityDefinition.QualifiedApiName, QualifiedApiName, DataType
FROM FieldDefinition
WHERE EntityDefinition.QualifiedApiName IN ('${sobjecttype}') ORDER BY QualifiedApiName
    `, {autoFetch: true, maxFetch: 50000});
      for (const f of fieldsResult.records) {
        const apiName = f['QualifiedApiName'];
        if (!apiName.endsWith('__c')) { // only custom fields!
          continue;
        }
        // const datatype = f['DataType'];
        fieldPermissions.push({
          editable: true,
          readable: true,
          field: `${sobjecttype}.${apiName}`
        });
      }

      objectPermissions.push({
        allowCreate: true,
        allowDelete: true,
        allowEdit: true,
        allowRead: true,
        modifyAllRecords: sobjecttype !== 'Product2',
        object: sobjecttype,
        viewAllRecords: sobjecttype !== 'Product2'
      });
    }

    if (fieldPermissions.length === 1) {
      jsonObj['PermissionSet']['fieldPermissions'] = fieldPermissions[0];
    } else {
      jsonObj['PermissionSet']['fieldPermissions'] = fieldPermissions;
    }
    if (objectPermissions.length === 1) {
      jsonObj['PermissionSet']['objectPermissions'] = objectPermissions[0];
    } else {
      jsonObj['PermissionSet']['objectPermissions'] = objectPermissions;
    }

    const outOptions = {
      attributeNamePrefix: '@_',
      attrNodeName: '@', // default is false
      textNodeName: '#text',
      ignoreAttributes: true,
      cdataTagName: '__cdata', // default is false
      cdataPositionChar: '\\c',
      format: true,
      indentBy: '  ',
      supressEmptyNode: false
    };
    const outParser = new parser.j2xParser(outOptions);
    const xml = outParser.parse(jsonObj);
    fs.writeFileSync(this.flags.file, xml, {encoding: 'utf8', flag: 'w+'});

    // Return an object to be displayed with --json
    return jsonObj;
  }
}

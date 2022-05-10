[![Version](https://img.shields.io/npm/v/veloce-sfdx.svg)](https://npmjs.org/package/veloce-sfdx)
[![CircleCI](https://circleci.com/gh/veloceapps/veloce-sfdx/tree/master.svg?style=shield)](https://circleci.com/gh/veloceapps/veloce-sfdx/tree/master)

```
Loads data into org, by creation of Anonymous apex code and it's execution. Operation is working in two modes: Update only (default) and Upsert --upsert. After each batch SOQL query is performed and ID Map file is populated with OldId=>NewId mappings

USAGE
  $ sfdx veloce:COMMAND

COMMANDS
  veloce:apexload        Loads data into org, by creation of Anonymous apex code
                         and it's execution. Operation is working in two modes:
                         Update only (default) and Upsert --upsert. After each
                         batch SOQL query is performed and ID Map file is
                         populated with OldId=>NewId mappings
  veloce:dump            Dumps data from Object in org
  veloce:dumpcontentdoc  Dumps data from Document in org
  veloce:dumpdoc         Dumps data from Document in org
  veloce:dumpui          Dumps ui definitions from Product Model in org
  veloce:fixref          Fix sobjects external id if empty
  veloce:load            Load data into org, by use of standard Salesforce API
  veloce:loadcontentdoc  Dumps data from Document in org
  veloce:loaddoc         Dumps data from Document in org
  veloce:login           Login using username and password
  veloce:packconfig      Create configuration csv from files
  veloce:packpricelist   Create price list file for import to salesforce
  veloce:packrules       Copy rules to csv for salesforce import
  veloce:packrulesgroup  Copy rules group to csv for salesforce import
  veloce:packui          Embeds attached files and creates self-contained json
  veloce:permgen         Load data into org, by use of standard Salesforce API
  veloce:sort            Sort custom/standard object list by metadata
                         dependencies (references)

```

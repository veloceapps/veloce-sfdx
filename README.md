veloce-sfdx
===========

veloce sfdx plugin

[![Version](https://img.shields.io/npm/v/veloce-sfdx.svg)](https://npmjs.org/package/veloce-sfdx)
[![CircleCI](https://circleci.com/gh/veloceapps/veloce-sfdx/tree/master.svg?style=shield)](https://circleci.com/gh/veloceapps/veloce-sfdx/tree/master)
[![Appveyor CI](https://ci.appveyor.com/api/projects/status/github/veloceapps/veloce-sfdx?branch=master&svg=true)](https://ci.appveyor.com/project/heroku/veloce-sfdx/branch/master)
[![Codecov](https://codecov.io/gh/veloceapps/veloce-sfdx/branch/master/graph/badge.svg)](https://codecov.io/gh/veloceapps/veloce-sfdx)
[![Sneak](https://snyk.io/test/github/veloceapps/veloce-sfdx/badge.svg)](https://app.snyk.io/org/veloceapps/)
[![Known Vulnerabilities](https://snyk.io/test/github/veloceapps/veloce-sfdx/badge.svg)](https://snyk.io/test/github/veloceapps/veloce-sfdx)
[![Downloads/week](https://img.shields.io/npm/dw/veloce-sfdx.svg)](https://npmjs.org/package/veloce-sfdx)
[![License](https://img.shields.io/npm/l/veloce-sfdx.svg)](https://github.com/veloceapps/veloce-sfdx/blob/master/package.json)

<!-- toc -->
* [Debugging your plugin](#debugging-your-plugin)
<!-- tocstop -->
<!-- install -->
<!-- usage -->
```sh-session
$ npm install -g veloce-sfdx
$ sfdx COMMAND
running command...
$ sfdx (-v|--version|version)
veloce-sfdx/1.0.16 darwin-x64 node-v15.14.0
$ sfdx --help [COMMAND]
USAGE
  $ sfdx COMMAND
...
```
<!-- usagestop -->
<!-- commands -->
* [`sfdx veloce:apexload -s <string> -i <string> -f <string> -I <string> [-U] [-o <string>] [-b <string>] [-B <string>] [-D <string>] [-N <string>] [-v <string>] [-u <string>] [--apiversion <string>] [--json] [--loglevel trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]`](#sfdx-veloceapexload--s-string--i-string--f-string--i-string--u--o-string--b-string--b-string--d-string--n-string--v-string--u-string---apiversion-string---json---loglevel-tracedebuginfowarnerrorfataltracedebuginfowarnerrorfatal)
* [`sfdx veloce:dump -s <string> -I <string> -f <string> [-i <string>] [-o <string>] [-v <string>] [-u <string>] [--apiversion <string>] [--json] [--loglevel trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]`](#sfdx-velocedump--s-string--i-string--f-string--i-string--o-string--v-string--u-string---apiversion-string---json---loglevel-tracedebuginfowarnerrorfataltracedebuginfowarnerrorfatal)
* [`sfdx veloce:dumpdoc -i <string> -o <string> [-v <string>] [-u <string>] [--apiversion <string>] [--json] [--loglevel trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]`](#sfdx-velocedumpdoc--i-string--o-string--v-string--u-string---apiversion-string---json---loglevel-tracedebuginfowarnerrorfataltracedebuginfowarnerrorfatal)
* [`sfdx veloce:load [-f <string>] [-v <string>] [-u <string>] [--apiversion <string>] [--json] [--loglevel trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]`](#sfdx-veloceload--f-string--v-string--u-string---apiversion-string---json---loglevel-tracedebuginfowarnerrorfataltracedebuginfowarnerrorfatal)
* [`sfdx veloce:loaddoc -I <string> -i <string> -n <string> -F <string> -f <string> [-v <string>] [-u <string>] [--apiversion <string>] [--json] [--loglevel trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]`](#sfdx-veloceloaddoc--i-string--i-string--n-string--f-string--f-string--v-string--u-string---apiversion-string---json---loglevel-tracedebuginfowarnerrorfataltracedebuginfowarnerrorfatal)
* [`sfdx veloce:login -p <string> -a <string> -u <string> -r <string> [-s <string>] [--json] [--loglevel trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]`](#sfdx-velocelogin--p-string--a-string--u-string--r-string--s-string---json---loglevel-tracedebuginfowarnerrorfataltracedebuginfowarnerrorfatal)
* [`sfdx veloce:packui -n <string> -i <string> -o <string> -I <string> [-P <string>] [--json] [--loglevel trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]`](#sfdx-velocepackui--n-string--i-string--o-string--i-string--p-string---json---loglevel-tracedebuginfowarnerrorfataltracedebuginfowarnerrorfatal)
* [`sfdx veloce:sort [-n <string>] [-f] [-v <string>] [-u <string>] [--apiversion <string>] [--json] [--loglevel trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]`](#sfdx-velocesort--n-string--f--v-string--u-string---apiversion-string---json---loglevel-tracedebuginfowarnerrorfataltracedebuginfowarnerrorfatal)

## `sfdx veloce:apexload -s <string> -i <string> -f <string> -I <string> [-U] [-o <string>] [-b <string>] [-B <string>] [-D <string>] [-N <string>] [-v <string>] [-u <string>] [--apiversion <string>] [--json] [--loglevel trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]`

Loads data into org, by creation of Anonymous apex code and it's execution. Operation is working in two modes: Update only (default) and Upsert --upsert. After each batch SOQL query is performed and ID Map file is populated with OldId=>NewId mappings

```
Loads data into org, by creation of Anonymous apex code and it's execution. Operation is working in two modes: Update only (default) and Upsert --upsert. After each batch SOQL query is performed and ID Map file is populated with OldId=>NewId mappings

USAGE
  $ sfdx veloce:apexload -s <string> -i <string> -f <string> -I <string> [-U] [-o <string>] [-b <string>] [-B <string>] 
  [-D <string>] [-N <string>] [-v <string>] [-u <string>] [--apiversion <string>] [--json] [--loglevel 
  trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]

OPTIONS
  -B, --boolfields=boolfields                                                       Coma separated list of boolean
                                                                                    fields

  -D, --datefields=datefields                                                       Coma separated list of date fields

  -I, --idmap=idmap                                                                 (required) idmap.json file path, to
                                                                                    store/load <csvId:targetId> pairs

  -N, --numericfields=numericfields                                                 Coma separated list of boolean
                                                                                    fields

  -U, --upsert                                                                      Should use APEX upsert (could insert
                                                                                    extra records) or update-only APEX
                                                                                    (one by one), which is default

  -b, --batch=batch                                                                 Size of batch, to avoid getting
                                                                                    'script is too large'

  -f, --file=file                                                                   (required) Full path to csv file

  -i, --externalid=externalid                                                       (required) The column name of the
                                                                                    external ID.

  -o, --ignorefields=ignorefields                                                   Coma separated list of fields to
                                                                                    ignore during load

  -s, --sobjecttype=sobjecttype                                                     (required) The sObject type of the
                                                                                    records you want to upsert.

  -u, --targetusername=targetusername                                               username or alias for the target
                                                                                    org; overrides default target org

  -v, --targetdevhubusername=targetdevhubusername                                   username or alias for the dev hub
                                                                                    org; overrides default dev hub org

  --apiversion=apiversion                                                           override the api version used for
                                                                                    api requests made by this command

  --json                                                                            format output as json

  --loglevel=(trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL)  [default: warn] logging level for
                                                                                    this command invocation

EXAMPLE
  $ sfdx veloce:apexload -u gp01 -s PricebookEntry -i sfxId__c -f ./data/insert.csv
```

_See code: [lib/commands/veloce/apexload.js](https://github.com/veloceapps/veloce-sfdx/blob/v1.0.16/lib/commands/veloce/apexload.js)_

## `sfdx veloce:dump -s <string> -I <string> -f <string> [-i <string>] [-o <string>] [-v <string>] [-u <string>] [--apiversion <string>] [--json] [--loglevel trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]`

Dumps data from Object in org

```
Dumps data from Object in org

USAGE
  $ sfdx veloce:dump -s <string> -I <string> -f <string> [-i <string>] [-o <string>] [-v <string>] [-u <string>] 
  [--apiversion <string>] [--json] [--loglevel trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]

OPTIONS
  -I, --idmap=idmap                                                                 (required) idmap.json file path, to
                                                                                    REVERSE map IDs from

  -f, --file=file                                                                   (required) relative/full path to
                                                                                    file to write CSV into

  -i, --id=id                                                                       id of Object to dump

  -o, --ignorefields=ignorefields                                                   Coma separated list of fields to
                                                                                    ignore during dump

  -s, --sobjecttype=sobjecttype                                                     (required) The sObject type of the
                                                                                    records you want to dump.

  -u, --targetusername=targetusername                                               username or alias for the target
                                                                                    org; overrides default target org

  -v, --targetdevhubusername=targetdevhubusername                                   username or alias for the dev hub
                                                                                    org; overrides default dev hub org

  --apiversion=apiversion                                                           override the api version used for
                                                                                    api requests made by this command

  --json                                                                            format output as json

  --loglevel=(trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL)  [default: warn] logging level for
                                                                                    this command invocation

EXAMPLES
  $ sfdx veloce:dump -s Product2 -i 00Dxx000000001234 --targetusername myOrg@example.com --targetdevhubusername 
  devhub@org.com
     Hello world! This is org: MyOrg and I will be around until Tue Mar 20 2018!
     My hub org id is: 00Dxx000000001234
  
  $ sfdx veloce:dump -s Product2 -i 00Dxx000000001234 --targetusername myOrg@example.com
     Hello myname! This is org: MyOrg and I will be around until Tue Mar 20 2018!
```

_See code: [lib/commands/veloce/dump.js](https://github.com/veloceapps/veloce-sfdx/blob/v1.0.16/lib/commands/veloce/dump.js)_

## `sfdx veloce:dumpdoc -i <string> -o <string> [-v <string>] [-u <string>] [--apiversion <string>] [--json] [--loglevel trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]`

Dumps data from Document in org

```
Dumps data from Document in org

USAGE
  $ sfdx veloce:dumpdoc -i <string> -o <string> [-v <string>] [-u <string>] [--apiversion <string>] [--json] [--loglevel 
  trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]

OPTIONS
  -i, --id=id                                                                       (required) id of document to dump

  -o, --outputfile=outputfile                                                       (required) relative/full path to
                                                                                    write Document into

  -u, --targetusername=targetusername                                               username or alias for the target
                                                                                    org; overrides default target org

  -v, --targetdevhubusername=targetdevhubusername                                   username or alias for the dev hub
                                                                                    org; overrides default dev hub org

  --apiversion=apiversion                                                           override the api version used for
                                                                                    api requests made by this command

  --json                                                                            format output as json

  --loglevel=(trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL)  [default: warn] logging level for
                                                                                    this command invocation

EXAMPLES
  $ sfdx veloce:dumpdoc -i 01521000000gHgnAAE -o file.pml --targetusername myOrg@example.com --targetdevhubusername 
  devhub@org.com
  
  $ sfdx veloce:dumpdoc -i 01521000000gHgnAAE -o file.pml --name myname --targetusername myOrg@example.com
```

_See code: [lib/commands/veloce/dumpdoc.js](https://github.com/veloceapps/veloce-sfdx/blob/v1.0.16/lib/commands/veloce/dumpdoc.js)_

## `sfdx veloce:load [-f <string>] [-v <string>] [-u <string>] [--apiversion <string>] [--json] [--loglevel trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]`

Load data into org, by use of standard Salesforce API

```
Load data into org, by use of standard Salesforce API

USAGE
  $ sfdx veloce:load [-f <string>] [-v <string>] [-u <string>] [--apiversion <string>] [--json] [--loglevel 
  trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]

OPTIONS
  -f, --file=file                                                                   csv file to load into salesforce

  -u, --targetusername=targetusername                                               username or alias for the target
                                                                                    org; overrides default target org

  -v, --targetdevhubusername=targetdevhubusername                                   username or alias for the dev hub
                                                                                    org; overrides default dev hub org

  --apiversion=apiversion                                                           override the api version used for
                                                                                    api requests made by this command

  --json                                                                            format output as json

  --loglevel=(trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL)  [default: warn] logging level for
                                                                                    this command invocation

EXAMPLES
  $ sfdx veloce:load -f ./ myname.csv --targetusername myOrg@example.com --targetdevhubusername devhub@org.com
     Hello world! This is org: MyOrg and I will be around until Tue Mar 20 2018!
     My hub org id is: 00Dxx000000001234
  
  $ sfdx veloce:load -f ./ myname.csv --targetusername myOrg@example.com
     Hello myname! This is org: MyOrg and I will be around until Tue Mar 20 2018!
```

_See code: [lib/commands/veloce/load.js](https://github.com/veloceapps/veloce-sfdx/blob/v1.0.16/lib/commands/veloce/load.js)_

## `sfdx veloce:loaddoc -I <string> -i <string> -n <string> -F <string> -f <string> [-v <string>] [-u <string>] [--apiversion <string>] [--json] [--loglevel trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]`

Dumps data from Document in org

```
Dumps data from Document in org

USAGE
  $ sfdx veloce:loaddoc -I <string> -i <string> -n <string> -F <string> -f <string> [-v <string>] [-u <string>] 
  [--apiversion <string>] [--json] [--loglevel trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]

OPTIONS
  -F, --foldername=foldername                                                       (required) name of folder to upsert
                                                                                    and bind document to

  -I, --idmap=idmap                                                                 (required) idmap.json file path, to
                                                                                    store/load <Id:targetId> pairs

  -f, --inputfile=inputfile                                                         (required) relative/full path to
                                                                                    read Document from

  -i, --id=id                                                                       (required) id of document to upsert

  -n, --name=name                                                                   (required) name of document to
                                                                                    upsert

  -u, --targetusername=targetusername                                               username or alias for the target
                                                                                    org; overrides default target org

  -v, --targetdevhubusername=targetdevhubusername                                   username or alias for the dev hub
                                                                                    org; overrides default dev hub org

  --apiversion=apiversion                                                           override the api version used for
                                                                                    api requests made by this command

  --json                                                                            format output as json

  --loglevel=(trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL)  [default: warn] logging level for
                                                                                    this command invocation

EXAMPLES
  $ sfdx veloce:loaddoc -i 01521000000gHgnAAE --targetusername myOrg@example.com --targetdevhubusername devhub@org.com
     Document content here
  
  $ sfdx veloce:loaddoc -i 01521000000gHgnAAE --name myname --targetusername myOrg@example.com
     Document content here
```

_See code: [lib/commands/veloce/loaddoc.js](https://github.com/veloceapps/veloce-sfdx/blob/v1.0.16/lib/commands/veloce/loaddoc.js)_

## `sfdx veloce:login -p <string> -a <string> -u <string> -r <string> [-s <string>] [--json] [--loglevel trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]`

Login using username and password

```
Login using username and password

USAGE
  $ sfdx veloce:login -p <string> -a <string> -u <string> -r <string> [-s <string>] [--json] [--loglevel 
  trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]

OPTIONS
  -a, --alias=alias                                                                 (required) target alias to create

  -p, --passwordfile=passwordfile                                                   (required) Relative/Full path to
                                                                                    file containing password

  -r, --instanceurl=instanceurl                                                     (required) salesforce environment
                                                                                    Instance URL

  -s, --securitytoken=securitytoken                                                 security token

  -u, --user=user                                                                   (required) Username to login with

  --json                                                                            format output as json

  --loglevel=(trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL)  [default: warn] logging level for
                                                                                    this command invocation

EXAMPLE
  $ sfdx veloce:login -u username -p ./PASSWORDFILE -a alias01
```

_See code: [lib/commands/veloce/login.js](https://github.com/veloceapps/veloce-sfdx/blob/v1.0.16/lib/commands/veloce/login.js)_

## `sfdx veloce:packui -n <string> -i <string> -o <string> -I <string> [-P <string>] [--json] [--loglevel trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]`

Embeds attached files and creates self-contained json

```
Embeds attached files and creates self-contained json

USAGE
  $ sfdx veloce:packui -n <string> -i <string> -o <string> -I <string> [-P <string>] [--json] [--loglevel 
  trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]

OPTIONS
  -I, --idmap=idmap                                                                 (required) idmap.json file path, to
                                                                                    store/load <csvId:targetId> pairs

  -P, --pricelistiid=pricelistiid                                                   replace ALL references to pricelists
                                                                                    in model with this ID

  -i, --inputdir=inputdir                                                           (required) input directory to read
                                                                                    metadata.json and relative links

  -n, --modelname=modelname                                                         (required) Name of model (directory)
                                                                                    to read metadata.json inside

  -o, --outputfile=outputfile                                                       (required) Output json file to
                                                                                    create

  --json                                                                            format output as json

  --loglevel=(trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL)  [default: warn] logging level for
                                                                                    this command invocation

EXAMPLE
  $ sfdx veloce:packui --inputdir . -n BOARDING --outputfile metadata_new.json
```

_See code: [lib/commands/veloce/packui.js](https://github.com/veloceapps/veloce-sfdx/blob/v1.0.16/lib/commands/veloce/packui.js)_

## `sfdx veloce:sort [-n <string>] [-f] [-v <string>] [-u <string>] [--apiversion <string>] [--json] [--loglevel trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]`

Sort custom/standard object list by metadata dependencies (references)

```
Sort custom/standard object list by metadata dependencies (references)

USAGE
  $ sfdx veloce:sort [-n <string>] [-f] [-v <string>] [-u <string>] [--apiversion <string>] [--json] [--loglevel 
  trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]

OPTIONS
  -f, --force                                                                       example boolean flag
  -n, --objects=objects                                                             name to print

  -u, --targetusername=targetusername                                               username or alias for the target
                                                                                    org; overrides default target org

  -v, --targetdevhubusername=targetdevhubusername                                   username or alias for the dev hub
                                                                                    org; overrides default dev hub org

  --apiversion=apiversion                                                           override the api version used for
                                                                                    api requests made by this command

  --json                                                                            format output as json

  --loglevel=(trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL)  [default: warn] logging level for
                                                                                    this command invocation

EXAMPLES
  $ sfdx veloce:sort --targetusername myOrg@example.com --targetdevhubusername devhub@org.com
     Hello world! This is org: MyOrg and I will be around until Tue Mar 20 2018!
     My hub org id is: 00Dxx000000001234
  
  $ sfdx veloce:sort --name myname --targetusername myOrg@example.com
     Hello myname! This is org: MyOrg and I will be around until Tue Mar 20 2018!
```

_See code: [lib/commands/veloce/sort.js](https://github.com/veloceapps/veloce-sfdx/blob/v1.0.16/lib/commands/veloce/sort.js)_
<!-- commandsstop -->
<!-- debugging-your-plugin -->
# Debugging your plugin
We recommend using the Visual Studio Code (VS Code) IDE for your plugin development. Included in the `.vscode` directory of this plugin is a `launch.json` config file, which allows you to attach a debugger to the node process when running your commands.

To debug the `veloce:dump` command: 
1. Start the inspector
  
If you linked your plugin to the sfdx cli, call your command with the `dev-suspend` switch: 
```sh-session
$ sfdx veloce:dump -u myOrg@example.com --dev-suspend
```
  
Alternatively, to call your command using the `bin/run` script, set the `NODE_OPTIONS` environment variable to `--inspect-brk` when starting the debugger:
```sh-session
$ NODE_OPTIONS=--inspect-brk bin/run veloce:dump -u myOrg@example.com
```

2. Set some breakpoints in your command code
3. Click on the Debug icon in the Activity Bar on the side of VS Code to open up the Debug view.
4. In the upper left hand corner of VS Code, verify that the "Attach to Remote" launch configuration has been chosen.
5. Hit the green play button to the left of the "Attach to Remote" launch configuration window. The debugger should now be suspended on the first line of the program. 
6. Hit the green play button at the top middle of VS Code (this play button will be to the right of the play button that you clicked in step #5).
<br><img src=".images/vscodeScreenshot.png" width="480" height="278"><br>
Congrats, you are debugging!

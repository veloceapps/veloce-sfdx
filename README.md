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
veloce-sfdx/1.0.44 darwin-x64 node-v16.3.0
$ sfdx --help [COMMAND]
USAGE
  $ sfdx COMMAND
...
```
<!-- usagestop -->
<!-- commands -->
* [`sfdx veloce:apexload -s <string> -i <string> -f <string> -I <string> [-R <string>] [-P] [-U] [-o <string>] [-b <string>] [-B <string>] [-D <string>] [-N <string>] [-v <string>] [-u <string>] [--apiversion <string>] [--json] [--loglevel trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]`](#sfdx-veloceapexload--s-string--i-string--f-string--i-string--r-string--p--u--o-string--b-string--b-string--d-string--n-string--v-string--u-string---apiversion-string---json---loglevel-tracedebuginfowarnerrorfataltracedebuginfowarnerrorfatal)
* [`sfdx veloce:dump -s <string> -I <string> -f <string> [-i <string>] [-A] [-F <string>] [-w <string>] [-o <string>] [-R <string>] [-v <string>] [-u <string>] [--apiversion <string>] [--json] [--loglevel trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]`](#sfdx-velocedump--s-string--i-string--f-string--i-string--a--f-string--w-string--o-string--r-string--v-string--u-string---apiversion-string---json---loglevel-tracedebuginfowarnerrorfataltracedebuginfowarnerrorfatal)
* [`sfdx veloce:dumpcontentdoc -i <string> -o <string> [-v <string>] [-u <string>] [--apiversion <string>] [--json] [--loglevel trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]`](#sfdx-velocedumpcontentdoc--i-string--o-string--v-string--u-string---apiversion-string---json---loglevel-tracedebuginfowarnerrorfataltracedebuginfowarnerrorfatal)
* [`sfdx veloce:dumpdoc -i <string> -o <string> [-v <string>] [-u <string>] [--apiversion <string>] [--json] [--loglevel trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]`](#sfdx-velocedumpdoc--i-string--o-string--v-string--u-string---apiversion-string---json---loglevel-tracedebuginfowarnerrorfataltracedebuginfowarnerrorfatal)
* [`sfdx veloce:load [-f <string>] [-v <string>] [-u <string>] [--apiversion <string>] [--json] [--loglevel trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]`](#sfdx-veloceload--f-string--v-string--u-string---apiversion-string---json---loglevel-tracedebuginfowarnerrorfataltracedebuginfowarnerrorfatal)
* [`sfdx veloce:loadcontentdoc -I <string> -i <string> -n <string> -d <string> -f <string> [-v <string>] [-u <string>] [--apiversion <string>] [--json] [--loglevel trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]`](#sfdx-veloceloadcontentdoc--i-string--i-string--n-string--d-string--f-string--v-string--u-string---apiversion-string---json---loglevel-tracedebuginfowarnerrorfataltracedebuginfowarnerrorfatal)
* [`sfdx veloce:loaddoc -I <string> -i <string> -n <string> -F <string> -f <string> [-v <string>] [-u <string>] [--apiversion <string>] [--json] [--loglevel trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]`](#sfdx-veloceloaddoc--i-string--i-string--n-string--f-string--f-string--v-string--u-string---apiversion-string---json---loglevel-tracedebuginfowarnerrorfataltracedebuginfowarnerrorfatal)
* [`sfdx veloce:login -p <string> -a <string> -u <string> -r <string> [-s <string>] [--json] [--loglevel trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]`](#sfdx-velocelogin--p-string--a-string--u-string--r-string--s-string---json---loglevel-tracedebuginfowarnerrorfataltracedebuginfowarnerrorfatal)
* [`sfdx veloce:packconfig -i <string> -o <string> [--json] [--loglevel trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]`](#sfdx-velocepackconfig--i-string--o-string---json---loglevel-tracedebuginfowarnerrorfataltracedebuginfowarnerrorfatal)
* [`sfdx veloce:packpricelist -i <string> -o <string> [--json] [--loglevel trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]`](#sfdx-velocepackpricelist--i-string--o-string---json---loglevel-tracedebuginfowarnerrorfataltracedebuginfowarnerrorfatal)
* [`sfdx veloce:packrules -i <string> -o <string> [--json] [--loglevel trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]`](#sfdx-velocepackrules--i-string--o-string---json---loglevel-tracedebuginfowarnerrorfataltracedebuginfowarnerrorfatal)
* [`sfdx veloce:packrulesgroup -i <string> -o <string> -m <string> [--json] [--loglevel trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]`](#sfdx-velocepackrulesgroup--i-string--o-string--m-string---json---loglevel-tracedebuginfowarnerrorfataltracedebuginfowarnerrorfatal)
* [`sfdx veloce:packui -n <string> -i <string> -o <string> -I <string> [-P <string>] [--json] [--loglevel trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]`](#sfdx-velocepackui--n-string--i-string--o-string--i-string--p-string---json---loglevel-tracedebuginfowarnerrorfataltracedebuginfowarnerrorfatal)
* [`sfdx veloce:permgen [-f <string>] [-s <string>] [-o <string>] [-v <string>] [-u <string>] [--apiversion <string>] [--json] [--loglevel trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]`](#sfdx-velocepermgen--f-string--s-string--o-string--v-string--u-string---apiversion-string---json---loglevel-tracedebuginfowarnerrorfataltracedebuginfowarnerrorfatal)
* [`sfdx veloce:sort [-n <string>] [-f] [-v <string>] [-u <string>] [--apiversion <string>] [--json] [--loglevel trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]`](#sfdx-velocesort--n-string--f--v-string--u-string---apiversion-string---json---loglevel-tracedebuginfowarnerrorfataltracedebuginfowarnerrorfatal)

## `sfdx veloce:apexload -s <string> -i <string> -f <string> -I <string> [-R <string>] [-P] [-U] [-o <string>] [-b <string>] [-B <string>] [-D <string>] [-N <string>] [-v <string>] [-u <string>] [--apiversion <string>] [--json] [--loglevel trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]`

Loads data into org, by creation of Anonymous apex code and it's execution. Operation is working in two modes: Update only (default) and Upsert --upsert. After each batch SOQL query is performed and ID Map file is populated with OldId=>NewId mappings

```
Loads data into org, by creation of Anonymous apex code and it's execution. Operation is working in two modes: Update only (default) and Upsert --upsert. After each batch SOQL query is performed and ID Map file is populated with OldId=>NewId mappings

USAGE
  $ sfdx veloce:apexload -s <string> -i <string> -f <string> -I <string> [-R <string>] [-P] [-U] [-o <string>] [-b 
  <string>] [-B <string>] [-D <string>] [-N <string>] [-v <string>] [-u <string>] [--apiversion <string>] [--json] 
  [--loglevel trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]

OPTIONS
  -B, --boolfields=boolfields                                                       Coma separated list of boolean
                                                                                    fields

  -D, --datefields=datefields                                                       Coma separated list of date fields

  -I, --idmap=idmap                                                                 (required) idmap.json file path, to
                                                                                    store/load <csvId:targetId> pairs

  -N, --numericfields=numericfields                                                 Coma separated list of boolean
                                                                                    fields

  -P, --printids                                                                    Print External ID before attempting
                                                                                    to update

  -R, --idreplacefields=idreplacefields                                             Coma separated list of fields in
                                                                                    which SF IDs are replaces by mapped
                                                                                    Ids by using text search and replace

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

_See code: [lib/commands/veloce/apexload.js](https://github.com/veloceapps/veloce-sfdx/blob/v1.0.44/lib/commands/veloce/apexload.js)_

## `sfdx veloce:dump -s <string> -I <string> -f <string> [-i <string>] [-A] [-F <string>] [-w <string>] [-o <string>] [-R <string>] [-v <string>] [-u <string>] [--apiversion <string>] [--json] [--loglevel trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]`

Dumps data from Object in org

```
Dumps data from Object in org

USAGE
  $ sfdx veloce:dump -s <string> -I <string> -f <string> [-i <string>] [-A] [-F <string>] [-w <string>] [-o <string>] 
  [-R <string>] [-v <string>] [-u <string>] [--apiversion <string>] [--json] [--loglevel 
  trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]

OPTIONS
  -A, --append                                                                      Append mode ON: don't add CSV header
                                                                                    row and append to existing file!

  -F, --onlyfields=onlyfields                                                       Coma separated list of fields to
                                                                                    include in export

  -I, --idmap=idmap                                                                 (required) idmap.json file path, to
                                                                                    REVERSE map IDs from

  -R, --idreplacefields=idreplacefields                                             Coma separated list of fields in
                                                                                    which SF IDs are replaces by mapped
                                                                                    Ids by using text search and replace

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

  -w, --where=where                                                                 where condition to filter sObjects
                                                                                    by

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

_See code: [lib/commands/veloce/dump.js](https://github.com/veloceapps/veloce-sfdx/blob/v1.0.44/lib/commands/veloce/dump.js)_

## `sfdx veloce:dumpcontentdoc -i <string> -o <string> [-v <string>] [-u <string>] [--apiversion <string>] [--json] [--loglevel trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]`

Dumps data from Document in org

```
Dumps data from Document in org

USAGE
  $ sfdx veloce:dumpcontentdoc -i <string> -o <string> [-v <string>] [-u <string>] [--apiversion <string>] [--json] 
  [--loglevel trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]

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
  $ sfdx veloce:dumpcontentdoc -i 01521000000gHgnAAE -o file.pml --targetusername myOrg@example.com 
  --targetdevhubusername devhub@org.com
  
  $ sfdx veloce:dumpcontentdoc -i 01521000000gHgnAAE -o file.pml --name myname --targetusername myOrg@example.com
```

_See code: [lib/commands/veloce/dumpcontentdoc.js](https://github.com/veloceapps/veloce-sfdx/blob/v1.0.44/lib/commands/veloce/dumpcontentdoc.js)_

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

_See code: [lib/commands/veloce/dumpdoc.js](https://github.com/veloceapps/veloce-sfdx/blob/v1.0.44/lib/commands/veloce/dumpdoc.js)_

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

_See code: [lib/commands/veloce/load.js](https://github.com/veloceapps/veloce-sfdx/blob/v1.0.44/lib/commands/veloce/load.js)_

## `sfdx veloce:loadcontentdoc -I <string> -i <string> -n <string> -d <string> -f <string> [-v <string>] [-u <string>] [--apiversion <string>] [--json] [--loglevel trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]`

Dumps data from Document in org

```
Dumps data from Document in org

USAGE
  $ sfdx veloce:loadcontentdoc -I <string> -i <string> -n <string> -d <string> -f <string> [-v <string>] [-u <string>] 
  [--apiversion <string>] [--json] [--loglevel trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]

OPTIONS
  -I, --idmap=idmap                                                                 (required) idmap.json file path, to
                                                                                    store/load <Id:targetId> pairs

  -d, --description=description                                                     (required) File description

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
  $ sfdx veloce:loadcontentdoc -i 01521000000gHgnAAE --targetusername myOrg@example.com --targetdevhubusername 
  devhub@org.com
     Document content here
  
  $ sfdx veloce:loadcontentdoc -i 01521000000gHgnAAE --name myname --targetusername myOrg@example.com
     Document content here
```

_See code: [lib/commands/veloce/loadcontentdoc.js](https://github.com/veloceapps/veloce-sfdx/blob/v1.0.44/lib/commands/veloce/loadcontentdoc.js)_

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

_See code: [lib/commands/veloce/loaddoc.js](https://github.com/veloceapps/veloce-sfdx/blob/v1.0.44/lib/commands/veloce/loaddoc.js)_

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

_See code: [lib/commands/veloce/login.js](https://github.com/veloceapps/veloce-sfdx/blob/v1.0.44/lib/commands/veloce/login.js)_

## `sfdx veloce:packconfig -i <string> -o <string> [--json] [--loglevel trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]`

Create configuration csv from files

```
Create configuration csv from files

USAGE
  $ sfdx veloce:packconfig -i <string> -o <string> [--json] [--loglevel 
  trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]

OPTIONS
  -i, --inputdir=inputdir                                                           (required) Input directory to read
                                                                                    property files

  -o, --outputfile=outputfile                                                       (required) Output csv configuration
                                                                                    file to create

  --json                                                                            format output as json

  --loglevel=(trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL)  [default: warn] logging level for
                                                                                    this command invocation

EXAMPLES
  $ sfdx veloce:createconfig -i config -o VELOCPQ__ConfigurationSetting__c.csv
  Configuration file example 
  filename: flows.json - where filename will be configuration property key( in this case `flows`) and inside that json 
  file 
  {
       "value": "some value here maybe multi-lined too",
    }
```

_See code: [lib/commands/veloce/packconfig.js](https://github.com/veloceapps/veloce-sfdx/blob/v1.0.44/lib/commands/veloce/packconfig.js)_

## `sfdx veloce:packpricelist -i <string> -o <string> [--json] [--loglevel trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]`

Create price list file for import to salesforce

```
Create price list file for import to salesforce

USAGE
  $ sfdx veloce:packpricelist -i <string> -o <string> [--json] [--loglevel 
  trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]

OPTIONS
  -i, --inputdir=inputdir                                                           (required) Input file with meta
                                                                                    information to create rule list

  -o, --outputfile=outputfile                                                       (required) Output csv rules group
                                                                                    file to create

  --json                                                                            format output as json

  --loglevel=(trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL)  [default: warn] logging level for
                                                                                    this command invocation

EXAMPLE
  $ sfdx veloce:packpricelist -i ./project-cato-pricelist.json -o ./VELOCPQ__PriceList__c.csv
```

_See code: [lib/commands/veloce/packpricelist.js](https://github.com/veloceapps/veloce-sfdx/blob/v1.0.44/lib/commands/veloce/packpricelist.js)_

## `sfdx veloce:packrules -i <string> -o <string> [--json] [--loglevel trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]`

Copy rules to csv for salesforce import

```
Copy rules to csv for salesforce import

USAGE
  $ sfdx veloce:packrules -i <string> -o <string> [--json] [--loglevel 
  trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]

OPTIONS
  -i, --inputdir=inputdir                                                           (required) Input directory to read
                                                                                    rule files

  -o, --outputfile=outputfile                                                       (required) Output csv rule file to
                                                                                    create

  --json                                                                            format output as json

  --loglevel=(trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL)  [default: warn] logging level for
                                                                                    this command invocation

EXAMPLES
  $ sfdx veloce:pack -i rules -o VELOCPQ__PriceRule__c.csv -m pgmap.json
  Rule file name will be used as a VELOCPQ__PriceRuleGroupId__c for example for rules file 
  project-cato-10-pre-config.drl VELOCPQ__PriceRuleGroupId__c will be project-cato-10-pre-config
```

_See code: [lib/commands/veloce/packrules.js](https://github.com/veloceapps/veloce-sfdx/blob/v1.0.44/lib/commands/veloce/packrules.js)_

## `sfdx veloce:packrulesgroup -i <string> -o <string> -m <string> [--json] [--loglevel trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]`

Copy rules group to csv for salesforce import

```
Copy rules group to csv for salesforce import

USAGE
  $ sfdx veloce:packrulesgroup -i <string> -o <string> -m <string> [--json] [--loglevel 
  trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]

OPTIONS
  -i, --inputdir=inputdir                                                           (required) Input directory to read
                                                                                    rule group files and meta
                                                                                    information

  -m, --pgmap=pgmap                                                                 (required) Price list meta
                                                                                    information

  -o, --outputfile=outputfile                                                       (required) Output csv rules group
                                                                                    file to create

  --json                                                                            format output as json

  --loglevel=(trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL)  [default: warn] logging level for
                                                                                    this command invocation

EXAMPLES
  $ sfdx veloce:packrulesgroup -i ./rules/ -o ./VELOCPQ__PriceRuleGroup__c.csv -m pricelistmeta.json
  Each rule in rules folder need to have .json meta file - for example xxx.drl will have xxx.json. 
  Meta file example: 
  {
       "label": "project cato 10 pre config",
       "description": "Pre Configuration Rules",
       "sequence": 10,
       "type": "PreConfiguration"
  }
```

_See code: [lib/commands/veloce/packrulesgroup.js](https://github.com/veloceapps/veloce-sfdx/blob/v1.0.44/lib/commands/veloce/packrulesgroup.js)_

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

_See code: [lib/commands/veloce/packui.js](https://github.com/veloceapps/veloce-sfdx/blob/v1.0.44/lib/commands/veloce/packui.js)_

## `sfdx veloce:permgen [-f <string>] [-s <string>] [-o <string>] [-v <string>] [-u <string>] [--apiversion <string>] [--json] [--loglevel trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]`

Load data into org, by use of standard Salesforce API

```
Load data into org, by use of standard Salesforce API

USAGE
  $ sfdx veloce:permgen [-f <string>] [-s <string>] [-o <string>] [-v <string>] [-u <string>] [--apiversion <string>] 
  [--json] [--loglevel trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]

OPTIONS
  -f, --file=file                                                                   csv file to load into salesforce

  -o, --ignorefields=ignorefields                                                   Coma separated list of fields to
                                                                                    ignore during generation

  -s, --sobjecttypes=sobjecttypes                                                   Coma separated lists of sObject
                                                                                    types of the records you want to
                                                                                    upsert.

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
  $ sfdx veloce:permgen -f ./ myname.csv --targetusername myOrg@example.com --targetdevhubusername devhub@org.com -s 
  Product2
     Hello world! This is org: MyOrg and I will be around until Tue Mar 20 2018!
     My hub org id is: 00Dxx000000001234
  
  $ sfdx veloce:permgen -f ./ myname.csv --targetusername myOrg@example.com -s Product2
     Hello myname! This is org: MyOrg and I will be around until Tue Mar 20 2018!
```

_See code: [lib/commands/veloce/permgen.js](https://github.com/veloceapps/veloce-sfdx/blob/v1.0.44/lib/commands/veloce/permgen.js)_

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

_See code: [lib/commands/veloce/sort.js](https://github.com/veloceapps/veloce-sfdx/blob/v1.0.44/lib/commands/veloce/sort.js)_
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

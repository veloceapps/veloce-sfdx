import { expect, test } from '@salesforce/command/lib/test';
import { ensureJsonMap, ensureString } from '@salesforce/ts-types';

describe('veloce:apexload', () => {
  test
    .withOrg({ username: 'test@org.com' }, true)
    .withConnectionRequest(request => {
      const requestMap = ensureJsonMap(request);
      if (ensureString(requestMap.url).match(/Organization/)) {
        return Promise.resolve({ records: [ { Name: 'Super Awesome Org', TrialExpirationDate: '2018-03-20T23:24:11.000+0000'}] });
      }
      return Promise.resolve({ records: [] });
    })
    .stdout()
    .command(['veloce:apexload',
      '--targetusername',
      'test@org.com',
      '-s',
      'PricebookEntry',
      '-i',
      'sfxId__c',
      '-o',
      'Id,Name,ProductCode',
      '--idmap=./org-idmap/gp01-idmap.json',
      './testdata/PricebookEntryStandard/PricebookEntry.csv'])
    .it('runs veloce:apexload --targetusername test@org.com', ctx => {
      expect(ctx.stdout).to.contain('');
    });

});

import {expect, test} from '@salesforce/command/lib/test';
import {ensureJsonMap, ensureString} from '@salesforce/ts-types';

describe('veloce:login', () => {
  test
    .withOrg({username: 'test@org.com'}, true)
    .withConnectionRequest(request => {
      const requestMap = ensureJsonMap(request);
      if (ensureString(requestMap.url).match(/Organization/)) {
        return Promise.resolve({
          records: [{
            Name: 'Super Awesome Org',
            TrialExpirationDate: '2018-03-20T23:24:11.000+0000'
          }]
        });
      }
      return Promise.resolve({records: []});
    })
    .stdout()
    .command(['veloce:login', '-u', 'username', '-p', './PASSWORDFILE', '-r', 'https://test.my.salesforce.com'])
    .it('runs veloce:login -u username -p ./PASSWORDFILE -r https://test.my.salesforce.com', ctx => {
      expect(ctx.stdout).to.contain('');
    });
});

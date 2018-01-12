var expect = require('chai').expect;
var PasswordPing = require('../passwordping.js');

//
// These are actually live tests and require a valid API key and Secret to be set in your environment variables.
// Set an env var for PP_API_KEY and PP_API_SECRET with the respective values prior to running the tests.
//
describe('PasswordPing', function() {
    describe('constructor', function() {
        it('throws exception on missing API key and Secret', function() {
            var error = false;
            try {
                new PasswordPing();
            }
            catch(e) {
                error = true;
                expect(e).to.equal('API key and Secret must be provided');
            }

            expect(error).to.equal(true);
        });

        it('instantiates correctly', function() {
           var passwordping = new PasswordPing(process.env.PP_API_KEY, process.env.PP_API_SECRET);
           expect(passwordping).to.be.a('Object');
           expect(passwordping).to.have.property('apiKey');
           expect(passwordping).to.have.property('secret');
           expect(passwordping.apiKey).to.equal(process.env.PP_API_KEY);
           expect(passwordping.secret).to.equal(process.env.PP_API_SECRET);
           expect(passwordping.host).to.equal('api.passwordping.com');
        });

        it('works with alternate base API host', function() {
            var passwordping = new PasswordPing(process.env.PP_API_KEY, process.env.PP_API_SECRET, 'api-alt.passwordping.com');
            expect(passwordping.host).to.equal('api-alt.passwordping.com');
        });
    });

    describe('#checkPassword()', function() {
        var passwordping = getPasswordPing();

        it('gets correct positive result', function(done) {
            passwordping.checkPassword('123456', function(err, result) {
                expect(err).to.equal(null);
                expect(result).to.equal(true);
                done();
            });
        });

        it('gets correct negative result', function(done) {
           passwordping.checkPassword('kjdlkjdlksjdlskjdlskjslkjdslkdjslkdjslkd', function(err, result) {
               expect(err).to.equal(null);
               expect(result).to.equal(false);
               done();
           });
        });

        it('handles errors properly', function(done) {
            var bogusServer = new PasswordPing(process.env.PP_API_KEY, process.env.PP_API_SECRET, 'bogus.passwordping.com');

            bogusServer.checkPassword('123456', function (err, result) {
                expect(err).to.equal('Unexpected error calling PasswordPing API: getaddrinfo ENOTFOUND bogus.passwordping.com bogus.passwordping.com:443');
                done();
            });
        });
    });

    describe('#checkCredentials()', function() {
        var passwordping = getPasswordPing();

       it('gets correct positive result', function(done) {
            passwordping.checkCredentials('test@passwordping.com', '123456', function(err, result) {
                expect(err).to.equal(null);
                expect(result).to.equal(true);
                done();
            });
       });

       it('gets correct negative result', function(done) {
            passwordping.checkCredentials('test@passwordping.com', '123456122', function(err, result) {
               expect(err).to.equal(null);
               expect(result).to.equal(false);
               done();
            });
       });

        it('handles errors properly', function(done) {
            var bogusServer = new PasswordPing(process.env.PP_API_KEY, process.env.PP_API_SECRET, 'bogus.passwordping.com');

            bogusServer.checkCredentials('test@passwordping.com', '123456', function (err, result) {
                expect(err).to.equal('Unexpected error calling PasswordPing API: getaddrinfo ENOTFOUND bogus.passwordping.com bogus.passwordping.com:443');
                done();
            });
        });
    });

    describe('#getExposuresForUser()', function(done) {
        var passwordping = getPasswordPing();

        it('gets correct result', function(done) {
            passwordping.getExposuresForUser('eicar', function(err, result) {
                expect(err).to.equal(null);
                expect(result.count).to.equal(6);
                expect(result.exposures.length).to.equal(6);
                expect(result.exposures).to.deep.equal(["5820469ffdb8780510b329cc", "58258f5efdb8780be88c2c5d",
                    "582a8e51fdb87806acc426ff", "583d2f9e1395c81f4cfa3479", "59ba1aa369644815dcd8683e", "59cae0ce1d75b80e0070957c"]);
                done();
            });
        });

        it('handles negative result correctly', function(done) {
            passwordping.getExposuresForUser('@@bogus-username@@', function(err, result) {
               expect(err).to.equal(null);
               expect(result.count).to.equal(0);
               expect(result.exposures.length).to.equal(0);
               done();
            });
        });

        it('handles error properly', function(done) {
            var bogusServer = new PasswordPing(process.env.PP_API_KEY, process.env.PP_API_SECRET, 'bogus.passwordping.com');

            bogusServer.getExposuresForUser('eicar', function (err, result) {
                expect(err).to.equal('Unexpected error calling PasswordPing API: getaddrinfo ENOTFOUND bogus.passwordping.com bogus.passwordping.com:443');
                done();
            });
        });
    });

    describe('#getExposedUsersForDomain()', function(done) {
        var passwordping = getPasswordPing();
        var pagingToken = null;

        it('gets correct result', function(done) {
            passwordping.getExposedUsersForDomain('email.tst', 2, null, function(err, result) {
                expect(err).to.equal(null);
                expect(result.count).to.equal(12);
                expect(result.users.length).to.equal(2);
                expect(result.users).to.deep.equal([
                    {
                        "username": "sample@email.tst",
                        "exposures": [
                            "57dc11964d6db21300991b78",
                            "5805029914f33808dc802ff7",
                            "57ffcf3c1395c80b30dd4429",
                            "598e5b844eb6d82ea07c5783",
                            "59bbf691e5017d2dc8a96eab",
                            "59bc2016e5017d2dc8bdc36a",
                            "59bebae9e5017d2dc85fc2ab",
                            "59f36f8c4eb6d85ba0bee09c"
                        ]
                    },
                    {
                        "username": "xxxxxxxxxx@email.tst",
                        "exposures": [
                            "5805029914f33808dc802ff7"
                        ]
                    }
                ]);
                expect(result.pagingToken).to.not.equal(null);
                pagingToken = result.pagingToken;
                done();
            });
        });

        it('gets correct result for subsequent page', function(done) {
            expect(pagingToken).to.not.equal(null);

            passwordping.getExposedUsersForDomain('email.tst', 2, pagingToken, function(err, result) {
                expect(err).to.equal(null);
                expect(result.count).to.equal(12);
                expect(result.users.length).to.equal(2);
                expect(result.users).to.deep.equal([
                    {
                        "username": "cbeiqvf@email.tst",
                        "exposures": [
                            "5805029914f33808dc802ff7"
                        ]
                    },
                    {
                        "username": "yjybey@email.tst",
                        "exposures": [
                            "5805029914f33808dc802ff7"
                        ]
                    }
                ]);
                done();
            });
        });

        it('handles negative result correctly', function(done) {
            passwordping.getExposedUsersForDomain('@@bogus-domain@@', 2, null, function(err, result) {
                expect(err).to.equal(null);
                expect(result.count).to.equal(0);
                expect(result.users.length).to.equal(0);
                done();
            });
        });

        it('handles error properly', function(done) {
            var bogusServer = new PasswordPing(process.env.PP_API_KEY, process.env.PP_API_SECRET, 'bogus.passwordping.com');

            bogusServer.getExposedUsersForDomain('email.tst', 2, null, function (err, result) {
                expect(err).to.equal('Unexpected error calling PasswordPing API: getaddrinfo ENOTFOUND bogus.passwordping.com bogus.passwordping.com:443');
                done();
            });
        });
    });

    describe('#getExposuresForDomain()', function(done) {
        var passwordping = getPasswordPing();

        it('gets correct result for no details', function(done) {
            passwordping.getExposuresForDomain('email.tst', false, function(err, result) {
                expect(err).to.equal(null);
                expect(result.count).to.equal(8);
                expect(result.exposures.length).to.equal(8);
                expect(result.exposures).to.deep.equal([
                    "59f36f8c4eb6d85ba0bee09c",
                    "59bebae9e5017d2dc85fc2ab",
                    "57dc11964d6db21300991b78",
                    "59bc2016e5017d2dc8bdc36a",
                    "598e5b844eb6d82ea07c5783",
                    "5805029914f33808dc802ff7",
                    "59bbf691e5017d2dc8a96eab",
                    "57ffcf3c1395c80b30dd4429"
                ]);
                done();
            });
        });

        it('gets correct result for include details', function(done) {
            passwordping.getExposuresForDomain('email.tst', true, function(err, result) {
                expect(err).to.equal(null);
                expect(result.count).to.equal(8);
                expect(result.exposures.length).to.equal(8);
                expect(result.exposures[0]).to.deep.equal(
                    {
                        "id": "57dc11964d6db21300991b78",
                        "title": "funsurveys.net",
                        "entries": 5123,
                        "date": "2015-05-01T00:00:00.000Z",
                        "category": "Surveys",
                        "passwordType": "Cleartext",
                        "exposedData": [
                            "Emails",
                            "Passwords"
                        ],
                        "dateAdded": "2016-09-16T15:36:54.000Z",
                        "sourceURLs": [],
                        "domainsAffected": 683
                    }
                );
                done();
            });
        });

        it('handles negative result correctly', function(done) {
            passwordping.getExposuresForDomain('@@bogus-domain@@', false, function(err, result) {
                expect(err).to.equal(null);
                expect(result.count).to.equal(0);
                expect(result.exposures.length).to.equal(0);
                done();
            });
        });

        it('handles error properly', function(done) {
            var bogusServer = new PasswordPing(process.env.PP_API_KEY, process.env.PP_API_SECRET, 'bogus.passwordping.com');

            bogusServer.getExposuresForDomain('email.tst', false, function (err, result) {
                expect(err).to.equal('Unexpected error calling PasswordPing API: getaddrinfo ENOTFOUND bogus.passwordping.com bogus.passwordping.com:443');
                done();
            });
        });
    });

    describe('#getExposureDetails()', function() {
        var passwordping = getPasswordPing();

        it('gets correct result', function(done) {
            passwordping.getExposureDetails('5820469ffdb8780510b329cc', function (err, result) {
                expect(err).to.equal(null);
                expect(result).to.deep.equal({
                    id: "5820469ffdb8780510b329cc",
                    title: "last.fm",
                    category: "Music",
                    date: "2012-03-01T00:00:00.000Z",
                    dateAdded: "2016-11-07T09:17:19.000Z",
                    passwordType: "MD5",
                    exposedData: ["Emails", "Passwords", "Usernames", "Website Activity"],
                    entries: 43570999,
                    domainsAffected: 1218513,
                    sourceURLs: []
                });
                done();
            });
        });

        it('handles negative result correctly', function(done) {
            passwordping.getExposureDetails("111111111111111111111111", function(err, result) {
                expect(err).to.equal(null);
                expect(result).to.equal(null);
                done();
            });
        });

        it('handles error properly', function(done) {
            var bogusServer = new PasswordPing(process.env.PP_API_KEY, process.env.PP_API_SECRET, 'bogus.passwordping.com');

            bogusServer.getExposureDetails('5820469ffdb8780510b329cc', function (err, result) {
                expect(err).to.equal('Unexpected error calling PasswordPing API: getaddrinfo ENOTFOUND bogus.passwordping.com bogus.passwordping.com:443');
                done();
            });
        });
    });

    describe('#addUserAlertSubscriptions()', function() {
        var passwordping = getPasswordPing();

        var testUserHashes = [
            'd56cdba2a920248f6487eb5a951013fcb9e4752a2ba5f1fa61ef8d235c44357e',
            'd56cdba2a920248f6487eb5a951013fcb9e4752a2ba5f1fa61ef8d235c44357f'
        ];

        it('cleans up previous test data', function(done) {
            passwordping.deleteUserAlertSubscriptions(testUserHashes,
                function (err, result) {
                    expect(err).to.equal(null);
                    expect(result.deleted).to.greaterThan(-1);
                    expect(result.notFound).to.greaterThan(-1);
                    done();
                }
            );
        });

        it('gets correct result', function(done) {
            passwordping.addUserAlertSubscriptions(testUserHashes,
                function (err, result) {
                    expect(err).to.equal(null);
                    expect(result).to.deep.equal({
                        added: 2,
                        alreadyExisted: 0
                    });
                    done();
                }
            );
        });

        it('gets correct repeated result', function(done) {
            passwordping.addUserAlertSubscriptions(testUserHashes,
                function (err, result) {
                    expect(err).to.equal(null);
                    expect(result).to.deep.equal({
                        added: 0,
                        alreadyExisted: 2
                    });
                    done();
                }
            );
        });

        it('handles error properly', function(done) {
            var bogusServer = new PasswordPing(process.env.PP_API_KEY, process.env.PP_API_SECRET, 'bogus.passwordping.com');

            bogusServer.addUserAlertSubscriptions(testUserHashes,
                function (err, result) {
                    expect(err).to.not.equal(null);
                    expect(err).to.equal('Unexpected error calling PasswordPing API: getaddrinfo ENOTFOUND bogus.passwordping.com bogus.passwordping.com:443');
                    done();
                }
            );
        });
    });

    describe('#deleteUserAlertSubscriptions()', function() {
        var passwordping = getPasswordPing();

        var testUserHashes = [
            'd56cdba2a920248f6487eb5a951013fcb9e4752a2ba5f1fa61ef8d235c44351e',
            'd56cdba2a920248f6487eb5a951013fcb9e4752a2ba5f1fa61ef8d235c44351f'
        ];

        it('adds test data', function(done) {
            passwordping.addUserAlertSubscriptions(testUserHashes,
                function (err, result) {
                    expect(err).to.equal(null);
                    expect(result.added).to.greaterThan(-1);
                    expect(result.alreadyExisted).to.greaterThan(-1);
                    done();
                }
            );
        });

        it('gets correct result', function(done) {
            passwordping.deleteUserAlertSubscriptions(testUserHashes,
                function (err, result) {
                    expect(err).to.equal(null);
                    expect(result).to.deep.equal({
                        deleted: 2,
                        notFound: 0
                    });
                    done();
                }
            );
        });

        it('gets correct repeated result', function(done) {
            passwordping.deleteUserAlertSubscriptions(testUserHashes,
                function (err, result) {
                    expect(err).to.equal(null);
                    expect(result).to.deep.equal({
                        deleted: 0,
                        notFound: 2
                    });
                    done();
                }
            );
        });

        it('handles error properly', function(done) {
            var bogusServer = new PasswordPing(process.env.PP_API_KEY, process.env.PP_API_SECRET, 'bogus.passwordping.com');

            bogusServer.deleteUserAlertSubscriptions(testUserHashes,
                function (err, result) {
                    expect(err).to.not.equal(null);
                    expect(err).to.equal('Unexpected error calling PasswordPing API: getaddrinfo ENOTFOUND bogus.passwordping.com bogus.passwordping.com:443');
                    done();
                }
            );
        });
    });

    describe('#isUserSubscribedForAlerts()', function() {
        var passwordping = getPasswordPing();

        var testUserHash = 'd56cdba2a920248f6487eb5a951013fcb9e4752a2ba5f1fa61ef8d235c44352e';

        it('adds test data', function(done) {
            passwordping.addUserAlertSubscriptions(testUserHash,
                function (err, result) {
                    expect(err).to.equal(null);
                    expect(result.added).to.greaterThan(-1);
                    expect(result.alreadyExisted).to.greaterThan(-1);
                    done();
                }
            );
        });

        it('gets correct result when exists', function(done) {
            passwordping.isUserSubscribedForAlerts(testUserHash,
                function (err, result) {
                    expect(err).to.equal(null);
                    expect(result).to.equal(true);
                    done();
                }
            );
        });

        it('delete test data', function(done) {
            passwordping.deleteUserAlertSubscriptions(testUserHash,
                function (err, result) {
                    expect(err).to.equal(null);
                    expect(result.deleted).to.greaterThan(-1);
                    expect(result.notFound).to.greaterThan(-1);
                    done();
                }
            );
        });

        it('gets correct result when not exists', function(done) {
            passwordping.isUserSubscribedForAlerts(testUserHash,
                function (err, result) {
                    expect(err).to.equal(null);
                    expect(result).to.equal(false);
                    done();
                }
            );
        });

        it('handles error properly', function(done) {
            var bogusServer = new PasswordPing(process.env.PP_API_KEY, process.env.PP_API_SECRET, 'bogus.passwordping.com');

            bogusServer.isUserSubscribedForAlerts(testUserHash,
                function (err, result) {
                    expect(err).to.not.equal(null);
                    expect(err).to.equal('Unexpected error calling PasswordPing API: getaddrinfo ENOTFOUND bogus.passwordping.com bogus.passwordping.com:443');
                    done();
                }
            );
        });
    });

    describe('#getUserAlertSubscriptions()', function() {
        var passwordping = getPasswordPing();

        var testUserHashes = [
            'd56cdba2a920248f6487eb5a951013fcb9e4752a2ba5f1fa61ef8d235c443530',
            'd56cdba2a920248f6487eb5a951013fcb9e4752a2ba5f1fa61ef8d235c443531',
            'd56cdba2a920248f6487eb5a951013fcb9e4752a2ba5f1fa61ef8d235c443532',
            'd56cdba2a920248f6487eb5a951013fcb9e4752a2ba5f1fa61ef8d235c443533',
            'd56cdba2a920248f6487eb5a951013fcb9e4752a2ba5f1fa61ef8d235c443534',
            'd56cdba2a920248f6487eb5a951013fcb9e4752a2ba5f1fa61ef8d235c443535',
            'd56cdba2a920248f6487eb5a951013fcb9e4752a2ba5f1fa61ef8d235c443536',
            'd56cdba2a920248f6487eb5a951013fcb9e4752a2ba5f1fa61ef8d235c443537',
            'd56cdba2a920248f6487eb5a951013fcb9e4752a2ba5f1fa61ef8d235c44353a',
            'd56cdba2a920248f6487eb5a951013fcb9e4752a2ba5f1fa61ef8d235c44353b',
            'd56cdba2a920248f6487eb5a951013fcb9e4752a2ba5f1fa61ef8d235c44353c',
            'd56cdba2a920248f6487eb5a951013fcb9e4752a2ba5f1fa61ef8d235c44353d',
            'd56cdba2a920248f6487eb5a951013fcb9e4752a2ba5f1fa61ef8d235c44353e',
            'd56cdba2a920248f6487eb5a951013fcb9e4752a2ba5f1fa61ef8d235c44353f'
        ];

        it('adds test data', function(done) {
            passwordping.addUserAlertSubscriptions(testUserHashes,
                function (err, result) {
                    expect(err).to.equal(null);
                    expect(result.added).to.greaterThan(-1);
                    expect(result.alreadyExisted).to.greaterThan(-1);
                    done();
                }
            );
        });

        var response1;

        it('gets correct result', function(done) {
            passwordping.getUserAlertSubscriptions(4, null,
                function (err, result) {
                    expect(err).to.equal(null);
                    expect(result.count).to.greaterThan(13);
                    expect(result.usernameHashes.length).to.equal(4);
                    expect(result.pagingToken).to.not.equal(null);

                    // save off result for next call
                    response1 = result;

                    done();
                }
            );
        });

        it('gets correct result for next page', function(done) {
            passwordping.getUserAlertSubscriptions(4, response1.pagingToken,
                function (err, result) {
                    expect(err).to.equal(null);
                    expect(result.count).to.greaterThan(13);
                    expect(result.usernameHashes.length).to.equal(4);
                    expect(result.pagingToken).to.not.equal(null);
                    done();
                }
            );
        });

        it('handles error properly', function(done) {
            var bogusServer = new PasswordPing(process.env.PP_API_KEY, process.env.PP_API_SECRET, 'bogus.passwordping.com');

            bogusServer.getUserAlertSubscriptions(4, null,
                function (err, result) {
                    expect(err).to.not.equal(null);
                    expect(err).to.equal('Unexpected error calling PasswordPing API: getaddrinfo ENOTFOUND bogus.passwordping.com bogus.passwordping.com:443');
                    done();
                }
            );
        });
    });

    describe('#addDomainAlertSubscriptions()', function() {
        var passwordping = getPasswordPing();

        var testDomains = [
            'testadddomain1.com',
            'testadddomain2.com'
        ];

        it('cleans up previous test data', function(done) {
            passwordping.deleteDomainAlertSubscriptions(testDomains,
                function (err, result) {
                    expect(err).to.equal(null);
                    expect(result.deleted).to.greaterThan(-1);
                    expect(result.notFound).to.greaterThan(-1);
                    done();
                }
            );
        });

        it('gets correct result', function(done) {
            passwordping.addDomainAlertSubscriptions(testDomains,
                function (err, result) {
                    expect(err).to.equal(null);
                    expect(result).to.deep.equal({
                        added: 2,
                        alreadyExisted: 0
                    });
                    done();
                }
            );
        });

        it('gets correct repeated result', function(done) {
            passwordping.addDomainAlertSubscriptions(testDomains,
                function (err, result) {
                    expect(err).to.equal(null);
                    expect(result).to.deep.equal({
                        added: 0,
                        alreadyExisted: 2
                    });
                    done();
                }
            );
        });

        it('handles error properly', function(done) {
            var bogusServer = new PasswordPing(process.env.PP_API_KEY, process.env.PP_API_SECRET, 'bogus.passwordping.com');

            bogusServer.addDomainAlertSubscriptions(testDomains,
                function (err, result) {
                    expect(err).to.not.equal(null);
                    expect(err).to.equal('Unexpected error calling PasswordPing API: getaddrinfo ENOTFOUND bogus.passwordping.com bogus.passwordping.com:443');
                    done();
                }
            );
        });
    });

    describe('#deleteDomainAlertSubscriptions()', function() {
        var passwordping = getPasswordPing();

        var testDomains = [
            'testdeletedomain1.com',
            'testdeletedomain2.com'
        ];

        it('adds test data', function(done) {
            passwordping.addDomainAlertSubscriptions(testDomains,
                function (err, result) {
                    expect(err).to.equal(null);
                    expect(result.added).to.greaterThan(-1);
                    expect(result.alreadyExisted).to.greaterThan(-1);
                    done();
                }
            );
        });

        it('gets correct result', function(done) {
            passwordping.deleteDomainAlertSubscriptions(testDomains,
                function (err, result) {
                    expect(err).to.equal(null);
                    expect(result).to.deep.equal({
                        deleted: 2,
                        notFound: 0
                    });
                    done();
                }
            );
        });

        it('gets correct repeated result', function(done) {
            passwordping.deleteDomainAlertSubscriptions(testDomains,
                function (err, result) {
                    expect(err).to.equal(null);
                    expect(result).to.deep.equal({
                        deleted: 0,
                        notFound: 2
                    });
                    done();
                }
            );
        });

        it('handles error properly', function(done) {
            var bogusServer = new PasswordPing(process.env.PP_API_KEY, process.env.PP_API_SECRET, 'bogus.passwordping.com');

            bogusServer.deleteDomainAlertSubscriptions(testDomains,
                function (err, result) {
                    expect(err).to.not.equal(null);
                    expect(err).to.equal('Unexpected error calling PasswordPing API: getaddrinfo ENOTFOUND bogus.passwordping.com bogus.passwordping.com:443');
                    done();
                }
            );
        });
    });

    describe('#isDomainSubscribedForAlerts()', function() {
        var passwordping = getPasswordPing();

        var testDomain = 'testtestdomain1.com';

        it('adds test data', function(done) {
            passwordping.addDomainAlertSubscriptions(testDomain,
                function (err, result) {
                    expect(err).to.equal(null);
                    expect(result.added).to.greaterThan(-1);
                    expect(result.alreadyExisted).to.greaterThan(-1);
                    done();
                }
            );
        });

        it('gets correct result when exists', function(done) {
            passwordping.isDomainSubscribedForAlerts(testDomain,
                function (err, result) {
                    expect(err).to.equal(null);
                    expect(result).to.equal(true);
                    done();
                }
            );
        });

        it('delete test data', function(done) {
            passwordping.deleteDomainAlertSubscriptions(testDomain,
                function (err, result) {
                    expect(err).to.equal(null);
                    expect(result.deleted).to.greaterThan(-1);
                    expect(result.notFound).to.greaterThan(-1);
                    done();
                }
            );
        });

        it('gets correct result when not exists', function(done) {
            passwordping.isDomainSubscribedForAlerts(testDomain,
                function (err, result) {
                    expect(err).to.equal(null);
                    expect(result).to.equal(false);
                    done();
                }
            );
        });

        it('handles error properly', function(done) {
            var bogusServer = new PasswordPing(process.env.PP_API_KEY, process.env.PP_API_SECRET, 'bogus.passwordping.com');

            bogusServer.isDomainSubscribedForAlerts(testDomain,
                function (err, result) {
                    expect(err).to.not.equal(null);
                    expect(err).to.equal('Unexpected error calling PasswordPing API: getaddrinfo ENOTFOUND bogus.passwordping.com bogus.passwordping.com:443');
                    done();
                }
            );
        });
    });

    describe('#getDomainAlertSubscriptions()', function() {
        var passwordping = getPasswordPing();

        var testDomains = [
            'testgetdomain1.com',
            'testgetdomain2.com',
            'testgetdomain3.com',
            'testgetdomain4.com',
            'testgetdomain5.com',
            'testgetdomain6.com',
            'testgetdomain7.com',
            'testgetdomain8.com',
            'testgetdomain9.com',
            'testgetdomain10.com',
            'testgetdomain11.com',
            'testgetdomain12.com',
            'testgetdomain13.com',
            'testgetdomain14.com'
        ];

        it('adds test data', function(done) {
            passwordping.addDomainAlertSubscriptions(testDomains,
                function (err, result) {
                    expect(err).to.equal(null);
                    expect(result.added).to.greaterThan(-1);
                    expect(result.alreadyExisted).to.greaterThan(-1);
                    done();
                }
            );
        });

        var response1;

        it('gets correct result', function(done) {
            passwordping.getDomainAlertSubscriptions(4, null,
                function (err, result) {
                    expect(err).to.equal(null);
                    expect(result.count).to.greaterThan(13);
                    expect(result.domains.length).to.equal(4);
                    expect(result.pagingToken).to.not.equal(null);

                    // save off result for next call
                    response1 = result;

                    done();
                }
            );
        });

        it('gets correct result for next page', function(done) {
            passwordping.getDomainAlertSubscriptions(4, response1.pagingToken,
                function (err, result) {
                    expect(err).to.equal(null);
                    expect(result.count).to.greaterThan(13);
                    expect(result.domains.length).to.equal(4);
                    expect(result.pagingToken).to.not.equal(null);
                    done();
                }
            );
        });

        it('handles error properly', function(done) {
            var bogusServer = new PasswordPing(process.env.PP_API_KEY, process.env.PP_API_SECRET, 'bogus.passwordping.com');

            bogusServer.getDomainAlertSubscriptions(4, null,
                function (err, result) {
                    expect(err).to.not.equal(null);
                    expect(err).to.equal('Unexpected error calling PasswordPing API: getaddrinfo ENOTFOUND bogus.passwordping.com bogus.passwordping.com:443');
                    done();
                }
            );
        });
    });

    describe('#calcPasswordHash()', function() {
        var passwordping = getPasswordPing();

        it('MD5 works', function(done) {
            passwordping.calcPasswordHash(PasswordType.MD5, '123456', null, function(err, result) {
                expect(err).to.equal(null);
                expect(result).to.equal('e10adc3949ba59abbe56e057f20f883e');
                done();
            });
        });

        it('SHA1 works', function(done) {
            passwordping.calcPasswordHash(PasswordType.SHA1, '123456', null, function(err, result) {
                expect(err).to.equal(null);
                expect(result).to.equal('7c4a8d09ca3762af61e59520943dc26494f8941b');
                done();
            });
        });

        it('SHA256 works', function(done) {
            passwordping.calcPasswordHash(PasswordType.SHA256, '123456', null, function(err, result) {
                expect(err).to.equal(null);
                expect(result).to.equal('8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92');
                done();
            });
        });

        it('IPBoard_MyBB works', function(done) {
            passwordping.calcPasswordHash(PasswordType.IPBoard_MyBB, '123456', ';;!_X', function(err, result) {
                expect(err).to.equal(null);
                expect(result).to.equal('2e705e174e9df3e2c8aaa30297aa6d74');
                done();
            });
        });

        it('VBulletin works', function(done) {
            passwordping.calcPasswordHash(PasswordType.VBulletinPost3_8_5, '123456789', ']G@', function(err, result) {
                expect(err).to.equal(null);
                expect(result).to.equal('57ce303cdf1ad28944d43454cea38d7a');
                done();
            });
        });

        it('BCrypt works', function(done) {
            passwordping.calcPasswordHash(PasswordType.BCrypt, '12345', '$2a$12$2bULeXwv2H34SXkT1giCZe', function(err, result) {
                expect(err).to.equal(null);
                expect(result).to.equal('$2a$12$2bULeXwv2H34SXkT1giCZeJW7A6Q0Yfas09wOCxoIC44fDTYq44Mm');
                done();
            });
        });

        it('CRC32 works', function(done) {
            passwordping.calcPasswordHash(PasswordType.CRC32, '123456', null, function(err, result) {
                expect(err).to.equal(null);
                expect(result).to.equal('0972d361');
                done();
            });
        });

        it('PHPBB3 works', function(done) {
            passwordping.calcPasswordHash(PasswordType.PHPBB3, '123456789', '$H$993WP3hbz', function(err, result) {
                expect(err).to.equal(null);
                expect(result).to.equal('$H$993WP3hbzy0N22X06wxrCc3800D2p41');
                done();
            });
        });

        it('CustomAlgorithm1 works', function(done) {
            passwordping.calcPasswordHash(PasswordType.CustomAlgorithm1, '123456', '00new00', function(err, result) {
                expect(err).to.equal(null);
                expect(result).to.equal('cee66db36504915f48b2d545803a4494bb1b76b6e9d8ba8c0e6083ff9b281abdef31f6172548fdcde4000e903c5a98a1178c414f7dbf44cffc001aee8e1fe206');
                done();
            });
        });

        it('CustomAlgorithm2 works', function(done) {
            passwordping.calcPasswordHash(PasswordType.CustomAlgorithm2, '123456', '123', function(err, result) {
                expect(err).to.equal(null);
                expect(result).to.equal('579d9ec9d0c3d687aaa91289ac2854e4');
                done();
            });
        });

        it('SHA512 works', function(done) {
            passwordping.calcPasswordHash(PasswordType.SHA512, 'test', null, function(err, result) {
                expect(err).to.equal(null);
                expect(result).to.equal('ee26b0dd4af7e749aa1a8ee3c10ae9923f618980772e473f8819a5d4940e0db27ac185f8a0e1d5f84f88bc887fd67b143732c304cc5fa9ad8e6f57f50028a8ff');
                done();
            });
        });

        it('MD5Crypt works', function(done) {
            passwordping.calcPasswordHash(PasswordType.MD5Crypt, '123456', '$1$4d3c09ea', function(err, result) {
                expect(err).to.equal(null);
                expect(result).to.equal('$1$4d3c09ea$hPwyka2ToWFbLTOq.yFjf.');
                done();
            });
        });

        it('CustomAlgorithm4 works', function(done) {
            passwordping.calcPasswordHash(PasswordType.CustomAlgorithm4, '1234', '$2y$12$Yjk3YjIzYWIxNDg0YWMzZO', function(err, result) {
                expect(err).to.equal(null);
                expect(result).to.equal('$2y$12$Yjk3YjIzYWIxNDg0YWMzZOpp/eAMuWCD3UwX1oYgRlC1ci4Al970W');
                done();
            });
        });
    });
});

function getPasswordPing() {
    return new PasswordPing(process.env.PP_API_KEY, process.env.PP_API_SECRET);
}
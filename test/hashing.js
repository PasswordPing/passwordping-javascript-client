var expect = require('chai').expect;
var hashing = require('../src/hashing.js');

describe("Hashing", function() {
    describe("#md5()", function() {
        it("generates a correct hash", function() {
            expect(Hashing.md5("123456")).to.equal("e10adc3949ba59abbe56e057f20f883e");
        });
    });

    describe("#sha1()", function() {
        it("generates a correct hash", function() {
            expect(Hashing.sha1("123456")).to.equal("7c4a8d09ca3762af61e59520943dc26494f8941b");
        });
    });

    describe("#sha256()", function() {
        it("generates a correct hash", function() {
            expect(Hashing.sha256("123456")).to.equal("8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92");
        });
    });

    describe("#sha512()", function() {
        it("generates a correct hash", function() {
            expect(Hashing.sha512("test")).to.equal("ee26b0dd4af7e749aa1a8ee3c10ae9923f618980772e473f8819a5d4940e0db27ac185f8a0e1d5f84f88bc887fd67b143732c304cc5fa9ad8e6f57f50028a8ff");
        });
    });

    describe("#whirlpool()", function() {
        it("generates a correct hash", function() {
            expect(Hashing.whirlpool("123456")).to.equal("fd9d94340dbd72c11b37ebb0d2a19b4d05e00fd78e4e2ce8923b9ea3a54e900df181cfb112a8a73228d1f3551680e2ad9701a4fcfb248fa7fa77b95180628bb2");
        });
    });

    describe("#crc32()", function() {
        it("generates a correct hash", function() {
            expect(Hashing.crc32("123456")).to.equal("0972d361");
        });
    });

    describe("#ipb_mybb()", function() {
        it("generates a correct hash", function() {
            expect(Hashing.ipb_mybb("123456", ";;!_X")).to.equal("2e705e174e9df3e2c8aaa30297aa6d74");
        });
    });

    describe("#vBulletin()", function() {
        it("generates a correct hash", function() {
            expect(Hashing.vBulletin("123456789", "]G@")).to.equal("57ce303cdf1ad28944d43454cea38d7a");
        });
    });

    describe("#bcrypt()", function() {
        it("generates a correct hash", function(done) {
            Hashing.bcrypt("12345", "$2a$12$2bULeXwv2H34SXkT1giCZe", function(err, value) {
                expect(err).to.equal(null);
                expect(value).to.equal("$2a$12$2bULeXwv2H34SXkT1giCZeJW7A6Q0Yfas09wOCxoIC44fDTYq44Mm");
                done();
            });
        });
    });

    describe("#phpbb3()", function() {
        it("generates a correct hash", function() {
            expect(Hashing.phpbb3("123456789", "$H$993WP3hbz")).to.equal("$H$993WP3hbzy0N22X06wxrCc3800D2p41");
        });
    });

    describe("#customAlgorithm1()", function() {
        it("generates a correct hash", function() {
            expect(Hashing.customAlgorithm1("123456", "00new00")).to.equal("cee66db36504915f48b2d545803a4494bb1b76b6e9d8ba8c0e6083ff9b281abdef31f6172548fdcde4000e903c5a98a1178c414f7dbf44cffc001aee8e1fe206");
        });
    });

    describe("#customAlgorithm2()", function() {
        it("generates a correct hash", function() {
            expect(Hashing.customAlgorithm2("123456", "123")).to.equal("579d9ec9d0c3d687aaa91289ac2854e4");
        });
    });

    describe("#customAlgorithm4()", function() {
        it("generates a correct hash", function(done) {
            Hashing.customAlgorithm4("1234", "$2y$12$Yjk3YjIzYWIxNDg0YWMzZO", function(err, value) {
                expect(err).to.equal(null);
                expect(value).to.equal("$2y$12$Yjk3YjIzYWIxNDg0YWMzZOpp/eAMuWCD3UwX1oYgRlC1ci4Al970W");
                done();
            });
        });
    });

    describe("#md5Crypt()", function() {
        it("generates a correct hash", function() {
            expect(Hashing.md5Crypt("123456", "$1$4d3c09ea")).to.equal("$1$4d3c09ea$hPwyka2ToWFbLTOq.yFjf.");
        });
    });

    describe("#argon2()", function() {
        it("generates a correct hash with plain salt and default params", function(done) {
            Hashing.argon2("123456", "saltysalt", function (err, hash) {
                try {
                    expect(hash).to.equal("$argon2d$v=19$m=1024,t=3,p=2$c2FsdHlzYWx0$EklGIPtCSWb3IS+q4IQ7rwrwm2o");
                    done();
                }
                catch(ex) {
                    done(ex);
                }
            });
        });

        it("generates a correct hash with parameterized salt and default params", function(done) {
            Hashing.argon2("123456", "$argon2d$v=19$m=1024,t=3,p=2$c2FsdHlzYWx0", function(err, hash) {
                try {
                    expect(hash).to.equal("$argon2d$v=19$m=1024,t=3,p=2$c2FsdHlzYWx0$EklGIPtCSWb3IS+q4IQ7rwrwm2o");
                    done();
                }
                catch(ex) {
                    done(ex);
                }
            });
        });

        it("generates a correct hash with parameterized salt and argon2i params", function(done) {
            Hashing.argon2("password", "$argon2i$v=19$m=65536,t=2,p=4,l=24$c29tZXNhbHQ", function(err, hash) {
                try {
                    expect(hash).to.equal("$argon2i$v=19$m=65536,t=2,p=4$c29tZXNhbHQ$RdescudvJCsgt3ub+b+dWRWJTmaaJObG");
                    done();
                }
                catch(ex) {
                    done(ex);
                }
            });
        });

        it("generates a correct hash with parameterized salt with invalid params", function(done) {
            Hashing.argon2("123456", "$argon2d$v=19$m=d2,t=ejw,p=2$c2FsdHlzYWx0", function(err, hash) {
                try {
                    expect(hash).to.equal("$argon2d$v=19$m=1024,t=3,p=2$c2FsdHlzYWx0$EklGIPtCSWb3IS+q4IQ7rwrwm2o");
                    done();
                }
                catch(ex) {
                    done(ex);
                }
            });
        });
    });

});
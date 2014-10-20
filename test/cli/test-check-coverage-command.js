/*jslint nomen: true */
var path = require('path'),
    fs = require('fs'),
    rimraf = require('rimraf'),
    mkdirp = require('mkdirp'),
    COMMAND = 'check-coverage',
    COVER_COMMAND = 'cover',
    DIR = path.resolve(__dirname, 'sample-project'),
    OUTPUT_DIR = path.resolve(DIR, 'coverage'),
    helper = require('../cli-helper'),
    existsSync = fs.existsSync || path.existsSync,
    run = helper.runCommand.bind(null, COMMAND),
    runCover = helper.runCommand.bind(null, COVER_COMMAND);

// TODO: REMOVE
//helper.setVerbose(true);

// TODO: Have the tests alternately read from *.yml file.
// TODO: Add tests for per-file, per-patten configured coverage.
// TODO: Maybe new test files `test-check-coverage-per-file`,
//       `test-check-coverage-patterns`
module.exports = {
    setUp: function (cb) {
        rimraf.sync(OUTPUT_DIR);
        mkdirp.sync(OUTPUT_DIR);
        helper.resetOpts();
        runCover([ 'test/run.js', '--report', 'none' ], function (/* results */) {
            cb();
        });
    },
    tearDown: function (cb) {
        rimraf.sync(OUTPUT_DIR);
        cb();
    },
    "Global coverage": {
        "should fail on inadequate statement coverage": function (test) {
            test.ok(existsSync(path.resolve(OUTPUT_DIR, 'coverage.json')));
            run([ '--statements', '72' ], function (results) {
                test.ok(!results.succeeded());
                test.ok(results.grepError(/Coverage for statements/));
                test.done();
            });
        },
        "should fail on inadequate branch coverage": function (test) {
            test.ok(existsSync(path.resolve(OUTPUT_DIR, 'coverage.json')));
            run([ '--branches', '72' ], function (results) {
                test.ok(!results.succeeded());
                test.ok(results.grepError(/Coverage for branches/));
                test.done();
            });
        },
        "should fail on inadequate function coverage": function (test) {
            test.ok(existsSync(path.resolve(OUTPUT_DIR, 'coverage.json')));
            run([ '--functions', '72' ], function (results) {
                test.ok(!results.succeeded());
                test.ok(results.grepError(/Coverage for functions/));
                test.done();
            });
        },
        "should fail on inadequate line coverage": function (test) {
            test.ok(existsSync(path.resolve(OUTPUT_DIR, 'coverage.json')));
            run([ '--lines', '72' ], function (results) {
                test.ok(!results.succeeded());
                test.ok(results.grepError(/Coverage for lines/));
                test.done();
            });
        },
        "should fail with multiple reasons when multiple thresholds violated": function (test) {
            test.ok(existsSync(path.resolve(OUTPUT_DIR, 'coverage.json')));
            run([ '--statements=72', '--functions=50', '--branches=72', '--lines=72' ], function (results) {
                test.ok(!results.succeeded());
                test.ok(results.grepError(/Coverage for lines/));
                test.ok(results.grepError(/Coverage for statements/));
                test.ok(results.grepError(/Coverage for branches/));
                test.ok(!results.grepError(/Coverage for functions/));
                test.done();
            });
        },
        "should fail with multiple reasons from configuration file": function (test) {
            test.ok(existsSync(path.resolve(OUTPUT_DIR, 'coverage.json')));
            // YML equivalent to: '--statements=72', '--functions=50', '--branches=72', '--lines=72'
            run([ '--config', 'config-check-global.istanbul.yml' ], function (results) {
                test.ok(!results.succeeded());
                test.ok(results.grepError(/Coverage for lines/));
                test.ok(results.grepError(/Coverage for statements/));
                test.ok(results.grepError(/Coverage for branches/));
                test.ok(!results.grepError(/Coverage for functions/));
                test.done();
            });
        },
        "should fail with multiple reasons from configuration file and command line": function (test) {
            test.ok(existsSync(path.resolve(OUTPUT_DIR, 'coverage.json')));
            // YML equivalent to: '--statements=72', '--functions=50', '--branches=72', '--lines=72'
            run([ '--statements=10', '--config', 'config-check-global.istanbul.yml' ], function (results) {
                test.ok(!results.succeeded());
                test.ok(results.grepError(/Coverage for lines/));
                test.ok(!results.grepError(/Coverage for statements/));
                test.ok(results.grepError(/Coverage for branches/));
                test.ok(!results.grepError(/Coverage for functions/));
                test.done();
            });
        },
        "should fail with multiple reasons when multiple thresholds violated with negative thresholds": function (test) {
            test.ok(existsSync(path.resolve(OUTPUT_DIR, 'coverage.json')));
            run([ '--statements=-3', '--functions=-10', '--branches=-1', '--lines=-3' ], function (results) {
                test.ok(!results.succeeded());
                test.ok(results.grepError(/Uncovered count for lines/));
                test.ok(results.grepError(/Uncovered count for statements/));
                test.ok(results.grepError(/Uncovered count for branches/));
                test.ok(!results.grepError(/Uncovered count for functions/));
                test.done();
            });
        },
        "should pass with multiple reasons when all thresholds in check": function (test) {
            test.ok(existsSync(path.resolve(OUTPUT_DIR, 'coverage.json')));
            run([ '--statements=60', '--functions=50', '--branches=50', '--lines=60', '-v' ], function (results) {
                test.ok(results.succeeded());
                test.ok(!results.grepOutput(/\\"actuals\\"/), "Verbose message not printed as expected");
                test.done();
            });
        },
        "should succeed with any threshold when no coverage found": function (test) {
            test.ok(existsSync(path.resolve(OUTPUT_DIR, 'coverage.json')));
            run([ '--statements', '72', '**/foobar.json' ], function (results) {
                test.ok(results.succeeded());
                test.done();
            });
        }
    },
    "Per-file coverage": {
        "should fail on inadequate statement coverage": function (test) {
            test.ok(existsSync(path.resolve(OUTPUT_DIR, 'coverage.json')));
            run([ '--config', 'config-check-each.istanbul.yml' ], function (results) {
                // vendor/dummy_vendor_lib.js (statements 66.67% vs. 72%)
                // vendor/dummy_vendor_lib.js (lines 66.67% vs. 72%)
                test.ok(!results.succeeded());
                test.ok(results.grepError(/Coverage for lines/));
                test.ok(results.grepError(/Coverage for statements/));
                test.ok(!results.grepError(/Coverage for branches/));
                test.ok(!results.grepError(/Coverage for functions/));
                test.done();
            });
        }
        // TODO: Add all comparable tests from above.
    }
};
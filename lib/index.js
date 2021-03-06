// Include modules

var ChildProcess = require('child_process');


// Declare internals

var internals = {};

exports.isDropped = false;


exports.register = function (pack, options, next) {

    internals.path = options.path || process.cwd();
    pack.events.on('response', internals.response(pack));
	next();
};


exports.register.attributes = {
   pkg: require('../package.json')
};


internals.response = function (pack) {

    var responseHandler = function (request) {

        if (exports.isDropped) {
            pack.events.removeListener('response', responseHandler);
            return;
        }

        if (request.response.statusCode !== 503) {
            return;
        }

        internals.dropCore();
    };

    return responseHandler;
};


internals.dropCore = function () {

    exports.isDropped = true;

    console.log('Dropping core for pid: ' + process.pid + ' to ' + internals.path);
    var gcore = ChildProcess.exec('ulimit -c unlimited; gcore ' + process.pid, {
        cwd: internals.path
    }, function (err, stdout, stderr) {

        console.log('Core file created at ' + Date.now());
        if (err) {
            console.error(err);
        }
        else if (stderr) {
            console.error(stderr.toString());
        }
        else if (stdout) {
            console.log(stdout.toString());
        }
    });
};

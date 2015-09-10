var _         = require('underscore'),
    fs        = require('fs-extended'),
    logger    = require('./logger'),
    constants = require('./constants');

exports.init = init;
exports.files = files;
exports.enable = enable;
exports.restore = restore;

function files(opts) {

	switch (opts.type) {

		case 'file':
			return [opts.input];

		case 'dir':
			return fs.listFilesSync(opts.input, {
				recursive:  true,
				prependDir: true,
				filter:     function(filePath) {
					return filePath.match(/\.js$/);
				}
			});
	}

	throw "Unknown 'input' type '" + opts.type + "'.";
}

function init(input, opts) {

	// 1st argument is options, with input specified as property
	if (_.isObject(input)) {
		opts = input;
	}

	// 1st argument is input, 2nd argument is options
	else {
		opts = (!opts || !_.isObject(opts)) ? {} : opts;
		opts.input = input;
	}

	// no input
	if (!opts.input) {

		// no CWD when executed as CommonJS module
		if (!process) {
			throw "Missing 'input' option telling me what to process.";
		}

		logger.debug('Assuming you want me to process the current working directory.');

		opts.input = process.cwd();
		opts.type = 'dir';
	}

	// input given
	else {

		// input is code
		if (opts.input.match(/[\n\r]/) || !fs.existsSync(opts.input)) {
			opts.type = 'code';
		}

		// input is dir or file
		else {
			var stat = fs.statSync(opts.input);

			opts.type = stat.isDirectory() ? 'dir' : 'file';
		}

		logger.debug("Assuming your 'input' is " + opts.type + ".");
	}

	if (opts.l) {
		opts.levels = opts.l;
		delete opts.l;
	}

	if (opts.n) {
		opts.notLevels = opts.n;
		delete opts.n;
	}

	if (opts['not-levels']) {
		opts.notLevels = opts['not-levels'];
		delete opts['not-levels'];
	}

	if (opts.levels && _.isString(opts.levels)) {
		opts.levels = opts.levels.split(',');
	}

	if (!opts.levels || !_.isArray(opts.levels)) {
		opts.levels = constants.LEVELS;
	}

	if (opts.notLevels && _.isString(opts.notLevels)) {
		opts.notLevels = opts.notLevels.split(',');
	}

	if (opts.notLevels) {
		opts.levels = _.difference(opts.levels, opts.notLevels);

		delete opts.notLevels;
	}

	return opts;
}

function enable(code, opts) {

	return code.replace(new RegExp('[^*]' + _regexp(opts), 'g'), '(function(){/*$1*/})');
}

function restore(code, opts) {

	return code.replace(new RegExp('\\(function\\(\\)\\s*\{\\/\\*' + _regexp(opts) + '\\*\\/\\s*\\}\\)', 'g'), '$1');
}

function _regexp(opts) {

	return '((?:console|Ti(?:tanium)?.API).(?:' + opts.levels.join('|') + '))';
}
// This module handles storing and retrieving user & app preferences
// NB! We use synchronous fs operations to ensure safe write on quit
const path = require('path');
const fs = require('fs');
const constants = require('../helpers/constants');
let storage = null;
let settings = null;

function readSettings() {
	try {
		// We need to use sync storage to have clean operations on app close
		settings = JSON.parse(fs.readFileSync(storage, 'utf8')) || {};
		return settings;
	} catch(error) {
		// If no settings file exists yet, return an empty set
		if (error.message && error.message.startsWith('ENOENT: no such file or directory')) {
			settings = {};
			return settings;
		}
		console.error(error);
		// Try to recover
		settings = {};
		return settings;
	}
}

function writeSettings() {
	try {
		return fs.writeFileSync(storage, JSON.stringify(settings));
	} catch (error) {
		console.error(error);
		return {};
	}
}

module.exports = function SettingStorage(app) {
	storage = path.join(app.getPath('appData'), constants.SETTINGS_STORAGE);
	settings = readSettings();

	return {
		get(key) {
			return settings[key];
		},
		set(key, value) {
			settings[key] = value;
			writeSettings();
		},
	};
};

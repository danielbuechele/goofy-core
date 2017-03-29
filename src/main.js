const electron = require('electron');
const BrowserWindow = electron.BrowserWindow;
const autoUpdater = electron.autoUpdater;
const dialog = electron.dialog;
const path = require('path');
const url = require('url');
const app = electron.app;
const session = electron.session;
const env = require('./config/env.js');
const os = require('os');
const constants = require('./helpers/constants');
const menubar = require('menubar');
const Config = require('electron-config');
const userConfig = new Config();
const getMenuBarIconPath = require('./helpers/getMenuBarIconPath');
const RequestFilter = require('./modules/requestFilter');

app.setName(env.appName);
app.disableHardwareAcceleration();

// menubar widget only available for Workplace right now
const menubarEnabled = env.product === constants.PRODUCT_WORKPLACE && userConfig.get('menubar');
if (menubarEnabled) {
	global.sharedObject = {
		unread: 0,
		mb: menubar({
			index: 'file:///' + path.join(__dirname, 'menu.html'),
			icon: getMenuBarIconPath(),
			width: 300,
			preloadWindow: true,
			transparent: true,
			showDockIcon: true,
		}),
	};

	global.sharedObject.mb.on('show', () => {
		global.sharedObject.mb.tray.setImage(getMenuBarIconPath(true, global.sharedObject.unread));
	});
	global.sharedObject.mb.on('hide', () => {
		global.sharedObject.mb.tray.setImage(getMenuBarIconPath(false, global.sharedObject.unread));
	});
}

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;
let willQuitApp = false;

function createWindow() {
	// Create the browser window.
	mainWindow = new BrowserWindow({ width: 800, height: 600, titleBarStyle: 'hidden-inset' });

	// Propagate retina resolution to requests if necessary
	const requestFilter = new RequestFilter(session);
	const display = electron.screen.getPrimaryDisplay();
	const scaleFactor = display.scaleFactor;
	if (scaleFactor !== 1.0) {
		requestFilter.setRetinaCookie(scaleFactor);
	}

	// and load the index.html of the app.
	mainWindow.loadURL(
		url.format({
			pathname: path.join(__dirname, 'index.html'),
			protocol: 'file:',
			slashes: true,
		})
	);

	mainWindow.on('close', e => {
		if (willQuitApp) {
			// the user tried to quit the app
			mainWindow = null;
		} else {
			// the user only tried to close the window
			e.preventDefault();
			if (mainWindow) {
				mainWindow.hide();
			}
		}
	});
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

app.on('before-quit', () => willQuitApp = true);

// Quit when all windows are closed.
app.on('window-all-closed', function() {
	// On OS X it is common for applications and their menu bar
	// to stay active until the user quits explicitly with Cmd + Q
	if (process.platform !== 'darwin') {
		app.quit();
	}
});

app.on('activate', function() {
	// On OS X it's common to re-create a window in the app when the
	// dock icon is clicked and there are no other windows open.
	if (mainWindow) {
		mainWindow.show();
	} else {
		createWindow();
	}
});

autoUpdater.on('update-downloaded', (event, releaseNotes, releaseName) => {
	dialog.showMessageBox(
		{
			title: 'Update available',
			message: `A new version of ${env.appName} is available!`,
			detail: `${env.appName} ${releaseName} is now available—you have ${app.getVersion()}.`,
			buttons: [ 'Install and Restart' ],
		},
		() => {
			willQuitApp = true;
			autoUpdater.quitAndInstall();
		}
	);
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

if (env.name === 'production') {
	const version = app.getVersion();
	const platform = os.platform() === 'darwin' ? 'osx' : os.platform();
	autoUpdater.setFeedURL(`${env.updateURL}/${platform}/${version}`);
	autoUpdater.checkForUpdates();
}

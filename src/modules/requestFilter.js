// This module handles all request filtering

module.exports = function RequestFilter(session) {
	let retinaCookie = null;

	const filter = {
		// TODO: Use getURL() or similar here instead?
		urls: [ 'https://*.facebook.com' ],
	};

	function ensureRetinaCookie(details) {
		const delimiter = '; ';
		const newCookie = `dpr=${retinaCookie}`;
		const cookieString = details.requestHeaders.Cookie || '';
		const cookies = cookieString.split(delimiter);

		// Check if the resolution cookie is set, if so, replace it, otherwise append it
		const wasSet = cookies.reduce((wasSet, cookie, index) => {
			if (cookie.match(/dpr=/)) {
				cookies[index] = newCookie;
				return true;
			}
			return wasSet;
		}, false);
		if (!wasSet) {
			cookies.push(newCookie);
		}
		details.requestHeaders.Cookie = cookies.join(delimiter);
	}

	session.defaultSession.webRequest.onBeforeSendHeaders(filter, (details, callback) => {
		if (retinaCookie) {
			ensureRetinaCookie(details);
		}
		const resolve = {
			cancel: false,
			requestHeaders: details.requestHeaders,
		};
		callback(resolve);
	});

	return {
		setRetinaCookie(cookieValue) {
			retinaCookie = cookieValue;
		},
	};
};

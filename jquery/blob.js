var xhrSupported = jQuery.ajaxSettings.xhr(),
	xhrSuccessStatus = {
		// file protocol always yields status code 0, assume 200
		0: 200,
		// Support: IE9
		// #1450: sometimes IE returns 1223 when it should be 204
		1223: 204
	},
	// Support: IE9
	// We need to keep track of outbound xhr and abort them manually
	// because IE is not smart enough to do it all by itself
	xhrId = 0,
	xhrCallbacks = {};


jQuery.ajaxTransport('blob', function( options ) {
	var callback;
	return {
		send: function( headers, complete ) {
			var i, id,
				xhr = options.xhr();
			xhr.open( options.type, options.url, options.async, options.username, options.password );
			xhr.responseType = 'blob';
			// Apply custom fields if provided
//			if ( options.xhrFields ) {
//				for ( i in options.xhrFields ) {
//					xhr[ i ] = options.xhrFields[ i ];
//				}
//			}
			// Override mime type if needed
//			if ( options.mimeType && xhr.overrideMimeType ) {
//				xhr.overrideMimeType( options.mimeType );
//			}
			// X-Requested-With header
			// For cross-domain requests, seeing as conditions for a preflight are
			// akin to a jigsaw puzzle, we simply never set it to be sure.
			// (it can always be set on a per-request basis or even using ajaxSetup)
			// For same-domain requests, won't change header if already provided.
			if ( !options.crossDomain && !headers["X-Requested-With"] ) {
				headers["X-Requested-With"] = "XMLHttpRequest";
			}
			// Set headers
			for ( i in headers ) {
				xhr.setRequestHeader( i, headers[ i ] );
			}
			// Callback
			callback = function( type ) {
				return function() {
					if ( callback ) {
						delete xhrCallbacks[ id ];
						callback = xhr.onload = xhr.onerror = null;
						if ( type === "abort" ) {
							xhr.abort();
						} else if ( type === "error" ) {
							complete(
								// file protocol always yields status 0, assume 404
								xhr.status || 404,
								xhr.statusText
							);
						} else {
							complete(
								xhrSuccessStatus[ xhr.status ] || xhr.status,
								xhr.statusText,
								{blob: xhr.response, text : 'Use .response for reading blobs.'},
								xhr.getAllResponseHeaders()
							);
						}
					}
				};
			};
			// Listen to events
			xhr.onload = callback();
			xhr.onerror = callback("error");
			// Create the abort callback
			callback = xhrCallbacks[( id = xhrId++ )] = callback("abort");
			// Do send the request
			// This may raise an exception which is actually
			// handled in jQuery.ajax (so no try/catch here)
			xhr.send( options.hasContent && options.data || null );
		},
		abort: function() {
			if ( callback ) {
				callback();
			}
		}
	};
});
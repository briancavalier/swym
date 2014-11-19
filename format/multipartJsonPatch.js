var partHeaderStart = '\nContent-Type: application/json-patch+json\n';

exports.stringify = stringify;
exports.contentType = 'multipart/mixed;boundary="patch-boundary"';

function stringify(patches) {
	return makeMultipartJsonPayload('patch-boundary', patches);
}

function makeMultipartJsonPayload (boundary, patches) {
	return patches.reduceRight(function (s, patch) {
		return makeBoundary(boundary) + partHeaderStart + makePartHeaders(patch) + '\n' + JSON.stringify(patch.patch) + s;
	}, makeEnd(boundary));
}

function makePartHeaders(patch) {
	return 'X-Version: ' + patch.version + ',' + patch.remoteVersion + '\n';
}

function makeBoundary(b) {
	return '\n--' + b;
}

function makeEnd(b) {
	return makeBoundary(b) + '--';
}
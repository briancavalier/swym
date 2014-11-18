var jiff = require('jiff');
var when = require('when');
var AsyncStore = require('../lib/store/AsyncStore');

module.exports = SRef;

function SRef(send, data, patches) {
	this._send = send;
	this.data = AsyncStore.from(data);
	this.patches = AsyncStore.from(patches);
}

SRef.prototype.map = function(f) {
	this.data.map(f);
	return this;
};

SRef.prototype.get = function() {
	return this.data.get();
};

SRef.prototype.set = function(data) {
	this.data.set(data);
	return this;
};

SRef.prototype.sync = function(init) {
	if(this._running) {
		return;
	}
	this._startSync(init);
	return this;
};

SRef.prototype._startSync = function(init) {
	this._running = true;
	
	this.data.map(init);

	this.shadow = this.data.get();
	when(this.shadow).with(this).then(this._initSync).then(this._sync);
};

SRef.prototype._initSync = function() {
	this.patches.map(function(patchData) {
		return patchData == null ? { version: 0, remoteVersion: 0, patches: [] } : patchData;
	});
};

SRef.prototype._stopSync = function() {
	this._running = false;
};

SRef.prototype._sync = function() {
	if (!this._running) {
		return when.resolve();
	}

	return when(this.data.get()).with(this)
		.fold(this._updatePatches, this.shadow)
		.then(this._sendNext)
		.then(this._handleReturnPatch)
		.catch(function(error) {
			// TODO: Need to surface this error somehow
			// TODO: Need a configurable policy on how to handle remote patch failures
			console.error(error);
		})
		.delay(1000)// TODO: This delay needs to be configurable/externalized
		.then(this._sync)
		.with(); // unset thisArg
};

SRef.prototype._updatePatches = function(shadow, data) {
	var patch = jiff.diff(shadow, data);
	this.shadow = data;

	if (patch.length > 0) {
		var self = this;

		this.patches = this.patches.map(function (patchData) {
			patchData.version += 1;
			patchData.patches.push({
				patch: patch,
				localVersion: patchData.version,
				remoteVersion: patchData.remoteVersion
			});

			return patchData;
		});
	}

	return this.patches.get();
};

SRef.prototype._sendNext = function(patchData) {
	return when(this._send(patchData.patches));
};

SRef.prototype._handleReturnPatch = function(versionedPatches) {
	var data = this.data.get();

	if(versionedPatches == null || versionedPatches.length === 0) {
		this._pruneChanges();
		return data;
	}

	data = when(data).with(this).fold(this._updateFromRemote, versionedPatches);

	return this.data.set(data).get();
};

SRef.prototype._updateFromRemote = function(versionedPatches, data) {
	return when(this.patches.get()).then(function(patchData) {
		return this._updateDataAndPrunePatches(versionedPatches, data, patchData);
	});
};

SRef.prototype._updateDataAndPrunePatches = function(versionedPatches, data, patchData) {
	var updated = updateData(versionedPatches, data, patchData);

	this.patches = this.patches.set(prunePatches(patchData));

	return updated;
};

function updateData (versionedPatches, data, patchData) {
	return versionedPatches.reduce(function (data, versionedPatch) {
		// Only apply patches for versions larger than the current
		if (versionedPatch.localVersion <= patchData.remoteVersion) {
			return data;
		}
		var updated = jiff.patch(versionedPatch.patch, data);
		patchData.remoteVersion = versionedPatch.localVersion;
		return updated;

	}, data);
}

function prunePatches (patchData) {
	var patches = patchData.patches;
	var remoteVersion = patchData.remoteVersion;

	return {
		version: patchData.version,
		remoteVersion: patchData.remoteVersion,
		patches: patches.filter(function (versionedPatch) {
			return versionedPatch.remoteVersion > remoteVersion;
		})
	};
}

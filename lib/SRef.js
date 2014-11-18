var when = require('when');
var AsyncStore = require('../lib/AsyncStore');

module.exports = SRef;

function SRef(send, store) {
	this._send = send;
	this.state = AsyncStore.from(store);
	this.shadow = void 0;
	this._running = false;
}

SRef.prototype.map = function(f) {
	this.state = this.state.map(function(state) {
		return {
			version: state.version,
			remoteVersion: state.remoteVersion,
			patches: state.patches,
			data: f(state.data)
		};
	});
	return this;
};

SRef.prototype.get = function() {
	return when(this.state.get(), function(state) {
		return state.data;
	});
};

SRef.prototype.set = function(data) {
	return this.map(function() {
		return data;
	});
};

SRef.prototype.sync = function() {
	if(this._running) {
		return;
	}
	this._startSync();
	return this;
};

SRef.prototype._startSync = function() {
	this._running = true;
	this.state = this._initState();
	this.shadow = this.get();

	when(this.shadow).with(this).then(this._sync);
};

SRef.prototype._initState = function() {
	return this.state.map(function(state) {
		return state == null ? {
			version: 0,
			remoteVersion: 0,
			patches: [],
			data: null
		} : state;
	});
};

SRef.prototype._stopSync = function() {
	this._running = false;
};

SRef.prototype._sync = function() {
	if (!this._running) {
		return when.resolve();
	}

	return when(this.state.get()).with(this)
		.fold(this._updatePatches, this.shadow)
		.then(this._sendNext)
		.then(this._handleReturnPatch)
		.catch(function(error) {
			// TODO: Need to surface this error somehow
			// TODO: Need a configurable policy on how to handle remote patch failures
			console.error(error.stack);
		})
		.delay(1000)// TODO: This delay needs to be configurable/externalized
		.then(this._sync)
		.with(); // unset thisArg
};

SRef.prototype._updatePatches = function(shadow, state) {
	var patch = jiff.diff(shadow, state.data);
	this.shadow = state.data;

	if (patch.length > 0) {

		this.state = this.state.map(function (state) {
			console.log('HERE');
			state.version += 1;
			state.patches.push({
				patch: patch,
				localVersion: state.version,
				remoteVersion: state.remoteVersion
			});

			return state;
		});
	}

	return this.state.get();
};

SRef.prototype._sendNext = function(state) {
	return when(this._send(state.patches));
};

SRef.prototype._handleReturnPatch = function(incomingPatches) {
	var self = this;
	this.state = this.state.map(function(state) {
		return self._updateFromRemote(incomingPatches, state);
	});
	return this.state.get();
};

SRef.prototype._updateFromRemote = function(incomingPatches, state) {
	if(incomingPatches == null) {
		return state;
	}

	var updated = updateShadowAndData(incomingPatches, state);
	return prunePatches(updated.remoteVersion, updated);
};

function updateShadowAndData (incomingPatches, state) {
	this.shadow = incomingPatches.reduce(function (shadow, patch) {
		// Only apply patches for versions larger than the current
		if (patch.localVersion <= state.remoteVersion) {
			return shadow;
		}

		// Patch both the shadow and the data
		shadow = jiff.patch(patch.patch, shadow);
		state.data = jiff.patch(patch.patch, state.data);
		state.remoteVersion = patch.localVersion;

		return shadow;

	}, this.shadow);

	return state;
}

function prunePatches (remoteVersion, state) {
	return {
		data: state.data,
		version: state.version,
		remoteVersion: state.remoteVersion,
		patches: state.patches.filter(function (patch) {
			return patch.remoteVersion > remoteVersion;
		})
	};
}

var when = require('when');

module.exports = SyncLoop;

function SyncLoop(send, patchStrategy, loopStrategy, sref) {
	this.send = send;
	this.patchStrategy = patchStrategy;
	this.loopStrategy = loopStrategy;
	this.sref = sref;
	this.shadow = sref.get();

	this._errors = 0;
	this._running = false;
}

SyncLoop.prototype.run = function() {
	if (this._running) {
		return;
	}

	this._running = true;
	return this._run();
};

SyncLoop.prototype._run = function() {
	if(!this._running) {
		return;
	}

	when(this.sref.state.get()).with(this)
		.fold(this._updatePatches, this.shadow)
		.then(this._sendNext)
		.then(this._handleReturnPatch)
		.then(function() {
			this._errors = 0;
			return this.loopStrategy.onLoop();
		}, function(e) {
			this._errors += 1;
			return this.loopStrategy.onError(this._errors, this, e);
		})
		.then(this._run);
};

SyncLoop.prototype.stop = function() {
	this._running = false;
};

SyncLoop.prototype._updatePatches = function(shadow, state) {
	var patch = this.patchStrategy.diff(shadow, state.data);

	var sref = this.sref;

	if (patch.length > 0) {
		this.shadow = state.data;

		sref.state = sref.state.map(function (state) {
			var version = state.version + 1;
			return {
				data: state.data,
				version: version,
				remoteVersion: state.remoteVersion,
				patches: state.patches.concat({
					patch: patch,
					localVersion: version,
					remoteVersion: state.remoteVersion
				})
			};
		});
	}

	return sref.state.get();
};

SyncLoop.prototype._sendNext = function(state) {
	return this.send(this.sref.url, state.patches);
};

SyncLoop.prototype._handleReturnPatch = function(incomingPatches) {
	var self = this;
	var sref = this.sref;

	sref.state = sref.state.map(function(state) {
		return self._updateFromRemote(incomingPatches, state);
	});

	//return sref.state.get();
};

SyncLoop.prototype._updateFromRemote = function(incomingPatches, state) {
	if(incomingPatches == null) {
		return state;
	}

	var updated = this._updateShadowAndData(incomingPatches, state);
	return prunePatches(updated.remoteVersion, updated);
};

SyncLoop.prototype._updateShadowAndData = function(incomingPatches, state) {
	var patchStrategy = this.patchStrategy;
	this.shadow = incomingPatches.reduce(function (shadow, patch) {
		// Only apply patches for versions larger than the current
		if (patch.localVersion <= state.remoteVersion) {
			return shadow;
		}

		// Patch both the shadow and the data
		shadow = patchStrategy.patch(patch.patch, shadow);
		state.data = patchStrategy.patch(patch.patch, state.data);
		state.remoteVersion = patch.localVersion;

		return shadow;

	}, this.shadow);

	return state;
};

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
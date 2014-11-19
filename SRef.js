var syncState = require('./sync/syncState');

module.exports = SRef;

function SRef(store) {
	this.state = store;
}

SRef.prototype.get = function() {
	return this.state.get().then(syncState.getData);
};

SRef.prototype.set = function(data) {
	return this.map(function() {
		return data;
	});
};

SRef.prototype.map = function(f) {
	this.state = this.state.map(function(state) {
		return syncState.map(f, state);
	});
	return this;
};


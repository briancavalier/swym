var syncState = require('./sync/syncState');

module.exports = SRef;

function SRef(store) {
	this.store = store;
}

SRef.init = function(f, store) {
	return new SRef(store.map(function(state) {
		return syncState.map(f, state == null ? syncState.empty() : state);
	}));
};

SRef.prototype.get = function() {
	return syncState.getData(this.store.get());
};

SRef.prototype.set = function(data) {
	return this.map(function() {
		return data;
	});
};

SRef.prototype.map = function(f) {
	this.store = this.store.map(function(state) {
		return syncState.map(f, state);
	});
	return this;
};

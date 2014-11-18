var when = require('when');

module.exports = AsyncStore;

function AsyncStore(store) {
	this.store = when.resolve(store);
}

AsyncStore.from = function(store) {
	return new AsyncStore(store);
};

AsyncStore.prototype.get = function() {
	return when(this.store, get);
};

AsyncStore.prototype.set = function(data) {
	return new AsyncStore(when(this.store).fold(set, data));
};

AsyncStore.prototype.map = function(f) {
	return new AsyncStore(when(this.store).fold(map, f));
};

function get(store) {
	return store.get();
}

function set(data, store) {
	return store.set(data);
}

function map(f, store) {
	return store.map(f);
}
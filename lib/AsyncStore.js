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
	var store = this.store.fold(set, data);
	return new AsyncStore(store);
};

AsyncStore.prototype.map = function(f) {
	var store = this.get().then(f).fold(create, this.store);
	return new AsyncStore(store);
};

function get(store) {
	return store.get();
}

function set(data, store) {
	return store.set(data);
}

function create(store, data) {
	return store.set(data);
}

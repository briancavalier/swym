module.exports = MemoryStore;

function MemoryStore(data) {
	this.data = data;
}

MemoryStore.of = function(data) {
	return new MemoryStore(data);
};

MemoryStore.empty = function() {
	return new MemoryStore(void 0);
};

MemoryStore.prototype.get = function() {
	return this.data;
};

MemoryStore.prototype.set = function(data) {
	this.data = data;
	return this;
};

MemoryStore.prototype.map = function(f) {
	return this.set(f(this.get()));
};
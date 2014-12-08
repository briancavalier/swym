module.exports = LocalStorageStore;

function LocalStorageStore(key, localStorage) {
	this.key = key;
	this.localStorage = localStorage;
}

LocalStorageStore.at = function(key) {
	return new LocalStorageStore(key, localStorage);
};

LocalStorageStore.prototype.get = function() {
	var data = this.localStorage.getItem(this.key);
	return data == null ? data : JSON.parse(data);
};

LocalStorageStore.prototype.set = function(data) {
	this.localStorage.setItem(this.key, JSON.stringify(data));
	return new LocalStorageStore(this.key, this.localStorage);
};

LocalStorageStore.prototype.map = function(f) {
	return this.set(f(this.get()));
};
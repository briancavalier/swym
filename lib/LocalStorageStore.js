module.exports = LocalStorageStore;

function LocalStorageStore(data, key, localStorage) {
	this.data = data;
	this.key = key;
	this.localStorage = localStorage;
}

LocalStorageStore.at = function(key) {
	return new LocalStorageStore(void 0, key, localStorage);
};

LocalStorageStore.prototype.get = function() {
	if(this.data === void 0) {
		var data = this.localStorage.getItem(this.key);
		if(data == null) {
			return data;
		}

		return this.data = JSON.parse(data);
	}

	return this.data;
};

LocalStorageStore.prototype.set = function(data) {
	this.localStorage.setItem(this.key, JSON.stringify(data));
	this.data = data;
	return this;
};

LocalStorageStore.prototype.map = function(f) {
	return this.set(f(this.get()));
};
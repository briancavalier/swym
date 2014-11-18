var AsyncStore = require('./store/AsyncStore');

module.exports = SRef;

function SRef(uri, store) {
	this.uri = uri;
	this.state = AsyncStore.from(store);
}

SRef.prototype.get = function() {
	return this.state.get().then(getData);
};

SRef.prototype.set = function(data) {
	return this.map(function() {
		return data;
	});
};

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

function getData(state) {
	return state.data;
}

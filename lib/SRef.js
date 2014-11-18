var AsyncStore = require('../lib/AsyncStore');

module.exports = SRef;

function SRef(url, store) {
	this.url = url;
	this.state = AsyncStore.from(store);
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
	return this.state.get().then(function(state) {
		return state.data;
	});
};

SRef.prototype.set = function(data) {
	return this.map(function() {
		return data;
	});
};

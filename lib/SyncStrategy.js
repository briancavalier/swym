var SyncLoop = require('./SyncLoop');
var SimpleLoopStrategy = require('./SimpleLoopStrategy');

module.exports = SyncStrategy;

function SyncStrategy(init, send, patchStrategy, loopStrategy) {
	this.init = init;
	this.send = send;
	this.patchStrategy = patchStrategy;
	this.loopStrategy = loopStrategy || new SimpleLoopStrategy(1000, 8);
}

SyncStrategy.prototype.sync = function(sref) {
	var init = this.init;
	sref.state = sref.state.map(function(state) {
		return init(sref.url, state);
	});

	var loop = new SyncLoop(this.send, this.patchStrategy, this.loopStrategy, sref);
	return loop.run();
};

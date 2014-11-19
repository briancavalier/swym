var SyncLoop = require('./sync/SyncLoop');
var SimpleLoopStrategy = require('./sync/SimpleLoopStrategy');

module.exports = SyncStrategy;

function SyncStrategy(patchStrategy, loopStrategy) {
	this.patchStrategy = patchStrategy;
	this.loopStrategy = loopStrategy || new SimpleLoopStrategy(1000, 8);
}

SyncStrategy.prototype.sync = function(send, sref) {
	var loop = new SyncLoop(send, this.patchStrategy, this.loopStrategy, sref);
	return loop.run();
};

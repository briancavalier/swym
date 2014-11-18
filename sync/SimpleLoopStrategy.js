var when = require('when');

module.exports = SimpleLoopStrategy;

function SimpleLoopStrategy(period, max) {
	this.period = period;
	this.max = max;
}

SimpleLoopStrategy.prototype.onLoop = function() {
	return when().delay(this.period);
};

SimpleLoopStrategy.prototype.onError = function(n) {
	return when().delay(this.period * (1 << Math.min(n, this.max)));
};


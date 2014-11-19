exports.create = create;
exports.empty = empty;
exports.of = of;
exports.getData = getData;
exports.map = map;
exports.update = update;
exports.append = append;
exports.trim = trim;

function create(version, remoteVersion, data, patches) {
	return {
		version: version,
		remoteVersion: remoteVersion,
		patches: patches,
		data: data
	};
}

function empty() {
	return create(0, 0, null, []);
}

function of(data) {
	return create(0, 0, data, []);
}

function getData(state) {
	return state.data;
}

function map(f, state) {
	return {
		version: state.version,
		remoteVersion: state.remoteVersion,
		patches: state.patches,
		data: f(state.data)
	};
}

function update(remoteVersion, data, state) {
	return create(state.version, remoteVersion, data, state.patches);
}

function append(patch, state) {
	var version = state.version + 1;
	return create(version, state.remoteVersion, state.data,
		state.patches.concat({
			patch: patch,
			localVersion: version,
			remoteVersion: state.remoteVersion
		}));
}

function trim(remoteVersion, state) {
	return create(state.version, state.remoteVersion, state.data,
		state.patches.filter(function (patch) {
			return patch.remoteVersion > remoteVersion;
		}));
}
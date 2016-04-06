const fs = require('fs')
const path = require('path')

const stat = usePromises(fs.stat)
const readdir = usePromises(fs.readdir)
const mkdir = usePromises(fs.mkdir)
const readFile = usePromises(fs.readFile)
const writeFile = usePromises(fs.writeFile)

function usePromises(method) {
	return (...args) => {
		return new Promise((resolve, reject) => {
			const callback = (err, ...results) => {
				if (err != null) {
					reject(err)
				} else {
					resolve(...results)
				}
			}

			const argsWithCallback = args.concat([callback])

			method(...argsWithCallback)
		})
	}
}

function copyFiles(source, target) {
	return makeTarget(target)
		.then(() => {
			return readdir(source)
		})
		.then((items) => {
			const files = items.map((item) => {
				return {
					source: path.join(source, item),
					target: path.join(target, item),
				}
			})
			return filter(files, (file) => isFile(file.source))
		})
		.then((files) => {
			return Promise.all(
				files.map((file) => readFile(file.source))
			)
				.then((fileContents) => {
					return Promise.all(
						fileContents.map((contents, index) => writeFile(files[index].target, contents))
					)
				})
		}, (error) => {
			console.error('failed')
			console.log(error)
			return Promise.reject(error)
		})
}

function makeTarget(target) {
	return isDirectory(target)
		.then(exists => {
			if (!exists) {
				const targetParent = path.dirname(target)
				return makeTarget(targetParent)
					.then(() => mkdir(target))
			}
		})
}

// Like array.prototype.filter but supports async predicate
function filter(array, predicate) {
	return Promise.all(
		array.map((item, index) => Promise.resolve(predicate(item, index)))
	)
		.then((filterResults) => {
			return array.filter((item, index) => filterResults[index])
		})
}

function isFile(path) {
	return stat(path)
		.then((stats) => stats.isFile(), () => false) // return false if does not exist
}

function isDirectory(path) {
	return stat(path)
		.then((stats) => stats.isDirectory(), () => false) // return false if does not exist
}

const [/*node*/, /*index.js*/, source, target] = process.argv

copyFiles(source, target)
	.then(() => {
		console.log('Finished copying files')
		process.exit()
	})

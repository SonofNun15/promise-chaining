const fs = require('fs')
const path = require('path')

const stat = usePromises(fs.stat)
const readdir = usePromises(fs.readdir)
const mkdir = usePromises(fs.mkdir)
const readFile = usePromises(fs.readFile)
const writeFile = usePromises(fs.writeFile)

function usePromises(method) {
	// Return a function that returns a promise
	return (...args) => {
		return new Promise((resolve, reject) => {
			// When the callback is called, resolve or reject the promise
			const callback = (err, ...results) => {
				if (err != null) {
					reject(err)
				} else {
					resolve(...results)
				}
			}

			// Add the callback to the end of the arguments and call the underlying method
			const argsWithCallback = args.concat([callback])

			method(...argsWithCallback)
		})
	}
}

function copyFiles(source, target) {
	// Create the target directory
	return makeTarget(target)
		.then(() => {
			// Read the contest of the source directory
			return readdir(source)
		})
		.then((items) => {
			// Get list of transfer objects with source and target
			const files = items.map((item) => {
				return {
					source: path.join(source, item),
					target: path.join(target, item),
				}
			})

			// Eliminate items in directory that are not files
			return filter(files, (file) => isFile(file.source))
		})
		.then((files) => {
			return Promise.all(
				// Read the contents of each file
				files.map((file) => readFile(file.source))
			)
				.then((fileContents) => {
					return Promise.all(
						// Write the contents of each file into target
						fileContents.map((contents, index) => writeFile(files[index].target, contents))
					)
				})
		}, (error) => {
			console.error('failed')
			console.log(error)
			return Promise.reject(error)
		})
}

// Recursively build the target directory
function makeTarget(target) {
	return isDirectory(target)
		.then(exists => {
			if (!exists) {
				const targetParent = path.dirname(target)
				// Build the parent directory if it does not exist
				return makeTarget(targetParent)
					.then(() => mkdir(target)) // Make the target directory
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

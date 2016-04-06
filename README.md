# promise-chaining
Demonstrate how to use promise chaining

### Purpose

This repository is a sample showing how promises can be chained to perform long sequences of asynchronous tasks very simply.

`copyFiles()` is the main function. It takes a source folder and target folder. If the target folder does not exist it is created. All FILES in the source folder are then copied into the target folder.

`usePromises()` converts a node system function using callbacks into a promise. 

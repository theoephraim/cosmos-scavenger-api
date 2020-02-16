# Cosmos Scavenger Sidechain REST api

This is a rest api to expose the data of the [scavenger hunt sidechain](https://tutorials.cosmos.network/eth-denver/) from ETHDenver2020.

## Instructions

First you must set up the ebcli following the tutorial above and make sure its accessible on your machine's PATH.

The run the api:
- `npm install` to install dependencies
- `npm run dev` runs the api, watches files, lints and restarts on changes

It's exposed on http://localhost:4444
There are 4 endpoints
- `http://localhost:4444/scavenges` - lists all riddles
- `http://localhost:4444/scavenges/:id` - lists info about a specific riddle, with the id being the solution hash
- `http://localhost:4444/scavengers` - lists all scavengers, sorted by total rewards won
- `http://localhost:4444/scavengers/:id` - lists same info about a single scavenger

both list endpoints accept `limit` and `offset` params


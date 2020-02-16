/* eslint-disable no-console */
// run init - set up config files
require('./lib/run-init');

const { execSync } = require('child_process');
const _ = require('lodash');
const Koa = require('koa');
const bodyParser = require('koa-bodyparser');
const Router = require('koa-router');
// const cors = require('@koa/cors');

const errorMiddleware = require('./lib/better-ctx-throw').middleware;
const { validate } = require('./lib/validation-helpers');

const PORT = 4444;
const app = new Koa();
const router = new Router();


function ebcli(cmd) {
  const jsonAsString = execSync(`ebcli ${cmd} --output json`).toString();
  return JSON.parse(jsonAsString);
}
function getScavengeData() {
  const scavengeList = ebcli('query scavenge list');
  return _.map(scavengeList, (scavengeId) => ebcli(`query scavenge get ${scavengeId}`));
}


app.use((ctx, next) => { ctx.$ = ctx.state; return next(); });
app.use(errorMiddleware);
app.use(bodyParser());

router.get('/scavenges', (ctx, next) => {
  validate(ctx.request.query, {
    limit: { toInt: true, min: 1, max: 100 },
    offset: { toInt: true, min: 0 },
  });

  let scavenges = getScavengeData();
  scavenges = _.sortBy(scavenges, (s) => _.sumBy(_.flatten(s.reward), (r) => parseInt(r.amount)));

  if (ctx.request.query.offset) {
    scavenges = scavenges.slice(ctx.request.query.offset);
  }
  if (ctx.request.query.limit) {
    scavenges = scavenges.slice(0, ctx.request.query.limit);
  }

  ctx.body = scavenges;
});

router.get('/scavengers', (ctx, next) => {
  validate(ctx.request.query, {
    limit: { toInt: true, min: 1, max: 100 },
    offset: { toInt: true, min: 0 },
  });

  const scavenges = getScavengeData();

  const byScavengerId = _.groupBy(scavenges, 'scavenger');
  delete (byScavengerId['']); // remove unsolved

  let scavengers = [];
  _.each(byScavengerId, (solved, scavengerId) => {
    const allRewards = _.flatten(_.map(solved, 'reward'));
    scavengers.push({
      id: scavengerId,
      totalRewards: _.sumBy(allRewards, (r) => parseInt(r.amount)),
      solvedScavengeIds: _.map(solved, 'solutionHash'),
    });
  });
  // sort by total rewards earned
  scavengers = _.orderBy(scavengers, ['totalRewards'], ['desc']);


  if (ctx.request.query.offset) {
    scavengers = scavengers.slice(ctx.request.query.offset);
  }
  if (ctx.request.query.limit) {
    scavengers = scavengers.slice(0, ctx.request.query.limit);
  }

  ctx.body = scavengers;
});

router.get('/scavengers/:scavengerId', (ctx, next) => {
  const scavenges = getScavengeData();
  const solvedByScavenger = _.filter(scavenges, { scavenger: ctx.params.scavengerId });

  const allRewards = _.flatten(_.map(solvedByScavenger, 'reward'));
  ctx.body = {
    id: ctx.params.scavengerId,
    totalRewards: _.sumBy(allRewards, (r) => parseInt(r.amount)) || 0,
    solvedScavengeIds: _.map(solvedByScavenger, 'solutionHash'),
  };
});


router.get('/scavenges/:scavengeId', (ctx, next) => {
  const scavenge = ebcli(`query scavenge get ${ctx.params.scavengeId}`);
  ctx.body = scavenge;
});

app.use(router.routes());

(async function start() {
  await app.listen(PORT);
  console.log(`App starting API - listening on port ${PORT}`);
}());

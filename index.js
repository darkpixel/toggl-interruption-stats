#!/usr/bin/env node
var api = require('toggl-api');
var moment = require('moment');
var EventEmitter = require('events');
var ee = new EventEmitter();
var debug = require('debug')('toggl-interruption-stats');

var toggl = new api({apiToken: process.env.TOGGL_API_KEY});

var req = {
  method: 'GET',
  auth: {}
};

req.auth[process.env.TOGGL_API_KEY] = 'api_token';

toggl.apiRequest('/api/v8/me', req, function(err, authdata) {
  if (err) {
    debug(err);
  } else {
    var user_id = authdata.data.id;
    debug('User ID: ' + user_id);
    toggl.getWorkspaces(function (err, workspaces) {
      if (err) {
        debug(err);
      } else {
        var workspace_id = workspaces[0].id;
        debug('Workspace ID: ' + workspace_id);
        var params = {
          workspace_id: workspace_id,
          user_ids: user_id,
          since: moment().startOf('day').format('YYYY-MM-DD')
        };
        toggl.detailedReport(params, function (err, report) {
          if (err) {
            debug(err);
          } else {
            var longest_stretch = 0;
            var total_minutes = report.total_grand / 1000 / 60;
            var billable_minutes = report.total_billable / 1000 / 60;
            report.data.forEach(function (entry) {
//              debug(entry.id + ' (' + Math.round(entry.dur / 1000 / 60) + ') (' + entry.project + '): ' + entry.description);
              if (entry.dur > longest_stretch) {
                longest_stretch = entry.dur;
              }
            });
            debug('Found ' + report.data.length + ' time entries today');
            debug('You worked ' + Math.round(total_minutes / 60 * 100) / 100 + ' hours today (' + Math.round(total_minutes * 100) / 100 + ' minutes)');
            debug('You were billable ' + Math.round(billable_minutes / 60 * 100) / 100 + ' hours today (' + Math.round(billable_minutes * 100) / 100 + ' minutes)');
            debug('You were interrupted every ' + Math.round(total_minutes * 100 / report.data.length) / 100 + ' minutes');
            debug('Your longest stretch was ' + Math.round(longest_stretch / 1000 / 60 / 60 * 100) / 100 + ' hours (' + Math.round(longest_stretch / 1000 / 60 * 100) / 100 + ' minutes)');
          }
        });

      }
    });
  }
});


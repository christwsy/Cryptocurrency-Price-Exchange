"use strict";

var webSocketServer = require('websocket').server;
var http = require('http');
var prices = require('./prices').PRICES;
var webSocketsServerPort = 7310;

var cachedRates = {};

var server = http.createServer();
server.listen(webSocketsServerPort);

var wsServer = new webSocketServer({
  httpServer: server
});

wsServer.on('request', function (request) {
  var connection = request.accept(null, request.origin);

  connection.on('message', function (message) {
    if (message.type === 'utf8') {
      var json = JSON.parse(message.utf8Data);
      switch (json.type) {
        case 'rate':
          if (cachedRates[json.src + json.tgt] == null) {
            var srcPrice = prices[json.src];
            var tgtPrice = prices[json.tgt];
            var rate = srcPrice[1] / tgtPrice[1];
            var srctgtCache = {
              srcPrice, tgtPrice, rate
            }
            var tgtsrcCache = {
              'srcPrice': tgtPrice,
              'tgtPrice': srcPrice,
              'rate': 1 / rate
            }
            cachedRates[json.src + json.tgt] = srctgtCache;
            cachedRates[json.tgt + json.src] = tgtsrcCache;
          }
          connection.send(JSON.stringify({
            'type': 'rate',
            'data': cachedRates[json.src + json.tgt]
          }));
          break;
        case 'currencylist':
          connection.send(JSON.stringify({
            'type': 'currencylist', 
            'data': Object.keys(prices)
          }));
        default:
          break;
      }
      
    }
  });

  connection.on('close', function (connection) {
  });
});
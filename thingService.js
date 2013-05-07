"use strict";
var config = require('./config');
  var cosm = require('cosm'),
        client = new cosm.Cosm(config.cosm.apiKey),
        feed = new cosm.Feed(cosm, {id: config.cosm.feed}),
        streamCpm = new cosm.Datastream(client, feed, {id: 2, queue_size: 20}),
        streamSv = new cosm.Datastream(client, feed, {id: 3, queue_size: 20}),
        streamHumidity = new cosm.Datastream(client, feed, {id: 4, queue_size: 20}),
        streamTemperature = new cosm.Datastream(client, feed, {id: 5, queue_size: 20}),
	streamSound = new cosm.Datastream(client, feed, {id: 6, queue_size: 20});

var things = {};

var arduinoSerialPort = config.serial;

var serialport = require('serialport');
var serialPort = new serialport.SerialPort(arduinoSerialPort,
{//Listening on the serial port for data coming from Arduino over USB
	baudRate: 115200,
	parser: serialport.parsers.readline('\n')
});

var humidityHandler = function(data){
	streamHumidity.addPoint(data.value);
},
temperatureHandler = function(data){
	streamTemperature.addPoint(data.value);
},
soundHandler = function(data){
	streamSound.addPoint(data.value);
	if(thing.sound.socket){
		thing.sound.socket.emit('updateInfo', data.value);
	}
},
geigerHandler = function(data){
	streamCpm.addPoint(data.cpm);
	streamSv.addPoint(data.radiationValue);
	
	if(thing.geiger.socket){
		thing.geiger.socket.emit('updateInfo', "CPM: " + data.cpm + " - " + data.radiationValue + " uSv/h");
	}
};

var dataHandlers = { 
		humidity:humidityHandler,
		temperature:temperatureHandler,
		sound:soundHandler
};

var handleData = function(data){
	if(dataHandlers[data.type]){
		dataHandlers[data.type](data);
	}else{
		console.warn("No handler for " + data.type);
	}
};

var lisener = function(thing){
	serialPort.on('data', function (jsonData)
	{
		try
		{
			var data = JSON.parse(jsonData);

			console.log(data);
			handleData(data);
			/*
			if(thing.socket){
				thing.socket.emit('updateInfo', "CPM: " + data.cpm + " - " + data.radiationValue + " uSv/h");
			}
			streamCpm.addPoint(data.cpm);
			streamSv.addPoint(data.radiationValue);
			*/
		}
		catch (ex)
		{
			console.warn(ex);
		}
	});
};


var createThing = function(){
    
   var thing = {};
    thing.settings = { 
		"name": 'Sound',
		"id": 23435672,
		"iconType": "Information",
		//"position": config.getPosition(),
		"actionControles": []
	};	
   things.sound = thing;
   return thing;
};

module.exports.thing = createThing();

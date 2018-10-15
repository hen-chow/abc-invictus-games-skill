'use strict';

var Alexa = require('alexa-sdk');
var Parser = require('rss-parser');
var parser = new Parser();

var dailyUpdate = {};

// fetch invictus games rss feed
(async () => {
  try {
    var feed = await parser.parseURL('https://rss.whooshkaa.com/rss/podcast/id/4665?format=flashbriefing');

    var updateInfo = feed.items[0];
  
    dailyUpdate.url = updateInfo.enclosure.url.split("?")[0];
    dailyUpdate.date = updateInfo.pubDate.split("T")[0];
    dailyUpdate.title = updateInfo.title;
  } catch (err) {
    var error = new Error(`Failed to fetch abc invictus games rss feed. Error: ${err.message}.`)

    throw error;
  }

  return dailyUpdate;
})();

var streamInfo = {
  title: 'ABC Invictus Games',
  subtitle: `${dailUpdate.date} - ${dailyUpdate.title}`,
  cardContent: "For more info: http://www.abc.net.au/news/invictus-games/",
  url: dailyUpdate.url,
  image: {
    // TODO: update image to suitable png
    largeImageUrl: 'https://s3.amazonaws.com/cdn.dabblelab.com/img/alexa-card-lg.png',
    smallImageUrl: 'https://s3.amazonaws.com/cdn.dabblelab.com/img/alexa-card-sm.png'
  }
};

exports.handler = (event, context, callback) => {
  var alexa = Alexa.handler(event, context, callback);

  alexa.registerHandlers(
    handlers,
    audioEventHandlers
  );

  alexa.execute();
};

var handlers = {
  'LaunchRequest': function() {
    this.emit('PlayStream');
  },
  'PlayStream': function() {
    this.response.speak('Here is your ABC Invictus Games update.').audioPlayerPlay('REPLACE_ALL', streamInfo.url, streamInfo.url, null, 0);
    this.emit(':responseReady');
  },
  'AMAZON.HelpIntent': function() {
    // skill help logic goes here
    this.emit(':responseReady');
  },
  'SessionEndedRequest': function() {
    // no session ended logic needed
  },
  'ExceptionEncountered': function() {
    console.log("\n---------- ERROR ----------");
    console.log("\n" + JSON.stringify(this.event.request, null, 2));
    this.callback(null, null)
  },
  'Unhandled': function() {
    this.response.speak('Sorry. Something went wrong.');
    this.emit(':responseReady');
  },
  'AMAZON.NextIntent': function() {
    this.response.speak('This skill does not support skipping.');
    this.emit(':responseReady');
  },
  'AMAZON.PreviousIntent': function() {
    this.response.speak('This skill does not support skipping.');
    this.emit(':responseReady');
  },
  'AMAZON.PauseIntent': function() {
    this.emit('AMAZON.StopIntent');
  },
  'AMAZON.CancelIntent': function() {
    this.emit('AMAZON.StopIntent');
  },
  'AMAZON.StopIntent': function() {
    this.response.speak('Okay. I\'ve stopped the stream.').audioPlayerStop();
    this.emit(':responseReady');
  },
  'AMAZON.ResumeIntent': function() {
    this.emit('PlayStream');
  },
  'AMAZON.LoopOnIntent': function() {
    this.emit('AMAZON.StartOverIntent');
  },
  'AMAZON.LoopOffIntent': function() {
    this.emit('AMAZON.StartOverIntent');
  },
  'AMAZON.ShuffleOnIntent': function() {
    this.emit('AMAZON.StartOverIntent');
  },
  'AMAZON.ShuffleOffIntent': function() {
    this.emit('AMAZON.StartOverIntent');
  },
  'AMAZON.StartOverIntent': function() {
    this.response.speak('Sorry. I can\'t do that yet.');
    this.emit(':responseReady');
  },
  'PlayCommandIssued': function() {

    if (this.event.request.type === 'IntentRequest' || this.event.request.type === 'LaunchRequest') {
      var cardTitle = streamInfo.subtitle;
      var cardContent = streamInfo.cardContent;
      var cardImage = streamInfo.image;
      this.response.cardRenderer(cardTitle, cardContent, cardImage);
    }

    this.response.speak('Here is your ABC Invictus Game update.').audioPlayerPlay('REPLACE_ALL', streamInfo.url, streamInfo.url, null, 0);
    this.emit(':responseReady');
  },
  'PauseCommandIssued': function() {
    this.emit('AMAZON.StopIntent');
  }
}

var audioEventHandlers = {
  'PlaybackStarted': function() {
    this.emit(':responseReady');
  },
  'PlaybackFinished': function() {
    this.emit(':responseReady');
  },
  'PlaybackStopped': function() {
    this.emit(':responseReady');
  },
  'PlaybackNearlyFinished': async function() {
    try {
      await fetchRssFeed();

      this.response.audioPlayerPlay('REPLACE_ALL', streamInfo.url, streamInfo.url, null, 0);
      this.emit(':responseReady');
    } catch (error) {
      this.response.speak('Sorry. Something went wrong.');
    }
  },
  'PlaybackFailed': function() {
    this.response.audioPlayerClearQueue('CLEAR_ENQUEUED');
    this.emit(':responseReady');
  }
}

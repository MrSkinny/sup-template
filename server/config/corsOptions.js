const hosts = require('./hosts');
const whitelist = [hosts.devHost, hosts.prodHost];

module.exports =  {
  origin: function(origin, callback){
    var originIsWhitelisted = whitelist.indexOf(origin) !== -1;
    callback(originIsWhitelisted ? null : 'Bad Request', originIsWhitelisted);
  }
};

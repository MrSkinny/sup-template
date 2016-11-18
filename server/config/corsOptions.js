const hosts = require('./hosts');
const whitelist = [hosts.prodHost];

module.exports =  {
  origin: function(origin, callback){
    if (process.env.NODE_ENV !== 'production') return callback(null);
    
    var originIsWhitelisted = whitelist.indexOf(origin) !== -1;
    callback(originIsWhitelisted ? null : 'Bad Request', originIsWhitelisted);
  }
};

const settings = require('./settings');

const allowCrossDomain = function(req, res, next) {
    let allowOrigin;
    if (process.env.NODE_ENV !== 'production') {
        allowOrigin = req.headers.origin;
    } else {
        allowOrigin = settings.allowOrigin;
    }
    
    console.log(allowOrigin);

    res.header('Access-Control-Allow-Origin', allowOrigin);
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type,Authorization');

    next();
};

module.exports = allowCrossDomain;

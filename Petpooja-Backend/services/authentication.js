require('dotenv').config();

const jwt = require('jsonwebtoken');
const { response } = require('..');

function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1]

    if (token == null)
        return res.sendStatus(401);

    jwt.verify(token, process.env.ACCESS_TOKEN, (err, response) => {
        if (err)
            return res.sendStatus(403);
        res.locals = response;
        //we can move to next method directly using the next() function
        next()
    })
}

module.exports = {
    authenticateToken: authenticateToken
}
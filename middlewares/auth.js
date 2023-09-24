const jwt = require('jsonwebtoken')
const config = require('../config');
const User = require('../models/user')

exports.isAuth = async (req, res, next) => {
    if(req.headers && req.headers.authorization){

        try {
            const token = req.headers.authorization.split(" ")[1];
            const decode = jwt.verify(token, config.jwtSecret)
    
            const user = await User.findById(decode.userId)
            if(!user){
                return res.json({ message: 'Dont have access' })
            }
    
            req.user = user
            next()
        } catch (error) {
            if(error.name === 'JsonWebTokenError'){
                return res.json({ message: 'Dont have access' })
            }
            if(error.name === 'TokenExpiredError'){
                return res.json({ message: 'Token expired ' })
            }

            res.json({ message: 'Server Error' })
        }
       
    }else {
        res.json({ message: 'Dont have access' })
    }
}
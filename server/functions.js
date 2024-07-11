const axios = require('axios')
const bcrypt = require('bcryptjs')

/**
 * description: update user data
 * @param {Object} req - express request object
 * @param {Number} isRetry - retry count
 */
async function updateDataUser(req, isRetry = 0, forceUpdate = false) {
    if((!req?.session?.iId || (req?.session?.updateIn > Date.now())) && !forceUpdate) return
    const user = req.session.iId

    try {
        const requestBotServer = await axios.post(process.env.BOT_API + '/api/v3/getUser', { user, apiKey: process.env.BOT_API_KEY, request: ['name', 'profilePic', 'money', 'isAdmin'] })
        const userData = requestBotServer.data
        req.session.username = userData.name
        req.session.profilePic = userData.profilePic || '/assets/img/avatars/images_pp_blank.png'
        req.session.moneyUser = userData.money
        req.session.isAdmin = userData.isAdmin
        req.session.updateIn = Date.now() + 5000
    } catch (error) {
        if (isRetry < 3) {
            setTimeout(() => {
                updateUserData(req, isRetry + 1)
            }, 1000)
        } else {
            console.error('updateDataUser Error:', error)
        }
    }
}

/**
 * description: send otp to user
 * @param {Object} req - express request object
 * @param {Object} user - user id
 */
async function sendOtpLoginUser(req, res) {
    if(!req?.body?.numberVerif) return res.status(400).json({ status: false, message: 'Bad Request!' })
    if(req.session.loginIn > Date.now()) return res.status(200).json({ status: false, message: 'cooldown!', countdown: Math.ceil((req.session.loginIn - Date.now()) / 1000) })

    try {
        const requestBotServer = await axios.post(process.env.BOT_API + '/api/v3/sendOtp', { user: req.body.numberVerif, apiKey: process.env.BOT_API_KEY })
        const data = requestBotServer.data
        if(data.status) {
            req.session.otpSendIn = data.countdown
        }
        return res.status(200).json({ status: data.status, message: data.message, countdown: data.countdown })
    } catch (error) {
        console.error('sendOtpLoginUser Error:', error)
        return res.status(500).json({ status: false, message: 'Internal server error!' })
    }
}

/**
 * description: login user
 * @param {Object} req - express request object
 * @param {Object} user - user id
 * @param {String} type - login type (email/number)
 */
async function loginUser(req, res) { 
    if(!req?.body?.numberVerif) return res.status(400).json({ status: false, message: 'Bad Request!' })
    if(!['email', 'number'].includes(req.body.type)) return res.status(400).json({ status: false, message: 'Bad Request!' })

    try {
        const requestBotServer = await axios.post(process.env.BOT_API + '/api/v3/getUser', { type: req.body.type, user: req.body.email, otp: req.body.otp, apiKey: process.env.BOT_API_KEY, request: ['iId', 'otp', 'email', 'password', 'isAdmin', 'name', 'profilePic', 'money'] })
        if(!requestBotServer.data.data) return res.status(200).json({ status: false, err: 'user_404', message: 'User not found!' })
        if(req.body.type === 'email') {
            if(!requestBotServer.data.status) return res.status(500).json({ status: false, message: 'Failed connect main server!' })
            if(!bcrypt.compareSync(req.body.password, requestBotServer.data.data.password)) return res.status(200).json({ status: false, err: 'invalid_creds', message: 'Invalid user!' })
        } else if(req.body.type === 'number') {
            if(!requestBotServer.data.status) return res.status(500).json({ status: false, message: 'Failed connect main server!' })
            if(req.body.otp !== requestBotServer.data.data.otp) return res.status(200).json({ status: false, err: 'invalid_creds', message: 'Invalid otp!' })
        }


        const data = requestBotServer.data.data
        if(data.status) {
            req.session.isLogin = true
            req.session.isAdmin = data.isAdmin
            req.session.username = data.name
            req.session.profilePic = data.profilePic || '/assets/img/avatars/images_pp_blank.png'
            req.session.moneyUser = data.money
            req.session.timeLogin = Date.now()
            req.session.updateIn = Date.now() + 5000
        }
        return res.redirect('/')
    } catch (error) {
        console.error('loginUser Error:', error)
        return res.status(500).json({ status: false, message: 'Internal server error!' })
    }
}

module.exports = {
    updateDataUser,
    sendOtpLoginUser,
    loginUser
}
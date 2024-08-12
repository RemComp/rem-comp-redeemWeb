const axios = require('axios')
const bcrypt = require('bcryptjs')
const { _mongo_UserSchema, _mongo_OtpRequestSchema } = require('./dbtype')

/**
 * description: update user data
 * @param {Object} req - express request object
 * @param {Object} res - express response object
 * @param {Function} next - express next function
 * @param {Boolean} forceUpdate - force update user data
 * @returns {Function} next - express next function
 */
async function updateDataUser(req, res, next, forceUpdate = false) {
    if((!req?.session?.iId || (req?.session?.updateIn > Date.now())) && !forceUpdate) return next()
    const user = req.session.iId

    try {
        const requestBotServer = await axios.post(process.env.BOT_API + '/api/v3/getUser', { type: 'number', user, apiKey: process.env.BOT_APIKEY, request: ['iId', 'email', 'name', 'isAdmin', 'isPremium', 'profilePic', 'money'] })
        const userData = requestBotServer.data?.data
        if(!requestBotServer.data.status) return next()
        req.session.iId = userData.iId
        req.session.username = userData.name
        req.session.profilePic = userData.profilePic || '/assets/img/avatars/images_pp_blank.png'
        req.session.moneyUser = userData.money
        req.session.isAdmin = userData.isAdmin
        req.session.isPremium = userData.isPremium
        req.session.updateIn = Date.now() + 10000
    } catch (error) {
        console.error('updateDataUser Error:', error)
    }
    return next()
}

/**
 * description: send otp to user
 * @param {Object} req - express request object
 * @param {Object} res - express response object
 */
async function sendOtpLoginUser(req, res) {
    if(!req?.body?.numberVerif || isNaN(req?.body?.numberVerif)) return res.status(400).json({ status: false, message: 'Bad Request!' })
    if(req.session?.otpSendIn > Date.now()) return res.status(200).json({ status: false, message: 'cooldown!', countdown: req.session.otpSendIn - Date.now() })

    if(req.body.numberVerif.startsWith('08')) req.body.numberVerif = req.body.numberVerif.replace('08', '628')
    if(!req.body.numberVerif.endsWith('@s.whatsapp.net')) req.body.numberVerif += '@s.whatsapp.net'
    try {
        await _mongo_OtpRequestSchema.deleteOne({ iId: req.body.numberVerif, type: 'number' })

        const randomOtp = Math.random().toString(36).substring(2, 8).toUpperCase()
        const requestBotServer = await axios.post(process.env.BOT_API + '/access/sendRequestRandomJadibot', { apiKey: process.env.BOT_APIKEY, method: 'sendText', content: [req?.body?.numberVerif, `*Kode Verifikasi*\nKode verifikasi web redeem kamu adalah\n\n> ${randomOtp}\n\n*Jangan bagikan kode ini ke siapapun!*\nBahkan ke Admin/SO Bot sekalipun`] })
        await _mongo_OtpRequestSchema.create({ iId: req.body.numberVerif, type: 'number', number: req.body.numberVerif, otp: randomOtp, otpSendIn: Date.now() + 30000 })

        const data = requestBotServer.data
        const countdown = Date.now() + 30000

        if(data.status) req.session.otpSendIn = countdown
        return res.status(200).json({ status: data.status, message: 'Success send otp', countdown })
    } catch (error) {
        console.error('sendOtpLoginUser Error:', error)
        return res.status(500).json({ status: false, message: 'Internal server error!' })
    }
}

/**
 * description: login user
 * @param {Object} req - express request object
 * @param {Object} res - express response object
 */
async function loginUser(req, res) { 
    if(!req?.body?.numberVerif || isNaN(req?.body?.numberVerif)) return res.status(400).json({ status: false, message: 'Bad Request!' })
    if(!['email', 'number'].includes(req.body.type)) return res.status(400).json({ status: false, message: 'Bad Request!' })

    if(req.body.numberVerif.startsWith('08')) req.body.numberVerif = req.body.numberVerif.replace('08', '628')
    if(!req.body.numberVerif.endsWith('@s.whatsapp.net')) req.body.numberVerif += '@s.whatsapp.net'
    try {
        if(req.body.type === 'email') {
            const getDataUser = await _mongo_UserSchema.findOne({ email: req.body.email })

            if(!getDataUser) return res.status(200).json({ status: false, err: 'user_404', message: 'User not found!' })
            if(!bcrypt.compareSync(req.body.password, getDataUser.password)) return res.status(200).json({ status: false, err: 'invalid_creds', message: 'Invalid user!' })
        } else if(req.body.type === 'number') {
            const getDataOtp = await _mongo_OtpRequestSchema.findOne({ iId: req.body.numberVerif, type: 'number' }).sort({ createdAt: -1 })

            if(!getDataOtp) return res.status(200).json({ status: false, err: 'otp_404', message: 'Otp not found!' })
            if(getDataOtp.otp !== req.body.codeVerif) return res.status(200).json({ status: false, err: 'invalid_creds', message: 'Invalid otp!' })
            await _mongo_OtpRequestSchema.deleteOne({ iId: req.body.numberVerif, type: 'number' })
        }

        const requestBotServer = await axios.post(process.env.BOT_API + '/api/v3/getUser', { type: req.body.type, user: req.body.email || req.body.numberVerif, apiKey: process.env.BOT_APIKEY, request: ['iId', 'email', 'name', 'isAdmin', 'isPremium', 'profilePic', 'money'] })
        const data = requestBotServer.data?.data
        if(requestBotServer.data.status) {
            req.session.isLogin = true
            req.session.iId = data.iId
            req.session.isAdmin = data.isAdmin
            req.session.isPremium = data.isPremium
            req.session.username = data.name
            req.session.profilePic = data.profilePic || '/assets/img/avatars/images_pp_blank.png'
            req.session.moneyUser = data.money
            req.session.timeLogin = Date.now()
            req.session.updateIn = Date.now() + 5000
        } else {
            return res.status(200).json({ status: false, message: 'User not found!' })
        }
        return res.status(200).json({ status: true, message: 'Success login!' })
    } catch (error) {
        console.error('loginUser Error:', error)
        return res.status(500).json({ status: false, message: 'Internal server error!' })
    }
}


/**
 * description: redeem item
 * @param {Object} req - express request object
 * @param {Object} res - express response object
 */
async function redeemItem(req, res) {
    if(!req?.body?.code) return res.status(400).json({ status: false, message: 'Bad Request!' })

    try {
        const requestBotServer = await axios.post(process.env.BOT_API + '/api/v3/redeemCode', { apiKey: process.env.BOT_APIKEY, user: req.session.iId, code: req.body.code })
        const data = requestBotServer.data
        return res.status(200).json(data)
    } catch (error) {
        console.error('redeemItem Error:', error)
        return res.status(500).json({ status: false, message: 'Internal server error!' })
    }
}

/**
 * description: create redeem
 * @param {Object} req - express request object
 * @param {Object} res - express response object
 */
async function createRedeem(req, res) {
    if(!req?.body?.redeemCount || isNaN(req?.body?.redeemCount)) return res.status(400).json({ status: false, message: 'Bad Request!' })
    if(!req?.body?.timeRedeem || !['Hari', 'Jam'].includes(req?.body?.timeRedeem)) return res.status(400).json({ status: false, message: 'Bad Request!' })
    if(!req?.body?.timeValueRedeem || isNaN(req?.body?.timeValueRedeem)) return res.status(400).json({ status: false, message: 'Bad Request!' })
    if(!req?.body?.redeemItems) return res.status(400).json({ status: false, message: 'Bad Request!' })
    if(!req?.body?.priceRedeem || isNaN(req?.body?.priceRedeem)) return res.json({ status: false, message: 'Bad Request!' })

    let parsedItems = []
    try {
        parsedItems = JSON.parse(req.body.redeemItems)
        if(!Array.isArray(parsedItems)) throw new Error('Bad Request!')
    } catch (error) {
        console.error('createRedeem Error:', error)
        return res.status(400).json({ status: false, message: 'Bad Request!' })
    }

    try {
        const requestBotServer = await axios.post(process.env.BOT_API + '/api/v3/createRedeemCode', { apiKey: process.env.BOT_APIKEY, user: req.session.iId, redeemCount: req.body.redeemCount, timeRedeem: req.body.timeRedeem, timeValueRedeem: req.body.timeValueRedeem, redeemItems: req.body.redeemItems, priceRedeem: req.body.priceRedeem })
        const data = requestBotServer.data
        return res.status(200).json(data)
    } catch (error) {
        console.error('createRedeem Error:', error)
        return res.status(500).json({ status: false, message: 'Internal server error!' })
    }
}

/**
 * description: inspect redeem code
 * @param {Object} req - express request object
 * @param {Object} res - express response object
 */
async function inspectRedeem(req, res) {
    if(!req?.body?.code) return res.status(400).json({ status: false, message: 'Bad Request!' })

    try {
        const requestBotServer = await axios.post(process.env.BOT_API + '/api/v3/getRedeemCode', { apiKey: process.env.BOT_APIKEY, code: req.body.code })
        const data = requestBotServer.data
        return res.status(200).json(data)
    } catch (error) {
        console.error('inspectRedeem Error:', error)
        return res.status(500).json({ status: false, message: 'Internal server error!' })
    }
}

/**
 * description: redirect to login with the params redeem if exist
 * @param {Object} req - express request object
 * @param {Object} res - express response object
 */
function redirectToLogin(req, res) {
    const checkCodeParams = req.query.code ? `?code=${req.query.code}` : ''
    return res.redirect(`/login${checkCodeParams}`)
}

module.exports = {
    updateDataUser,
    sendOtpLoginUser,
    loginUser,
    redeemItem,
    createRedeem,
    inspectRedeem,
    redirectToLogin
}
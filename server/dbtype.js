const mongoose = require('mongoose');
async function connectDatabaseMongo() {
    try {
        mongoose.pluralize(null);
        await mongoose.connect(process.env.MONGO_URI)
        mongoose.pluralize(null);
        console.log('MongoDB connected!')
    } catch (error) {
        console.error('MongoDB connection error:', error)
    }
}

// schema
const _mongo_OtpRequestSchema = mongoose.Schema({
    iId: { type: String, required: true, unique: true },
    type: { type: String, required: true, enum: ['email', 'number'] },
    email: String,
    number: String,
    otp: { type: String, required: true },
    otpSendIn: { type: Date, required: true },
    createdAt: { type: Date, default: Date.now }
}, { collection: 'otp_request' })

const _mongo_UserSchema = mongoose.Schema({
    iId: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true, unique: true } // bcrypt
}, { collection: 'user' })

module.exports = {
    connectDatabaseMongo,
    _mongo_OtpRequestSchema: mongoose.model('otp_request', _mongo_OtpRequestSchema, 'otp_request'),
    _mongo_UserSchema: mongoose.model('user', _mongo_UserSchema, 'user'),
}
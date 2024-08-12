'no strict';
require('dotenv').config();

const express = require('express');
const session = require('express-session');
const MongoStore = require('connect-mongo');

const multer = require('multer')();
const path = require('path');
const fs = require('fs');

const mongoose = require('mongoose');
const { sendOtpLoginUser, loginUser, updateDataUser, redeemItem, createRedeem, inspectRedeem, redirectToLogin } = require(path.resolve(process.cwd(), 'server', 'functions'));

const app = express();

app.set('views', path.resolve(process.cwd(), 'html'));
app.set('view engine', 'ejs');
app.use(multer.array());
app.set('trust proxy', 1) // trust first proxy
app.use(session({
    store: MongoStore.create({ client: mongoose.connection.getClient(), dbName: 'db-redeemweb-rem-comp' }),
    secret: process.env.SESS_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 7 * 24 * 60 * 60 * 1000 } // 7 days
}))
app.use('/assets', express.static(path.resolve(process.cwd(), 'assets')));
app.use(updateDataUser)

app.get('/', (req, res) => {
    if(!req.session.isLogin) return redirectToLogin(req, res);

    res.render('index', { isLogin: req.session.isLogin, isAdmin: req.session.isAdmin, isPremium: req.session.isPremium,
        numberUser: req.session.iId, userName: req.session.username, roleUser: req.session.isAdmin ? 'Admin' : 'User', profilePic: req.session.profilePic, moneyUser: req.session.moneyUser,
        pageActive: 'redeem'
    });
});

app.get('/cr', (req, res) => {
    if(!req.session.isLogin) return res.redirect('/login');
    if(!req.session.isPremium) return res.redirect('/');

    res.render('cr', { isLogin: req.session.isLogin, isAdmin: req.session.isAdmin, isPremium: req.session.isPremium,
        userName: req.session.username, roleUser: req.session.isAdmin ? 'Admin' : 'User', profilePic: req.session.profilePic, moneyUser: req.session.moneyUser,
        pageActive: 'cr'
    });
});

app.get('/inspect', (req, res) => {
    if(!req.session.isLogin) return res.redirect('/login');
    if(!req.session.isAdmin) return res.redirect('/');

    res.render('inspect-redeem', { isLogin: req.session.isLogin, isAdmin: req.session.isAdmin, isPremium: req.session.isPremium,
        userName: req.session.username, roleUser: req.session.isAdmin ? 'Admin' : 'User', profilePic: req.session.profilePic, moneyUser: req.session.moneyUser,
        pageActive: 'inspect'
    });
})

app.get('/login', (req, res) => {
    if(req.session.isLogin) return res.redirect('/');
    res.sendFile(path.resolve(process.cwd(), 'html', 'login.html'));
});

app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/login');
});

app.post('/api/login', (req, res) => {
    if(req.session.isLogin) return res.status(400).json({ status: false, message: 'Already login, refresh the page!' });
    if(req.body.action === 'verify') {
        return sendOtpLoginUser(req, res);
    } else if(req.body.action === 'login') {
        // to do: login user
        
        if(process.env.DEBUG === 'true') {
            req.session.isLogin = true;
            req.session.isAdmin = true;
            req.session.username = 'Admin';
            req.session.profilePic = '/assets/img/avatars/images_pp_blank.png';
            req.session.moneyUser = 999999999999;
            res.json({ status: true });
        } else {
            return loginUser(req, res);
        }
    }
});


// redeem
app.post('/api/redeem', (req, res) => {
    if(!req.session.isLogin) return res.status(401).json({ status: false, message: 'Unauthorized!' });

    if(req.body.action === 'redeem') {
        return redeemItem(req, res);
    } else {
        return res.status(400).json({ status: false, message: 'Bad Request!' });
    }
})

app.post('/api/createRedeem', (req, res) => {
    if(!req.session.isLogin) return res.status(401).json({ status: false, message: 'Unauthorized!' });
    if(!req.session.isPremium) return res.status(403).json({ status: false, message: 'Forbidden!' });

    if(req.body.action === 'create') {
        return createRedeem(req, res);
    } else {
        return res.status(400).json({ status: false, message: 'Bad Request!' });
    }
})

app.post('/api/inspectRedeem', (req, res) => {
    if(!req.session.isLogin) return res.status(401).json({ status: false, message: 'Unauthorized!' });
    if(!req.session.isAdmin) return res.status(403).json({ status: false, message: 'Forbidden!' });

    if(req.body.action === 'inspect') {
        return inspectRedeem(req, res);
    } else {
        return res.status(400).json({ status: false, message: 'Bad Request!' });
    }
})

app.use((req, res) => {
    res.status(404).sendFile(path.resolve(process.cwd(), 'html', '404.html'));
});

app.listen(process.env.PORT, () => {
    console.log('Server is running on http://localhost:' + process.env.PORT);
});

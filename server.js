'no strict';
require('dotenv').config({ path: './example.env' });

const express = require('express');
const session = require('express-session');
const SQLiteStore = require('connect-sqlite3')(session);
const multer = require('multer')();
const path = require('path');
const fs = require('fs');

const app = express();

app.set('views', path.resolve(process.cwd(), 'html'));
app.set('view engine', 'ejs');
app.use(multer.array());
app.set('trust proxy', 1) // trust first proxy
app.use(session({
    store: new SQLiteStore({ dir: path.resolve(process.cwd(), 'sessions'), createDirIfNotExists: true, db: 'sessions.db'}),
    secret: process.env.SESS_SECRET,
    resave: true,
    saveUninitialized: true,
    cookie: { maxAge: 7 * 24 * 60 * 60 * 1000 }
}))
app.use('/assets', express.static(path.resolve(process.cwd(), 'assets')));

app.get('/', (req, res) => {
    if(!req.session.isLogin) return res.redirect('/login');

    res.render('index', { isLogin: req.session.isLogin, isAdmin: true, 
        numberUser: req.session.iId, userName: req.session.username, roleUser: true ? 'Admin' : 'User', profilePic: req.session.profilePic, moneyUser: req.session.moneyUser,
        pageActive: 'redeem'
    });
});

app.get('/cr', (req, res) => {
    if(!req.session.isLogin) return res.redirect('/login');

    res.render('cr', { isLogin: req.session.isLogin, isAdmin: true, 
        userName: req.session.username, roleUser: true ? 'Admin' : 'User', profilePic: req.session.profilePic, moneyUser: req.session.moneyUser,
        pageActive: 'cr'
    });
});

app.get('/inspect', (req, res) => {
    if(!req.session.isLogin) return res.redirect('/login');
    if(!req.session.isAdmin) return res.redirect('/');

    res.render('inspect-redeem', { isLogin: req.session.isLogin, isAdmin: true, 
        userName: req.session.username, roleUser: true ? 'Admin' : 'User', profilePic: req.session.profilePic, moneyUser: req.session.moneyUser,
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
    if(req.body.action === 'verify') {
        // to do: send otp to user
        res.json({ status: true });
    } else if(req.body.action === 'login') {
        // to do: login user
        
        if(process.env.DEBUG === 'true') {
            req.session.isLogin = true;
            req.session.isAdmin = true;
            req.session.username = 'Admin';
            req.session.profilePic = '/assets/img/avatars/images_pp_blank.png';
            req.session.moneyUser = 999999999999;
            res.json({ status: true });
        }
    }
});

app.use((req, res) => {
    res.status(404).sendFile(path.resolve(process.cwd(), 'html', '404.html'));
});

app.listen(process.env.PORT, () => {
    console.log('Server is running on http://localhost:' + process.env.PORT);
});

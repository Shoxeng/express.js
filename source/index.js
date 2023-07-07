const express = require('express');
const app = express();
const Joi = require('joi');
const ejs = require('ejs');
const path = require("path");
const cookieParser = require('cookie-parser');
const bodyParser = require("express");
const session = require('express-session');
app.use(session({resave:true, saveUninitialized: true, secret: 'tajnykluczsesjiti'}));
app.use(express.static(path.join(__dirname, '../statyczne')));
app.use(cookieParser('tajnyklucz1'));
app.use(bodyParser.urlencoded({extended: true}));

app.set('view engine','ejs');

app.set('views','./widoki');

let lista = [
    { id: 1, nazwa: 'ALFA ROMEO'} ,
    { id: 2, nazwa: 'AUDI'} ,
    { id: 3, nazwa: 'BMW' } ,
    { id: 4, nazwa: 'CHRYSLER' },
    { id: 5, nazwa: 'CITROEN' },
    { id: 6, nazwa: 'DAIHATSU' },
    { id: 7, nazwa: 'FIAT' },
    { id: 8, nazwa: 'FORD' },
    { id: 9, nazwa: 'HONDA' },
    { id: 10, nazwa: 'ISUZU' },
    { id: 11, nazwa: 'JAGUAR' },
    { id: 12, nazwa: 'LADA' },
    { id: 13, nazwa: 'LANCIA' },
    { id: 14, nazwa: 'MAZDA' },
    { id: 15, nazwa: 'MERCEDES' },
    { id: 16, nazwa: 'MITSUBISHI' },
    { id: 17, nazwa: 'NISSAN' },
    { id: 18, nazwa: 'OPEL' },
    { id: 19, nazwa: 'PEUGEOT' },
    { id: 20, nazwa: 'PORSCHE' },
    { id: 21, nazwa: 'RENAULT' },
    { id: 22, nazwa: 'ROVER' },
    { id: 23, nazwa: 'SAAB' },
    { id: 24, nazwa: 'SEAT' },
    { id: 25, nazwa: 'SKODA' },
    { id: 26, nazwa: 'SUBARU' },
    { id: 27, nazwa: 'SUZUKI' },
    { id: 28, nazwa: 'TOYOTA' },
    { id: 29, nazwa: 'VOLVO' },
    { id: 30, nazwa: 'VW' }
];

let users = [
    { id: 1, login: 'user1',pass: 'u1',role: 1} ,
    { id: 2, login: 'user2',pass: 'u2',role: 1} ,
    { id: 3, login: 'user3',pass: 'u3', role: 1} ,
    { id: 4, login: 'admin',pass: 'a', role: 2}
];

app.use("/sesja", (req, res) => {
    let sessionValue;
    if(!req.session.sessionValue) {
        sessionValue = `Data w sesji: ${new Date()}`;
        req.session.sessionValue = sessionValue;
    } else {
        sessionValue = req.session.sessionValue;
    }
    res.render("sesja", {sessionValue: sessionValue});
});

app.use('/ciastko',(req,res)=>{
    let cookieValue;
    if(!req.cookies.ciasteczko){
        cookieValue = new Date().toString();
    }
    else{
        cookieValue = req.cookies.ciasteczko;
    }
    res.render("ciastko", {cookieValue: cookieValue});
});

app.use('/tajneciastko',(req,res)=>{
    let cookieValue;
    if(!req.signedCookies.tajneciasteczko){
        cookieValue = "TAJNA INFORMACJA " + new Date().toString();
        res.cookie('tajneciasteczko', cookieValue,{signed: true});
    }
    else{
        cookieValue = req.signedCookies.tajneciasteczko;
    }
    res.render("ciastko", {cookieValue: cookieValue});
});

app.get('/zaloguj',(req,res)=>{
    res.render('zaloguj');
})

app.post('/zaloguj',(req,res)=>{
    let username = req.body.txtUser;
    let password = req.body.txtPass;

    let element = users.find(l => l.login === username);
    if(!element){
        res.render('zaloguj', {komunikat: 'Zła nazwa użytkownika'})
    }
    else {
        if (element.pass == password) {
            res.cookie('uzytkownik', username, {signed: true});
            let przekierowanie = req.query.przekierowanie;
            if (przekierowanie) {
                res.redirect(przekierowanie);
            } else {
                res.redirect('/');
            }
        } else {
            res.render('zaloguj', {komunikat: 'Złe hasło'})
        }
    }

})
function autoryzuj(req,res,next){
    if(req.signedCookies.uzytkownik){
        req.uzytkownik = req.signedCookies.uzytkownik;
        next();
    }
    else{
        res.redirect('/zaloguj?przekierowanie='+req.url);
    }
}

app.get('/',(req,res)=>{
    uzytkownikCiastko = req.signedCookies.uzytkownik;
    res.render('index',{uzytkownik: uzytkownikCiastko})
})

app.get('/',(req,res) =>{
    res.send(path.join(__dirname, '../statyczne'));
})

app.use(express.json());

app.get('/wyloguj',autoryzuj,(req,res)=>{
    res.cookie('uzytkownik','',{maxAge: -1});
    res.redirect('/')
})

app.get('/lista',autoryzuj,(req,res)=>{
    res.render('lista',{lista:lista});
})

app.get('/api/lista',(req,res)=>{
    res.send(lista)
})

app.get('/api/lista/:id(\\d+)', (req, res) => {
    let element = lista.find(l => l.id === parseInt(req.params.id));

    if(!element) res.status(404).send("Element o takim id nie istnieje");

    else res.send(element);
})

app.get('/api/lista/:rok/:miesiac', (req,res)=>{
    res.send(req.params);
})

app.post('/api/lista', (req,res) => {
    const schemat = Joi.object().keys({
        nazwa: Joi.string().min(3).required()
    });

    const wynik = schemat.validate(req.body);
    console.log(wynik);

    if(wynik.error){
        res.status(400).send(wynik.error.details[0].message);
        return;
    }

    const element = {
        id: lista.length + 1,
        nazwa: req.body.nazwa
    }

    lista.push(element);
    res.send(element);
})

app.put('/api/lista/:id',(req, res)=>{
    let element = lista.find(l => l.id === parseInt(req.params.id));
    if(!element) res.status(404).send('Element o takim ID nie istnieje');

    const wynik = sprawdzElement(req.body);
    if(wynik.error){
        res.status(400).send(wynik.error.details[0].message);
        return;
    }

    element.nazwa = req.body.nazwa;

    res.send(element);

})

function sprawdzElement(element){
    const schemat = Joi.object().keys({
        nazwa: Joi.string().min(3).required()
    });
    return schemat.validate(element);
}

app.delete('/api/lista/:id',(req,res)=>{
    let element = lista.find(l => l.id === parseInt(req.params.id));
    if(!element){
        return res.status(404).send('Element o takim ID nie istnieje');
    }
    let index = lista.indexOf(element);
    lista.splice(index,1);

    res.send(element);
})

app.use((req,res,next)=>{
    res.render('404.ejs',{url: req.url})
});

const port = process.env.PORT || 3000
app.listen(port, () => console.log('Oczekuje na porcie ${port}...'))
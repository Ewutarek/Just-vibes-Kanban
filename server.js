const express = require('express')
const Handlebars = require('handlebars')
const expressHandlebars = require('express-handlebars')
const {allowInsecurePrototypeAccess} = require('@handlebars/allow-prototype-access')
const app = express()
const {User, Task, Board, AdminTable, sequelize, Op} = require('./models')
const e = require('express')
var loggedIndex;


const handlebars = expressHandlebars({
    handlebars: allowInsecurePrototypeAccess(Handlebars)
})

app.use(express.static('public'))
app.engine('handlebars', handlebars)
app.set('view engine', 'handlebars')
app.use(express.urlencoded({ extended: true }))
app.use(express.json())

//landing page

app.get('/', (req, res) => {
    res.render('landing', {layout : 'main'});
    })

/*-----------------------Login-Create----------------------*/
app.get('/login-create', (req, res) => 
{
    res.render('login-create', {layout : 'main'});
})

  
//login-create page login
app.post('/login-create', async (req, res) =>{
    console.log(req.body);
    const users = await User.findAll();
    let isFound = false;
    users.forEach(user => 
        {
            if(user.username == req.body.username)
            {
                isFound = true;
                loggedIndex = user.id;
                console.log(loggedIndex);
                res.redirect('/myBoards')
            } 
        })
        
        if(isFound == false)
        {
            res.redirect('/login-create');
        }
})

//login-create page sign-up
app.post('/login-create', async (req, res) => {
   
    const users = await User.findAll();
    let isFound = false;
    users.forEach(user => 
    {
        if(user.username == req.body.username)
        {
            isFound = true;
            res.redirect('/login-create');
        } 
    })
    
    if(isFound == false)
    {
    await User.create(req.body)
    }

    res.redirect('/login-create')
    })


//app is listening on port 3000

app.listen(3000, async() => {
    await sequelize.sync()
    console.log('Web server is running')
})

//my boards page

app.get('/myBoards', async (req, res) => {
    const users = await User.findAll({
        where: {
            id: {
                [Op.ne]: loggedIndex
            }
        }
    })
    
    const admin = await AdminTable.findAll({
        where: {
          UserId: loggedIndex
        }
      })
    
    const boards = await Promise.all(admin.map(admin => Board.findByPk(admin.BoardId)))

    res.render('myBoards', {users, boards})
})

//create new board

app.post('/myBoards', async (req, res) => {
    const data = req.body
    console.log(data)
    const newBoard = await Board.create({title: data.title, image: data.image})
    await AdminTable.create({UserId: loggedIndex, BoardId: newBoard.id})

    if (data.users.length == 1) {
        await AdminTable.create({UserId: data.users, BoardId: newBoard.id})

    }
    else {
        (data.users).forEach(async (user) => {
        await AdminTable.create({UserId: user, BoardId: newBoard.id})
        })
    }

    res.redirect('/myBoards')
})
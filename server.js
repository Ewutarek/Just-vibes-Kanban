const express = require('express')
const Handlebars = require('handlebars')
const expressHandlebars = require('express-handlebars')
const {allowInsecurePrototypeAccess} = require('@handlebars/allow-prototype-access')
const app = express()
const {User, Task, Board, AdminTable, sequelize, Op} = require('./models')
const e = require('express')
var loggedIndex = 1
var BoardIndex = 1
var user = null
boards = []
user = []
var notStarted = []
var inProgress = []
var done = []
var otherUsers = []


const handlebars = expressHandlebars({
    handlebars: allowInsecurePrototypeAccess(Handlebars),
    helpers: { 
        exportBoards:() => {
            //finds all a users boards 
            return (boards)
        },
        getLoggedUser: function(){
            return (user.username)

        },
        getLoggedAvatar: function(){
            var avatar = user.avatar
            return (avatar)

        }
    },
    partialsDir: __dirname + '/views/partials/'
})

app.use(express.static('public'))
app.engine('handlebars', handlebars)
app.set('view engine', 'handlebars')
app.use(express.urlencoded({ extended: true }))
app.use(express.json())

/*---------------------------landing page---------------------------*/

app.get('/', (req, res) => {
    res.render('landing', {layout : 'main'});
    })

/*-----------------------Login-Create Render----------------------*/
app.get('/login-create', (req, res) => 
{
    res.render('login-create', {layout : 'main'});
})

  
/*--------------------------------login-create login validation--------------------------------*/
app.post('/login', async (req, res) =>
{
    console.log(req.body);
    const users = await User.findAll();
    let isFound = false;
    users.forEach((_user, index) => 
        {
            if(_user.username == req.body.username)
            {
                isFound = true;
                loggedIndex = _user.id;
                user = _user
                res.redirect('/myBoards')
            } 
        })
        
        if(isFound == false)
        {
            res.redirect('/login-create');
        }
    
    await getBoards()
})


/*-------------------------login-create sign-up validation---------------------------*/
app.post('/signup', async (req, res) =>
{
   
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



/*---------------------All Boards (Explore)-----------------------*/
app.get('/explore', async (req, res) => 
{
    const boards = await Board.findAll()
    res.render('explore', {boards});
})

/*---------------------one Board (viewBoard)-----------------------*/ 
getUsers = async (BoardIndex) =>
{
    const admin = await AdminTable.findAll({
        where: {
          BoardId: BoardIndex
        }
      })
    
    users = await Promise.all(admin.map(admin => User.findByPk(admin.UserId)))
}

app.get('/viewBoard/:id', async (req, res) => 
{
    const board = await Board.findByPk(req.params.id).catch(console.error)
    BoardIndex = board.id;
    console.log("-----------------------Selected Board Index-------------",BoardIndex);
    const admin = await AdminTable.findAll()
    
    await getUsers(req.params.id);

    res.render('viewBoard', {board, users});
})

/*---------------------app is listening on port 3000-----------------------*/
app.listen(3000, async() => {
    await sequelize.sync()
    console.log('Web server is running')
})

/*----------------------------------finds a users boards ------------------------------*/
getBoards = async () => {
    const admin = await AdminTable.findAll({
        where: {
          UserId: loggedIndex
        }
      })
    
    boards = await Promise.all(admin.map(admin => Board.findByPk(admin.BoardId)))
}



/*----------------------------------------my boards page----------------------------------*/
app.get('/myBoards', async (req, res) => {
    const users = await User.findAll({
        where: {
            id: {
                [Op.ne]: loggedIndex
            }
        }
    })
    
    await getBoards()
    

    res.render('myBoards', {users, boards})
})



/*---------------------------create new board-----------------------------*/
app.post('/myBoards', async (req, res) => {
    const data = req.body
    console.log(data)
    const newBoard = await Board.create({title: data.title, image: data.image})
    await AdminTable.create({UserId: loggedIndex, BoardId: newBoard.id})
    
    if (data.users == null) {
        //do nothing
    }
    else if (data.users.length == 1) {
        await AdminTable.create({UserId: data.users, BoardId: newBoard.id})

    }
    else {
        (data.users).forEach(async (user) => {
        await AdminTable.create({UserId: user, BoardId: newBoard.id})
        })
    }

    res.redirect('/myBoards')
})



/*--------------------------------get a boards users----------------------------------*/

getUsers = async (BoardIndex) =>
{
    const admin = await AdminTable.findAll({
        where: {
          BoardId: BoardIndex
        }
      })
    users = await Promise.all(admin.map(admin => User.findByPk(admin.UserId)))
}


/*-----------------------------------edit board page ----------------------------*/

app.get('/editBoard/:id', async (request, response) => {
    const board = await Board.findByPk(request.params.id, {
        include: [{model: Task, as: 'tasks'}],
    })

    board.tasks.sort(function(a, b){
        return a.priority-b.priority
    })

    notStarted = []
    inProgress = []
    done = []
    
    board.tasks.forEach(task => {
        if (task.status == -1) {
            notStarted.push(task)
        } 
        else if (task.status == 0) {
            inProgress.push(task)
        } 

        else {
            done.push(task)
        }
    })

    
    getUsers(request.params.id)
    getOtherUsers(request.params.id)
    
    response.render('editBoard', {board})
})

getOtherUsers = async (BoardIndex) =>
{
    const allUsers = await User.findAll()
    const adminTables = await AdminTable.findAll()

    adminTables.forEach(row => {
        if (row.BoardId == BoardIndex) {
            index = allUsers.findIndex(user => user.id == row.UserId)
            allUsers.splice(index,1)
        }
    })
    
    otherUsers = allUsers
      
}

app.get('/users', (req, res) => {
    res.send(users)
})

app.get('/otherUsers', (req,res) => {
    res.send(otherUsers)
})


app.get('/notStarted', (req, res) => {
    res.send(notStarted)
})

app.get('/inProgress', (req, res) => {
    res.send(inProgress)
})

app.get('/done', (req, res) => {
    res.send(done)
})


/*-------------------------------------add task-----------------------------------*/
app.post('/editBoard/:id/addTask', async (req,res) => {
    task = await Task.create({text: req.body.text, BoardId: req.params.id, status: -1, priority: notStarted.length})
    notStarted.push(task)
    res.send()
})

/*--------------------------------move task --------------------------------*/
app.post('/moveTask', async (req,res) => {
    const index1 = req.body[0]
    const index2 = req.body[1]
    const index3 = req.body[2]
    const listOut = req.body[3]
    const listIn = req.body[4]

    if (listOut == -1) {
        task = notStarted[index1]
        notStarted.splice(index1, 1)
    }
    else if (listOut == 0) {
        task = inProgress[index2]
        inProgress.splice(index2, 1)
    }
    else {
        task = done[index3]
        done.splice(index3, 1)
    }


    if (listIn == -1) {
        await task.update({status: -1, priority: notStarted.length})
        notStarted.push(task)
    }
    else if (listIn == 0) {
        await task.update({status: 0, priority: inProgress.length})
        inProgress.push(task)
    }
    else {
        await task.update({status: 1, priority: done.length})
        done.push(task)
    }

    res.send()
})

/*-----------------------------delete task--------------------------*/
app.post('/deleteTask', async (req,res) => {
    const index1 = req.body[0]
    const index2 = req.body[1]
    const index3 = req.body[2]
    const list = req.body[3]

    if (list == -1) {
        task = notStarted[index1]
        notStarted.splice(index1, 1)
    }
    else if (list == 0) {
        task = inProgress[index2]
        inProgress.splice(index2, 1)
    }
    else {
        task = done[index3]
        done.splice(index3, 1)
    }

    await task.destroy()
    res.send()
})

/*-----------------------------------redorder tasks--------------------------------*/
app.post('/reorderTasks', async (req,res) => {
    const index1 = req.body[0]
    const index2 = req.body[1]
    const index3 = req.body[2]
    const listOut = req.body[3]
    const listIn = req.body[4]
    const priority = req.body[5]

    if (listOut == -1) {
        task = notStarted[index1]
        notStarted.splice(index1, 1)
    }
    else if (listOut == 0) {
        task = inProgress[index2]
        inProgress.splice(index2, 1)
    }
    else {
        task = done[index3]
        done.splice(index3, 1)
    }

    

    if (listIn == -1) {
        await task.update({status: -1})
        notStarted.splice(priority, 0, task)

        await Promise.all(notStarted.map(item => {
            newPriority = notStarted.indexOf(item)
            return item.update({priority: newPriority})
        }))

        
    }
    else if (listIn == 0) {
        await task.update({status: 0})
        inProgress.splice(priority, 0, task)

        await Promise.all(inProgress.map(item => {
            newPriority = inProgress.indexOf(item)
            return item.update({priority: newPriority})
        }))
    }
    else {
        await task.update({status: 1})
        done.splice(priority, 0, task)
        
        await Promise.all(done.map(item => {
            newPriority = done.indexOf(item)
            return item.update({priority: newPriority})
        }))
    }

    res.send()
})

/*----------------------------------edit task ---------------------------*/
app.post('/editTask', async (req,res) => {
    const index1 = req.body[0]
    const index2 = req.body[1]
    const index3 = req.body[2]
    const list = req.body[3]
    const text = req.body[4]
    const asignee = req.body[5]

    if (list == -1) {
        task = notStarted[index1]
        await task.update({text: text, UserId: asignee})
    }
    else if (list == 0) {
        task = inProgress[index2]
        await task.update({text: text, UserId: asignee})
    }
    else {
        task = done[index3]
        await task.update({text: text, UserId: asignee})
    }

    res.send()
})

//edit board 

app.post('/editBoard', async (req,res) => {
    const id = req.body[0]
    const title = req.body[1]
    const users= req.body[2]
    
    const board = await Board.findByPk(id)

    await board.update({title: title})

    if (users == null) {
        //do nothing
    }
    else if (users.length == 1) {
        await AdminTable.create({UserId: users, BoardId: id})
    }
    else {
        users.forEach(async (user) => {
        await AdminTable.create({UserId: user, BoardId: id})
        })
    }

    res.send()
})

//delete board

app.post('/deleteBoard',async (req,res) => {
    const id = req.body[0]

    board = await Board.findByPk(id)
    adminTables = await AdminTable.findAll({
        where: {
            BoardId: id
        }
    })
    
    
    await Promise.all(adminTables.map(row => row.destroy()))
    await board.destroy()
    

    res.send()
})





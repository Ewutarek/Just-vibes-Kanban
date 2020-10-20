const express = require('express')
const session = require('express-session')
const Handlebars = require('handlebars')
const expressHandlebars = require('express-handlebars')
const {allowInsecurePrototypeAccess} = require('@handlebars/allow-prototype-access')
const app = express()
const {User, Task, Board, AdminTable, sequelize, Op} = require('./models')
const e = require('express')
var loginMsg ="";
var signupMsg ="";


const handlebars = expressHandlebars({
    handlebars: allowInsecurePrototypeAccess(Handlebars),
    partialsDir: __dirname + '/views/partials/'
})

app.use(express.static('public'), session({
    'secret': '343ji43j4n3jn4jk3n'
  }))
app.engine('handlebars', handlebars)
app.set('view engine', 'handlebars')
app.use(express.urlencoded({ extended: true }))
app.use(express.json())

/*---------------------------landing page---------------------------*/

app.get('/', (req, res) => {
    res.render('landing', {layout : 'mainlanding'});
    })

/*-----------------------Login-Create Render----------------------*/
app.get('/login-create', (req, res) => 
{
    res.render('login-create', {layout : 'mainlanding', loginMsg, signupMsg});
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
                req.session.userId = _user.id;
                req.session.user = _user
                req.session.maxAge = 365 * 24 * 60 * 60 * 1000;
                res.redirect('/myBoards')
            } 
        })
        
        if(isFound == false)
        {
            loginMsg = "Username is incorrect. Please try again or  sign up for an account" 
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
            signupMsg = "Sorry, '"+ req.body.username + "' is already taken. Please try another username"
            res.redirect('/login-create');
        } 
    })
    
    if(isFound == false)
    {
    signupMsg = "Welcome, "+ req.body.username + "! Your account has been created. Please Login"
    await User.create(req.body)
    }

    res.redirect('/login-create')
})


/*------------------------------logout----------------------------------- */ 
app.get('/logout', async (req, res) => 
{
    loginMsg = "";
    signupMsg = ""; 
    loggedIndex = null;
   res.redirect('/')
})


/*------------------------------logout----------------------------------- */ 
app.get('/logout', async (req, res) => 
{
    loggedIndex = null;
   res.redirect('/')
})


/*---------------------All Boards (Explore)-----------------------*/
app.get('/explore', async (req, res) => 
{
    const boards = await Board.findAll()
    thisSession = req.session 


    res.render('explore', {boards, thisSession});
})

/*---------------------one Board (viewBoard)-----------------------*/ 

app.get('/viewBoard/:id', async (req, res) => 
{
    const board = await Board.findByPk(req.params.id, {
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

    req.session.notStarted = notStarted
    req.session.inProgress = inProgress
    req.session.done = done

    //finding users on board 
    const admin = await AdminTable.findAll({
        where: {
          BoardId: req.params.id
        }
      })
    
    users = await Promise.all(admin.map(admin => User.findByPk(admin.UserId)))
    req.session.users = users
    thisSession = req.session 

    res.render('viewBoard', {board, users, thisSession});
})

/*---------------------app is listening on port 3000-----------------------*/
app.listen(3000, async() => {
    await sequelize.sync()
    console.log('Web server is running')
})

/*----------------------------------finds a users boards ------------------------------*/
   



/*----------------------------------------my boards page----------------------------------*/
app.get('/myBoards', async (req, res) => {
    const users = await User.findAll({
        where: {
            id: {
                [Op.ne]: req.session.userId
            }
        }
    })
    
     const admin = await AdminTable.findAll({
        where: {
          UserId: req.session.userId
        }
      })
    
    req.session.boards = await Promise.all(admin.map(admin => Board.findByPk(admin.BoardId)))
    
    boards= req.session.boards
    req.session.boards = boards
    thisSession = req.session 


    res.render('myBoards', {users, boards, thisSession})
})



/*---------------------------create new board-----------------------------*/
app.post('/myBoards', async (req, res) => {
    const data = req.body
    console.log(data)
    const newBoard = await Board.create({title: data.title, image: data.image})
    await AdminTable.create({UserId: req.session.userId, BoardId: newBoard.id})
    
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


/*-----------------------------------edit board page ----------------------------*/

app.get('/editBoard/:id', async (req, res) => {
    const board = await Board.findByPk(req.params.id, {
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

    req.session.notStarted = notStarted
    req.session.inProgress = inProgress
    req.session.done = done

    //finding users on board 
    const admin = await AdminTable.findAll({
        where: {
          BoardId: req.params.id
        }
      })
    
    users = await Promise.all(admin.map(admin => User.findByPk(admin.UserId)))
    req.session.users = users

    //finding users not on board
    const allUsers = await User.findAll()
    const adminTables = await AdminTable.findAll()

    adminTables.forEach(row => {
        if (row.BoardId == req.params.id) {
            index = allUsers.findIndex(user => user.id == row.UserId)
            allUsers.splice(index,1)
        }
    })
    
    req.session.otherUsers = allUsers
    thisSession = req.session 
    
    res.render('editBoard', {board, thisSession})
})



app.get('/users', (req, res) => {
    res.send(req.session.users)
})

app.get('/otherUsers', (req,res) => {
    res.send(req.session.otherUsers)
})

app.get('/notStarted', async (req, res) => {
    res.send(req.session.notStarted)
})

app.get('/inProgress', (req, res) => {
    res.send(req.session.inProgress)
})

app.get('/done', (req, res) => {
    res.send(req.session.done)
})


/*-------------------------------------add task-----------------------------------*/
app.post('/editBoard/:id/addTask', async (req,res) => {
    task = await Task.create({text: req.body.text, BoardId: req.params.id, status: -1, priority: notStarted.length})
    req.session.notStarted.push(task)
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
        task = req.session.notStarted[index1]
        req.session.notStarted.splice(index1, 1)
    }
    else if (listOut == 0) {
        task = req.session.inProgress[index2]
        req.session.inProgress.splice(index2, 1)
    }
    else {
        task = req.session.done[index3]
        req.session.done.splice(index3, 1)
    }


    dbTask = await Task.findByPk(task.id)


    if (listIn == -1) {
        await dbTask.update({status: -1, priority: notStarted.length})
        req.session.notStarted.push(dbTask)
    }
    else if (listIn == 0) {
        await dbTask.update({status: 0, priority: inProgress.length})
        req.session.inProgress.push(dbTask)
    }
    else {
        await dbTask.update({status: 1, priority: done.length})
        req.session.done.push(dbTask)
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
        task = req.session.notStarted[index1]
        req.session.notStarted.splice(index1, 1)
    }
    else if (list == 0) {
        task = req.session.inProgress[index2]
        req.session.inProgress.splice(index2, 1)
    }
    else {
        task = req.session.done[index3]
        req.session.done.splice(index3, 1)
    }

    dbTask = await Task.findByPk(task.id)
    await dbTask.destroy()
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

    notStarted = await Promise.all(req.session.notStarted.map(task => Task.findByPk(task.id)))
    inProgress = await Promise.all(req.session.inProgress.map(task => Task.findByPk(task.id)))
    done = await Promise.all(req.session.done.map(task => Task.findByPk(task.id)))

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

    req.session.notStarted = notStarted
    req.session.inProgress = inProgress
    req.session.done = done

    res.send()
})

/*----------------------------------edit task ---------------------------*/
app.post('/editTask', async (req,res) => {
    const index1 = req.body[0]
    const index2 = req.body[1]
    const index3 = req.body[2]
    const list = req.body[3]
    const text = req.body[4]
    const assignee = req.body[5]

    if (list == -1) {
        task = req.session.notStarted[index1]
        task.text = text
        task.UserId = assignee
        dbTask = await Task.findByPk(task.id)
        await dbTask.update({text: text, UserId: assignee})
    }
    else if (list == 0) {
        task = req.session.inProgress[index2]
        task.text = text
        task.UserId = assignee
        dbTask = await Task.findByPk(task.id)
        await dbTask.update({text: text, UserId: assignee})
    }
    else {
        task = req.session.done[index3]
        task.text = text
        task.UserId = assignee
        dbTask = await Task.findByPk(task.id)
        await dbTask.update({text: text, UserId: assignee})
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





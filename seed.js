const {User, AdminTable, Board, Tasks, sequelize} = require("./models")

//creating some default users 

const users = [
    {
        "id": 1,
        "username": "Keratuwe",
        "avatar": ""
    },
    {
        "id": 2,
        "username": "Kaye",
        "avatar": ""
    },
    {
        "id": 3,
        "username": "Martha",
        "avatar": ""
    }
]

//creating default boards

const boards = [
    {
        "id": 1,
        "title": "Just-Vibes",
        "image": ""
    }
]

//linking users to boards

const admin = [
    {
        "user_id": 1,
        "board_id": 1
    },
    {
        "user_id": 2,
        "board_id": 1
    },
    {
        "user_id": 3,
        "board_id": 1
    }
]

//creating some default tasks 

const tasks = [
    {
        "text": "Make models.js",
        "board_id": 1,
        "user_id": 1
    },
    {
        "text": "Make server.js",
        "board_id": 1,
        "user_id": 2
    },
    {
        "text": "Make seed.js",
        "board_id": 1,
        "user_id": 3
    } 
]

//creating database then populating it 

sequelize.sync().then( () => {

    const seedUsers = users.map(async (user) => {
        const newUser = await User.create({id: user.id, username: user.username, avatar: user.avatar})
    })

    const seedBoards = boards.map(async (board) => {
        const newBoard = await Board.create({id: board.id, title: board.title, image: board.image})
    })

    const seedAdmin = admin.map(async (admin) => {
        const newAdmin = await AdminTable.create({UserId: admin.user_id, BoardId: admin.board_id})
    })

    const seeTasks = tasks.map(async (task) => {
        const newTask = await Tasks.create({text: task.text, BoardId: task.board_id, UserId: task.user_id})
    })
    
})

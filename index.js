#!/usr/bin/env node

const yargs = require('yargs')
const fs = require('fs')
const Trello = require('trello')

const DEFAULT_OPTS = { auth_key: '' }
const RC_FILE = '.cardsrc'
const CONFIG_FILE = `${process.env['HOME']}/${RC_FILE}`

// REQUESTS
const reqBoards = config => {
  const trello = new Trello(config.auth_key, config.auth_token)
  trello.getBoards(config.username, (err, res) => {
    res.forEach(obj => {
      if (!obj.closed) {
        console.log(obj.name, obj.id)
      }
    })
  })
}

const reqCardsOnBoard = (config, boardName) => {
  const trello = new Trello(config.auth_key, config.auth_token)
  trello.getBoards(config.username, (err, boards) => {
    const board = boards.find(b => boardName.toLowerCase().includes(b.name.toLowerCase()))
    trello.getListsOnBoard(board.id, (err, lists) => {
      lists.forEach(l => {
        if (!l.closed) {
          trello.getCardsOnList(l.id, (err, cards) => {
            console.log(`${l.name}`)
            console.log('-'.repeat(l.name.length))
            cards.forEach(c => console.log(c.name))
            console.log('\n')
          })
        }
      })
    })
  })
}

// HANDLERS

const getConfig = argv => {
  if (fs.existsSync(CONFIG_FILE)) {
    const config = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'))
    return config
  } else {
    console.log(`${CONFIG_FILE} does not exist, yet.`)
    console.log('Please run `' + argv['$0'] + 'auth`, first.')
    return {}
  }
}

const handleShow = argv => {
  const config = getConfig(argv)
  reqCardsOnBoard(config, argv.board)
}

const handleAuth = argv => {
  console.log(`Writing authorisation token to ${CONFIG_FILE} ... `)
  fs.writeFile(
    CONFIG_FILE,
    JSON.stringify(
      {
        auth_key: argv.key,
        auth_token: argv.token,
        username: argv.username
      },
      null,
      4
    ),
    err => {
      if (err) {
        console.error(err)
      }
      console.log(`Successfully Wrote authorisation token to ${CONFIG_FILE}`)
    }
  )
}

const handleBoards = argv => {
  const config = getConfig(argv)
  reqBoards(config)
}

const argv = yargs
  .command(
    'board [board]',
    'Choose a board to perform actions on',
    yargs => {
      yargs
        .positional('board', {
          describe: 'Name of the board to perform actions on',
          default: ''
        })
        .command('show', 'Show all cards for the given board', () => {})
    },
    handleShow
  )
  .command(
    'auth [key] [token] [username]',
    'Provide credentials to authorise trello requests',
    yargs => {
      yargs
        .positional('key', {
          describe: 'Trello API Developer key for authorising requests',
          default: ''
        })
        .positional('token', {
          describe: 'Trello API Developer token for authorising requests',
          default: ''
        })
        .positional('username', {
          describe: 'Trello username',
          default: ''
        })
    },
    handleAuth
  )
  .command('boards', 'Show all open boards', () => {}, handleBoards).argv

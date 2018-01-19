const config = require('./config')
const r = require('rethinkdbdash')({
  host: config.rethinkdb.url, 
  port: config.rethinkdb.port,
  db: 'crypto_miner_monitor',
  user: config.rethinkdb.user,
  password: config.rethinkdb.password
})

let type = 'case_temp'

// get the temperatures based on query type and send to client
r.table('temperatures')
  .orderBy({ index: r.asc('date') })
  .without('id')
  .run()
  .then(results => {
    let prevTime = 0
    results = results.reduce((output, item, index) => {
      let ticks = new Date(item.date).getTime()

      
      if (ticks - prevTime > (1000 * 60 * 10)) {
        //console.log(ticks - prevTime)
        output.push(item)
        prevTime = ticks
      }

      return output
    }, [])

    r.table('historic_readings')
      .delete({durability: "soft"})
      .run()
      .then((deleteResults) => {
        console.log(deleteResults)
        r.table('historic_readings')
          .insert(results)
          .run()
          .then(data => {
            console.log('inserted: ', data.inserted)
            process.exit()
          })
          .catch(err => console.log(err))
      })
      .catch(err => console.log(err))   
  })
  .catch(err => {
    console.log(err)
  })
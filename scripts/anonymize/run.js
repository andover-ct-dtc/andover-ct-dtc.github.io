const streetMap = require('./streets.json')
const voterMap = require('./voters.json')
const addr = require('./convertAddresses')

const main = async () => 
  addr(streetMap)
    .then(addressMap => console.log (`Passing ${Object.keys(addressMap).length} addresses to convertVoters`))

main()
  .then(console.log)
  .catch(console.warn)
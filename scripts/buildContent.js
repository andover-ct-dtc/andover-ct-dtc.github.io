const {writeFile, mkdir, rm, readFile: rf} = require ('fs/promises')
const tap = (fn) => (x) => ((fn (x)), x)
const map = (fn) => (xs) => xs .map (x => fn (x))
const call = (fn, ...args) => fn (...args)
const display = msg => tap (() => console .log (msg))
const allPromises = (ps) => Promise .all (ps)
const readFile = (filename) => () => rf(filename, 'utf8')

const main = (fileName, latLong) =>
  deleteOutputDirs()   // ensure there's no detritus from previous runs
    .then (createOutputDirs)
    .then (readFile(fileName))
    .then (delay(500))
    .then (display ('Built directories'))
    .then (psv2arr)
    .then (handleVoters)
    .then (handleAddresses(latLong))
    .then (() => console .log ('Completed!'))
    .catch (console .warn)

const deleteOutputDirs = () => 
    rm ('./plugins/AndoverCT/Voters', {force: true, recursive: true})
    .then (() => rm ('./plugins/AndoverCT/Addresses', {force: true, recursive: true}))
  
const createOutputDirs = () =>
  mkdir ('./plugins/AndoverCT/Addresses', {recursive: true})
  .then (() => mkdir ('./plugins/AndoverCT/Voters', {recursive: true}))

const delay = (t) => (v) => new Promise (r => setTimeout(() => r(v), t))

const psv2arr = ( 
  psv, [headers, ...rows] = psv.split('\n').filter(Boolean).map((r => r.split('|')))
) => rows.map((r) => Object.fromEntries(r.map((c, i) => [headers[i], c.trim()])))

const handleVoters = (rs) => Promise.resolve(rs)
  .then (map(getOverview))
  .then (map(writeTiddler))
  .then (allPromises)
  .then (tap (ps => console .log (`Wrote ${ps.length} Voter tiddlers`)))
  .then (() => rs)

const getOverview = (r) => [
  `./Plugins/AndoverCT/Voters/van-${r['Voter File VANID']}-${r.FirstName}_${r.LastName}.tid`,
  convertPerson(r)
]

const convertPerson = r => `title: $:/AndoverCT/Voters/${r['Voter File VANID']}
tags: Voter
caption: Voters/${r.FirstName + ' ' + r.LastName + (r.Suffix ? (' ' + r.Suffix) : '')}
first-name: ${r.FirstName}
last-name: ${r.LastName}
middle-name: ${r.MiddleName}
suffix: ${r.suffix || ''}
full-name: ${r.FirstName + ' ' + r.LastName + (r.Suffix ? (' ' + r.Suffix) : '')}
gender: ${r.Sex}
age: ${r.Age}
party: ${getParty(r.Party)}
phone: ${makePhone(r['Preferred Phone'])}
address: ${r.Address}
`

const makePhone = (p) => p
  ? `${p.slice(0, 3)}-${p.slice(3, 6)}-${p.slice(6, 10)}`
  : ''
 
  
const getParty = (p) => ({
  'U': '', 'D': 'Democratic', 'R': 'Republican', 
  'I': 'Independent', 'G': 'Green', 'L': 'Libertairan',
}) [p]

const handleAddresses = (latLong) => (rs) => 
  Promise.resolve(rs)
    .then (convertAddresses(latLong))
    .then (map(writeTiddler))
    .then (allPromises)
    .then (tap (ps => console .log (`Wrote ${ps.length} Address tiddlers`)))
    .then (() => rs)

const convertAddresses = (latLong) => (rs, loc) => Object .entries (Object .fromEntries (rs.map (r => [ // `entries` dance for uniqueness
`./Plugins/AndoverCT/Addresses/${r.Address.replace(/\s/g, '_')}.tid`,

`title: $:/AndoverCT/Address/${r.Address}
tags: Address
caption: Addresses/${r.Address}
address: ${r.Address}
street-number: ${r.Address.split(' ')[0]}
street: ${r.Address.split(' ').slice(1).join(' ').replace(/ Apt.*$/i, '')}
${addApt(r.Address)
}city: ${r.City}
state: ${r.State}
zip5: ${r.Zip5}
zip4: ${r.Zip4}
${(
  loc = latLong[r.Address.replace(/ Apt.*$/i, '')] || latLong['Andover'], 
`lat: ${loc.latitude}
long: ${loc.longitude}
alt: 0`
)}`
])))

const addApt = (a, m = a.match(/ Apt (.*)$/)) => m ? `apt: ${m[1]}
` : ''  

const writeTiddler = ([fileName, content]) => writeFile (fileName, content, 'utf8')

   
main ('./RawData/VAN_Extract.txt', require('../RawData/LatLong.json'))
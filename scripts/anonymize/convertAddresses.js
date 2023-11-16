const {readFile, writeFile, readdir, mkdir} = require('fs/promises')
const {join} = require('path')
const allPromises = (xs) => Promise.all (xs)
const map = (fn) => (xs) => xs .map (x => fn(x))
const tap = (fn) => (x) => (fn(x), x)
const srcDir = './plugins/AndoverCT/Addresses'
const targetDir = './anon/plugins/AndoverCT/Addresses'


const main = async (streetMap) =>
  mkdir(targetDir, {recursive: true})
    .then(() => readdir(srcDir))
    .then(map(convertAddress(streetMap)))
    .then(allPromises)
    .then(tap(xs => console.log(`Processed ${xs.length} addresses`)))
    .then(Object.fromEntries)

const convertAddress = (streetMap) => (name) => 
  readFile(join(srcDir, name))
    .then(String)
    .then(s => newAddress(streetMap, name, s))
    .then(tap(([title, body]) => writeFile(join(targetDir, title), body , 'utf8')))
    .then(([t, b, o, n]) => [o, n])


const newAddress = (streetMap, title, body) => {
  const name = body.match(/^street: (.+)$/m)[1].trim()
  const oldAddress = body.match(/^address: (.+)$/m)[1].trim()
  const newName = streetMap[name] || name
  const newAddress = oldAddress.replace(name, newName)

  return [
    title.replaceAll(name.replaceAll(' ', '_'), newName.replaceAll(' ', '_')), 
    body
      .replaceAll(name, newName)
      .replace(/lat: (.+)/, (_, lat) => `lat: ${String(Number(lat) + Math.random() * 2 - 1).slice(0, 9)}`)
      .replace(/long: (.+)/, (_, long) => `long: ${String(Number(long) + Math.random() * 2 - 1).slice(0, 10)}`),
    oldAddress,
    newAddress
  ]
}

module.exports = main

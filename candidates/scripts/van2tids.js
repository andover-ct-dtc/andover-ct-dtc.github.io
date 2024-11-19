const {readFile, writeFile} = require('fs').promises

const psv2arr = ( 
  psv, [headers, ...rows] = psv.split('\n').filter(Boolean).map((r => r.split('|')))
) => rows.map((r) => Object.fromEntries(r.map((c, i) => [headers[i], c])))

const convertSection = (s) => 
  s.replace(/\s+/g, '-')
   .replace(/([a-z])([A-Z])/g, (_, l, u) => `${l}-${u.toLowerCase()}`)
   .replace(/^([A-Z]{3,})([A-Z])([a-z])/, (_, a, b, c) => `${a.toLowerCase()}-${(b + c).toLowerCase()}`)
   .toLowerCase()
   .replace(/\-$/, '')

const convertKey = (k) => 
  k.split(':').map(convertSection).join('-')

const convertObj = (o) =>
  Object.fromEntries(Object.entries(o).map(([k, v]) => [convertKey(k), v.trim()]))

const removeEmptyFields = (xs, empties = Object.keys(xs[0] || {}).filter(k => xs.every(x => x[k] == ''))) => xs.map(
  x => Object.fromEntries(Object.entries(x).filter(([k, v]) => !empties.includes(k)))
) 

const parsePhone = (nbr) => nbr.match(/\d{9}/) 
  ? `${nbr.slice(0, 3)}-${nbr.slice(3, 6)}-${nbr.slice(6, 10)}`
  : nbr

const updatePhones = (o) =>
  Object.fromEntries(Object.entries(o).map(([k, v]) => k.endsWith('-phone') ? [k, parsePhone(v)]: [k, v]))

const toTid = (o) => ({
  title: `Voter/${o['voter-file-vanid']}`,
  tags: 'Voter',
  caption: `Voter/${o['first-name']} ${o['last-name']}` + (o.suffix ? `, ${o.suffix}` : ''),
  ...o
})

const convert = (recs) => 
  removeEmptyFields(psv2arr(recs).map(convertObj)).map(updatePhones).map(toTid)

const addAddresses = (voters, addresses = voters.reduce((a, v, i) => ({...a, [v['m-address']]: a[v['m-address']] || ({
  title: `Address/${i + 1}`,
  tags: 'Address',
  caption: `Address/${v['m-address']}`,
  address: v['m-address'],
  city: v['m-city'],
  state: v['m-state'],
  zip5: v['m-zip5'],
  zip4: v['m-zip4'],
  city: v['m-city'],
  'address-id': String(i + 1),
})}), {})) => [
  ...voters.map(v => ({
    ...v,
    'address-id': addresses[v['m-address']]['address-id']
  })),
  ...Object.values(addresses)
]

const main = (infile, outfile) =>
  readFile(infile, { encoding: 'utf8' })
    .then(convert)
    .then(addAddresses)
    .then((s) => JSON.stringify(s, null, 4))
    .then((json) => writeFile(outfile, json)) 

main(process.argv[2], process.argv[3])
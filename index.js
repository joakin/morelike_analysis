const https = require('https')
const fs = require('fs')

const host = 'https://en.wikipedia.org'

const tap = (fn) => (x) => { fn(x); return x }

const jsonStream = (stream) =>
  new Promise((res, rej) => {
    let str = ''
    stream.on('data', (b) => str += b.toString())
    stream.on('end', () => {
      try {
        res(JSON.parse(str))
      } catch (e) {
        console.error(str)
        rej(e)
      }
    })
  })

const get = (url, tries) =>
  new Promise((res, rej) => https.get(url, res).on('error', rej))
    .then(jsonStream)
    .catch((err) => {
      tries = tries === undefined ? 3 : tries
      if (tries > 0) {
        return get(url, --tries)
      } else {
        throw err
      }
    })

const morelike = (title, profile) => `${host}/w/api.php?action=query&list=search&srsearch=morelike:${title}&srqiprofile=${profile || 'classic'}&format=json`

const titles = (key) => (json) => json.query[key].map((i) => i.title)

const getMoreLike = (title, profile) =>
  get(morelike(title, profile)).then(titles('search'))

const profiles = [
  'classic',
  'classic_noboostlinks',
  'empty'
]

const toMap = (keys, values) =>
  values.reduce((a, value, i) => {
    a[keys[i]] = value
    return a
  }, {})

const getMoreLikeAllProfiles = (title) =>
  Promise.all(profiles.map(getMoreLike.bind(null, title)))
    .then(toMap.bind(null, profiles))

const random = (limit) =>
  `${host}/w/api.php?action=query&format=json&list=random&rnnamespace=0&rnfilterredir=nonredirects&rnlimit=${limit || 10}`

const getRandom = (limit) =>
  get(random(limit)).then(titles('random'))

const seq = (s, fn) =>
  s.reduce((p, v) =>
    p.then((acc) => fn(v).then((res) => acc.concat(res)))
  , Promise.resolve([]))

const prn = {
  cell: (c) => ` |style="background:#ffffff" | [${host}/wiki/${encodeURIComponent(c)} ${c}]`,

  row: (cells) => cells.map(prn.cell).join('\n'),

  article: (key, value) => {
    let cells = value.classic.map((_, i) =>
      prn.row([
        value.classic[i],
        value.classic_noboostlinks[i],
        value.empty[i]
      ])).join('\n |-\n')
    return `
=== ${key}  ===
{| class="wikitable toccolours" style="font-size:100%; margin:0 auto; width:100%;"
 !style="background:#f0f0f0" | classic
 !style="background:#f0f0f0" | classic noboostlinks
 !style="background:#f0f0f0" | empty
 |-
${cells}
 |}`
  }
}

const getTitles = (args) => {
  if (args.length === 1) {
    try {
      fs.accessSync(args[0])
      let titles = require('./'+args[0])
      return Promise.resolve(titles)
    } catch (e) {
      return Promise.reject(e)
    }
  } else {
    return getRandom(10)
  }
}

getTitles(process.argv.slice(2))
  // .then(tap(console.log))
  .then((ts) =>
    seq(ts, getMoreLikeAllProfiles)
       .then(toMap.bind(null, ts)))
  // .then(tap(console.log))
  // .then((j) => JSON.stringify(j, null, 2))
  .then((o) =>
    Object.keys(o).map((k) => prn.article(k, o[k])).join('\n'))
  .then(tap(console.log))
  .catch(console.error)

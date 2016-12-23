# hub.js
[![Build Status](https://travis-ci.org/vigour-io/hub.js.svg?branch=master)](https://travis-ci.org/vigour-io/hub.js)
[![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg)](http://standardjs.com/)
[![npm version](https://badge.fury.io/js/hub.js.svg)](https://badge.fury.io/js/hub.js)
[![Coverage Status](https://coveralls.io/repos/github/vigour-io/hub.js/badge.svg?branch=master)](https://coveralls.io/github/vigour-io/hub.js?branch=master)

Seamless realtime communcation

```javascript
const hub = require('hub.js')
// creates a hub as a server and as a client (url and port)
const node = hub({
  url: 'ws://someurl.com',
  port: 80 // some port to listen to
})

node.subscribe({
  $any: { title: true }
}, (target, type) => {
  console.log('update!', target, type)
})
```

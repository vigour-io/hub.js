# hub.js
[![Build Status](https://travis-ci.org/vigour-io/hub.js.svg?branch=master)](https://travis-ci.org/vigour-io/hub.js)
[![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg)](http://standardjs.com/)
[![npm version](https://badge.fury.io/js/hub.js.svg)](https://badge.fury.io/js/hub.js)
[![Coverage Status](https://coveralls.io/repos/github/vigour-io/hub.js/badge.svg?branch=master)](https://coveralls.io/github/vigour-io/hub.js?branch=master)

Observable data structures, over the network

### What is it not?
- Its not a database
- Its not a query language
- Its not persistent storage

### What is it?
- Software to help scale a realtime back end to millions of users — without adding any extra worries for developers
- Make an app for users as simple as creating a prototype
- Use the server to offload most of your client side cpu

### Why
  There is firebase right?
  - better subscriptions, “observable deep queries”
  - conflict resolution
  - flexible
  - completely open source — can be hosted on now or anywhere else
  - use as a hub for all your integrations — custom AND standard

### What does it do?
  - Create realtime branches of data
  - Gives sandboxes for your application to store data in
  - Executes queries
  - Sends diffs, keeps track of change
  - Integrates apis
  - Supports references (serliazable over the network)
  - Performs!
  - Can be a server
  - Can be a client
  - Or both
  - Runs on the browser
  - Can be used as a state store (like redux but simple)
  - Reconnects
  - Server side sessions

### Getting started
`npm i hub.js`

```javascript
const Hub = require('hub.js')
// creates a hub as a server and as a client
const hub = Hub()
  .listen(80)
  .connect('ws://someurl.com')
```

### Data structure
hub.js uses a  data structure modelled to closely resemble plain js objects

Elements can be values and objects at the same time, all element are observable
```javascript
const hub = Hub({
  something: 'hello'
})

// .set does a deep merge by default
hub.set({
  something: {
    field: 'some field'
  }
})

hub.get('something').on(() => {
  console.log('fires on change!')
})

// object notation for listeners
hub.set({
  something: {
    on: {
      data: () => {} // data emitter type
    }
  }
})

console.log(hub.serialize()) // serialize casts hub objects to plain objects
// logs { something: { val: 'hello', field: 'some field' }}
```

### References
```javascript
const hub = Hub({
  something: 'hello'
})

// creates an observable reference
hub.set({
  thing: hub.get('something')
})

hub.thing.on(() => {
  console.log('hello')
})

hub.something.set('bye')
// fires the listener on hub.thing

hub.set({
  bla: [ '@', 'root', 'other']
})
// set something to a reference before it exists

hub.set({
  other: 'thing'
})
// will resolve updates for

```



### Subscriptions

#### Basic

A simple subscription
```javascript
client.subscribe(true, (target, type) => {
  // fires updates for any update in the hub
  console.log('update!', target, type)
})
```

Setting on the server
```javascript
server.set('hello!')
// will fire an update on client
```

A shallow subscription
```javascript
client.subscribe('shallow', (target, type) => {
  // fires updates for any update on the value of the hub, but not nested fields
  console.log('update!', target, type)
})
```

#### Any

A simple subscription
```javascript
client.subscribe({
  $any: { title: true }
}, (target, type) => {
  // fires updates when any field updates a title
  console.log('update!', target, type)
})
```

A complex subscription
```javascript
client.subscribe({
  $any: {
    $keys: keys => keys.slice(0, 5),
    title: true
  }
}, (target, type) => {
  // fires updates when any field updates a title but only the first 5
  console.log('update!', target, type)
})
```

A complex subscription with sort
```javascript
client.subscribe({
  $any: {
    $keys: (keys, state) => keys.sort((a, b) =>
      // get allows you to get a field that does not exist yet
      state.get([ a, 'count' ], 0).compute() >
      state.get([ b, 'count' ], 0).compute()
    ).slice(0, 5),
    title: true
  }
}, (target, type) => {
  // fires updates when any field updates a title but only the first 5 sorted by count
  console.log('update!', target, type)
})
```

#### Switch

Switches are probably the most powerful concept in supported in the subscription model, allowing you to branch subscriptions based on certain conditions
```javascript
client.subscribe({
  $any: {
    kind: {
      $switch: state => {
        if (state.compute() === 'dog') {
          return {
            diet: true
          }
        } else {
          title: true
        }
      }
    }
  }
}, (target, type) => {
  // fires updates on diet when it finds a dog else fires updates for title
  console.log('update!', target, type)
})
```

const client = {
  props: {
    socket: true
  }
}

export default {
  props: {
    clients: {
      props: {
        default: { client }
      }
    }
  }
}


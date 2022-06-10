"use strict"

import express from "express"

const PORT = 8080
const HOST = "0.0.0.0"

const app = express()

app.get("/", (req, res) => {
  res.send("Hello, World!\n")
})

app.get("/api", (req, res) => {
  res.type("json")
  res.send(JSON.stringify({
    hello: "world"
  }))
})

app.listen(PORT, HOST)
console.log(`Running on http://${HOST}:${PORT}`)

"use strict";

var express = require("express");
var app = express();

app.set("port", process.env.PORT || 3000);

app.use(express.static(__dirname + "/dev"));

app.listen(app.get("port"), () => console.log("Ascolto su porta " + app.get("port")));



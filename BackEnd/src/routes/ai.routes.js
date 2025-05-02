const express = require('express')
const router = express.Router();
const auth = require('../middleware/auth');
const aiController = require("../controllers/ai.controllers.js")

router.post("/get-review", auth, aiController.getResponse)

module.exports = router;
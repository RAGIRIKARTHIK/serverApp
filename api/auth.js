const app = require("../index");

module.exports.handler = async (req, res) => {
  try {
    await app(req, res);
  } catch (error) {
    console.error("Error handling request:", error);
    res.status(500).send("Internal Server Error");
  }
};

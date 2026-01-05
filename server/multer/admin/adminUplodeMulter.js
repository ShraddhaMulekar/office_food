const multer = require("multer");
const { adminStorageMulter } = require("./adminStorageMulter");
const {fileFilter} = require("../../routes/admin");

const adminUploadMulter = multer({
  storage: adminStorageMulter,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
})
module.exports = { adminUploadMulter };
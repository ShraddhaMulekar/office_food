const multer = require("multer");
const { deliveryStorageMulter } = require("./deliveryStorageMulter");
const {fileFilter} = require("../../routes/delivery");

const deliveryUploadMulter = multer({
  storage: deliveryStorageMulter,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
})
module.exports = { deliveryUploadMulter };
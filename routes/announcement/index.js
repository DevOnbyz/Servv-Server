const router = require('express').Router()
const validateRequest = require('../../middleware/validateRequest')
const controller = require('./controller')
const { addAnnouncement } = require('./validator')
const { v4: uuidv4 } = require('uuid')
const multer = require('multer')
const path = require('path')
const sendHTTPResponse = require('../../lib/sendHTTPResponse')

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/announcement/')
  },
  filename: (req, file, cb) => {
    console.log({file: JSON.stringify(file)})
    cb(null, file.fieldname + '-' + uuidv4() + '-' + file.originalname)
  }
})

const upload = multer({
  storage: storage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png/
    const mimetype = filetypes.test(file.mimetype)
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase())

    if (mimetype && extname) {
      return cb(null, true)
    }
    cb(new Error('Only .jpeg, .jpg, and .png files are allowed!'))
  }
}).single('imgSrc')

router.get('/', controller.getAnnouncemntsController)
router.post('/', (req, res, next) => {
  upload(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      return sendHTTPResponse.error(res, 'Error while uploading image', err.message)
    } else if (err) {
      return sendHTTPResponse.error(res, 'Error while uploading image', err.message)
    }
    controller.addAnnouncementController(req, res, next)
  })
})

module.exports = router
const multer = require('multer');
const User = require('../Models/userModel');
const catchAsync = require('../utils/catchAsync');
const ErrorHandler = require('../utils/ErrorHandler');
const factory = require('./handlerFacory');

const multerStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/img/users');
  },
  filename: (req, file, cb) => {
    ext = file.mimetype.split('/')[1];
    cb(null, `user-${req.user.id}-${Date.now()}.${ext}`);
  }
});

const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new ErrorHandler(400, 'Please provide a valid image extension 😊'));
  }
};

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter
});

const filterObj = (obj, ...key) => {
  const filteredObj = {};
  Object.keys(obj).forEach(el => {
    if (key.includes(el)) filteredObj[el] = obj[el];
  });
  return filteredObj;
};

exports.filterBody = (req, res, next) => {
  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new ErrorHandler(400, `This route is not for updating passwords 😊`)
    );
  }
  const dataToUpdate = filterObj(req.body, 'name', 'photo', 'email');
  if (req.file) dataToUpdate.photo = req.file.filename;
  req.body = dataToUpdate;
  next();
};

exports.getMe = (req, res, next) => {
  req.params.id = req.user.id;
  next();
};

exports.deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, { active: false });

  res.status(204).json({
    status: 'success 👌',
    data: null
  });
});

exports.updateUserPhoto = upload.single('photo');

exports.updateMe = factory.updateOne(User);

exports.getAllUsers = factory.getAll(User);

exports.getUser = factory.getOne(User);

exports.createUser = factory.createOne(User);

exports.updateUser = factory.updateOne(User);

exports.deleteUser = factory.deleteOne(User);

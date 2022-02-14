const User = require('../Models/userModel');
const catchAsync = require('../utils/catchAsync');
const jwt = require('jsonwebtoken');
const ErrorHandler = require('../utils/ErrorHandler');
const { promisify } = require('util');
const Email = require('../utils/email');
const crypto = require('crypto');

const createToken = id => {
  return jwt.sign({ id }, process.env.JWT_SECRET);
};

const cookieOptions = {
  expires: new Date(Date.now() + process.env.COOKIE_EXPIRE_AT),
  httpOnly: true
};

if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;

const sendJWTToken = (user, statusCode, res) => {
  const token = createToken(user._id);

  res.cookie('jwt', token, cookieOptions);

  res.status(statusCode).json({
    status: 'success 👌',
    token
  });
};

exports.signup = catchAsync(async (req, res, next) => {
  const newUser = await User.create(req.body);

  const url = `${req.protocol}://${req.get('host')}/me`;
  await new Email(newUser, url).sendWelcome();

  sendJWTToken(newUser, 201, res);
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(
      new ErrorHandler(400, 'Please provid the amail and the password 😊')
    );
  }

  const user = await User.findOne({ email }).select('+password');

  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new ErrorHandler(401, 'Incorrect email or password 😊'));
  }

  sendJWTToken(user, 200, res);
});

exports.protect = catchAsync(async (req, res, next) => {
  //1- Get the token and check if it exists  1-Bradley Hand, cursive   2-Gabriola
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }
  if (!token) {
    return next(new ErrorHandler(401, 'Please login to get access 😊'));
  }

  // Verify token
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  //Check if user is still exist
  const freshUser = await User.findById(decoded.id);
  if (!freshUser) {
    return next(
      new ErrorHandler(
        401,
        'The user belonging to this token is no longer exist 😊'
      )
    );
  }

  //Check if the password was changed
  if (freshUser.passwordIsChanged(decoded.iat)) {
    return next(new ErrorHandler(401, 'User recently changed his password 😊'));
  }

  //Grant access to protected route
  req.user = freshUser;
  next();
});

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new ErrorHandler(403, 'You have no permission to do this action 😊')
      );
    }
    next();
  };
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new ErrorHandler(404, 'There is no user with this email 😊'));
  }
  const token = user.createResetPasswordToken();
  await user.save({ validateBeforeSave: false });
  try {
    const resetURL = `${req.protocol}://${req.get(
      'host'
    )}/api/v1/users/resetPassword/${token}`;
    const text = `You are trayna reset you password.... Click here to reset your password (${resetURL})... If not you please check your account`;
    const mailOptions = {
      email: user.email,
      subject: `Reset Password (Valid for 10 minutes)`,
      text
    };
    // await sendEmail(mailOptions);
    res.status(200).json({
      status: 'success 👌',
      message: 'Check your email'
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetTokenExp = undefined;
    await user.save({ validateBeforeSave: false });
    return next(
      new ErrorHandler(
        500,
        `Couldn't send the email... Please try again later 😊`
      )
    );
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetTokenExp: { $gt: Date.now() }
  });
  if (!user) {
    return next(new ErrorHandler(400, 'Token is invalid or expired 😊'));
  }
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetTokenExp = undefined;
  await user.save();
  sendJWTToken(user, 200, res);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  // 1) Get user
  const user = await User.findOne({ email: req.body.email }).select(
    '+password'
  );
  if (
    !user ||
    !(await user.correctPassword(req.body.password, user.password))
  ) {
    return next(new ErrorHandler(401, 'Incorrect email or password 😊'));
  }
  // 2) Update password
  user.password = req.body.newPassword;
  user.passwordConfirm = req.body.newPasswordConfirm;
  user.save();
  // 3) Log user in
  sendJWTToken(user, 200, res);
});

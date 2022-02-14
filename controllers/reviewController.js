const Review = require('../Models/reviewModel');
const catchAsync = require('../utils/catchAsync');
const ErrorHandler = require('../utils/ErrorHandler');
const factory = require('./handlerFacory');

exports.getUserAndTour = (req, res, next) => {
  if (!req.body.tour) req.body.tour = req.params.tourid;
  if (!req.body.user) req.body.user = req.user._id;
  next();
};

exports.privateReview = catchAsync(async (req, res, next) => {
  const review = req.params.id;
  const doc = await Review.findById(review);
  if (!doc) {
    const error = new ErrorHandler(404, "Couldn't find this ID");
    return next(error);
  }
  if (req.user.id != doc.user.id) {
    const error = new ErrorHandler(400, 'This is private review');
    return next(error);
  }
  next();
});

exports.getAllReviews = factory.getAll(Review);

exports.getReview = factory.getOne(Review);

exports.createReview = factory.createOne(Review);

exports.updateReview = factory.updateOne(Review);

exports.deleteReview = factory.deleteOne(Review);

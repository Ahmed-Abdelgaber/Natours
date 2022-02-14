const express = require('express');
const reviewController = require('../controllers/reviewController');
const authControler = require('../controllers/authControler');

/*merge params to make a router get accsess to onther router params 
whicu it already now it but don't have access to it*/
const router = express.Router({ mergeParams: true });

router
  .route('/')
  .get(reviewController.getAllReviews)
  .post(
    authControler.protect,
    reviewController.getUserAndTour,
    reviewController.createReview
  );

router
  .route('/:id')
  .patch(
    authControler.protect,
    reviewController.privateReview,
    reviewController.updateReview
  )
  .delete(
    authControler.protect,
    reviewController.privateReview,
    reviewController.deleteReview
  )
  .get(reviewController.getReview);

module.exports = router;

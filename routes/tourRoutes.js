const express = require('express');
const tourController = require('./../controllers/tourController');
const authControler = require('./../controllers/authControler');
const reviewRouter = require('./reviewRoutes');

const router = express.Router();

//If the route is like /:tourId/reviews redirect it to review router
router.use('/:tourid/reviews', reviewRouter);

router
  .route('/')
  .get(tourController.getAllTours)
  .post(
    authControler.protect,
    authControler.restrictTo('admin', 'lead-guide'),
    tourController.createTour
  );

router
  .route('/top-5-cheap')
  .get(tourController.getTop5Cheap, tourController.getAllTours);
router.route('/tours-stats').get(tourController.getToursStats);
router
  .route('/tours-plan/:year')
  .get(
    authControler.protect,
    authControler.restrictTo('admin', 'lead-guide', 'guide'),
    tourController.getMonthlyPlan
  );
router
  .route('/tours-within/:distance/center/:coordinates/unit/:unit')
  .get(tourController.getToursWithIn);
router
  .route('/distances/:coordinates/unit/:unit')
  .get(tourController.getToursDistances);
router
  .route('/:id')
  .get(tourController.getTour)
  .patch(
    authControler.protect,
    authControler.restrictTo('admin', 'lead-guide'),
    tourController.uploadTourImages,
    tourController.updateTourImages,
    tourController.updateTour
  )
  .delete(
    authControler.protect,
    authControler.restrictTo('admin', 'lead-guide'),
    tourController.deleteTour
  );

module.exports = router;

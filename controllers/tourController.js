const multer = require('multer');
const Tour = require('../Models/tourModel');
const catchAsync = require('../utils/catchAsync');
const ErrorHandler = require('../utils/ErrorHandler');
const factory = require('./handlerFacory');

let i = 0;
const multerStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/img/tours');
  },
  filename: (req, file, cb) => {
    if (file.fieldname === 'imageCover') {
      const coverExt = file.mimetype.split('/')[1];
      cb(null, `tour-cover-${req.params.id}-${Date.now()}.${coverExt}`);
    }
    if (file.fieldname === 'images') {
      const coverExt = file.mimetype.split('/')[1];
      i++;
      cb(null, `tour-image-${req.params.id}-${i}-${Date.now()}.${coverExt}`);
    }
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

exports.updateTourImages = (req, res, next) => {
  if (req.files.imageCover) {
    req.body.imageCover = req.files.imageCover[0].filename;
  }
  if (req.files.images) {
    req.body.images = [];
    req.files.images.forEach(el => {
      req.body.images.push(el.filename);
    });
  }
  next();
};

exports.uploadTourImages = upload.fields([
  { name: 'imageCover', maxCount: 1 },
  { name: 'images', maxCount: 3 }
]);
/*if there is just one field and we want to upload more than one file we simply use
upload.array('field-name')
upload.array('images',3)
*/

exports.createTour = factory.createOne(Tour);

exports.getTour = factory.getOne(Tour, { path: 'reviews' });

exports.updateTour = factory.updateOne(Tour);

exports.deleteTour = factory.deleteOne(Tour);

exports.getAllTours = factory.getAll(Tour);

exports.getTop5Cheap = (req, res, next) => {
  req.query.limit = '5';
  req.query.sort = 'price,ratingsAverage';
  next();
};

exports.getToursStats = catchAsync(async (req, res, next) => {
  let groupBy = '_id';
  if (req.query.groupBy) {
    groupBy = `$${req.query.groupBy}`;
  }
  const stats = await Tour.aggregate([
    {
      $group: {
        _id: groupBy,
        numTours: { $sum: 1 },
        numRatings: { $sum: '$ratingsQuantity' },
        avgRating: { $avg: '$ratingsAverage' },
        avgPrice: { $avg: '$price' },
        minRating: { $min: '$ratingsAverage' },
        maxRating: { $max: '$ratingsAverage' },
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' }
      }
    }
  ]);
  res.status(201).json({
    status: 'success 👌',
    results: stats.length,
    data: {
      stats
    }
  });
});

exports.getMonthlyPlan = catchAsync(async (req, res, next) => {
  const year = req.params.year;
  const plan = await Tour.aggregate([
    {
      $unwind: '$startDates'
    },
    {
      $match: {
        startDates: {
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-31`)
        }
      }
    },
    {
      $group: {
        _id: { $month: '$startDates' },
        toursNumber: { $sum: 1 },
        tours: { $push: '$name' }
      }
    },
    {
      $addFields: { month: '$_id' }
    },
    {
      $sort: { toursNumber: -1 }
    },
    {
      $project: { _id: 0 }
    }
  ]);
  res.status(201).json({
    status: 'success 👌',
    results: plan.length,
    data: {
      plan
    }
  });
});
///tours-within/:distance/center/:coordinates/unit/:unit
exports.getToursWithIn = catchAsync(async (req, res, next) => {
  const { distance, coordinates, unit } = req.params;
  const [lat, lng] = coordinates.split(',');
  if (unit != 'mil' && unit != 'km') {
    return next(new ErrorHandler(400, 'Please provide a valid unit'));
  }
  const coefficient = unit === 'mil' ? 3963.2 : 6378.1;
  const radius = distance / coefficient;
  if (!lat || !lng) {
    return next(new ErrorHandler(400, 'Please provide a valid coordinates'));
  }
  const tours = await Tour.find({
    startLocation: { $geoWithin: { $centerSphere: [[lng, lat], radius] } }
  });

  res.status(200).json({
    status: 'success 👌',
    results: tours.length,
    data: {
      tours
    }
  });
});

exports.getToursDistances = catchAsync(async (req, res, next) => {
  const { distance, coordinates, unit } = req.params;
  const [lat, lng] = coordinates.split(',');
  if (unit != 'mil' && unit != 'km') {
    return next(new ErrorHandler(400, 'Please provide a valid unit'));
  }
  const coefficient = unit === 'mil' ? 0.000621371192 : 0.001;
  if (!lat || !lng) {
    return next(new ErrorHandler(400, 'Please provide a valid coordinates'));
  }
  const distances = await Tour.aggregate([
    {
      $geoNear: {
        near: {
          type: 'point',
          coordinates: [lng * 1, lat * 1]
        },
        distanceField: 'distance',
        distanceMultiplier: coefficient
      }
    },
    {
      $project: {
        name: 1,
        distance: 1
      }
    }
  ]);

  res.status(200).json({
    status: 'success 👌',
    data: {
      distances
    }
  });
});
// const fs = require('fs');

// const tours = JSON.parse(
//   fs.readFileSync(`${__dirname}/../dev-data/data/tours-simple.json`)
// );

// exports.checkID = (req, res, next, val) => {
//   console.log(`Tour id is: ${val}`);

//   if (req.params.id * 1 > tours.length) {
//     return res.status(404).json({
//       status: 'fail',
//       message: 'Invalid ID'
//     });
//   }
//   next();
// };

// exports.checkBody = (req, res, next) => {
//   if (!req.body.name || !req.body.price) {
//     return res.status(400).json({
//       status: 'fail',
//       message: 'Missing name or price'
//     });
//   }
//   next();
// };

// exports.getAllTours = (req, res) => {
//   console.log(req.requestTime);

//   res.status(200).json({
//     status: 'success',
//     requestedAt: req.requestTime,
//     results: tours.length,
//     data: {
//       tours
//     }
//   });
// };

// exports.getTour = (req, res) => {
//   console.log(req.params);
//   const id = req.params.id * 1;

//   const tour = tours.find(el => el.id === id);

//   res.status(200).json({
//     status: 'success',
//     data: {
//       tour
//     }
//   });
// };

// exports.createTour = (req, res) => {
//   // console.log(req.body);

//   const newId = tours[tours.length - 1].id + 1;
//   const newTour = Object.assign({ id: newId }, req.body);

//   tours.push(newTour);

//   fs.writeFile(
//     `${__dirname}/dev-data/data/tours-simple.json`,
//     JSON.stringify(tours),
//     err => {
//       res.status(201).json({
//         status: 'success',
//         data: {
//           tour: newTour
//         }
//       });
//     }
//   );
// };

// exports.updateTour = (req, res) => {
//   res.status(200).json({
//     status: 'success',
//     data: {
//       tour: '<Updated tour here...>'
//     }
//   });
// };

// exports.deleteTour = (req, res) => {
//   res.status(204).json({
//     status: 'success',
//     data: null
//   });
// };

const catchAsync = require('../utils/catchAsync');
const ErrorHandler = require('../utils/ErrorHandler');
const APIFeatuers = require('../utils/APIFeatures');

exports.deleteOne = Model =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndDelete(req.params.id);
    if (!doc) {
      const error = new ErrorHandler(404, "Couldn't find this ID");
      return next(error);
    }
    res.status(204).json({
      status: 'success 👌',
      data: null
    });
  });

exports.updateOne = Model =>
  catchAsync(async (req, res, next) => {
    let id = req.params.id;
    if (!id) id = req.user.id;
    const doc = await Model.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true
    });
    if (!doc) {
      const error = new ErrorHandler(404, "Couldn't find this ID");
      return next(error);
    }
    res.status(201).json({
      status: 'success 👌',
      data: {
        doc
      }
    });
  });

exports.createOne = Model =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.create(req.body);
    res.status(201).json({
      status: 'success 👌',
      data: {
        doc
      }
    });
  });

exports.getOne = (Model, populate) =>
  catchAsync(async (req, res, next) => {
    let query = Model.findById(req.params.id);
    if (populate) query = query.populate(populate);
    const doc = await query;
    if (!doc) {
      const error = new ErrorHandler(404, "Couldn't find this ID");
      return next(error);
    }
    res.status(201).json({
      status: 'success 👌',
      data: {
        doc
      }
    });
  });

exports.getAll = Model =>
  catchAsync(async (req, res, next) => {
    let tour;
    if (req.params.tourid) tour = { tour: req.params.tourid };
    const revisedAPI = new APIFeatuers(Model.find(tour), req.query)
      .filter()
      .sort()
      .limitFields()
      .paginate();
    const doc = await revisedAPI.myAPI;
    res.status(200).json({
      status: 'success 👌',
      results: doc.length,
      data: {
        doc
      }
    });
  });

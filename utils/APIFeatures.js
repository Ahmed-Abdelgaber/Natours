class APIFeatuers {
  constructor(myAPI, query) {
    this.myAPI = myAPI;
    this.query = query;
  }
  filter() {
    /*
    (This trick was for deleting unwanted filters from the query without losing them
      but now with the new version we don't need it any more)
    const queryObj = { ...req.query };
    const unwantedFields = ['sort', 'page', 'limit', 'fields'];
    unwantedFields.forEach(el => delete queryObj[el]);
    const tours = await Tour.find(queryObj);*/
    let queryStr = JSON.stringify(this.query);
    queryStr = queryStr
      .toLowerCase()
      .replace(/\b(gte|gt|lte|lt)\b/g, match => `$${match}`);
    this.myAPI = this.myAPI.find(JSON.parse(queryStr));
    return this;
  }
  sort() {
    if (this.query.sort) {
      const sortBy = this.query.sort.split(',').join(' ');
      this.myAPI = this.myAPI.sort(sortBy);
    } else {
      this.myAPI = this.myAPI.sort('price');
    }
    return this;
  }
  limitFields() {
    if (this.query.fields) {
      const select = this.query.fields.split(',').join(' ');
      this.myAPI = this.myAPI.select(select);
    } else {
      this.myAPI = this.myAPI.select('-__v');
    }
    return this;
  }
  paginate() {
    const page = this.query.page * 1 || 1;
    const limit = this.query.limit * 1 || 100;
    const skip = (page - 1) * limit;
    this.myAPI = this.myAPI.skip(skip).limit(limit);
    return this;
  }
}
module.exports = APIFeatuers;

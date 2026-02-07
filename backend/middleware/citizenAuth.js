module.exports = (req, res, next) => {
  if (!req.session || !req.session.citizen) {
    return res.redirect("/login");
  }

  next();
};

/*
 * GET /
 */

exports.index = function(req, res){
  res.render('index', { title: 'TicTacNode by John Wyles' })
};

var router = require('express').Router();
var Composition = require('../../db/models/composition');

router.use('/tracks', require('./tracks');
})

router.get('/', function(req, res, next) {
  Composition.find();
  .then(function(compositions) {
    res.json(compositions);
  })
  .catch(null, next);
});

router.post('/', function(req, res, next) {
  var comp = new Composition(req.body);
  comp.creator = req.user;
  comp.save()
  .then(function(comp) {
    res.status(201).json(comp);
  })
});

router.param('compositionId', function(req, res, next) {
  Composition.findById(req.params.compositionId)
  .then(function(composition) {
    if (composition) {
      req.composition = composition;
      next();
    } else {
      next(new Error('failed to find composition'));
    }
  })
  .then(null, next)
})

router.get('/compositionId', function(req, res, next) {
  res.json(req.composition);
});

router.put('/compositionId', functino(req, res, next) {
  req.composition.set(req.body);
  req.composition.save()
  .then(function(composition){
    res.status(201).json(composition);
  })
});

router.delete('/compositionId', function(req, res, next) {
  req.composition.remove()
  .then(function(){
    res.status(204).send();
  })
});

module.exports = router;
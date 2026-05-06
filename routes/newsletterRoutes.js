const express = require('express');
const router = express.Router();
const newsletterController = require('../controllers/newsletterController');

router.post('/subscribe', newsletterController.subscribe);
router.get('/', newsletterController.getAllSubscribers);
router.delete('/:id', newsletterController.deleteSubscriber);

module.exports = router;

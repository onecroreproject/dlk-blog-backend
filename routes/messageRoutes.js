const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');

router.post('/', messageController.createMessage);
router.get('/', messageController.getMessages);
router.delete('/:id', messageController.deleteMessage);
router.patch('/:id/status', messageController.updateMessageStatus);

module.exports = router;

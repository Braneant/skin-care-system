'use strict';

/**
 * 路由聚合：挂载 /api/wx 与 /api/admin
 */
const express = require('express');
const wxRoutes = require('./wxRoutes');
const adminRoutes = require('./adminRoutes');

const router = express.Router();

router.use('/wx', wxRoutes);
router.use('/admin', adminRoutes);

module.exports = router;

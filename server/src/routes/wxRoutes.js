'use strict';

/**
 * 小程序端路由 /api/wx/*
 * 除登录外全部需 authWx（Wx-Authorization）
 */
const express = require('express');
const { authWx } = require('../middlewares/authWx');
const { uploadSingle } = require('../middlewares/upload');

const authController = require('../controllers/wx/authController');
const userController = require('../controllers/wx/userController');
const skinProfileController = require('../controllers/wx/skinProfileController');
const detectController = require('../controllers/wx/detectController');
const planController = require('../controllers/wx/planController');
const checkinController = require('../controllers/wx/checkinController');
const contentController = require('../controllers/wx/contentController');
const consultController = require('../controllers/wx/consultController');

const router = express.Router();

// 公开：登录
router.post('/auth/login', authController.login);

// 以下全部需要小程序鉴权
router.use(authWx);

// 用户
router.get('/users/me', userController.getMe);
router.put('/users/me', userController.updateMe);

// 肌肤档案
router.post('/skin-profile/survey', skinProfileController.submitSurvey);
router.get('/skin-profile', skinProfileController.getProfile);
router.put('/skin-profile', skinProfileController.updateProfile);

// 检测
router.post('/detect/upload', uploadSingle('file'), detectController.upload);
router.post('/detect/analyze', detectController.analyze);
router.get('/detect', detectController.list);
router.get('/detect/:id', detectController.getDetail);

// 趋势
router.get('/trend', detectController.getTrend);

// 方案
router.get('/plan', planController.getPlan);

// 打卡
router.get('/checkin/today', checkinController.getToday);
router.post('/checkin', checkinController.submit);

// 内容
router.get('/articles', contentController.listArticles);
router.get('/articles/:id', contentController.getArticle);
router.post('/favorites', contentController.toggleFavorite);
router.get('/favorites', contentController.listFavorites);
router.get('/notices', contentController.listNotices);
router.get('/notices/:id', contentController.getNotice);
router.post('/feedback', contentController.submitFeedback);
router.get('/advice', contentController.getMyAdvice);

// 咨询
router.post('/consultations', consultController.create);
router.get('/consultations', consultController.listMy);

module.exports = router;

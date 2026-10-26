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
const badgeController = require('../controllers/wx/badgeController');
const homeController = require('../controllers/wx/homeController');
const ingredientController = require('../controllers/wx/ingredientController');
const productController = require('../controllers/wx/productController');
const myProductController = require('../controllers/wx/myProductController');
const productUsageController = require('../controllers/wx/productUsageController');
const usageLogController = require('../controllers/wx/usageLogController');
const envController = require('../controllers/wx/envController');
const reminderController = require('../controllers/wx/reminderController');
const photoDiaryController = require('../controllers/wx/photoDiaryController');
const followupController = require('../controllers/wx/followupController');
const reportController = require('../controllers/wx/reportController');

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
router.get('/plan/steps', planController.getSteps);
router.put('/plan/steps/:period/:stepKey/product', planController.bindProduct);

// 成分库
router.get('/ingredients', ingredientController.list);
router.get('/ingredients/:id', ingredientController.detail);

// 产品浏览
router.get('/products', productController.list);
router.get('/products/:id', productController.detail);

// 我的产品柜
router.get('/my-products', myProductController.list);
router.post('/my-products', myProductController.add);
router.delete('/my-products/:id', myProductController.remove);

// 开封有效期
router.get('/product-usages/expiring', productUsageController.expiring);
router.get('/product-usages', productUsageController.list);
router.post('/product-usages', productUsageController.set);

// 使用记录
router.get('/usage-logs', usageLogController.list);
router.post('/usage-logs', usageLogController.create);

// 打卡
router.get('/checkin/today', checkinController.getToday);
router.get('/checkin/stats', checkinController.stats);
router.get('/checkin/calendar', checkinController.calendar);
router.post('/checkin', checkinController.submit);

// 首页聚合
router.get('/home/summary', homeController.summary);

// 徽章
router.get('/badges', badgeController.list);

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

// 环境/UV/季节/复测
router.get('/env/uv', envController.uv);
router.get('/env/season-tip', envController.seasonTip);
router.get('/recheck', envController.recheck);

// 提醒
router.get('/reminders', reminderController.list);
router.post('/reminders', reminderController.upsert);
router.put('/reminders/:id', reminderController.update);
router.delete('/reminders/:id', reminderController.remove);

// 照片日记
router.get('/photo-diary', photoDiaryController.list);
router.post('/photo-diary', uploadSingle('file'), photoDiaryController.upload);
router.delete('/photo-diary/:id', photoDiaryController.remove);

// 报告时间轴
router.get('/reports', reportController.timeline);

// 轻随访
router.get('/followup', followupController.list);
router.post('/followup', followupController.send);

module.exports = router;

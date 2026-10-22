'use strict';

/**
 * 管理端/医生端路由 /api/admin/*
 * 除登录外全部需 authAdmin（Authorization）+ 按需 RBAC
 */
const express = require('express');
const { authAdmin } = require('../middlewares/authAdmin');
const requirePermission = require('../middlewares/requirePermission');

const authController = require('../controllers/admin/authController');
const userController = require('../controllers/admin/userController');
const rbacController = require('../controllers/admin/rbacController');
const dashboardController = require('../controllers/admin/dashboardController');
const contentController = require('../controllers/admin/contentController');
const skinDictController = require('../controllers/admin/skinDictController');
const feedbackController = require('../controllers/admin/feedbackController');
const detectRecordController = require('../controllers/admin/detectRecordController');
const patientController = require('../controllers/admin/patientController');
const adviceTemplateController = require('../controllers/admin/adviceTemplateController');
const consultController = require('../controllers/admin/consultController');

const router = express.Router();

// 公开
router.post('/auth/login', authController.login);
router.post('/auth/refresh', authController.refresh);

// 以下全部需要后台鉴权
router.use(authAdmin);

// 当前用户 + 菜单
router.get('/users/me', authController.me);

// 用户管理
router.get('/users', requirePermission('system:user:list'), userController.list);
router.post('/users', requirePermission('system:user:add'), userController.create);
router.put('/users/:id', requirePermission('system:user:edit'), userController.update);
router.patch('/users/:id/status', requirePermission('system:user:status'), userController.updateStatus);

// RBAC
router.get('/roles', requirePermission('system:role:list'), rbacController.listRoles);
router.get('/roles/:id', requirePermission('system:role:list'), rbacController.getRole);
router.post('/roles', requirePermission('system:role:add'), rbacController.createRole);
router.put('/roles/:id', requirePermission('system:role:edit'), rbacController.updateRole);
router.delete('/roles/:id', requirePermission('system:role:delete'), rbacController.deleteRole);
router.get('/permissions', requirePermission('system:role:list'), rbacController.listPermissions);

// 看板
router.get('/dashboard/summary', requirePermission('dashboard:view'), dashboardController.summary);

// 内容运营
router.get('/articles', requirePermission('content:article:list'), contentController.listArticles);
router.post('/articles', requirePermission('content:article:add'), contentController.createArticle);
router.put('/articles/:id', requirePermission('content:article:edit'), contentController.updateArticle);
router.delete('/articles/:id', requirePermission('content:article:delete'), contentController.deleteArticle);

router.get('/products', requirePermission('content:product:list'), contentController.listProducts);
router.post('/products', requirePermission('content:product:add'), contentController.createProduct);
router.put('/products/:id', requirePermission('content:product:edit'), contentController.updateProduct);
router.delete('/products/:id', requirePermission('content:product:delete'), contentController.deleteProduct);

router.get('/notices', requirePermission('content:notice:list'), contentController.listNotices);
router.post('/notices', requirePermission('content:notice:add'), contentController.createNotice);
router.put('/notices/:id', requirePermission('content:notice:edit'), contentController.updateNotice);
router.delete('/notices/:id', requirePermission('content:notice:delete'), contentController.deleteNotice);

// 肌肤字典
router.get('/skin-dict', requirePermission('skin:dict:list'), skinDictController.list);
router.post('/skin-dict', requirePermission('skin:dict:add'), skinDictController.create);
router.put('/skin-dict/:id', requirePermission('skin:dict:edit'), skinDictController.update);
router.delete('/skin-dict/:id', requirePermission('skin:dict:delete'), skinDictController.remove);

// 反馈
router.get('/feedback', requirePermission('feedback:list'), feedbackController.list);
router.post('/feedback/:id/reply', requirePermission('feedback:reply'), feedbackController.reply);

// 检测记录
router.get('/detect-records', requirePermission('detect:record:list'), detectRecordController.list);

// 医生工作台
router.get('/patients', requirePermission('doctor:patient:view'), patientController.listPatients);
router.get('/patients/:id', requirePermission('doctor:patient:view'), patientController.getPatient);
router.get('/patients/:id/trend', requirePermission('doctor:patient:view'), patientController.getPatientTrend);
router.post('/patients/:id/advice', requirePermission('doctor:advice:write'), patientController.writeAdvice);

// 建议模板
router.get('/advice-templates', requirePermission('doctor:advice:write'), adviceTemplateController.list);
router.post('/advice-templates', requirePermission('doctor:advice:write'), adviceTemplateController.create);
router.put('/advice-templates/:id', requirePermission('doctor:advice:write'), adviceTemplateController.update);
router.delete('/advice-templates/:id', requirePermission('doctor:advice:write'), adviceTemplateController.remove);

// 咨询预约
router.get('/consultations', requirePermission('doctor:consult:handle'), consultController.list);
router.patch('/consultations/:id', requirePermission('doctor:consult:handle'), consultController.patch);

module.exports = router;

import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { tenantMiddleware } from '../middleware/tenant.middleware';
import { requirePermission } from '../middleware/rbac.middleware';
import { imageUpload, uploadToS3Middleware } from '../middleware/upload.middleware';
import * as blogController from '../controllers/blog.controller';

const router = Router();

// Apply authentication and tenant middleware to all routes
router.use(authenticate);
router.use(tenantMiddleware);

// Blog post routes
router.get('/posts', requirePermission('blog', 'read'), blogController.getBlogs);
router.get('/posts/:id', requirePermission('blog', 'read'), blogController.getBlog);
router.post('/posts', requirePermission('blog', 'create'), imageUpload.single('featuredImage'), uploadToS3Middleware('blog'), blogController.createBlog);
router.put('/posts/:id', requirePermission('blog', 'update'), imageUpload.single('featuredImage'), uploadToS3Middleware('blog'), blogController.updateBlog);
router.delete('/posts/:id', requirePermission('blog', 'delete'), blogController.deleteBlog);

// Blog revision routes (US-163)
router.get('/posts/:id/revisions', requirePermission('blog', 'read'), blogController.getBlogRevisions);
router.post('/posts/:id/revisions/:revisionId/restore', requirePermission('blog', 'update'), blogController.restoreBlogRevision);

// Blog category routes
router.get('/categories', requirePermission('blog', 'read'), blogController.getBlogCategories);
router.post('/categories', requirePermission('blog', 'create'), blogController.createBlogCategory);
router.put('/categories/:id', requirePermission('blog', 'update'), blogController.updateBlogCategory);
router.delete('/categories/:id', requirePermission('blog', 'delete'), blogController.deleteBlogCategory);

// Blog tag routes
router.get('/tags', requirePermission('blog', 'read'), blogController.getBlogTags);
router.post('/tags', requirePermission('blog', 'create'), blogController.createBlogTag);
router.put('/tags/:id', requirePermission('blog', 'update'), blogController.updateBlogTag);
router.delete('/tags/:id', requirePermission('blog', 'delete'), blogController.deleteBlogTag);

export default router;

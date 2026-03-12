import { Response } from 'express';
import { prisma } from '../services/db.service';
import { AuthenticatedRequest } from '../types';
import { ApiResponse } from '../types';

/**
 * Blog Response Interface
 */
interface BlogResponse {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string | null;
  featuredImage: string | null;
  featuredImageAlt: string | null;
  author: string | null;
  authorId: string | null;
  authorStaff: { id: string; firstName: string; lastName: string } | null;
  status: string;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  category: {
    id: string;
    name: string;
  };
  tags: { id: string; name: string; slug: string }[];
}

/**
 * Blog List Response
 */
interface BlogListResponse {
  blogs: BlogResponse[];
  total: number;
}

/**
 * GET /api/v1/blog/posts
 * List all blogs for the tenant with optional filters
 */
export const getBlogs = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const tenantId = req.tenantId;

    if (!tenantId) {
      res.status(403).json({
        success: false,
        error: {
          code: 'TENANT_REQUIRED',
          message: 'Tenant context is required',
        },
      });
      return;
    }

    const { status, search, sort, authorId, tagId } = req.query;

    // Build filter
    const where: any = {
      businessOwnerId: tenantId,
    };

    if (status && typeof status === 'string') {
      where.status = status;
    }

    if (authorId && typeof authorId === 'string') {
      where.authorId = authorId;
    }

    if (tagId && typeof tagId === 'string') {
      where.tags = { some: { id: tagId } };
    }

    if (search && typeof search === 'string' && search.trim()) {
      where.OR = [
        { title: { contains: search.trim(), mode: 'insensitive' } },
        { excerpt: { contains: search.trim(), mode: 'insensitive' } },
        { content: { contains: search.trim(), mode: 'insensitive' } },
      ];
    }

    // Build sort order
    let orderBy: any = { createdAt: 'desc' };
    if (sort === 'oldest') {
      orderBy = { createdAt: 'asc' };
    }

    const blogs = await prisma.blog.findMany({
      where,
      orderBy,
      include: {
        category: {
          select: {
            id: true,
            name: true,
          },
        },
        authorStaff: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        tags: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    const blogResponses: BlogResponse[] = blogs.map((blog) => ({
      id: blog.id,
      title: blog.title,
      slug: blog.slug,
      content: blog.content,
      excerpt: blog.excerpt,
      featuredImage: blog.featuredImage,
      featuredImageAlt: blog.featuredImageAlt,
      author: blog.author,
      authorId: blog.authorId,
      authorStaff: blog.authorStaff,
      status: blog.status,
      publishedAt: blog.publishedAt,
      createdAt: blog.createdAt,
      updatedAt: blog.updatedAt,
      category: {
        id: blog.category.id,
        name: blog.category.name,
      },
      tags: blog.tags,
    }));

    const response: ApiResponse<BlogListResponse> = {
      success: true,
      data: {
        blogs: blogResponses,
        total: blogResponses.length,
      },
      message: 'Blogs retrieved successfully',
    };

    res.json(response);
  } catch (error) {
    console.error('Error listing blogs:', error);
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to retrieve blogs',
      },
    };
    res.status(500).json(response);
  }
};

/**
 * GET /api/v1/blog/posts/:id
 * Get a single blog by ID
 */
export const getBlog = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const tenantId = req.tenantId;
    const { id } = req.params;

    if (!tenantId) {
      res.status(403).json({
        success: false,
        error: {
          code: 'TENANT_REQUIRED',
          message: 'Tenant context is required',
        },
      });
      return;
    }

    const blog = await prisma.blog.findFirst({
      where: {
        id,
        businessOwnerId: tenantId,
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
          },
        },
        authorStaff: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        tags: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    if (!blog) {
      res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Blog not found',
        },
      });
      return;
    }

    const blogResponse: BlogResponse = {
      id: blog.id,
      title: blog.title,
      slug: blog.slug,
      content: blog.content,
      excerpt: blog.excerpt,
      featuredImage: blog.featuredImage,
      featuredImageAlt: blog.featuredImageAlt,
      author: blog.author,
      authorId: blog.authorId,
      authorStaff: blog.authorStaff,
      status: blog.status,
      publishedAt: blog.publishedAt,
      createdAt: blog.createdAt,
      updatedAt: blog.updatedAt,
      category: {
        id: blog.category.id,
        name: blog.category.name,
      },
      tags: blog.tags,
    };

    const response: ApiResponse<{ blog: BlogResponse }> = {
      success: true,
      data: { blog: blogResponse },
      message: 'Blog retrieved successfully',
    };

    res.json(response);
  } catch (error) {
    console.error('Error getting blog:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to retrieve blog',
      },
    });
  }
};

/**
 * POST /api/v1/blog/posts
 * Create a new blog post
 */
export const createBlog = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const tenantId = req.tenantId;

    if (!tenantId) {
      res.status(403).json({
        success: false,
        error: {
          code: 'TENANT_REQUIRED',
          message: 'Tenant context is required',
        },
      });
      return;
    }

    const { title, categoryId, content, excerpt, featuredImage, featuredImageAlt, author, authorId, tagIds, status } = req.body;

    // Handle uploaded image file (from multipart/form-data)
    const uploadedFile = (req as any).uploadedFile;
    const imageUrl = uploadedFile?.url || featuredImage || null;

    // Validate required fields
    if (!title || typeof title !== 'string' || title.trim() === '') {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Title is required and must be a non-empty string',
        },
      });
      return;
    }

    if (!categoryId || typeof categoryId !== 'string') {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Category ID is required',
        },
      });
      return;
    }

    if (!content || typeof content !== 'string' || content.trim() === '') {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Content is required and must be a non-empty string',
        },
      });
      return;
    }

    // Verify category belongs to tenant
    const category = await prisma.blogCategory.findFirst({
      where: {
        id: categoryId,
        businessOwnerId: tenantId,
      },
    });

    if (!category) {
      res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Blog category not found',
        },
      });
      return;
    }

    // Validate author belongs to tenant when provided
    if (authorId) {
      const authorStaff = await prisma.staff.findFirst({
        where: {
          id: authorId,
          businessOwnerId: tenantId,
        },
        select: { id: true },
      });
      if (!authorStaff) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Selected author is invalid for this tenant',
          },
        });
        return;
      }
    }

    // Validate tag IDs belong to tenant when provided
    if (Array.isArray(tagIds) && tagIds.length > 0) {
      const validTags = await prisma.blogTag.findMany({
        where: {
          id: { in: tagIds },
          businessOwnerId: tenantId,
        },
        select: { id: true },
      });
      if (validTags.length !== tagIds.length) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'One or more selected tags are invalid for this tenant',
          },
        });
        return;
      }
    }

    // Generate slug from title
    const baseSlug = title.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    let slug = baseSlug;
    let counter = 1;

    // Ensure unique slug per tenant
    while (await prisma.blog.findFirst({ where: { slug, businessOwnerId: tenantId } })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    // Determine status and publishedAt
    const blogStatus = status === 'Published' ? 'Published' : 'Draft';
    const publishedAt = blogStatus === 'Published' ? new Date() : null;

    const blog = await prisma.blog.create({
      data: {
        businessOwnerId: tenantId,
        categoryId,
        title: title.trim(),
        slug,
        content: content.trim(),
        excerpt: excerpt?.trim() || null,
        featuredImage: imageUrl,
        featuredImageAlt: featuredImageAlt?.trim() || null,
        author: author?.trim() || null,
        authorId: authorId || null,
        status: blogStatus,
        publishedAt,
        ...(Array.isArray(tagIds) && tagIds.length > 0
          ? { tags: { connect: tagIds.map((tid: string) => ({ id: tid })) } }
          : {}),
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
          },
        },
        authorStaff: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        tags: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    const blogResponse: BlogResponse = {
      id: blog.id,
      title: blog.title,
      slug: blog.slug,
      content: blog.content,
      excerpt: blog.excerpt,
      featuredImage: blog.featuredImage,
      featuredImageAlt: blog.featuredImageAlt,
      author: blog.author,
      authorId: blog.authorId,
      authorStaff: blog.authorStaff,
      status: blog.status,
      publishedAt: blog.publishedAt,
      createdAt: blog.createdAt,
      updatedAt: blog.updatedAt,
      category: {
        id: blog.category.id,
        name: blog.category.name,
      },
      tags: blog.tags,
    };

    const response: ApiResponse<{ blog: BlogResponse }> = {
      success: true,
      data: { blog: blogResponse },
      message: 'Blog created successfully',
    };

    res.status(201).json(response);
  } catch (error) {
    console.error('Error creating blog:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to create blog',
      },
    });
  }
};

/**
 * PUT /api/v1/blog/posts/:id
 * Update an existing blog post
 */
export const updateBlog = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const tenantId = req.tenantId;
    const { id } = req.params;

    if (!tenantId) {
      res.status(403).json({
        success: false,
        error: {
          code: 'TENANT_REQUIRED',
          message: 'Tenant context is required',
        },
      });
      return;
    }

    // Find existing blog
    const existingBlog = await prisma.blog.findFirst({
      where: {
        id,
        businessOwnerId: tenantId,
      },
    });

    if (!existingBlog) {
      res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Blog not found',
        },
      });
      return;
    }

    const { title, categoryId, content, excerpt, featuredImage, featuredImageAlt, author, authorId, tagIds, status } = req.body;

    const revisionAuthorId = req.user?.userType === 'Staff' ? req.user.id : null;
    const revisionAuthorName =
      req.user?.userType === 'Staff'
        ? undefined
        : req.user?.email || req.user?.userType || 'System';

    // Save revision of current state before updating (US-163)
    await prisma.blogRevision.create({
      data: {
        blogId: existingBlog.id,
        content: existingBlog.content,
        title: existingBlog.title,
        excerpt: existingBlog.excerpt,
        authorId: revisionAuthorId,
        authorName: revisionAuthorName,
      },
    });

    // Limit revisions to last 20 versions (US-163)
    const revisionCount = await prisma.blogRevision.count({ where: { blogId: existingBlog.id } });
    if (revisionCount > 20) {
      const oldRevisions = await prisma.blogRevision.findMany({
        where: { blogId: existingBlog.id },
        orderBy: { createdAt: 'asc' },
        take: revisionCount - 20,
        select: { id: true },
      });
      await prisma.blogRevision.deleteMany({
        where: { id: { in: oldRevisions.map(r => r.id) } },
      });
    }

    // Handle uploaded image file (from multipart/form-data)
    const uploadedFile = (req as any).uploadedFile;

    // Build update data
    const updateData: any = {};

    if (title !== undefined) {
      if (typeof title !== 'string' || title.trim() === '') {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Title must be a non-empty string',
          },
        });
        return;
      }
      updateData.title = title.trim();

      // Regenerate slug if title changed
      const baseSlug = title.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      let slug = baseSlug;
      let counter = 1;
      while (await prisma.blog.findFirst({ where: { slug, businessOwnerId: tenantId, id: { not: id } } })) {
        slug = `${baseSlug}-${counter}`;
        counter++;
      }
      updateData.slug = slug;
    }

    if (categoryId !== undefined) {
      // Verify category belongs to tenant
      const category = await prisma.blogCategory.findFirst({
        where: {
          id: categoryId,
          businessOwnerId: tenantId,
        },
      });

      if (!category) {
        res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Blog category not found',
          },
        });
        return;
      }
      updateData.categoryId = categoryId;
    }

    if (content !== undefined) {
      if (typeof content !== 'string' || content.trim() === '') {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Content must be a non-empty string',
          },
        });
        return;
      }
      updateData.content = content.trim();
    }

    if (excerpt !== undefined) {
      updateData.excerpt = excerpt?.trim() || null;
    }

    if (uploadedFile) {
      updateData.featuredImage = uploadedFile.url;
    } else if (featuredImage !== undefined) {
      updateData.featuredImage = featuredImage || null;
    }

    if (featuredImageAlt !== undefined) {
      updateData.featuredImageAlt = featuredImageAlt?.trim() || null;
    }

    if (author !== undefined) {
      updateData.author = author?.trim() || null;
    }

    if (authorId !== undefined) {
      if (authorId) {
        const authorStaff = await prisma.staff.findFirst({
          where: {
            id: authorId,
            businessOwnerId: tenantId,
          },
          select: { id: true },
        });
        if (!authorStaff) {
          res.status(400).json({
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Selected author is invalid for this tenant',
            },
          });
          return;
        }
      }
      updateData.authorId = authorId || null;
    }

    if (Array.isArray(tagIds)) {
      if (tagIds.length > 0) {
        const validTags = await prisma.blogTag.findMany({
          where: {
            id: { in: tagIds },
            businessOwnerId: tenantId,
          },
          select: { id: true },
        });
        if (validTags.length !== tagIds.length) {
          res.status(400).json({
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'One or more selected tags are invalid for this tenant',
            },
          });
          return;
        }
      }
      updateData.tags = { set: tagIds.map((tid: string) => ({ id: tid })) };
    }

    if (status !== undefined) {
      updateData.status = status === 'Published' ? 'Published' : 'Draft';
      // Set publishedAt when transitioning to Published
      if (status === 'Published' && existingBlog.status !== 'Published') {
        updateData.publishedAt = new Date();
      } else if (status !== 'Published') {
        updateData.publishedAt = null;
      }
    }

    const updatedBlog = await prisma.blog.update({
      where: { id },
      data: updateData,
      include: {
        category: {
          select: {
            id: true,
            name: true,
          },
        },
        authorStaff: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        tags: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    const blogResponse: BlogResponse = {
      id: updatedBlog.id,
      title: updatedBlog.title,
      slug: updatedBlog.slug,
      content: updatedBlog.content,
      excerpt: updatedBlog.excerpt,
      featuredImage: updatedBlog.featuredImage,
      featuredImageAlt: updatedBlog.featuredImageAlt,
      author: updatedBlog.author,
      authorId: updatedBlog.authorId,
      authorStaff: updatedBlog.authorStaff,
      status: updatedBlog.status,
      publishedAt: updatedBlog.publishedAt,
      createdAt: updatedBlog.createdAt,
      updatedAt: updatedBlog.updatedAt,
      category: {
        id: updatedBlog.category.id,
        name: updatedBlog.category.name,
      },
      tags: updatedBlog.tags,
    };

    const response: ApiResponse<{ blog: BlogResponse }> = {
      success: true,
      data: { blog: blogResponse },
      message: 'Blog updated successfully',
    };

    res.json(response);
  } catch (error) {
    console.error('Error updating blog:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to update blog',
      },
    });
  }
};

/**
 * DELETE /api/v1/blog/posts/:id
 * Delete a blog post
 */
export const deleteBlog = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const tenantId = req.tenantId;
    const { id } = req.params;

    if (!tenantId) {
      res.status(403).json({
        success: false,
        error: {
          code: 'TENANT_REQUIRED',
          message: 'Tenant context is required',
        },
      });
      return;
    }

    const existingBlog = await prisma.blog.findFirst({
      where: {
        id,
        businessOwnerId: tenantId,
      },
    });

    if (!existingBlog) {
      res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Blog not found',
        },
      });
      return;
    }

    await prisma.blog.delete({
      where: { id },
    });

    const response: ApiResponse = {
      success: true,
      message: 'Blog deleted successfully',
    };

    res.json(response);
  } catch (error) {
    console.error('Error deleting blog:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to delete blog',
      },
    });
  }
};

/**
 * GET /api/v1/blog/categories
 * List all blog categories for the tenant
 */
export const getBlogCategories = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const tenantId = req.tenantId;

    if (!tenantId) {
      res.status(403).json({
        success: false,
        error: {
          code: 'TENANT_REQUIRED',
          message: 'Tenant context is required',
        },
      });
      return;
    }

    const { status, search } = req.query;

    const where: any = {
      businessOwnerId: tenantId,
    };

    if (status && typeof status === 'string') {
      where.status = status;
    }

    if (search && typeof search === 'string' && search.trim()) {
      where.name = { contains: search.trim(), mode: 'insensitive' };
    }

    const categories = await prisma.blogCategory.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: {
            blogs: true,
          },
        },
      },
    });

    const categoryResponses = categories.map((cat) => ({
      id: cat.id,
      name: cat.name,
      slug: cat.slug,
      status: cat.status,
      createdAt: cat.createdAt,
      updatedAt: cat.updatedAt,
      blogsCount: cat._count.blogs,
    }));

    res.json({
      success: true,
      data: {
        categories: categoryResponses,
        total: categoryResponses.length,
      },
      message: 'Blog categories retrieved successfully',
    });
  } catch (error) {
    console.error('Error listing blog categories:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to retrieve blog categories',
      },
    });
  }
};

/**
 * POST /api/v1/blog/categories
 * Create a new blog category
 */
export const createBlogCategory = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const tenantId = req.tenantId;

    if (!tenantId) {
      res.status(403).json({
        success: false,
        error: {
          code: 'TENANT_REQUIRED',
          message: 'Tenant context is required',
        },
      });
      return;
    }

    const { name, status } = req.body;

    if (!name || typeof name !== 'string' || name.trim() === '') {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Name is required and must be a non-empty string',
        },
      });
      return;
    }

    // Generate slug
    const baseSlug = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    let slug = baseSlug;
    let counter = 1;

    while (await prisma.blogCategory.findFirst({ where: { slug, businessOwnerId: tenantId } })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    const category = await prisma.blogCategory.create({
      data: {
        businessOwnerId: tenantId,
        name: name.trim(),
        slug,
        status: status === 'inactive' ? 'inactive' : 'active',
      },
      include: {
        _count: {
          select: {
            blogs: true,
          },
        },
      },
    });

    res.status(201).json({
      success: true,
      data: {
        category: {
          id: category.id,
          name: category.name,
          slug: category.slug,
          status: category.status,
          createdAt: category.createdAt,
          updatedAt: category.updatedAt,
          blogsCount: category._count.blogs,
        },
      },
      message: 'Blog category created successfully',
    });
  } catch (error) {
    console.error('Error creating blog category:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to create blog category',
      },
    });
  }
};

/**
 * PUT /api/v1/blog/categories/:id
 * Update a blog category
 */
export const updateBlogCategory = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const tenantId = req.tenantId;
    const { id } = req.params;

    if (!tenantId) {
      res.status(403).json({
        success: false,
        error: {
          code: 'TENANT_REQUIRED',
          message: 'Tenant context is required',
        },
      });
      return;
    }

    const existing = await prisma.blogCategory.findFirst({
      where: { id, businessOwnerId: tenantId },
    });

    if (!existing) {
      res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Blog category not found',
        },
      });
      return;
    }

    const { name, status } = req.body;
    const updateData: any = {};

    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim() === '') {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Name must be a non-empty string',
          },
        });
        return;
      }
      updateData.name = name.trim();

      // Regenerate slug
      const baseSlug = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      let slug = baseSlug;
      let counter = 1;
      while (await prisma.blogCategory.findFirst({ where: { slug, businessOwnerId: tenantId, id: { not: id } } })) {
        slug = `${baseSlug}-${counter}`;
        counter++;
      }
      updateData.slug = slug;
    }

    if (status !== undefined) {
      updateData.status = status === 'inactive' ? 'inactive' : 'active';
    }

    const updatedCategory = await prisma.blogCategory.update({
      where: { id },
      data: updateData,
      include: {
        _count: {
          select: {
            blogs: true,
          },
        },
      },
    });

    res.json({
      success: true,
      data: {
        category: {
          id: updatedCategory.id,
          name: updatedCategory.name,
          slug: updatedCategory.slug,
          status: updatedCategory.status,
          createdAt: updatedCategory.createdAt,
          updatedAt: updatedCategory.updatedAt,
          blogsCount: updatedCategory._count.blogs,
        },
      },
      message: 'Blog category updated successfully',
    });
  } catch (error) {
    console.error('Error updating blog category:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to update blog category',
      },
    });
  }
};

/**
 * DELETE /api/v1/blog/categories/:id
 * Delete a blog category
 */
export const deleteBlogCategory = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const tenantId = req.tenantId;
    const { id } = req.params;

    if (!tenantId) {
      res.status(403).json({
        success: false,
        error: {
          code: 'TENANT_REQUIRED',
          message: 'Tenant context is required',
        },
      });
      return;
    }

    const existing = await prisma.blogCategory.findFirst({
      where: { id, businessOwnerId: tenantId },
    });

    if (!existing) {
      res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Blog category not found',
        },
      });
      return;
    }

    // Check if category has blogs
    const blogCount = await prisma.blog.count({
      where: { categoryId: id },
    });

    if (blogCount > 0) {
      res.status(400).json({
        success: false,
        error: {
          code: 'HAS_BLOGS',
          message: `Cannot delete category with ${blogCount} blog(s). Delete or reassign blogs first.`,
        },
      });
      return;
    }

    await prisma.blogCategory.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: 'Blog category deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting blog category:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to delete blog category',
      },
    });
  }
};

// ============================================
// Blog Tag CRUD Operations
// ============================================

/**
 * GET /api/v1/blog/tags
 * List all blog tags for the tenant
 */
export const getBlogTags = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const tenantId = req.tenantId;

    if (!tenantId) {
      res.status(403).json({
        success: false,
        error: { code: 'TENANT_REQUIRED', message: 'Tenant context is required' },
      });
      return;
    }

    const { status, search } = req.query;

    const where: any = { businessOwnerId: tenantId };

    if (status && typeof status === 'string') {
      where.status = status;
    }

    if (search && typeof search === 'string' && search.trim()) {
      where.name = { contains: search.trim(), mode: 'insensitive' };
    }

    const tags = await prisma.blogTag.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { blogs: true } },
      },
    });

    const tagResponses = tags.map((tag) => ({
      id: tag.id,
      name: tag.name,
      slug: tag.slug,
      status: tag.status,
      createdAt: tag.createdAt,
      updatedAt: tag.updatedAt,
      blogsCount: tag._count.blogs,
    }));

    res.json({
      success: true,
      data: { tags: tagResponses, total: tagResponses.length },
      message: 'Blog tags retrieved successfully',
    });
  } catch (error) {
    console.error('Error listing blog tags:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_SERVER_ERROR', message: 'Failed to retrieve blog tags' },
    });
  }
};

/**
 * POST /api/v1/blog/tags
 * Create a new blog tag
 */
export const createBlogTag = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const tenantId = req.tenantId;

    if (!tenantId) {
      res.status(403).json({
        success: false,
        error: { code: 'TENANT_REQUIRED', message: 'Tenant context is required' },
      });
      return;
    }

    const { name, status } = req.body;

    if (!name || typeof name !== 'string' || name.trim() === '') {
      res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Name is required and must be a non-empty string' },
      });
      return;
    }

    // Generate slug
    const baseSlug = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    let slug = baseSlug;
    let counter = 1;

    while (await prisma.blogTag.findFirst({ where: { slug, businessOwnerId: tenantId } })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    const tag = await prisma.blogTag.create({
      data: {
        businessOwnerId: tenantId,
        name: name.trim(),
        slug,
        status: status === 'inactive' ? 'inactive' : 'active',
      },
      include: {
        _count: { select: { blogs: true } },
      },
    });

    res.status(201).json({
      success: true,
      data: {
        tag: {
          id: tag.id,
          name: tag.name,
          slug: tag.slug,
          status: tag.status,
          createdAt: tag.createdAt,
          updatedAt: tag.updatedAt,
          blogsCount: tag._count.blogs,
        },
      },
      message: 'Blog tag created successfully',
    });
  } catch (error) {
    console.error('Error creating blog tag:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_SERVER_ERROR', message: 'Failed to create blog tag' },
    });
  }
};

/**
 * PUT /api/v1/blog/tags/:id
 * Update a blog tag
 */
export const updateBlogTag = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const tenantId = req.tenantId;
    const { id } = req.params;

    if (!tenantId) {
      res.status(403).json({
        success: false,
        error: { code: 'TENANT_REQUIRED', message: 'Tenant context is required' },
      });
      return;
    }

    const existing = await prisma.blogTag.findFirst({
      where: { id, businessOwnerId: tenantId },
    });

    if (!existing) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Blog tag not found' },
      });
      return;
    }

    const { name, status } = req.body;
    const updateData: any = {};

    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim() === '') {
        res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Name must be a non-empty string' },
        });
        return;
      }
      updateData.name = name.trim();

      const baseSlug = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      let slug = baseSlug;
      let counter = 1;
      while (await prisma.blogTag.findFirst({ where: { slug, businessOwnerId: tenantId, id: { not: id } } })) {
        slug = `${baseSlug}-${counter}`;
        counter++;
      }
      updateData.slug = slug;
    }

    if (status !== undefined) {
      updateData.status = status === 'inactive' ? 'inactive' : 'active';
    }

    const updatedTag = await prisma.blogTag.update({
      where: { id },
      data: updateData,
      include: {
        _count: { select: { blogs: true } },
      },
    });

    res.json({
      success: true,
      data: {
        tag: {
          id: updatedTag.id,
          name: updatedTag.name,
          slug: updatedTag.slug,
          status: updatedTag.status,
          createdAt: updatedTag.createdAt,
          updatedAt: updatedTag.updatedAt,
          blogsCount: updatedTag._count.blogs,
        },
      },
      message: 'Blog tag updated successfully',
    });
  } catch (error) {
    console.error('Error updating blog tag:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_SERVER_ERROR', message: 'Failed to update blog tag' },
    });
  }
};

/**
 * DELETE /api/v1/blog/tags/:id
 * Delete a blog tag
 */
export const deleteBlogTag = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const tenantId = req.tenantId;
    const { id } = req.params;

    if (!tenantId) {
      res.status(403).json({
        success: false,
        error: { code: 'TENANT_REQUIRED', message: 'Tenant context is required' },
      });
      return;
    }

    const existing = await prisma.blogTag.findFirst({
      where: { id, businessOwnerId: tenantId },
    });

    if (!existing) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Blog tag not found' },
      });
      return;
    }

    await prisma.blogTag.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: 'Blog tag deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting blog tag:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_SERVER_ERROR', message: 'Failed to delete blog tag' },
    });
  }
};

// ============================================
// Blog Revision Endpoints (US-163)
// ============================================

/**
 * GET /api/v1/blog/posts/:id/revisions
 * List revisions for a blog post (max 20, newest first)
 */
export const getBlogRevisions = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const tenantId = req.tenantId;
    const { id } = req.params;

    if (!tenantId) {
      res.status(403).json({
        success: false,
        error: { code: 'TENANT_REQUIRED', message: 'Tenant context is required' },
      });
      return;
    }

    // Verify blog belongs to tenant
    const blog = await prisma.blog.findFirst({
      where: { id, businessOwnerId: tenantId },
    });

    if (!blog) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Blog not found' },
      });
      return;
    }

    const revisions = await prisma.blogRevision.findMany({
      where: { blogId: id },
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: {
        authorStaff: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });

    res.json({
      success: true,
      data: {
        revisions: revisions.map(r => ({
          id: r.id,
          blogId: r.blogId,
          content: r.content,
          title: r.title,
          excerpt: r.excerpt,
          authorId: r.authorId,
          authorName: r.authorName || (r.authorStaff ? `${r.authorStaff.firstName} ${r.authorStaff.lastName}` : 'Unknown'),
          createdAt: r.createdAt,
        })),
      },
    });
  } catch (error) {
    console.error('Error fetching blog revisions:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_SERVER_ERROR', message: 'Failed to fetch blog revisions' },
    });
  }
};

/**
 * POST /api/v1/blog/posts/:id/revisions/:revisionId/restore
 * Restore a blog post to a previous revision
 */
export const restoreBlogRevision = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const tenantId = req.tenantId;
    const { id, revisionId } = req.params;

    if (!tenantId) {
      res.status(403).json({
        success: false,
        error: { code: 'TENANT_REQUIRED', message: 'Tenant context is required' },
      });
      return;
    }

    // Verify blog belongs to tenant
    const blog = await prisma.blog.findFirst({
      where: { id, businessOwnerId: tenantId },
    });

    if (!blog) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Blog not found' },
      });
      return;
    }

    // Find the revision
    const revision = await prisma.blogRevision.findFirst({
      where: { id: revisionId, blogId: id },
    });

    if (!revision) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Revision not found' },
      });
      return;
    }

    const revisionAuthorId = req.user?.userType === 'Staff' ? req.user.id : null;
    const revisionAuthorName =
      req.user?.userType === 'Staff'
        ? undefined
        : req.user?.email || req.user?.userType || 'System';

    // Save current state as a revision before restoring
    await prisma.blogRevision.create({
      data: {
        blogId: blog.id,
        content: blog.content,
        title: blog.title,
        excerpt: blog.excerpt,
        authorId: revisionAuthorId,
        authorName: revisionAuthorName,
      },
    });

    // Limit revisions to last 20
    const revisionCount = await prisma.blogRevision.count({ where: { blogId: blog.id } });
    if (revisionCount > 20) {
      const oldRevisions = await prisma.blogRevision.findMany({
        where: { blogId: blog.id },
        orderBy: { createdAt: 'asc' },
        take: revisionCount - 20,
        select: { id: true },
      });
      await prisma.blogRevision.deleteMany({
        where: { id: { in: oldRevisions.map(r => r.id) } },
      });
    }

    // Restore the blog to the revision content
    const updatedBlog = await prisma.blog.update({
      where: { id },
      data: {
        content: revision.content,
        title: revision.title,
        excerpt: revision.excerpt,
      },
      include: {
        category: { select: { id: true, name: true } },
        authorStaff: { select: { id: true, firstName: true, lastName: true } },
        tags: { select: { id: true, name: true, slug: true } },
      },
    });

    const blogResponse: BlogResponse = {
      id: updatedBlog.id,
      title: updatedBlog.title,
      slug: updatedBlog.slug,
      content: updatedBlog.content,
      excerpt: updatedBlog.excerpt,
      featuredImage: updatedBlog.featuredImage,
      featuredImageAlt: updatedBlog.featuredImageAlt,
      author: updatedBlog.author,
      authorId: updatedBlog.authorId,
      authorStaff: updatedBlog.authorStaff,
      status: updatedBlog.status,
      publishedAt: updatedBlog.publishedAt,
      createdAt: updatedBlog.createdAt,
      updatedAt: updatedBlog.updatedAt,
      category: { id: updatedBlog.category.id, name: updatedBlog.category.name },
      tags: updatedBlog.tags,
    };

    res.json({
      success: true,
      data: { blog: blogResponse },
      message: 'Blog restored to previous revision successfully',
    });
  } catch (error) {
    console.error('Error restoring blog revision:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_SERVER_ERROR', message: 'Failed to restore blog revision' },
    });
  }
};

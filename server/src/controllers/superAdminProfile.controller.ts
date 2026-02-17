import { Response } from 'express';
import { prisma } from '../services/db.service';
import { AuthenticatedRequest, ApiResponse } from '../types';

/**
 * PUT /api/v1/super-admin/profile
 * Update super admin profile (name, phone)
 */
export async function updateSuperAdminProfile(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    if (!req.user || req.user.userType !== 'SuperAdmin') {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Only super admins can update this profile',
        },
      };
      res.status(403).json(response);
      return;
    }

    const { name, phone } = req.body;

    // Validation
    if (name !== undefined && (!name || name.trim().length === 0)) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Name cannot be empty',
        },
      };
      res.status(400).json(response);
      return;
    }

    if (phone !== undefined && phone) {
      const phoneRegex = /^\+?[\d\s\-()]{7,15}$/;
      if (!phoneRegex.test(phone)) {
        const response: ApiResponse = {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid phone number format',
          },
        };
        res.status(400).json(response);
        return;
      }
    }

    // Build update data
    const updateData: Record<string, string> = {};
    if (name !== undefined) updateData.name = name.trim();
    if (phone !== undefined) updateData.phone = phone || null;

    // Handle avatar upload if file is present
    const uploadedFile = (req as any).uploadedFile;
    if (uploadedFile) {
      // Delete old avatar from S3 if exists
      const existingAdmin = await prisma.superAdmin.findUnique({
        where: { id: req.user.id },
        select: { avatar: true },
      });
      if (existingAdmin?.avatar) {
        try {
          const s3Service = await import('../services/s3.service');
          const oldKey = existingAdmin.avatar.split('.com/')[1];
          if (oldKey) {
            await s3Service.deleteFromS3(oldKey);
          }
        } catch (e) {
          console.error('Failed to delete old avatar:', e);
        }
      }
      (updateData as any).avatar = uploadedFile.url;
    }

    if (Object.keys(updateData).length === 0) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'No fields to update',
        },
      };
      res.status(400).json(response);
      return;
    }

    const superAdmin = await prisma.superAdmin.update({
      where: { id: req.user.id },
      data: updateData,
    });

    const response: ApiResponse = {
      success: true,
      data: {
        id: superAdmin.id,
        email: superAdmin.email,
        name: superAdmin.name,
        phone: superAdmin.phone,
        avatar: superAdmin.avatar,
        userType: 'SuperAdmin',
        createdAt: superAdmin.createdAt,
      },
      message: 'Profile updated successfully',
    };
    res.status(200).json(response);
  } catch (error) {
    console.error('Error updating super admin profile:', error);
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to update profile',
      },
    };
    res.status(500).json(response);
  }
}

/**
 * DELETE /api/v1/super-admin/profile/avatar
 * Remove super admin avatar
 */
export async function deleteSuperAdminAvatar(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    if (!req.user || req.user.userType !== 'SuperAdmin') {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Only super admins can update this profile',
        },
      };
      res.status(403).json(response);
      return;
    }

    const existingAdmin = await prisma.superAdmin.findUnique({
      where: { id: req.user.id },
      select: { avatar: true },
    });

    if (existingAdmin?.avatar) {
      try {
        const s3Service = await import('../services/s3.service');
        const oldKey = existingAdmin.avatar.split('.com/')[1];
        if (oldKey) {
          await s3Service.deleteFromS3(oldKey);
        }
      } catch (e) {
        console.error('Failed to delete avatar from S3:', e);
      }
    }

    await prisma.superAdmin.update({
      where: { id: req.user.id },
      data: { avatar: null },
    });

    const response: ApiResponse = {
      success: true,
      message: 'Avatar removed successfully',
    };
    res.status(200).json(response);
  } catch (error) {
    console.error('Error deleting super admin avatar:', error);
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to remove avatar',
      },
    };
    res.status(500).json(response);
  }
}

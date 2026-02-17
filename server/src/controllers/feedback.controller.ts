import { Response } from 'express';
import { AuthenticatedRequest } from '../types';
import { prisma } from '../services/db.service';
import { Prisma } from '@prisma/client';

// Define the question structure type
interface FeedbackQuestion {
  id: string;
  type: 'text' | 'rating' | 'multiple_choice' | 'checkbox';
  text: string;
  options?: string[];
  required: boolean;
}

/**
 * @route GET /api/v1/marketing/feedback-forms
 * @desc Get all feedback forms for the authenticated business owner
 * @access Private (BusinessOwner)
 */
export const getFeedbackForms = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const tenantId = req.tenantId;

    if (!tenantId) {
      res.status(403).json({
        success: false,
        error: {
          code: 'MISSING_TENANT_CONTEXT',
          message: 'Tenant context is required',
        },
      });
      return;
    }

    const feedbackForms = await prisma.feedbackForm.findMany({
      where: {
        businessOwnerId: tenantId,
      },
      include: {
        _count: {
          select: {
            feedbackResponses: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Transform response to include response count
    const formsWithCount = feedbackForms.map((form) => ({
      id: form.id,
      title: form.title,
      description: form.description,
      questions: form.questions,
      qrCode: form.qrCode,
      status: form.status,
      responseCount: form._count.feedbackResponses,
      createdAt: form.createdAt,
      updatedAt: form.updatedAt,
    }));

    res.status(200).json({
      success: true,
      data: formsWithCount,
    });
  } catch (error) {
    console.error('Error fetching feedback forms:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch feedback forms',
      },
    });
  }
};

/**
 * @route POST /api/v1/marketing/feedback-forms
 * @desc Create a new feedback form
 * @access Private (BusinessOwner)
 */
export const createFeedbackForm = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const tenantId = req.tenantId;

    if (!tenantId) {
      res.status(403).json({
        success: false,
        error: {
          code: 'MISSING_TENANT_CONTEXT',
          message: 'Tenant context is required',
        },
      });
      return;
    }

    const { title, description, questions, status } = req.body;

    // Validate required fields
    if (!title || !questions) {
      res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_REQUIRED_FIELDS',
          message: 'Title and questions are required',
        },
      });
      return;
    }

    // Validate questions is an array
    if (!Array.isArray(questions) || questions.length === 0) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_QUESTIONS',
          message: 'Questions must be a non-empty array',
        },
      });
      return;
    }

    // Validate each question structure
    const validTypes = ['text', 'rating', 'multiple_choice', 'checkbox'];
    for (const question of questions as FeedbackQuestion[]) {
      if (!question.id || !question.type || !question.text) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_QUESTION_STRUCTURE',
            message: 'Each question must have id, type, and text fields',
          },
        });
        return;
      }

      if (!validTypes.includes(question.type)) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_QUESTION_TYPE',
            message: `Question type must be one of: ${validTypes.join(', ')}`,
          },
        });
        return;
      }

      // Validate options for multiple_choice and checkbox
      if (
        (question.type === 'multiple_choice' || question.type === 'checkbox') &&
        (!question.options || !Array.isArray(question.options) || question.options.length === 0)
      ) {
        res.status(400).json({
          success: false,
          error: {
            code: 'MISSING_QUESTION_OPTIONS',
            message: 'Multiple choice and checkbox questions must have options array',
          },
        });
        return;
      }

      if (question.required === undefined) {
        question.required = false;
      }
    }

    // Create the feedback form
    const feedbackForm = await prisma.feedbackForm.create({
      data: {
        businessOwnerId: tenantId,
        title,
        description: description || null,
        questions: questions as Prisma.JsonArray,
        qrCode: null, // Will be generated separately (placeholder for now)
        status: status || 'active',
      },
    });

    // Generate QR code URL (using form ID in a public URL format)
    // Format: /public/feedback/{formId}
    const qrCodeUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/public/feedback/${feedbackForm.id}`;

    // Update the form with QR code URL
    const updatedForm = await prisma.feedbackForm.update({
      where: { id: feedbackForm.id },
      data: { qrCode: qrCodeUrl },
    });

    res.status(201).json({
      success: true,
      data: updatedForm,
      message: 'Feedback form created successfully',
    });
  } catch (error) {
    console.error('Error creating feedback form:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to create feedback form',
      },
    });
  }
};

/**
 * @route PUT /api/v1/marketing/feedback-forms/:id
 * @desc Update a feedback form
 * @access Private (BusinessOwner)
 */
export const updateFeedbackForm = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const tenantId = req.tenantId;
    const { id } = req.params;

    if (!tenantId) {
      res.status(403).json({
        success: false,
        error: {
          code: 'MISSING_TENANT_CONTEXT',
          message: 'Tenant context is required',
        },
      });
      return;
    }

    // Verify form exists and belongs to tenant
    const existingForm = await prisma.feedbackForm.findFirst({
      where: {
        id,
        businessOwnerId: tenantId,
      },
    });

    if (!existingForm) {
      res.status(404).json({
        success: false,
        error: {
          code: 'FEEDBACK_FORM_NOT_FOUND',
          message: 'Feedback form not found',
        },
      });
      return;
    }

    const { title, description, questions, status } = req.body;

    // Validate questions if provided
    if (questions) {
      if (!Array.isArray(questions) || questions.length === 0) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_QUESTIONS',
            message: 'Questions must be a non-empty array',
          },
        });
        return;
      }

      // Validate each question structure
      const validTypes = ['text', 'rating', 'multiple_choice', 'checkbox'];
      for (const question of questions as FeedbackQuestion[]) {
        if (!question.id || !question.type || !question.text) {
          res.status(400).json({
            success: false,
            error: {
              code: 'INVALID_QUESTION_STRUCTURE',
              message: 'Each question must have id, type, and text fields',
            },
          });
          return;
        }

        if (!validTypes.includes(question.type)) {
          res.status(400).json({
            success: false,
            error: {
              code: 'INVALID_QUESTION_TYPE',
              message: `Question type must be one of: ${validTypes.join(', ')}`,
            },
          });
          return;
        }

        // Validate options for multiple_choice and checkbox
        if (
          (question.type === 'multiple_choice' || question.type === 'checkbox') &&
          (!question.options || !Array.isArray(question.options) || question.options.length === 0)
        ) {
          res.status(400).json({
            success: false,
            error: {
              code: 'MISSING_QUESTION_OPTIONS',
              message: 'Multiple choice and checkbox questions must have options array',
            },
          });
          return;
        }

        if (question.required === undefined) {
          question.required = false;
        }
      }
    }

    // Build update data object
    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (questions !== undefined) updateData.questions = questions as Prisma.JsonArray;
    if (status !== undefined) updateData.status = status;

    // Regenerate QR code URL to ensure it's in sync with current FRONTEND_URL
    const qrCodeUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/public/feedback/${id}`;
    if (existingForm.qrCode !== qrCodeUrl) {
      updateData.qrCode = qrCodeUrl;
    }

    // Update the feedback form
    const updatedForm = await prisma.feedbackForm.update({
      where: { id },
      data: updateData,
    });

    res.status(200).json({
      success: true,
      data: updatedForm,
      message: 'Feedback form updated successfully',
    });
  } catch (error) {
    console.error('Error updating feedback form:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to update feedback form',
      },
    });
  }
};

/**
 * @route DELETE /api/v1/marketing/feedback-forms/:id
 * @desc Delete a feedback form and all associated responses
 * @access Private (BusinessOwner)
 */
export const deleteFeedbackForm = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const tenantId = req.tenantId;
    const { id } = req.params;

    if (!tenantId) {
      res.status(403).json({
        success: false,
        error: {
          code: 'MISSING_TENANT_CONTEXT',
          message: 'Tenant context is required',
        },
      });
      return;
    }

    // Verify form exists and belongs to tenant
    const existingForm = await prisma.feedbackForm.findFirst({
      where: {
        id,
        businessOwnerId: tenantId,
      },
    });

    if (!existingForm) {
      res.status(404).json({
        success: false,
        error: {
          code: 'FEEDBACK_FORM_NOT_FOUND',
          message: 'Feedback form not found',
        },
      });
      return;
    }

    // Delete the feedback form (responses will cascade delete if configured in schema)
    await prisma.feedbackForm.delete({
      where: { id },
    });

    res.status(200).json({
      success: true,
      message: 'Feedback form deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting feedback form:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to delete feedback form',
      },
    });
  }
};

/**
 * @route POST /api/v1/public/feedback/:formId
 * @desc Submit a feedback response (public endpoint, no authentication required)
 * @access Public
 */
export const submitFeedbackResponse = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { formId } = req.params;
    const { responses, rating, customerId } = req.body;

    // Validate required fields
    if (!responses) {
      res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_REQUIRED_FIELDS',
          message: 'Responses are required',
        },
      });
      return;
    }

    // Validate responses is an object
    if (typeof responses !== 'object' || Array.isArray(responses)) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_RESPONSES_FORMAT',
          message: 'Responses must be a JSON object',
        },
      });
      return;
    }

    // Check if feedback form exists and is active
    const feedbackForm = await prisma.feedbackForm.findUnique({
      where: { id: formId },
    });

    if (!feedbackForm) {
      res.status(404).json({
        success: false,
        error: {
          code: 'FEEDBACK_FORM_NOT_FOUND',
          message: 'Feedback form not found',
        },
      });
      return;
    }

    if (feedbackForm.status !== 'active') {
      res.status(400).json({
        success: false,
        error: {
          code: 'FEEDBACK_FORM_INACTIVE',
          message: 'This feedback form is no longer accepting responses',
        },
      });
      return;
    }

    // Validate responses match form questions
    const questions = feedbackForm.questions as unknown as FeedbackQuestion[];

    // Check all required questions are answered
    for (const question of questions) {
      if (question.required && !responses[question.id]) {
        res.status(400).json({
          success: false,
          error: {
            code: 'MISSING_REQUIRED_RESPONSE',
            message: `Question "${question.text}" is required`,
          },
        });
        return;
      }
    }

    // Validate question IDs in responses match form questions
    const validQuestionIds = questions.map(q => q.id);
    for (const questionId of Object.keys(responses)) {
      if (!validQuestionIds.includes(questionId)) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_QUESTION_ID',
            message: `Question ID "${questionId}" does not exist in this form`,
          },
        });
        return;
      }
    }

    // Create the feedback response
    const feedbackResponse = await prisma.feedbackResponse.create({
      data: {
        feedbackFormId: formId,
        customerId: customerId || null,
        responses: responses as Prisma.JsonObject,
        rating: rating || null,
      },
    });

    res.status(201).json({
      success: true,
      data: feedbackResponse,
      message: 'Feedback submitted successfully',
    });
  } catch (error) {
    console.error('Error submitting feedback response:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to submit feedback response',
      },
    });
  }
};

/**
 * @route GET /api/v1/marketing/feedback-forms/:formId/responses
 * @desc Get all feedback responses for a specific form
 * @access Private (BusinessOwner)
 */
export const getFeedbackResponses = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const tenantId = req.tenantId;

    if (!tenantId) {
      res.status(403).json({
        success: false,
        error: {
          code: 'MISSING_TENANT_CONTEXT',
          message: 'Tenant context is required',
        },
      });
      return;
    }

    const { formId } = req.params;
    const { startDate, endDate } = req.query;

    // Verify form exists and belongs to tenant
    const feedbackForm = await prisma.feedbackForm.findFirst({
      where: {
        id: formId,
        businessOwnerId: tenantId,
      },
    });

    if (!feedbackForm) {
      res.status(404).json({
        success: false,
        error: {
          code: 'FEEDBACK_FORM_NOT_FOUND',
          message: 'Feedback form not found',
        },
      });
      return;
    }

    // Build where clause with date range filter
    const whereClause: any = {
      feedbackFormId: formId,
    };

    if (startDate || endDate) {
      whereClause.createdAt = {};
      if (startDate) {
        whereClause.createdAt.gte = new Date(startDate as string);
      }
      if (endDate) {
        whereClause.createdAt.lte = new Date(endDate as string);
      }
    }

    // Fetch responses with customer info
    const responses = await prisma.feedbackResponse.findMany({
      where: whereClause,
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Transform response to include formatted data
    const formattedResponses = responses.map((response) => ({
      id: response.id,
      responses: response.responses,
      rating: response.rating,
      customer: response.customer || null,
      submittedAt: response.createdAt,
      createdAt: response.createdAt,
    }));

    res.status(200).json({
      success: true,
      data: formattedResponses,
    });
  } catch (error) {
    console.error('Error fetching feedback responses:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch feedback responses',
      },
    });
  }
};

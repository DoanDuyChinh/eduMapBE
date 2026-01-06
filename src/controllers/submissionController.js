const mongoose = require('mongoose');
const submissionService = require('../services/submissionService');

/**
 * Starts a new exam submission
 * POST /v1/api/submissions/start
 */
async function startSubmission(req, res, next) {
  try {
    const { examId, password } = req.body;
    const user = req.user;

    if (!examId) {
      return res.status(400).json({ ok: false, message: 'examId is required' });
    }

    if (!mongoose.isValidObjectId(examId)) {
      return res.status(400).json({ ok: false, message: 'Invalid examId format' });
    }

    // Verify exam password if required
    const Exam = require('../models/Exam');
    const exam = await Exam.findById(examId);
    if (exam && exam.examPassword) {
      if (!password || password !== exam.examPassword) {
        return res.status(401).json({ ok: false, message: 'Invalid exam password' });
      }
    }

    const result = await submissionService.startSubmission({
      examId,
      user,
      orgId: user.orgId || null
    });

    res.status(201).json({ ok: true, data: result });
  } catch (error) {
    if (error?.status) {
      console.error('Error starting submission:', error);
      return res.status(error.status).json({ ok: false, message: error.message });
    }
    next(error);
  }
}

/**
 * Updates submission answers (auto-save)
 * PATCH /v1/api/submissions/:id/answers
 */
async function updateAnswers(req, res, next) {
  try {
    const { id } = req.params;
    const { answers } = req.body;
    const user = req.user;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ ok: false, message: 'Invalid submission ID format' });
    }

    if (!Array.isArray(answers)) {
      return res.status(400).json({ ok: false, message: 'answers must be an array' });
    }

    const submission = await submissionService.updateSubmissionAnswers({
      submissionId: id,
      answers,
      user
    });

    res.json({ ok: true, data: submission });
  } catch (error) {
    if (error?.status) {
      return res.status(error.status).json({ ok: false, message: error.message });
    }
    next(error);
  }
}

/**
 * Submits an exam
 * POST /v1/api/submissions/:id/submit
 */
async function submitExam(req, res, next) {
  try {
    const { id } = req.params;
    const user = req.user;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ ok: false, message: 'Invalid submission ID format' });
    }

    const submission = await submissionService.submitExam({
      submissionId: id,
      user
    });

    res.json({ ok: true, data: submission });
  } catch (error) {
    if (error?.status) {
      return res.status(error.status).json({ ok: false, message: error.message });
    }
    next(error);
  }
}

/**
 * Gets submission by ID
 * GET /v1/api/submissions/:id
 */
async function getSubmissionById(req, res, next) {
  try {
    const { id } = req.params;
    const user = req.user;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ ok: false, message: 'Invalid submission ID format' });
    }

    const submission = await submissionService.getSubmissionById({
      submissionId: id,
      user
    });

    res.json({ ok: true, data: submission });
  } catch (error) {
    if (error?.status) {
      return res.status(error.status).json({ ok: false, message: error.message });
    }
    next(error);
  }
}

/**
 * Gets all submissions for an exam
 * GET /v1/api/submissions/exam/:examId
 */
async function getExamSubmissions(req, res, next) {
  try {
    const { examId } = req.params;
    const user = req.user;

    if (!mongoose.isValidObjectId(examId)) {
      return res.status(400).json({ ok: false, message: 'Invalid examId format' });
    }

    const submissions = await submissionService.getExamSubmissions({
      examId,
      user
    });

    res.json({ ok: true, data: submissions });
  } catch (error) {
    if (error?.status) {
      return res.status(error.status).json({ ok: false, message: error.message });
    }
    next(error);
  }
}

/**
 * Gets leaderboard for an exam
 * GET /v1/api/submissions/exam/:examId/leaderboard
 */
async function getExamLeaderboard(req, res, next) {
  try {
    const { examId } = req.params;
    const user = req.user;

    if (!mongoose.isValidObjectId(examId)) {
      return res.status(400).json({ ok: false, message: 'Invalid examId format' });
    }

    const leaderboard = await submissionService.getExamLeaderboard({
      examId,
      user
    });

    res.json({ ok: true, data: leaderboard });
  } catch (error) {
    if (error?.status) {
      return res.status(error.status).json({ ok: false, message: error.message });
    }
    next(error);
  }
}
/**
 * Gets current user's submissions
 * GET /v1/api/submissions/me
 */
/**
 * Updates submission face image (for proctoring)
 * POST /v1/api/submissions/:id/face-image
 */
async function updateFaceImage(req, res, next) {
  try {
    const { id } = req.params;
    const user = req.user;

    // Check if file is uploaded
    if (!req.file) {
      return res.status(400).json({ ok: false, message: 'No image file uploaded' });
    }

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ ok: false, message: 'Invalid submission ID format' });
    }

    // Upload to Cloudinary using stream
    const cloudinary = require('../config/cloudinary');
    const streamifier = require('streamifier');

    const streamUpload = (req) => {
      return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: 'proctoring/faces',
            allowed_formats: ['jpg', 'png', 'jpeg', 'webp'],
            public_id: `face_${id}_${Date.now()}`
          },
          (error, result) => {
            if (result) {
              resolve(result);
            } else {
              reject(error);
            }
          }
        );
        streamifier.createReadStream(req.file.buffer).pipe(stream);
      });
    };

    const uploadResult = await streamUpload(req);
    const imageUrl = uploadResult.secure_url;

    // Update submission
    const Submission = require('../models/Submission');
    const submission = await Submission.findOneAndUpdate(
      { _id: id, userId: user.id },
      { $set: { 'proctoringData.referenceFaceImage': imageUrl } },
      { new: true }
    );

    if (!submission) {
      return res.status(404).json({ ok: false, message: 'Submission not found or unauthorized' });
    }

    res.json({ ok: true, data: { imageUrl } });
  } catch (error) {
    console.error('Error updating face image:', error);
    next(error);
  }
}

async function getMySubmissions(req, res, next) {
  try {
    const user = req.user;
    const { subject, status, startDate, endDate } = req.query;

    const submissions = await submissionService.getMySubmissions({
      userId: user.id,
      filters: {
        subject,
        status,
        startDate,
        endDate
      }
    });

    res.json({ ok: true, data: submissions });
  } catch (error) {
    if (error?.status) {
      return res.status(error.status).json({ ok: false, message: error.message });
    }
    next(error);
  }
}

module.exports = {
  startSubmission,
  updateAnswers,
  submitExam,
  getSubmissionById,
  getExamSubmissions,
  getExamLeaderboard,
  getMySubmissions,
  updateFaceImage
};


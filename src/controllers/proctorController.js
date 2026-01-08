const mongoose = require('mongoose');
const ProctorLog = require('../models/ProctorLog');
const Submission = require('../models/Submission');
const cloudinary = require('../config/cloudinary');
const streamifier = require('streamifier');

/**
 * Logs a proctoring event
 * POST /v1/api/proctor/log
 */
async function logEvent(req, res, next) {
  try {
    const { submissionId, event, severity, meta } = req.body;

    // DEBUG LOG


    let parsedMeta = meta;
    if (typeof meta === 'string') {
      try {
        parsedMeta = JSON.parse(meta);
      } catch (e) {
        parsedMeta = {};
      }
    }
    const user = req.user;

    if (!submissionId) {
      return res.status(400).json({ ok: false, message: 'submissionId is required' });
    }

    if (!mongoose.isValidObjectId(submissionId)) {
      return res.status(400).json({ ok: false, message: 'Invalid submissionId format' });
    }

    if (!event) {
      return res.status(400).json({ ok: false, message: 'event is required' });
    }

    // Verify submission exists and belongs to user
    const submission = await Submission.findById(submissionId);
    if (!submission) {
      return res.status(404).json({ ok: false, message: 'Submission not found' });
    }

    if (submission.userId.toString() !== user.id) {
      return res.status(403).json({ ok: false, message: 'Forbidden' });
    }

    // Create log entry
    // Only set orgId if it exists (not required)
    const logData = {
      submissionId,
      userId: user.id,
      event,
      severity: severity || 'low',
      meta: {
        ...parsedMeta,
        userAgent: req.headers['user-agent'],
        ip: req.ip || req.connection.remoteAddress
      }
    };

    // Handle Image Upload if present
    if (req.file) {
      try {
        const streamUpload = (fileBuffer) => {
          return new Promise((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
              {
                folder: 'proctoring/evidence',
                resource_type: 'image',
                allowed_formats: ['jpg', 'png', 'jpeg', 'webp']
              },
              (error, result) => {
                if (result) {
                  resolve(result);
                } else {
                  reject(error);
                }
              }
            );
            streamifier.createReadStream(fileBuffer).pipe(stream);
          });
        };

        const result = await streamUpload(req.file.buffer);
        logData.evidenceUrl = result.secure_url;
      } catch (uploadError) {
        console.error('Proctor evidence upload failed:', uploadError);
        // Continue logging even if upload fails, but maybe note it in meta
        logData.meta.uploadError = uploadError.message;
      }
    }

    // Only add orgId if it exists
    if (user.orgId || submission.orgId) {
      logData.orgId = user.orgId || submission.orgId;
    }

    const log = new ProctorLog(logData);

    await log.save();

    // Update submission proctoring data if severity is high (Atomic Update)
    if (severity === 'high' || severity === 'critical') {
      const timestamp = new Date().toISOString();
      const updateField = ['tab_switch', 'copy_paste', 'right_click', 'multiple_faces', 'camera_denied', 'no_face', 'face_mismatch'].includes(event)
        ? 'proctoringData.violations'
        : 'proctoringData.warnings';

      await Submission.findByIdAndUpdate(submissionId, {
        $push: { [updateField]: `${event}: ${timestamp}` }
      });
    }

    res.status(201).json({
      ok: true,
      data: log
    });
  } catch (error) {
    if (error?.status) {
      return res.status(error.status).json({ ok: false, message: error.message });
    }
    next(error);
  }
}

/**
 * Gets proctor logs for a submission
 * GET /v1/api/proctor/submission/:submissionId
 */
async function getSubmissionLogs(req, res, next) {
  try {
    const { submissionId } = req.params;
    const user = req.user;

    if (!mongoose.isValidObjectId(submissionId)) {
      return res.status(400).json({ ok: false, message: 'Invalid submissionId format' });
    }

    // Verify submission exists
    const submission = await Submission.findById(submissionId);
    if (!submission) {
      return res.status(404).json({ ok: false, message: 'Submission not found' });
    }

    // Check permissions
    const isOwner = submission.userId.toString() === user.id;
    const isTeacher = user.role === 'teacher' || user.role === 'admin';

    if (!isOwner && !isTeacher) {
      return res.status(403).json({ ok: false, message: 'Forbidden' });
    }

    const logs = await ProctorLog.find({ submissionId })
      .sort({ ts: -1 })
      .limit(1000);

    res.json({ ok: true, data: logs });
  } catch (error) {
    if (error?.status) {
      return res.status(error.status).json({ ok: false, message: error.message });
    }
    next(error);
  }
}

/**
 * Gets proctor logs for an exam (teacher/admin only)
 * GET /v1/api/proctor/exam/:examId
 */
async function getExamLogs(req, res, next) {
  try {
    const { examId } = req.params;
    const user = req.user;

    if (!mongoose.isValidObjectId(examId)) {
      return res.status(400).json({ ok: false, message: 'Invalid examId format' });
    }

    if (user.role !== 'teacher' && user.role !== 'admin') {
      return res.status(403).json({ ok: false, message: 'Forbidden' });
    }

    // Get all submissions for this exam
    const submissions = await Submission.find({ examId }).select('_id');
    const submissionIds = submissions.map(s => s._id);

    const logs = await ProctorLog.find({ submissionId: { $in: submissionIds } })
      .populate('userId', 'name email')
      .populate('submissionId', 'status')
      .sort({ ts: -1 })
      .limit(5000);

    res.json({ ok: true, data: logs });
  } catch (error) {
    if (error?.status) {
      return res.status(error.status).json({ ok: false, message: error.message });
    }
    next(error);
  }
}

module.exports = {
  logEvent,
  getSubmissionLogs,
  getExamLogs
};


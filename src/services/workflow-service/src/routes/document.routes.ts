import { Router } from 'express';
import { documentController } from '../controllers/document.controller';
import { requireAuth, requirePermissions, agentContextMiddleware } from '../middleware/auth.middleware';
import { uploadMultiple } from '../middleware/document-upload.middleware';
import { documentValidation, validateRequest } from '../validations/document.validation';

const router = Router();

// Upload documents
router.post(
  '/upload',
  requireAuth,
  agentContextMiddleware,
  requirePermissions(['customer_doc:upload']),
  uploadMultiple,
  validateRequest(documentValidation.upload),
  documentController.uploadDocuments.bind(documentController)
);

// Get customer documents
router.get(
  '/customer/:cif',
  requireAuth,
  agentContextMiddleware,
  validateRequest(documentValidation.getByCustomer),
  documentController.getCustomerDocuments.bind(documentController)
);

// Get loan documents
router.get(
  '/loan/:loanAccountNumber',
  requireAuth,
  agentContextMiddleware,
  validateRequest(documentValidation.getByLoan),
  documentController.getLoanDocuments.bind(documentController)
);

// Get document metadata
router.get(
  '/:id',
  requireAuth,
  agentContextMiddleware,
  validateRequest(documentValidation.getById),
  documentController.getDocument.bind(documentController)
);

// Download document
router.get(
  '/:id/download',
  requireAuth,
  agentContextMiddleware,
  requirePermissions(['customer_doc:download']),
  validateRequest(documentValidation.download),
  documentController.downloadDocument.bind(documentController)
);

// Get presigned URL for direct download
router.get(
  '/:id/presigned-url',
  requireAuth,
  agentContextMiddleware,
  validateRequest(documentValidation.presignedUrl),
  documentController.getPresignedUrl.bind(documentController)
);

// Delete document
router.delete(
  '/:id',
  requireAuth,
  agentContextMiddleware,
  requirePermissions(['customer_doc:delete']),
  validateRequest(documentValidation.delete),
  documentController.deleteDocument.bind(documentController)
);

// Get document statistics for a customer
router.get(
  '/statistics/customer/:cif',
  requireAuth,
  agentContextMiddleware,
  validateRequest(documentValidation.getStatistics),
  documentController.getCustomerDocumentStats.bind(documentController)
);

export default router;
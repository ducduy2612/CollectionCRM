import { Document } from '../entities/document.entity';
import { AppDataSource } from '../config/data-source';
import { Errors, OperationType, SourceSystemType } from '../utils/errors';
import { ResponseUtil, PaginatedResponse } from '../utils/response';

/**
 * Search criteria for documents
 */
export interface DocumentSearchCriteria {
  cif?: string;
  loanAccountNumber?: string;
  documentType?: string;
  documentCategory?: string;
  status?: string;
  uploadedBy?: string;
  page?: number;
  pageSize?: number;
}

/**
 * Repository for Document entity
 */
export const DocumentRepository = AppDataSource.getRepository(Document).extend({
  /**
   * Find a document by ID
   * @param id Document ID
   * @returns The document if found, null otherwise
   */
  async findById(id: string): Promise<Document | null> {
    try {
      return await this.findOne({
        where: { id },
        relations: ['uploadedByAgent']
      });
    } catch (error) {
      throw Errors.wrap(
        error as Error,
        OperationType.DATABASE,
        SourceSystemType.WORKFLOW_SERVICE,
        { id, operation: 'findById' }
      );
    }
  },

  /**
   * Find documents by customer CIF
   * @param cif Customer CIF
   * @param options Additional filtering options
   * @returns Array of documents
   */
  async findByCustomer(cif: string, options: Partial<DocumentSearchCriteria> = {}): Promise<Document[]> {
    try {
      const queryBuilder = this.createQueryBuilder('document')
        .leftJoinAndSelect('document.uploadedByAgent', 'agent')
        .where('document.cif = :cif', { cif })
        .andWhere('document.status = :status', { status: 'active' });

      if (options.documentType) {
        queryBuilder.andWhere('document.documentType = :type', { type: options.documentType });
      }

      if (options.loanAccountNumber) {
        queryBuilder.andWhere('document.loanAccountNumber = :loan', { loan: options.loanAccountNumber });
      }

      if (options.documentCategory) {
        queryBuilder.andWhere('document.documentCategory = :category', { category: options.documentCategory });
      }

      return await queryBuilder
        .orderBy('document.createdAt', 'DESC')
        .getMany();
    } catch (error) {
      throw Errors.wrap(
        error as Error,
        OperationType.DATABASE,
        SourceSystemType.WORKFLOW_SERVICE,
        { cif, options, operation: 'findByCustomer' }
      );
    }
  },

  /**
   * Find documents by loan account number
   * @param loanAccountNumber Loan account number
   * @returns Array of documents
   */
  async findByLoan(loanAccountNumber: string): Promise<Document[]> {
    try {
      return await this.find({
        where: {
          loanAccountNumber,
          status: 'active'
        },
        relations: ['uploadedByAgent'],
        order: {
          createdAt: 'DESC'
        }
      });
    } catch (error) {
      throw Errors.wrap(
        error as Error,
        OperationType.DATABASE,
        SourceSystemType.WORKFLOW_SERVICE,
        { loanAccountNumber, operation: 'findByLoan' }
      );
    }
  },

  /**
   * Search documents based on criteria
   * @param criteria Search criteria
   * @returns Paginated result of documents
   */
  async searchDocuments(criteria: DocumentSearchCriteria): Promise<PaginatedResponse<Document>> {
    try {
      const queryBuilder = this.createQueryBuilder('document')
        .leftJoinAndSelect('document.uploadedByAgent', 'agent');

      // Apply filters
      if (criteria.cif) {
        queryBuilder.andWhere('document.cif = :cif', { cif: criteria.cif });
      }

      if (criteria.loanAccountNumber) {
        queryBuilder.andWhere('document.loanAccountNumber = :loan', { loan: criteria.loanAccountNumber });
      }

      if (criteria.documentType) {
        queryBuilder.andWhere('document.documentType = :type', { type: criteria.documentType });
      }

      if (criteria.documentCategory) {
        queryBuilder.andWhere('document.documentCategory = :category', { category: criteria.documentCategory });
      }

      if (criteria.status) {
        queryBuilder.andWhere('document.status = :status', { status: criteria.status });
      } else {
        queryBuilder.andWhere('document.status = :status', { status: 'active' });
      }

      if (criteria.uploadedBy) {
        queryBuilder.andWhere('document.uploadedBy = :uploadedBy', { uploadedBy: criteria.uploadedBy });
      }

      // Get total count
      const total = await queryBuilder.getCount();

      // Apply pagination
      const page = criteria.page || 1;
      const pageSize = criteria.pageSize || 10;

      queryBuilder
        .skip((page - 1) * pageSize)
        .take(pageSize)
        .orderBy('document.createdAt', 'DESC');

      // Get paginated results
      const documents = await queryBuilder.getMany();

      return ResponseUtil.paginate(documents, total, page, pageSize);
    } catch (error) {
      throw Errors.wrap(
        error as Error,
        OperationType.DATABASE,
        SourceSystemType.WORKFLOW_SERVICE,
        { criteria, operation: 'searchDocuments' }
      );
    }
  },

  /**
   * Create a new document
   * @param document Document data
   * @returns The created document
   */
  async createDocument(document: Partial<Document>): Promise<Document> {
    try {
      const newDocument = this.create(document);
      return await this.save(newDocument);
    } catch (error) {
      throw Errors.wrap(
        error as Error,
        OperationType.DATABASE,
        SourceSystemType.WORKFLOW_SERVICE,
        { document, operation: 'createDocument' }
      );
    }
  },

  /**
   * Update an existing document
   * @param id Document ID
   * @param documentData Updated document data
   * @returns The updated document
   */
  async updateDocument(id: string, documentData: Partial<Document>): Promise<Document> {
    try {
      const document = await this.findById(id);

      if (!document) {
        throw Errors.create(
          Errors.Database.RECORD_NOT_FOUND,
          `Document with ID ${id} not found`,
          OperationType.DATABASE,
          SourceSystemType.WORKFLOW_SERVICE
        );
      }

      // Update document properties
      Object.assign(document, documentData);

      return await this.save(document);
    } catch (error) {
      throw Errors.wrap(
        error as Error,
        OperationType.DATABASE,
        SourceSystemType.WORKFLOW_SERVICE,
        { id, documentData, operation: 'updateDocument' }
      );
    }
  },

  /**
   * Soft delete a document
   * @param id Document ID
   * @param deletedBy Agent ID who deleted the document
   * @returns The updated document
   */
  async softDeleteDocument(id: string, deletedBy: string): Promise<Document> {
    try {
      const document = await this.findById(id);

      if (!document) {
        throw Errors.create(
          Errors.Database.RECORD_NOT_FOUND,
          `Document with ID ${id} not found`,
          OperationType.DATABASE,
          SourceSystemType.WORKFLOW_SERVICE
        );
      }

      document.status = 'deleted';
      document.deletedAt = new Date();
      document.deletedBy = deletedBy;

      return await this.save(document);
    } catch (error) {
      throw Errors.wrap(
        error as Error,
        OperationType.DATABASE,
        SourceSystemType.WORKFLOW_SERVICE,
        { id, deletedBy, operation: 'softDeleteDocument' }
      );
    }
  },

  /**
   * Get document statistics
   * @returns Document statistics
   */
  async getDocumentStatistics(): Promise<{
    totalDocuments: number;
    uniqueCustomers: number;
    uniqueLoans: number;
    totalStorageBytes: number;
    averageFileSize: number;
    activeDocuments: number;
    deletedDocuments: number;
  }> {
    try {
      const result = await this.createQueryBuilder('document')
        .select([
          'COUNT(*) as totalDocuments',
          'COUNT(DISTINCT document.cif) as uniqueCustomers',
          'COUNT(DISTINCT document.loanAccountNumber) as uniqueLoans',
          'COALESCE(SUM(document.fileSize), 0) as totalStorageBytes',
          'COALESCE(AVG(document.fileSize), 0) as averageFileSize',
          'COUNT(CASE WHEN document.status = \'active\' THEN 1 END) as activeDocuments',
          'COUNT(CASE WHEN document.status = \'deleted\' THEN 1 END) as deletedDocuments'
        ])
        .getRawOne();

      return {
        totalDocuments: parseInt(result.totalDocuments),
        uniqueCustomers: parseInt(result.uniqueCustomers),
        uniqueLoans: parseInt(result.uniqueLoans),
        totalStorageBytes: parseInt(result.totalStorageBytes),
        averageFileSize: parseFloat(result.averageFileSize),
        activeDocuments: parseInt(result.activeDocuments),
        deletedDocuments: parseInt(result.deletedDocuments)
      };
    } catch (error) {
      throw Errors.wrap(
        error as Error,
        OperationType.DATABASE,
        SourceSystemType.WORKFLOW_SERVICE,
        { operation: 'getDocumentStatistics' }
      );
    }
  },

  /**
   * Get document type summary
   * @returns Document type summary
   */
  async getDocumentTypeSummary(): Promise<Array<{
    documentType: string;
    documentCategory: string;
    count: number;
    totalSize: number;
    avgSize: number;
    lastUploaded: Date;
  }>> {
    try {
      const results = await this.createQueryBuilder('document')
        .select([
          'document.documentType as documentType',
          'document.documentCategory as documentCategory',
          'COUNT(*) as count',
          'COALESCE(SUM(document.fileSize), 0) as totalSize',
          'COALESCE(AVG(document.fileSize), 0) as avgSize',
          'MAX(document.createdAt) as lastUploaded'
        ])
        .where('document.status = :status', { status: 'active' })
        .groupBy('document.documentType, document.documentCategory')
        .getRawMany();

      return results.map(result => ({
        documentType: result.documentType,
        documentCategory: result.documentCategory,
        count: parseInt(result.count),
        totalSize: parseInt(result.totalSize),
        avgSize: parseFloat(result.avgSize),
        lastUploaded: new Date(result.lastUploaded)
      }));
    } catch (error) {
      throw Errors.wrap(
        error as Error,
        OperationType.DATABASE,
        SourceSystemType.WORKFLOW_SERVICE,
        { operation: 'getDocumentTypeSummary' }
      );
    }
  }
});
import type {
  AdjudicateCaseRequest,
  AttachRunRequest,
  CreateCaseRequest,
  CreateEvalPackRequest,
  PromoteCaseRequest,
  SubmitCaseReviewRequest,
} from '@/types/api/realInputCorpusApi';
import {
  RealInputCorpusService,
  RicLifecycleError,
  RicValidationError,
} from '@/types/realInputCorpusService';
import type { RicProductSurface } from '@/types/realInputCorpus';

export type RicHandlerResponse<T = unknown> = {
  status: number;
  body: T | { error: { code: string; message: string; details?: unknown } };
};

function mapError(error: unknown): RicHandlerResponse {
  if (error instanceof RicValidationError) {
    return {
      status: 400,
      body: {
        error: {
          code: 'validation_error',
          message: 'Request validation failed',
          details: error.issues,
        },
      },
    };
  }

  if (error instanceof RicLifecycleError) {
    return {
      status: 409,
      body: {
        error: {
          code: 'lifecycle_error',
          message: error.message,
        },
      },
    };
  }

  return {
    status: 500,
    body: {
      error: {
        code: 'internal_error',
        message: 'Unexpected error',
      },
    },
  };
}

export function createRicHandlers(service: RealInputCorpusService) {
  return {
    async createCase(actorId: string, body: unknown): Promise<RicHandlerResponse> {
      try {
        const result = await service.createCase(actorId, body as CreateCaseRequest);
        return { status: 201, body: result };
      } catch (error) {
        return mapError(error);
      }
    },

    async normalizeCase(actorId: string, caseId: string, body: unknown): Promise<RicHandlerResponse> {
      try {
        await service.normalizeCase(actorId, caseId, body);
        return { status: 200, body: { caseId } };
      } catch (error) {
        return mapError(error);
      }
    },

    async attachRun(actorId: string, caseId: string, body: unknown): Promise<RicHandlerResponse> {
      try {
        const result = await service.attachRun(actorId, caseId, body as AttachRunRequest);
        return { status: 200, body: result };
      } catch (error) {
        return mapError(error);
      }
    },

    async submitReview(
      actorId: string,
      caseId: string,
      productSurface: RicProductSurface,
      body: unknown,
    ): Promise<RicHandlerResponse> {
      try {
        const result = await service.submitCaseReview(
          actorId,
          caseId,
          productSurface,
          body as SubmitCaseReviewRequest,
        );
        return { status: 200, body: result };
      } catch (error) {
        return mapError(error);
      }
    },

    async adjudicateCase(actorId: string, caseId: string, body: unknown): Promise<RicHandlerResponse> {
      try {
        const result = await service.adjudicateCase(actorId, caseId, body as AdjudicateCaseRequest);
        return { status: 200, body: result };
      } catch (error) {
        return mapError(error);
      }
    },

    async promoteCase(actorId: string, caseId: string, body: unknown): Promise<RicHandlerResponse> {
      try {
        const result = await service.promoteCase(actorId, caseId, body as PromoteCaseRequest);
        return { status: 200, body: result };
      } catch (error) {
        return mapError(error);
      }
    },

    async createEvalPack(actorId: string, body: unknown): Promise<RicHandlerResponse> {
      try {
        const result = await service.createEvalPack(actorId, body as CreateEvalPackRequest);
        return { status: 201, body: result };
      } catch (error) {
        return mapError(error);
      }
    },

    async exportEvalPack(evalPackId: string): Promise<RicHandlerResponse> {
      try {
        const result = await service.exportEvalPack(evalPackId);
        return { status: 200, body: result.payload };
      } catch (error) {
        return mapError(error);
      }
    },
  };
}

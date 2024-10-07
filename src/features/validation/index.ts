import type { ApplicationMetadata } from 'src/features/applicationMetadata/types';
import type { AttachmentsSelector } from 'src/features/attachments/AttachmentsStorePlugin';
import type { Expression, ExprValToActual } from 'src/features/expressions/types';
import type { TextReference, ValidLangParam } from 'src/features/language/useLanguage';
import type { DataElementHasErrorsSelector } from 'src/features/validation/validationContext';
import type { FormDataSelector } from 'src/layout';
import type { ILayoutSets } from 'src/layout/common.generated';
import type { IInstance } from 'src/types/shared';
import type { LayoutNode } from 'src/utils/layout/LayoutNode';
import type { NodeDataSelector } from 'src/utils/layout/NodesContext';

export enum FrontendValidationSource {
  EmptyField = '__empty_field__',
  Schema = '__schema__',
  Component = '__component__',
  Expression = '__expression__',
  InvalidData = '__invalid_data__',
}

export type ValidationSeverity = 'error' | 'warning' | 'info' | 'success';

export enum BuiltInValidationIssueSources {
  File = 'File',
  DataAnnotations = 'DataAnnotations',
  Required = 'Required',
  Expression = 'Expression',
  DefaultTaskValidator = 'Altinn.App.Core.Features.Validation.Default.DefaultTaskValidator-*',
}

export const IgnoredValidators: BuiltInValidationIssueSources[] = [
  BuiltInValidationIssueSources.DataAnnotations,
  BuiltInValidationIssueSources.Required,
  BuiltInValidationIssueSources.Expression,
];

export enum BackendValidationSeverity {
  Error = 1,
  Warning = 2,
  Informational = 3,
  Success = 5,
}

// prettier-ignore
export enum ValidationMask {
  Schema                = 0b0000000000000001,
  Component             = 0b0000000000000010,
  Expression            = 0b0000000000000100,
  CustomBackend         = 0b0000000000001000,
  Required              = 0b0100000000000000,
  AllExceptRequired     = 0b0011111111111111, // All frontend validations except required
  All                   = 0b0111111111111111, // All frontend validations
  Backend               = 0b1000000000000000, // All backend validations except custom backend validations
  AllIncludingBackend   = 0b1111111111111111, // All validations including backend validations that overlap with frontend validations
}
export type ValidationMaskKeys = keyof typeof ValidationMask;

/* ValidationMaskCollectionKeys are used to group commonly used validation masks together. */
export type ValidationMaskCollectionKeys = Extract<
  ValidationMaskKeys,
  'All' | 'AllExceptRequired' | 'All_Including_Backend'
>;

/* ValidationCategoryKeys are ValidationMasks that represent a single validation category.*/
export type ValidationCategoryKey = Exclude<ValidationMaskKeys, ValidationMaskCollectionKeys>;
/*  A value of 0 represents a validation to be shown immediately */
export type ValidationCategory = (typeof ValidationMask)[ValidationCategoryKey] | 0;

/*
 * Visibility setting used for selecting errors for nodes.
 * 'visible' = Select all validations with a ValidationMask matching the nodes current visibility
 * 'showAll' = Matches both current visibility and all backend validations, needed for "showAllBackendErrors"
 * number = Select all validations with a ValidationMask maching the mask (number, because you can OR multiple masks together in any combination)
 */
export type NodeVisibility = 'visible' | 'showAll' | number;

export type WaitForValidation = (forceSave?: boolean) => Promise<void>;

export type ValidationContext = {
  state: ValidationState;
  validating: WaitForValidation | undefined;

  /**
   * If there are no frontend errors, but process next still returns validation errors,
   * this will show all backend errors.
   */
  setShowAllBackendErrors: (showAllErrors: boolean) => void;
  showAllBackendErrors: boolean;
};

export type ValidationState = {
  task: BaseValidation[];
  dataModels: DataModelValidations;
};

export type DataModelValidations = {
  [dataElementId: string]: FieldValidations;
};

export type FieldValidations = {
  [field: string]: FieldValidation[];
};

/**
 * Validation format returned by backend validation API.
 */
export type BackendValidationIssueGroups = {
  [validator: string]: BackendValidationIssue[];
};

/**
 * Storage format for backend validations.
 */
export type BackendValidatorGroups = {
  [validator: string]: (BaseValidation | FieldValidation)[];
};

export type BackendFieldValidatorGroups = {
  [validator: string]: FieldValidation[];
};

export type BaseValidation<Severity extends ValidationSeverity = ValidationSeverity> = {
  message: TextReference;
  severity: Severity;
  category: ValidationCategory;
  source: string;
  noIncrementalUpdates?: boolean;
};

/**
 * Validation message associated with a field in the datamodel
 * Typically generated by backend validators or expression validators.
 */
export type FieldValidation<Severity extends ValidationSeverity = ValidationSeverity> = BaseValidation<Severity> & {
  field: string;
  dataElementId: string;
  // When showing all backend validations we want to associate the validations to nodes if we can, and show the rest as unclickable
  // In order to avoid showing the same validation multiple times we need a unique identifier.
  backendValidationId?: string;
};

export function hasBackendValidationId<T extends AnyValidation>(
  validation: T,
): validation is T & { backendValidationId: string } {
  return 'backendValidationId' in validation && typeof validation.backendValidationId === 'string';
}

/**
 * Validation message associated with a component in the layout
 * Typically generated by built-in frontend validators
 */
export type ComponentValidation<Severity extends ValidationSeverity = ValidationSeverity> = BaseValidation<Severity> & {
  bindingKey?: string;
};

/**
 * Validation message associated with an attachment
 */
export type AttachmentValidation<Severity extends ValidationSeverity = ValidationSeverity> =
  BaseValidation<Severity> & {
    attachmentId: string;

    /**
     * Attachment validations may have their own validation visibility tacked on. This is used to postpone displaying
     * the validation for 'you have to select a tag' for FileUploadWithTag until the user has interacted with the
     * save button.
     * @see isValidationVisible
     */
    visibility?: number;
  };

/**
 * Validation message associated with a subform
 */
export type SubformValidation<Severity extends ValidationSeverity = ValidationSeverity> = BaseValidation<Severity> & {
  subformDataElementIds: string[];
};

export function isSubformValidation(validation: NodeValidation): validation is NodeValidation<SubformValidation> {
  return 'subformDataElementIds' in validation;
}

export type AnyValidation<Severity extends ValidationSeverity = ValidationSeverity> =
  | FieldValidation<Severity>
  | ComponentValidation<Severity>
  | AttachmentValidation<Severity>
  | SubformValidation<Severity>;

/**
 * Validation message format used by frontend components.
 * This type is derived from other validation types, but a reference to the node is added.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type NodeValidation<Validation extends AnyValidation<any> = AnyValidation<any>> = Validation & {
  node: LayoutNode;
};

/**
 * The same as NodeValidation, but with a nodeId instead of a node.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type NodeRefValidation<Validation extends AnyValidation<any> = AnyValidation<any>> = Validation & {
  nodeId: string;
};

export type ValidationsProcessedLast = {
  incremental: BackendValidationIssueGroups | undefined;
  initial: BackendValidationIssue[] | undefined;
};

/**
 * Contains all the necessary elements from the store to run frontend validations.
 */
export type ValidationDataSources = {
  currentLanguage: string;
  formDataSelector: FormDataSelector;
  invalidDataSelector: FormDataSelector;
  attachmentsSelector: AttachmentsSelector;
  nodeDataSelector: NodeDataSelector;
  applicationMetadata: ApplicationMetadata;
  instance: IInstance | undefined;
  layoutSets: ILayoutSets;
  dataElementHasErrorsSelector: DataElementHasErrorsSelector;
};

/**
 * This format is used by the backend to send validation issues to the frontend.
 */
export interface BackendValidationIssue {
  code?: string;
  description?: string;
  field?: string;
  dataElementId?: string;
  severity: BackendValidationSeverity;
  source: string;
  noIncrementalUpdates?: boolean; // true if it will not be validated on PATCH, should be ignored when trying to submit
  customTextKey?: string;
  customTextParams?: ValidLangParam[]; //TODO(Validation): Probably broken for text resources currently
  showImmediately?: boolean; // Not made available
  actLikeRequired?: boolean; // Not made available
}

/**
 * Expression validation object.
 */
export type IExpressionValidation = {
  message: string;
  condition: Expression | ExprValToActual;
  severity: ValidationSeverity;
  showImmediately: boolean;
};

/**
 * Expression validations for all fields.
 */
export type IExpressionValidations = {
  [field: string]: IExpressionValidation[];
};

/**
 * Expression validation or definition with references resolved.
 */
export type IExpressionValidationRefResolved = {
  message: string;
  condition: Expression | ExprValToActual;
  severity?: ValidationSeverity;
  showImmediately?: boolean;
};

/**
 * Unresolved expression validation or definition from the configuration file.
 */
export type IExpressionValidationRefUnresolved =
  | IExpressionValidationRefResolved
  | {
      // If extending using a reference, assume that message and condition are inherited if undefined. This must be verified at runtime.
      message?: string;
      condition?: Expression | ExprValToActual;
      severity?: ValidationSeverity;
      showImmediately?: boolean;
      ref: string;
    };

/**
 * Expression validation configuration file type.
 */
export type IExpressionValidationConfig = {
  validations: { [field: string]: (IExpressionValidationRefUnresolved | string)[] };
  definitions: { [name: string]: IExpressionValidationRefUnresolved };
};

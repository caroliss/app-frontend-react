import { createHookContext } from 'src/core/contexts/hookContext';
import { useApplicationMetadata } from 'src/features/applicationMetadata/ApplicationMetadataProvider';
import { useApplicationSettings } from 'src/features/applicationSettings/ApplicationSettingsProvider';
import { DataModels } from 'src/features/datamodel/DataModelsProvider';
import { useDevToolsStore } from 'src/features/devtools/data/DevToolsStore';
import { useExternalApis } from 'src/features/externalApi/useExternalApi';
import { useLayoutSets } from 'src/features/form/layoutSets/LayoutSetsProvider';
import { useCurrentLayoutSet } from 'src/features/form/layoutSets/useCurrentLayoutSet';
import { FD } from 'src/features/formData/FormDataWrite';
import { useLaxDataElementsSelectorProps, useLaxInstanceDataSources } from 'src/features/instance/InstanceContext';
import { useLaxProcessData } from 'src/features/instance/ProcessContext';
import { useCurrentLanguage } from 'src/features/language/LanguageProvider';
import { useInnerLanguageWithForcedNodeSelector } from 'src/features/language/useLanguage';
import { Validation } from 'src/features/validation/validationContext';
import { useMultipleDelayedSelectors } from 'src/hooks/delayedSelectors';
import { useShallowObjectMemo } from 'src/hooks/useShallowObjectMemo';
import { useCommitWhenFinished } from 'src/utils/layout/generator/CommitQueue';
import { Hidden, NodesInternal, useNodes } from 'src/utils/layout/NodesContext';
import { useInnerDataModelBindingTranspose } from 'src/utils/layout/useDataModelBindingTranspose';
import { useInnerNodeFormDataSelector } from 'src/utils/layout/useNodeItem';
import { useInnerNodeTraversalSelector } from 'src/utils/layout/useNodeTraversal';
import type { ValidationDataSources } from 'src/features/validation';
import type { ExpressionDataSources } from 'src/utils/layout/useExpressionDataSources';

const { Provider, hooks } = createHookContext({
  useLaxInstanceDataSources: () => useLaxInstanceDataSources(),
  useCurrentLayoutSet: () => useCurrentLayoutSet(),
  useDefaultDataType: () => DataModels.useDefaultDataType(),
  useReadableDataTypes: () => DataModels.useReadableDataTypes(),
  useExternalApis: () => useExternalApis(useApplicationMetadata().externalApiIds ?? []),
  useIsForcedVisibleByDevTools: () => useDevToolsStore((state) => state.isOpen && state.hiddenComponents !== 'hide'),

  useGetDataElementIdForDataType: () => DataModels.useGetDataElementIdForDataType(),
  useValidationsProcessedLast: () => Validation.useProcessedLast(),

  useCommitWhenFinished: () => useCommitWhenFinished(),
});

export const GeneratorData = {
  Provider,
  useExpressionDataSources,
  useValidationDataSources,
  useDefaultDataType: hooks.useDefaultDataType,
  useIsForcedVisibleByDevTools: hooks.useIsForcedVisibleByDevTools,

  useGetDataElementIdForDataType: hooks.useGetDataElementIdForDataType,
  useValidationsProcessedLast: hooks.useValidationsProcessedLast,

  useCommitWhenFinished: hooks.useCommitWhenFinished,
};

function useExpressionDataSources(): ExpressionDataSources {
  const [
    formDataSelector,
    formDataRowsSelector,
    attachmentsSelector,
    optionsSelector,
    nodeDataSelector,
    dataSelectorForTraversal,
    isHiddenSelector,
  ] = useMultipleDelayedSelectors(
    FD.useDebouncedSelectorProps(),
    FD.useDebouncedRowsSelectorProps(),
    NodesInternal.useAttachmentsSelectorProps(),
    NodesInternal.useNodeOptionsSelectorProps(),
    NodesInternal.useNodeDataSelectorProps(),
    NodesInternal.useDataSelectorForTraversalProps(),
    Hidden.useIsHiddenSelectorProps(),
  );

  const process = useLaxProcessData();
  const applicationSettings = useApplicationSettings();
  const currentLanguage = useCurrentLanguage();

  const instanceDataSources = hooks.useLaxInstanceDataSources();
  const currentLayoutSet = hooks.useCurrentLayoutSet() ?? null;
  const dataModelNames = hooks.useReadableDataTypes();
  const externalApis = hooks.useExternalApis();
  const nodeTraversal = useInnerNodeTraversalSelector(useNodes(), dataSelectorForTraversal);
  const transposeSelector = useInnerDataModelBindingTranspose(nodeDataSelector);
  const nodeFormDataSelector = useInnerNodeFormDataSelector(nodeDataSelector, formDataSelector);
  const langToolsSelector = useInnerLanguageWithForcedNodeSelector(
    hooks.useDefaultDataType(),
    dataModelNames,
    formDataSelector,
    nodeDataSelector,
  );

  return useShallowObjectMemo({
    formDataSelector,
    formDataRowsSelector,
    attachmentsSelector,
    optionsSelector,
    nodeDataSelector,
    process,
    applicationSettings,
    instanceDataSources,
    langToolsSelector,
    currentLanguage,
    isHiddenSelector,
    nodeFormDataSelector,
    nodeTraversal,
    transposeSelector,
    currentLayoutSet,
    externalApis,
    dataModelNames,
  });
}

function useValidationDataSources(): ValidationDataSources {
  const [
    formDataSelector,
    invalidDataSelector,
    attachmentsSelector,
    nodeDataSelector,
    dataElementsSelector,
    dataElementHasErrorsSelector,
  ] = useMultipleDelayedSelectors(
    FD.useDebouncedSelectorProps(),
    FD.useInvalidDebouncedSelectorProps(),
    NodesInternal.useAttachmentsSelectorProps(),
    NodesInternal.useNodeDataSelectorProps(),
    useLaxDataElementsSelectorProps(),
    Validation.useDataElementHasErrorsSelectorProps(),
  );

  const currentLanguage = useCurrentLanguage();
  const applicationMetadata = useApplicationMetadata();
  const layoutSets = useLayoutSets();

  return useShallowObjectMemo({
    formDataSelector,
    invalidDataSelector,
    attachmentsSelector,
    nodeDataSelector,
    dataElementsSelector,
    dataElementHasErrorsSelector,
    currentLanguage,
    applicationMetadata,
    layoutSets,
  });
}
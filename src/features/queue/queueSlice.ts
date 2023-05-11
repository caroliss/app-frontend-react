import { put } from 'redux-saga/effects';
import type { SagaIterator } from 'redux-saga';

import { AttachmentActions } from 'src/features/attachments/attachmentSlice';
import { DataModelActions } from 'src/features/datamodel/datamodelSlice';
import { FormDataActions } from 'src/features/formData/formDataSlice';
import { IsLoadingActions } from 'src/features/isLoading/isLoadingSlice';
import { LanguageActions } from 'src/features/language/languageSlice';
import { FormLayoutActions } from 'src/features/layout/formLayoutSlice';
import { PdfActions } from 'src/features/pdf/data/pdfSlice';
import { watchStartInitialInfoTaskQueueSaga } from 'src/features/queue/infoTask/infoTaskQueueSaga';
import { TextResourcesActions } from 'src/features/textResources/textResourcesSlice';
import { createSagaSlice } from 'src/redux/sagaSlice';
import type { IQueueError, IQueueState } from 'src/features/queue/index';
import type { ActionsFromSlice, MkActionType } from 'src/redux/sagaSlice';

const commonState = { isDone: null, error: null };
export const initialState: IQueueState = {
  dataTask: { ...commonState },
  appTask: { ...commonState },
  userTask: { ...commonState },
  infoTask: { ...commonState },
  stateless: { ...commonState },
};

export let QueueActions: ActionsFromSlice<typeof queueSlice>;
export const queueSlice = () => {
  const slice = createSagaSlice((mkAction: MkActionType<IQueueState>) => ({
    name: 'queue',
    initialState,
    actions: {
      appTaskQueueError: mkAction<IQueueError>({
        reducer: (state, action) => {
          const { error } = action.payload;
          state.appTask.error = error;
        },
      }),
      userTaskQueueError: mkAction<IQueueError>({
        reducer: (state, action) => {
          const { error } = action.payload;
          state.userTask.error = error;
        },
      }),
      dataTaskQueueError: mkAction<IQueueError>({
        reducer: (state, action) => {
          const { error } = action.payload;
          state.dataTask.error = error;
        },
      }),
      infoTaskQueueError: mkAction<IQueueError>({
        reducer: (state, action) => {
          const { error } = action.payload;
          state.infoTask.error = error;
        },
      }),
      statelessQueueError: mkAction<IQueueError>({
        reducer: (state, action) => {
          const { error } = action.payload;
          state.stateless.error = error;
        },
      }),
      startInitialAppTaskQueue: mkAction<void>({
        *takeEvery(): SagaIterator {
          yield put(TextResourcesActions.fetch());
          yield put(LanguageActions.fetchLanguage());
          yield put(QueueActions.startInitialAppTaskQueueFulfilled());
        },
        reducer: (state) => {
          state.appTask.isDone = false;
        },
      }),
      startInitialAppTaskQueueFulfilled: mkAction<void>({
        reducer: (state) => {
          state.appTask.isDone = true;
        },
      }),
      startInitialDataTaskQueue: mkAction<void>({
        *takeEvery(): SagaIterator {
          yield put(FormDataActions.fetchInitial());
          yield put(DataModelActions.fetchJsonSchema());
          yield put(FormLayoutActions.fetch());
          yield put(FormLayoutActions.fetchSettings());
          yield put(PdfActions.initial());
          yield put(AttachmentActions.mapAttachments());
          yield put(QueueActions.startInitialDataTaskQueueFulfilled());
        },
        reducer: (state) => {
          state.dataTask.isDone = false;
        },
      }),
      startInitialDataTaskQueueFulfilled: mkAction<void>({
        reducer: (state) => {
          state.dataTask.isDone = true;
        },
      }),
      startInitialInfoTaskQueue: mkAction<void>({
        saga: () => watchStartInitialInfoTaskQueueSaga,
        reducer: (state) => {
          state.infoTask.isDone = false;
        },
      }),
      startInitialInfoTaskQueueFulfilled: mkAction<void>({
        reducer: (state) => {
          state.infoTask.isDone = true;
        },
      }),
      startInitialStatelessQueue: mkAction<void>({
        *takeLatest(): SagaIterator {
          yield put(IsLoadingActions.startStatelessIsLoading());
          yield put(FormDataActions.fetchInitial());
          yield put(DataModelActions.fetchJsonSchema());
          yield put(FormLayoutActions.fetch());
          yield put(FormLayoutActions.fetchSettings());
          yield put(QueueActions.startInitialStatelessQueueFulfilled());
        },
        reducer: (state) => {
          state.stateless.isDone = false;
        },
      }),
      startInitialStatelessQueueFulfilled: mkAction<void>({
        reducer: (state) => {
          state.stateless.isDone = true;
        },
      }),
    },
  }));

  QueueActions = slice.actions;
  return slice;
};